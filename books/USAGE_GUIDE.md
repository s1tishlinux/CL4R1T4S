# 📚 Books Library - Complete Usage Guide

## Overview

The CL4R1T4S Books Library contains 30+ technical books covering DevOps, MLOps, GenAI, Agentic AI, Python, Kubernetes, and more. This guide shows you how to maximize the value of this collection.

---

## 🎯 Three Ways to Use the Books

### 1. **AI-Powered Reading with RAG** (Recommended)
Query books using natural language and get instant answers with citations.

### 2. **Direct Reading**
Open PDFs with your favorite reader for traditional study.

### 3. **Academy Integration**
Use the built-in Academy interface for structured learning.

---

## 🚀 Quick Start: Index All Books

### Step 1: Start the Server
```bash
cd /Users/satishgundu/CL4R1T4S-main/agent-studio/server
python serve.py
```

The server will start on `http://localhost:3300`

### Step 2: Automated Indexing (New!)
```bash
cd /Users/satishgundu/CL4R1T4S-main/books
python index_books.py
```

This script will:
- ✅ Scan all category folders (DevOps, Python, Kubernetes, GenAI, MLOps)
- ✅ Index root-level PDFs (IIT Patna curriculum, free resources)
- ✅ Skip large files excluded from git (>10MB)
- ✅ Generate a detailed indexing report
- ✅ Show progress and success/error counts

**Output example:**
```
🔍 Scanning for PDF books...

📁 Processing DevOps...
  📚 Indexing: Python For Devops
  ✅ Success: 342 chunks indexed
  
  📚 Indexing: 500 Essential Devops Commands
  ✅ Success: 89 chunks indexed

...

✨ Indexing Complete!
  📚 Successfully indexed: 25 books
  ❌ Errors: 0 books
  📄 Report saved: indexing_report.json
```

---

## 🔍 Using the RAG Engine

### Query Books via Web Interface

1. **Open the Academy**: Navigate to `http://localhost:3300`
2. **Go to Textbook RAG tab**
3. **Ask questions**:
   - "What are Kubernetes best practices for production?"
   - "Explain Python decorators with examples"
   - "How do I set up a CI/CD pipeline with Jenkins?"
   - "What are the key differences between DevOps and MLOps?"

### Query Books via Python API

```python
import sys
sys.path.append('/Users/satishgundu/CL4R1T4S-main/agent-studio/server')

from rag_engine import query_books

# Search across all books
results = query_books(
    query="What are Kubernetes networking best practices?",
    category="devops-cloud",
    top_k=5
)

for result in results:
    print(f"📖 {result['book_title']}")
    print(f"📄 Page {result.get('page', 'N/A')}")
    print(f"📝 {result['text']}\n")
    print(f"🎯 Relevance: {result['score']:.2f}\n")
    print("-" * 60)
```

### Query Specific Books

```python
from rag_engine import query_book

# Query a specific book
results = query_book(
    book_id="kubernetes-best-practices",
    query="How to configure ingress controllers?",
    top_k=3
)
```

---

## 📂 Library Organization

```
books/
├── DevOps/              # 8 books on DevOps practices
├── Python/              # 7 books on Python programming
├── Kubernetes/          # 5 books on container orchestration
├── GenAI/              # 2 books on Generative AI
├── MLOps/              # 1 resource on ML operations
├── uploads/            # For new book uploads
├── vectors/            # RAG vector database storage
├── README.md           # Library overview
├── USAGE_GUIDE.md      # This file
├── RECOMMENDED_RESOURCES.md  # 50+ free online resources
├── index_books.py      # Automated indexing script
└── indexing_report.json # Last indexing results
```

---

## 🎓 Learning Paths

### Path 1: DevOps Engineer
1. **Linux Cheat Sheet for DevOps** - Start here for command fundamentals
2. **Python For DevOps** - Learn automation scripting
3. **Kubernetes Best Practices** - Master container orchestration
4. **DevOps-With-AI-Curriculum (IIT Patna)** - Advanced AI-enhanced DevOps

### Path 2: MLOps Engineer
1. **Mathematics for Machine Learning** - Build the math foundation
2. **LLM and Finetuning** - Understand large language models
3. **MLOps Practices** - Learn ML pipeline engineering
4. **AWS Machine Learning** - Cloud ML deployment

### Path 3: Agentic AI Developer
1. **Generative AI Visual Notebook** - Understand GenAI fundamentals
2. **IIT Patna Generative-AI-With-Agentic-AI-Curriculum** - Deep dive into agents
3. **Python For DevOps** - Build automation skills
4. **Complete Data Science Visual Notebook** - Data engineering for AI

---

## 🔧 Advanced Usage

### Index a Single Book Manually

```python
from rag_engine import index_book

result = index_book(
    book_id="my-custom-book",
    title="My Custom Technical Book",
    file_path="/path/to/book.pdf",
    category="devops-cloud",
    author="Author Name",
    metadata={
        "publisher": "Tech Press",
        "year": 2026,
        "tags": ["devops", "kubernetes", "docker"]
    }
)

print(f"✅ Indexed {result['chunks']} chunks")
```

### Search with Filters

```python
from rag_engine import query_books

# Search only in DevOps category
results = query_books(
    query="continuous integration best practices",
    category="devops-cloud",
    top_k=10,
    filters={
        "year": 2026,
        "tags": ["ci-cd"]
    }
)
```

### Export Search Results

```python
import json

results = query_books(query="Kubernetes security", top_k=10)

# Save as JSON
with open("search_results.json", "w") as f:
    json.dump(results, f, indent=2)

# Save as Markdown
with open("search_results.md", "w") as f:
    f.write("# Search Results: Kubernetes Security\n\n")
    for i, result in enumerate(results, 1):
        f.write(f"## {i}. {result['book_title']}\n")
        f.write(f"**Page:** {result.get('page', 'N/A')}\n\n")
        f.write(f"{result['text']}\n\n")
        f.write(f"---\n\n")
```

---

## 🆕 Adding New Books

### Method 1: Automatic (Recommended)
```bash
# 1. Copy PDF to appropriate category folder
cp ~/Downloads/new-book.pdf /Users/satishgundu/CL4R1T4S-main/books/DevOps/

# 2. Run indexing script
cd /Users/satishgundu/CL4R1T4S-main/books
python index_books.py

# Done! Book is now searchable
```

### Method 2: Manual Python
```bash
cd /Users/satishgundu/CL4R1T4S-main/agent-studio/server
python
```

```python
from rag_engine import index_book

index_book(
    book_id="new-book-id",
    title="New Book Title",
    file_path="/Users/satishgundu/CL4R1T4S-main/books/DevOps/new-book.pdf",
    category="devops-cloud",
    author="Author Name"
)
```

### Method 3: Web Upload
1. Open `http://localhost:3300`
2. Go to **Academy → Textbook RAG**
3. Click **Upload Book**
4. Select PDF and fill metadata form
5. Click **Index**

---

## 📊 Book Categories & RAG Categories

| Folder Category | RAG Category | Use For |
|----------------|--------------|---------|
| DevOps         | `devops-cloud` | Infrastructure, CI/CD, automation |
| Python         | `programming` | Coding, scripting, development |
| Kubernetes     | `devops-cloud` | Container orchestration, K8s |
| GenAI          | `ai-ml` | Generative AI, LLMs, prompting |
| MLOps          | `ai-ml` | ML pipelines, model deployment |
| Root (IIT)     | Various | Curriculum and comprehensive guides |

---

## ⚡ Performance Tips

1. **Index incrementally**: Don't re-index all books unless necessary
2. **Use category filters**: Narrow searches to relevant categories
3. **Adjust `top_k`**: Start with 3-5 results, increase if needed
4. **Check indexing_report.json**: Review for indexing errors
5. **Large files**: Files >10MB are excluded from git but can be indexed locally

---

## 🐛 Troubleshooting

### "Module not found: rag_engine"
```bash
# Ensure you're in the correct directory
cd /Users/satishgundu/CL4R1T4S-main/agent-studio/server
python
>>> import rag_engine  # Should work now
```

### "Port 3300 already in use"
```bash
# Server is already running - just use it!
# Or kill and restart:
lsof -ti:3300 | xargs kill
python serve.py
```

### "Book not found in vector database"
```bash
# Re-run indexing script
cd /Users/satishgundu/CL4R1T4S-main/books
python index_books.py
```

### "PDF parsing error"
Some PDFs may be scanned images without OCR. Solutions:
1. Use a different PDF version
2. Run OCR with tools like `ocrmypdf`
3. Manually extract text and create a searchable PDF

---

## 🎯 Example Queries to Try

### DevOps & Infrastructure
- "What are the best practices for Docker multi-stage builds?"
- "How do I set up a Jenkins CI/CD pipeline with GitHub webhooks?"
- "Explain Kubernetes service mesh and when to use it"
- "What are the essential Linux commands for DevOps engineers?"

### Python Programming
- "How do I use Python decorators with arguments?"
- "What's the difference between `async def` and `def` in Python?"
- "Show me Python best practices for error handling"
- "How to optimize Python code for performance?"

### Kubernetes
- "What are Kubernetes pod security policies?"
- "How to configure horizontal pod autoscaling?"
- "Explain Kubernetes ingress vs service vs load balancer"
- "Best practices for Kubernetes secrets management"

### GenAI & MLOps
- "What is fine-tuning in LLMs and when should I use it?"
- "How to build a RAG system for document question answering?"
- "What are the key differences between training and inference?"
- "How to deploy ML models with MLOps best practices?"

---

## 📈 Next Steps

1. **Index all books**: Run `python index_books.py`
2. **Try example queries**: Test the RAG engine with real questions
3. **Explore Academy**: Use the web interface for interactive learning
4. **Add your notes**: Create custom study guides and index them too
5. **Share knowledge**: Export search results and share with team

---

## 🔗 Additional Resources

- **RECOMMENDED_RESOURCES.md** - 50+ free online learning resources
- **Agent Studio Server**: `/agent-studio/server/serve.py`
- **RAG Engine Source**: `/agent-studio/server/rag_engine.py`
- **GitHub Repository**: https://github.com/s1tishlinux/CL4R1T4S

---

**Last Updated**: October 1, 2026  
**Maintained by**: CL4R1T4S Team  
**Questions?** Check `README.md` or `RECOMMENDED_RESOURCES.md`
