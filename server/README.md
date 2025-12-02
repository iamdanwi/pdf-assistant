# DocuMind Backend 🧠

> **An Advanced RAG-based PDF Assistant built with FastAPI, LangChain, and ChromaDB.**

DocuMind is a high-performance backend system designed to ingest, analyze, and chat with multiple PDF documents. It leverages local LLMs via Ollama for privacy and speed, offering features like streaming responses, intelligent chunking, and precise source citations.

## 🚀 Features

### Core Essentials (MVP)
- **Multi-Document Ingestion**: Upload and process multiple PDFs simultaneously.
- **Robust PDF Parsing**: Clean text extraction handling headers and footers using `PyMuPDF`.
- **Intelligent Chunking**: Semantic text splitting with overlap to preserve context.
- **Vector Storage**: Local vector database powered by `ChromaDB` and `nomic-embed-text`.
- **Streaming Responses**: Real-time token-by-token generation using Server-Sent Events (SSE).
- **Context-Aware Chat**: Remembers conversation history for natural follow-up questions.

### Google-Level Enhancements
- **Source Citations**: Every answer includes exact page numbers and source documents to prevent hallucinations.
- **Hybrid Search**: (Planned) Combination of keyword (BM25) and semantic search for higher accuracy.
- **Session Management**: (Planned) Persistent chat sessions and workspaces.

## 🛠️ Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) (High performance, easy to use)
- **Orchestration**: [LangChain](https://www.langchain.com/) (RAG chains, retrievers)
- **Vector DB**: [ChromaDB](https://www.trychroma.com/) (Local, persistent)
- **LLM Serving**: [Ollama](https://ollama.com/) (Local Llama 3 inference)
- **PDF Processing**: [PyMuPDF](https://pymupdf.readthedocs.io/) (Fast, accurate text extraction)

## 🏗️ Architecture

```mermaid
graph TD
    User[User Client] -->|POST /api/ingest| API[FastAPI Server]
    User -->|POST /api/chat| API
    
    subgraph "Ingestion Pipeline"
        API -->|Upload| Parser[PyMuPDF Parser]
        Parser -->|Clean Text| Splitter[Recursive Splitter]
        Splitter -->|Chunks| Embed[Ollama Embeddings]
        Embed -->|Vectors| DB[(ChromaDB)]
    end
    
    subgraph "RAG Pipeline"
        API -->|Query| History[Chat History]
        History -->|Contextualized Query| Retriever[Vector Retriever]
        Retriever -->|Docs| DB
        DB -->|Relevant Chunks| LLM[Ollama (Llama 3)]
        LLM -->|Stream| API
    end
```

## ⚡ Getting Started

### Prerequisites
- Python 3.10+
- [Ollama](https://ollama.com/) installed and running.

### 1. Model Setup
Pull the required models in Ollama:
```bash
ollama pull llama3
ollama pull nomic-embed-text
```

### 2. Installation
Clone the repository and install dependencies:
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Running the Server
Start the FastAPI development server from the `server` directory:
```bash
# Make sure you are in the root 'server' directory, not inside 'app'
uvicorn app.main:app --reload
```
The API will be available at `http://localhost:8000`.

### 4. API Documentation
Interactive API docs (Swagger UI) are available at:
- **URL**: `http://localhost:8000/docs`

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ingest` | Uploads and indexes PDF files (Background Task). |
| `POST` | `/api/chat` | Streams chat responses with context and citations. |
| `DELETE` | `/api/clear` | Clears the vector database (for testing). |
| `GET` | `/api/health` | Checks service health. |

## 📂 Project Structure

```
server/
├── app/
│   ├── api/
│   │   ├── endpoints/    # Route handlers (chat, ingest, utils)
│   │   └── api.py        # Router configuration
│   ├── core/
│   │   └── config.py     # App settings (Env vars)
│   ├── services/
│   │   └── vector_store.py # ChromaDB singleton service
│   └── main.py           # App entry point
├── requirements.txt
└── README.md
```

---
*Built for the Google Advanced Coding Agent Project.*
