# Omni Agent Studio

A multimodal AI testing workbench — chat with local LLMs, generate images and video, search vectorized books via RAG, and run on-device memory recall — all from a single local web server with zero API keys required.

## Project Structure

```
agent-studio/
├── server/                   # Python backend
│   ├── serve.py              # HTTP server & streaming proxy (port 3300)
│   ├── rag_engine.py         # PDF/MD ingestion, vector DB, hybrid search
│   └── on_device_memory.py   # Sub-50ms on-device edge memory engine
├── client/                   # Web frontend
│   ├── index.html            # Main app shell
│   ├── app.js                # Frontend logic & API calls
│   ├── style.css             # Styles
│   └── academy/              # OmniTech Academy sub-app
│       ├── index.html
│       ├── academy.js
│       ├── data.js
│       ├── db-dashboard.html
│       └── style.css
├── assets/                   # Static images
│   ├── cat.jpg
│   └── sample-neural-art.jpg
├── books/                    # RAG document store (git-ignored at runtime)
│   ├── uploads/              # Drop PDFs / Markdown here for ingestion
│   └── vectors/              # SQLite vector DB (rag_catalog.db)
├── requirements.txt
├── .gitignore
└── README.md
```

## Prerequisites

- Python 3.11+
- (Optional) [Ollama](https://ollama.ai) running locally for LLM inference and embeddings
- (Optional) [LM Studio](https://lmstudio.ai) or OmniRoute for alternative model backends

Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Quick Start

```bash
cd agent-studio/server
python serve.py
```

Then open [http://localhost:3300](http://localhost:3300) in your browser.

## Features

| Feature | Description |
|---|---|
| **Multimodal Chat** | Chat with Ollama, LM Studio, OmniRoute, Spark MLX, or the zero-key Pollinations proxy |
| **Image Generation** | Generate images via Pollinations Flux — no API key needed |
| **RAG Engine** | Ingest PDFs and Markdown into a local SQLite vector DB; hybrid dense + BM25 search with neural reranking |
| **On-Device Memory** | Sub-50ms vector recall using a Qdrant+SQLite hybrid edge memory store |
| **OmniTech Academy** | Structured AI/ML curriculum viewer with a live DB studio dashboard |
| **Code Sandbox** | Execute Python, JavaScript, and Bash snippets directly in the browser |
| **Prompt Catalog** | Browse and load 100+ system prompts from the CL4R1T4S repository |

## Gateway Configuration

The server proxies requests to the following backends (all optional):

| Gateway | Default URL | Notes |
|---|---|---|
| Ollama | `http://localhost:11434` | Local LLM inference; also used for `nomic-embed-text` embeddings |
| OmniRoute | `http://localhost:20128` | Custom model router |
| Spark MLX | `http://127.0.0.1:8080` | Apple Silicon MLX server |
| LM Studio | `http://localhost:1234` | LM Studio OpenAI-compatible API |
| Free Web | `https://text.pollinations.ai/openai` | Zero-key cloud fallback |

## RAG Ingestion

Drop PDF or Markdown files into `books/uploads/`, then use the Academy's ingestion UI or call the API directly:

```bash
curl -X POST http://localhost:3300/api/rag/index \
  -H 'Content-Type: application/json' \
  -d '{"book_id":"my_book","title":"My Book","file_path":"/abs/path/to/book.pdf"}'
```

## License

MIT
