# ⚡ Quick Start - Books Library

## 🎯 Get Started in 3 Steps

### 1️⃣ Start the Server
```bash
cd /Users/satishgundu/CL4R1T4S-main/agent-studio/server
python serve.py
```
**Access at**: http://localhost:3300

---

### 2️⃣ Index All Books (One-Time Setup)
```bash
cd /Users/satishgundu/CL4R1T4S-main/books
python index_books.py
```
**Wait for**: "🎉 All books indexed successfully!"

---

### 3️⃣ Start Asking Questions!

#### Via Web Interface
1. Open browser: http://localhost:3300
2. Go to **Academy → Textbook RAG** tab
3. Type your question, click **Search**

#### Via Python
```python
import sys
sys.path.append('/Users/satishgundu/CL4R1T4S-main/agent-studio/server')

from rag_engine import query_books

results = query_books(
    query="What are Kubernetes best practices?",
    category="devops-cloud",
    top_k=5
)

for r in results:
    print(f"📖 {r['book_title']}: {r['text'][:200]}...")
```

---

## 📚 What's in the Library?

| Category | Count | Topics |
|----------|-------|--------|
| **DevOps** | 8 books | CI/CD, Linux, Networking |
| **Python** | 7 books | Programming, Automation |
| **Kubernetes** | 5 books | K8s, Containers, Services |
| **GenAI** | 2 books | LLMs, Generative AI |
| **MLOps** | 1 resource | ML Pipelines, AWS |
| **IIT Curriculum** | 5 PDFs | Comprehensive guides |
| **Free Resources** | 3 items | Math, SRE, K8s cheat |

**Total**: 30+ technical books ready to query!

---

## 💡 Example Questions to Ask

### For DevOps Engineers
```
- "What are the best practices for Docker multi-stage builds?"
- "How to set up Jenkins CI/CD with GitHub?"
- "Essential Linux commands for DevOps"
```

### For ML Engineers
```
- "What is LLM fine-tuning and when to use it?"
- "How to build a RAG system?"
- "MLOps best practices for model deployment"
```

### For Python Developers
```
- "How do Python decorators work?"
- "Best practices for Python error handling"
- "Difference between async def and def"
```

### For Kubernetes Admins
```
- "Kubernetes pod security policies explained"
- "How to configure horizontal pod autoscaling?"
- "Ingress vs Service vs LoadBalancer"
```

---

## 🔧 Common Commands

```bash
# Start server
cd agent-studio/server && python serve.py

# Index all books
cd books && python index_books.py

# Check indexing report
cat books/indexing_report.json

# Add new book
cp ~/Downloads/new-book.pdf books/DevOps/
cd books && python index_books.py

# Find running server
lsof -ti:3300

# Stop server
lsof -ti:3300 | xargs kill
```

---

## 📖 More Documentation

- **USAGE_GUIDE.md** - Comprehensive guide with advanced features
- **README.md** - Library overview and book list
- **RECOMMENDED_RESOURCES.md** - 50+ free online resources

---

## 🆘 Troubleshooting

### Server not starting?
```bash
# Check if already running
lsof -ti:3300

# Kill and restart
lsof -ti:3300 | xargs kill
cd agent-studio/server && python serve.py
```

### Books not searchable?
```bash
# Re-run indexing
cd books && python index_books.py
```

### Python import errors?
```bash
# Make sure you're in the right directory
cd /Users/satishgundu/CL4R1T4S-main/agent-studio/server
python
>>> import rag_engine  # Should work
```

---

## 🎉 You're Ready!

Your AI-powered technical library is ready. Start asking questions and level up your skills!

**Next**: Open http://localhost:3300 and explore the Academy interface.
