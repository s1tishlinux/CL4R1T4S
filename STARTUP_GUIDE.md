# 🚀 CL4R1T4S - Quick Startup Guide

## ⚡ Start Everything with One Command

```bash
./start_all.sh
```

That's it! This single command starts:
- ✅ Academy Server (port 3300)
- ✅ Multi-DB Dashboard (port 5000)
- ✅ Ollama Service (port 11434)
- ✅ All 11 role-based vector databases

---

## 🌐 Access Points

Once started, **open your browser to http://localhost:3300** - all features are accessible via **one-click navigation cards**!

| Service | URL | Description |
|---------|-----|-------------|
| **Academy Home** ⭐ | http://localhost:3300 | **START HERE** - Main interface with navigation cards |
| **Unified Dashboard** | http://localhost:3300/unified-dashboard.html | Query ALL databases at once (click 🎯 purple card) |
| **System Overview** | http://localhost:3300/system-overview.html | Complete system map (click 🗺️ green card) |
| **Multi-DB Dashboard** | http://localhost:5000 | Technical database viewer (click 📊 orange card) |

**💡 Pro Tip**: Just go to http://localhost:3300 and click the prominent cards at the top - no need to type URLs!

---

## 🎯 Unified Dashboard Features

### **Multi-Role Querying**

The unified dashboard lets you query multiple technical domains **simultaneously**:

✅ **Select Roles**: Check/uncheck any combination:
- 🚀 DevOps
- ☸️ Kubernetes  
- 🐍 Python
- 🤖 GenAI
- 🎯 Agentic AI
- 🧠 MLE (Machine Learning Engineering)
- ⚙️ MLOps
- 📊 Data Science
- ☁️ AWS Cloud
- 🐧 Linux
- 📚 General

✅ **Ask Any Question**: Query all selected databases at once

✅ **Get Unified Results**: See relevant answers from ALL domains, sorted by relevance

### **Example Queries**

Try these multi-domain queries:

**DevOps + Cloud:**
```
How do I deploy containers to AWS ECS using CI/CD?
```
→ Gets results from DevOps, AWS Cloud, and Kubernetes databases

**ML + MLOps:**
```
Best practices for deploying ML models in production
```
→ Gets results from MLE, MLOps, and Python databases

**GenAI + Python:**
```
How to implement RAG with LangChain?
```
→ Gets results from GenAI, Agentic AI, and Python databases

---

## 🛑 Stop All Services

```bash
./stop_all.sh
```

This stops:
- Academy Server (port 3300)
- Multi-DB Dashboard (port 5000)
- Ollama Service (optional)

---

## 📊 What's Running?

### **1. Academy Server (Port 3300)**
- Main web interface
- Serves all dashboards
- API endpoints for multi-role queries
- File management

### **2. Multi-DB Dashboard (Port 5000)**
- Technical database inspector
- Schema viewer
- Real-time statistics
- Per-database drilling

### **3. Ollama (Port 11434)**
- Local embedding generation
- Uses nomic-embed-text model (768-dim vectors)
- Required for indexing new books

---

## 📚 11 Role-Based Databases

All automatically available after startup:

```
books/vectors/
├── devops/         → CI/CD, Docker, Jenkins
├── kubernetes/     → K8s orchestration
├── python/         → Python programming
├── genai/          → LLMs, prompts
├── agentic_ai/     → Agents, tools
├── mle/            → ML algorithms
├── mlops/          → ML pipelines
├── data_science/   → Pandas, visualization
├── aws_cloud/      → AWS services
├── linux/          → System admin
└── general/        → General tech
```

---

## 🔍 How Multi-Role Query Works

```
User Query: "Kubernetes CI/CD best practices"
    │
    ▼
┌─────────────────────────┐
│ Select Roles:           │
│ ✓ DevOps                │
│ ✓ Kubernetes            │
│ □ Python                │
│ □ GenAI                 │
└───────────┬─────────────┘
            │
            ▼
    ┌───────────────┐
    │ Query Engine  │
    │ (parallel)    │
    └───┬───────────┘
        │
        ├──→ DevOps DB      → 3 results
        └──→ Kubernetes DB  → 3 results
        │
        ▼
    ┌──────────────────┐
    │ Merge & Sort     │
    │ by Relevance     │
    └────────┬─────────┘
             │
             ▼
    ┌────────────────────┐
    │ Display 6 Results  │
    │ with Scores        │
    └────────────────────┘
```

---

## 🎓 Usage Examples

### **Example 1: Full-Stack DevOps Query**

**Roles**: DevOps + Kubernetes + AWS Cloud + Linux

**Query**: "Set up a production Kubernetes cluster on AWS with monitoring"

**Results**: Get answers from all 4 domains covering:
- DevOps: CI/CD setup
- Kubernetes: Cluster configuration
- AWS Cloud: EKS setup
- Linux: System tuning

### **Example 2: ML Pipeline Query**

**Roles**: MLE + MLOps + Python + Data Science

**Query**: "Build an ML training pipeline with data preprocessing"

**Results**: Comprehensive answers covering:
- MLE: Model architecture
- MLOps: Pipeline automation
- Python: Code implementation
- Data Science: Data preprocessing

### **Example 3: AI Development Query**

**Roles**: GenAI + Agentic AI + Python

**Query**: "Implement a multi-agent RAG system with LangGraph"

**Results**: Complete guidance from:
- GenAI: RAG concepts
- Agentic AI: Agent frameworks
- Python: Code examples

---

## ⚡ Quick Commands

```bash
# Start everything
./start_all.sh

# Check if running
lsof -i:3300,5000,11434

# View logs
tail -f logs/academy.log
tail -f logs/dashboard.log

# Stop everything
./stop_all.sh

# Restart (clean)
./stop_all.sh && ./start_all.sh
```

---

## 📝 Logs Location

All logs are in the `logs/` directory:

```
logs/
├── academy.log      # Main server logs
├── dashboard.log    # Dashboard logs
└── ollama.log       # Ollama service logs
```

---

## 🐛 Troubleshooting

### "Port already in use"

```bash
# Stop existing services
./stop_all.sh

# Or manually kill
lsof -ti:3300 | xargs kill
lsof -ti:5000 | xargs kill
```

### "Ollama not found"

```bash
# Install Ollama
brew install ollama  # macOS
# or visit: https://ollama.ai/

# Pull embedding model
ollama pull nomic-embed-text
```

### "No results in unified dashboard"

```bash
# Index books first
cd books
python index_books_langgraph.py
```

### "Multi-role query fails"

```bash
# Check server is running
curl http://localhost:3300/api/multi_role_query

# Check logs
tail -f logs/academy.log
```

---

## 🎯 Differences from Old System

### **Before (Multiple Dashboards)**
- ❌ Had to open 3 different URLs
- ❌ Query one database at a time
- ❌ Start services manually
- ❌ Confusing to understand

### **Now (Unified System)**
- ✅ One startup command
- ✅ One unified dashboard
- ✅ Query all databases simultaneously
- ✅ Clear system overview

---

## 📊 System Architecture

```
┌─────────────────────────────────────┐
│         ./start_all.sh              │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌─────────┐ ┌────────┐ ┌──────────┐
│ Academy │ │Dashboard│ │ Ollama  │
│ :3300   │ │ :5000   │ │ :11434  │
└────┬────┘ └────────┘ └──────────┘
     │
     ├─→ Unified Dashboard
     │   (Multi-role query)
     │
     ├─→ System Overview
     │   (Architecture map)
     │
     └─→ API Endpoints
         /api/multi_role_query
```

---

## 🎉 Benefits

### **For You**
- ⚡ **One command** to start everything
- 🎯 **One dashboard** for all queries
- 🔍 **Multi-domain** answers in seconds
- 📊 **Clear visibility** of all components

### **Technical**
- ✅ Parallel database queries
- ✅ Automatic service orchestration
- ✅ Unified result ranking
- ✅ Real-time statistics

---

## 📚 Next Steps

1. **Start the system**: `./start_all.sh`
2. **Open main page**: http://localhost:3300
3. **Click navigation cards**: Choose from:
   - 🎯 **Unified Multi-Role Dashboard** (purple card) - query 11 databases
   - 🗺️ **System Architecture Overview** (green card) - view system map
   - 📊 **Original RAG Dashboard** (orange card) - deep database inspection
4. **Select your roles**: Check DevOps, AWS, MLE, MLOps, GenAI, etc.
5. **Ask your question**: Get answers from all selected domains
6. **Explore results**: Sorted by relevance with source citations

---

## 🆘 Need Help?

- **Navigation Guide**: `NAVIGATION_GUIDE.md` - Complete navigation walkthrough
- **System Overview**: http://localhost:3300/system-overview.html
- **Documentation**: `DATABASE_GUIDE.md`, `AGENTIC_RAG_GUIDE.md`
- **Logs**: `logs/academy.log`

---

**Last Updated**: October 1, 2026  
**Repository**: https://github.com/s1tishlinux/CL4R1T4S

🎉 **Happy Querying Across All Domains!**
