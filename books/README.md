# Books Library - Technical Learning Resources

This folder contains curated technical books and learning resources for DevOps, MLOps, GenAI, Agentic AI, and related topics.

## 📚 Current Collection

### DevOps (8 books)
- Python For DevOps
- Top 200 DevOps Engineer Interview Questions and Answers
- 500 Essential DevOps Commands  
- Linux Cheat Sheet for DevOps
- Networking for DevOps (2 volumes)
- DevOps Engineering Practices

### Python (9 books)
- Learn Python Step by Step
- Python Basics
- Python For DevOps
- Python Interview Questions
- Python Default Empty Values Cheatsheet
- SQL & Python Integration
- Variables in Python

### Kubernetes (6 books)
- Kubernetes Best Practices
- Kubernetes Notes (31 MB comprehensive guide)
- Kubernetes Interview Questions (2 versions)
- Handwritten Kubernetes Services (kube-proxy, CNI)
- Kubernetes Core Concepts

### GenAI & Agentic AI (2 books)
- Generative AI from LinkedIn
- MLOps Practices

### MLOps (1 resource)
- AWS Machine Learning (ZIP archive)

### IIT Patna Curriculum (5 books - already in root)
- DevOps With AI Curriculum - IIT Patna.pdf
- Generative AI With Agentic AI Curriculum - IIT Patna.pdf
- LLM and Finetuning.pdf
- Complete Data Science Visual Notebook.pdf
- Generative AI Visual Notebook.pdf

### Free Open Source Resources (3 books)
- Mathematics for Machine Learning (mml-book.pdf)
- Google SRE: Building Secure & Reliable Systems
- Kubernetes Cheatsheet (HTML)

---

## 📖 Total: **30+ Technical Books**

## 🎯 How to Use These Books

### With the RAG Engine

1. **Index a book into the vector database:**
   ```bash
   cd agent-studio/server
   python
   >>> from rag_engine import index_book
   >>> index_book(
   ...     book_id="k8s-best-practices",
   ...     title="Kubernetes Best Practices",
   ...     file_path="/Users/satishgundu/CL4R1T4S-main/books/Kubernetes/Kubernetes_Best_Practices_1745328240.pdf",
   ...     category="devops-cloud",
   ...     author="DevOps Community"
   ... )
   ```

2. **Use the Academy AI Co-Reader** to ask questions about any indexed book

3. **Vector search across all books** for specific topics

### Direct Reading
- All books are organized by topic in subdirectories
- Use Preview.app (Mac) or any PDF reader
- Take notes and add them to the academy

## 🔍 Finding More Books

Check:
- `RECOMMENDED_RESOURCES.md` - Links to 50+ free resources
- Your Downloads folder: `~/Downloads/@ @1. Satish Office personal /16. Learning & Notes/`
- 85 total PDFs found in your Learning folder

## 📝 Adding New Books

1. Copy PDF to appropriate category folder:
   ```bash
   cp ~/path/to/book.pdf /Users/satishgundu/CL4R1T4S-main/books/[Category]/
   ```

2. Update this README with the book title

3. Index into RAG for AI-powered reading:
   - Open Academy → Textbook RAG tab
   - Click "Index All Visual Books"
   - Or manually index using Python script

---

**Last Updated**: October 1, 2026
