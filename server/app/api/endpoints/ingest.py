from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List
import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from app.services.vector_store import vector_store
import os
import shutil

router = APIRouter()

def process_pdf(file_path: str, filename: str, clear_store: bool = False):
    try:
        if clear_store:
            # Clear existing vector store to avoid context mixing
            try:
                vector_store.clear()
            except Exception as e:
                print(f"Error clearing store: {e}")

        doc = fitz.open(file_path)
        text = ""
        documents = []
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )

        for page_num, page in enumerate(doc):
            page_text = page.get_text()
            # Simple header/footer removal heuristic (can be improved)
            lines = page_text.split('\n')
            # Remove first and last few lines if they look like headers/footers?
            # For now, let's keep it simple but robust enough
            cleaned_text = "\n".join(lines)
            
            chunks = text_splitter.split_text(cleaned_text)
            for chunk in chunks:
                documents.append(Document(
                    page_content=chunk,
                    metadata={
                        "source": filename,
                        "page": page_num + 1
                    }
                ))
        
        vector_store.add_documents(documents)
        doc.close()
        # Clean up temp file
        os.remove(file_path)
        
    except Exception as e:
        print(f"Error processing {filename}: {str(e)}")
        # In a real app, we might want to log this to a DB or notify user

@router.post("/ingest")
async def ingest_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...)
):
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    
    for file in files:
        if not file.filename.endswith('.pdf'):
            continue
            
        temp_path = os.path.join(temp_dir, file.filename)
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Clear existing vector store handled in process_pdf if clear_store=True
        # We don't need to do it here explicitly if we pass the flag
            
        background_tasks.add_task(process_pdf, temp_path, file.filename, clear_store=True)
        
    
    # Generate suggested questions
    questions = []
    try:
        from langchain_ollama import ChatOllama
        from langchain_core.prompts import ChatPromptTemplate
        from app.core.config import settings

        # Get a snippet of the text for context (first 2000 chars of first file)
        # In a real app, we might want to sample from all files or use a summary
        sample_text = ""
        with open(os.path.join(temp_dir, files[0].filename), "rb") as f:
             doc = fitz.open(stream=f.read(), filetype="pdf")
             for page in doc:
                 sample_text += page.get_text()
                 if len(sample_text) > 2000:
                     break
        
        llm = ChatOllama(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.CHAT_MODEL,
            temperature=0.7
        )
        
        prompt = ChatPromptTemplate.from_template(
            """Based on the following document excerpt, generate 3 short, interesting questions that a user might ask to learn more about the content.
            Return ONLY the questions, one per line.
            
            Excerpt:
            {text}
            """
        )
        
        chain = prompt | llm
        response = await chain.ainvoke({"text": sample_text[:2000]})
        questions = [q.strip() for q in response.content.split('\n') if q.strip()]
        
    except Exception as e:
        print(f"Error generating questions: {e}")

    return {
        "message": "Ingestion started", 
        "files_count": len(files),
        "suggested_questions": questions[:3]
    }

class UrlRequest(BaseModel):
    url: str

def process_web_content(url: str, clear_store: bool = False):
    # Set USER_AGENT to avoid warnings/blocks
    os.environ["USER_AGENT"] = "DocuMind/1.0"
    
    try:
        if clear_store:
            try:
                vector_store.clear()
            except Exception as e:
                print(f"Error clearing store: {e}")

        from langchain_community.document_loaders import WebBaseLoader
        loader = WebBaseLoader(url)
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = text_splitter.split_documents(docs)
        
        # Add metadata
        for doc in splits:
            doc.metadata["source"] = url
            
        vector_store.add_documents(splits)
        
    except Exception as e:
        print(f"Error processing web content: {e}")

@router.post("/ingest-url")
async def ingest_url(
    background_tasks: BackgroundTasks,
    request: UrlRequest
):
    import httpx
    from urllib.parse import urlparse
    
    url = str(request.url)
    filename = "web_content"
    
    # Check if it's a PDF
    if url.lower().endswith('.pdf'):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, follow_redirects=True)
                response.raise_for_status()
                
                # Extract filename
                path = urlparse(url).path
                filename = os.path.basename(path) or "downloaded_document.pdf"
                if not filename.lower().endswith('.pdf'):
                    filename += ".pdf"
                
                temp_dir = "temp_uploads"
                os.makedirs(temp_dir, exist_ok=True)
                temp_path = os.path.join(temp_dir, filename)
                with open(temp_path, "wb") as f:
                    f.write(response.content)
                
                background_tasks.add_task(process_pdf, temp_path, filename, clear_store=True)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to download PDF: {str(e)}")
    else:
        # Handle as generic web content
        background_tasks.add_task(process_web_content, url, clear_store=True)
        filename = url

    return {
        "status": "processing", 
        "filename": filename,
        "suggested_questions": [
            "What is the main topic of this page?",
            "Summarize the key points.",
            "What are the conclusions?"
        ]
    }
