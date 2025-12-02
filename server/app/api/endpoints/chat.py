from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from langchain_classic.chains.history_aware_retriever import create_history_aware_retriever
from langchain_classic.chains.retrieval import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain

from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory

from langchain_core.documents import Document

from app.services.vector_store import vector_store
from app.core.config import settings

import asyncio
from typing import AsyncIterable


router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default_session"
    model: str = None  # Optional model selection

# Simple in-memory history for now (replace with DB later)
store = {}

def get_session_history(session_id: str):
    if session_id not in store:
        store[session_id] = ChatMessageHistory()
    return store[session_id]

@router.post("/chat")
async def chat(request: ChatRequest):
    retriever = vector_store.as_retriever()
    
    # Use selected model or default from settings
    model_name = request.model or settings.CHAT_MODEL

    llm = ChatOllama(
        base_url=settings.OLLAMA_BASE_URL,
        model=model_name,
        temperature=0.7
    )

    # Contextualize question prompt
    contextualize_q_system_prompt = """Given a chat history and the latest user question \
    which might reference context in the chat history, formulate a standalone question \
    which can be understood without the chat history. Do NOT answer the question, \
    just reformulate it if needed and otherwise return it as is."""
    
    contextualize_q_prompt = ChatPromptTemplate.from_messages([
        ("system", contextualize_q_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    
    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_q_prompt
    )

    # Answer question prompt
    qa_system_prompt = """You are an assistant for question-answering tasks. \
    Use the following pieces of retrieved context to answer the question. \
    If you don't know the answer, just say that you don't know. \
    Use three sentences maximum and keep the answer concise. \
    \
    {context}"""
    
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system", qa_system_prompt),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])
    
    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
    
    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
    
    conversational_rag_chain = RunnableWithMessageHistory(
        rag_chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
    )

    async def generate_response() -> AsyncIterable[str]:
        sources = []
        # Use astream_events to capture retrieval and streaming output
        async for event in conversational_rag_chain.astream_events(
            {"input": request.message},
            config={"configurable": {"session_id": request.session_id}},
            version="v2"
        ):
            kind = event["event"]
            
            if kind == "on_retriever_end":
                # Capture retrieved documents
                # The output of the retriever is a list of Documents
                if "output" in event and event["output"]:
                    sources.extend([
                        {
                            "source": doc.metadata.get("source", "unknown"),
                            "page": doc.metadata.get("page", 0)
                        }
                        for doc in event["output"]
                        if isinstance(doc, Document)
                    ])
            
            elif kind == "on_chat_model_stream":
                # Stream tokens
                content = event["data"]["chunk"].content
                if content:
                    import json
                    yield json.dumps({"token": content}) + "\n"

        # Send sources at the end
        if sources:
            import json
            # Deduplicate sources based on source and page
            unique_sources = [dict(t) for t in {tuple(d.items()) for d in sources}]
            yield json.dumps({"sources": unique_sources}) + "\n"

    return StreamingResponse(generate_response(), media_type="application/x-ndjson")
