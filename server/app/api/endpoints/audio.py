from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from app.services.vector_store import vector_store
from app.core.config import settings
from gtts import gTTS
import os
import uuid

router = APIRouter()

class AudioRequest(BaseModel):
    text: str = None # Optional: generate from specific text
    # In a real app, we might pass a document ID or filter

@router.post("/audio-summary")
async def generate_audio_summary():
    try:
        # 1. Retrieve context (or use a summary of the whole doc if we had it)
        # For now, let's retrieve a broad summary based on a generic query
        retriever = vector_store.as_retriever()
        docs = retriever.invoke("Summarize the main concepts and key takeaways of this document.")
        context = "\n\n".join([d.page_content for d in docs])
        
        # 2. Generate Script
        llm = ChatOllama(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.CHAT_MODEL,
            temperature=0.7
        )
        
        prompt = ChatPromptTemplate.from_template(
            """You are a podcast host. Create a short, engaging script (max 200 words) summarizing the following content for your listeners. 
            Keep it conversational and fun.
            
            Content:
            {context}
            """
        )
        
        chain = prompt | llm
        response = await chain.ainvoke({"context": context})
        script = response.content
        
        # 3. Generate Audio
        # gTTS.save is blocking, so we run it in a threadpool to avoid blocking the async event loop
        from starlette.concurrency import run_in_threadpool
        
        tts = gTTS(text=script, lang='en', slow=False)
        
        filename = f"summary_{uuid.uuid4()}.mp3"
        filepath = os.path.join("static", filename)
        os.makedirs("static", exist_ok=True)
        
        await run_in_threadpool(tts.save, filepath)
        
        # Return URL (assuming we serve static files)
        # For now, let's just return the file directly or a path
        return {"audio_url": f"/static/{filename}", "script": script}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
