# DocuMind

DocuMind is an advanced, privacy-focused AI assistant that allows users to chat with their documents and the web. Built with a "local-first" philosophy, it leverages **Ollama** to run powerful LLMs directly on your machine, ensuring your data never leaves your control.

Whether you need to summarize a research paper, extract insights from a financial report, or query a GitHub repository, DocuMind provides a seamless, chat-based interface to interact with your content.

## Features

*   **📄 Chat with PDFs**: Upload PDF documents and ask questions. The system uses RAG (Retrieval-Augmented Generation) to provide accurate answers with source citations.
*   **🌍 Universal Ingestion**: Paste URLs from Wikipedia, GitHub, or any other website. DocuMind scrapes and processes the content, making it instantly queryable.
*   **🎧 Audio Summaries**: Generate podcast-style audio summaries of your documents to listen on the go.
*   **🔒 Local & Private**: Powered by Ollama, all processing happens locally. No API keys required, no data leakage.
*   **🧠 Model Agnostic**: Switch between different LLMs (Llama 3, Mistral, Gemma) on the fly directly from the chat interface.
*   **⚡ Real-time Streaming**: Enjoy a smooth, typewriter-style chat experience with low latency.
*   **🎨 Modern UI**: A clean, responsive interface built with Next.js and Shadcn UI, featuring dark mode support and syntax highlighting for code.

## Technology Stack

### Frontend
*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Components**: [Shadcn UI](https://ui.shadcn.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Markdown**: `react-markdown` with `react-syntax-highlighter`

### Backend
*   **API**: [FastAPI](https://fastapi.tiangolo.com/)
*   **Vector Store**: [ChromaDB](https://www.trychroma.com/)
*   **LLM Orchestration**: [LangChain](https://www.langchain.com/)
*   **PDF Processing**: [PyMuPDF (fitz)](https://pymupdf.readthedocs.io/)
*   **Web Scraping**: `beautifulsoup4` & `WebBaseLoader`
*   **Audio Generation**: `gTTS` (Google Text-to-Speech)

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js** (v18 or higher)
*   **Python** (v3.10 or higher)
*   **Ollama**: Download and install from [ollama.com](https://ollama.com/).
    *   Pull a model: `ollama pull llama3` (or your preferred model).

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/documind.git
cd documind
```

### 2. Backend Setup

Navigate to the server directory and set up the Python environment.

```bash
cd server
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

*Note: If `requirements.txt` is missing, install the core dependencies:*
```bash
pip install fastapi uvicorn[standard] langchain-ollama langchain-community chromadb pymupdf python-multipart httpx gTTS beautifulsoup4
```

### 3. Frontend Setup

Navigate to the client directory and install dependencies.

```bash
cd ../client
npm install
```

## Usage

### Running the Application

1.  **Start the Backend Server**:
    ```bash
    # In /server directory
    source .venv/bin/activate
    uvicorn app.main:app --reload
    ```
    The API will be available at `http://localhost:8000`.

2.  **Start the Frontend Client**:
    ```bash
    # In /client directory
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

### How to Use

1.  **Select a Model**: Use the dropdown in the chat input to select your installed Ollama model.
2.  **Add Content**:
    *   **Upload PDF**: Click the paperclip icon to upload a document.
    *   **Add URL**: Click "Add from URL" to paste a link (e.g., a Wikipedia article).
3.  **Chat**: Type your questions. The AI will answer based on the uploaded context.
4.  **Listen**: Click "Generate Audio" to hear a summary of the active document.
5.  **New Chat**: Click the `+` icon in the sidebar to clear the context and start fresh.

## Project Structure

```
documind/
├── client/                 # Next.js Frontend
│   ├── app/
│   │   ├── components/     # React Components (ChatInterface, MessageBubble)
│   │   ├── hooks/          # Custom Hooks (useChat)
│   │   └── lib/            # Utilities
│   └── public/
├── server/                 # FastAPI Backend
│   ├── app/
│   │   ├── api/            # API Routes (chat, ingest, audio)
│   │   ├── core/           # Configuration
│   │   └── services/       # Business Logic (Vector Store)
│   └── static/             # Generated audio files
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
