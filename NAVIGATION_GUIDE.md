# 🧭 OmniTech Academy - Navigation Guide

## Quick Access from Main Page

After starting all services with `./start_all.sh`, navigate to **http://localhost:3300** to access the OmniTech Academy home page.

## 🎯 Three Main Features (Visible on Home Page)

### 1. **Unified Multi-Role Dashboard** 🎯
- **Link:** http://localhost:3300/unified-dashboard.html
- **Purpose:** Query across 11 specialized knowledge domains simultaneously
- **Features:**
  - Multi-role selection (DevOps, Kubernetes, Python, GenAI, Agentic AI, MLE, MLOps, Data Science, AWS Cloud, Linux, General)
  - Parallel database queries
  - Hybrid RAG retrieval (Dense + BM25)
  - Cross-encoder reranking
  - Single unified interface

**How to Use:**
1. Click the **"Unified Multi-Role Dashboard"** card on the home page
2. Select one or more roles (checkboxes)
3. Enter your question
4. Click "Query All Selected Roles"
5. View aggregated results from all selected databases

---

### 2. **System Architecture Overview** 🗺️
- **Link:** http://localhost:3300/system-overview.html
- **Purpose:** Visualize complete system architecture and real-time statistics
- **Features:**
  - All 11 vector databases overview
  - 7 LangGraph agents visualization (Router, Decomposer, Retriever, Reranker, Grader, Generator, Evaluator)
  - Database schemas and table structures
  - Real-time telemetry (books indexed, chunks created, tokens counted)
  - Architecture diagram

**How to Use:**
1. Click the **"System Architecture Overview"** card on the home page
2. View the complete system topology
3. Inspect individual database statistics
4. Understand the agentic workflow

---

### 3. **Original RAG Dashboard** 📊
- **Link:** http://localhost:5000
- **Purpose:** Detailed database inspection and SQL console
- **Features:**
  - Flask-based API interface
  - Deep database inspection
  - Raw SQL query console
  - Schema exploration
  - Table-by-table analysis

**How to Use:**
1. Click the **"Original RAG Dashboard"** card on the home page
2. Opens in new tab (port 5000)
3. Browse individual databases
4. Run custom SQL queries
5. Export data

---

## 📍 Navigation Structure

```
http://localhost:3300/                    (Main Academy Home)
├── unified-dashboard.html               (NEW - Multi-role query interface)
├── system-overview.html                 (NEW - System architecture & stats)
└── [All existing Academy features]

http://localhost:5000/                    (Original RAG Dashboard)
└── Database inspection interface
```

---

## 🚀 Quick Start Navigation Flow

1. **Start all services:**
   ```bash
   ./start_all.sh
   ```

2. **Open browser to main page:**
   ```
   http://localhost:3300
   ```

3. **You'll see 3 prominent cards:**
   - 🎯 **Unified Multi-Role Dashboard** (Purple gradient, "NEW" badge)
   - 🗺️ **System Architecture Overview** (Green gradient, "LIVE" badge)
   - 📊 **Original RAG Dashboard** (Orange gradient, "PORT 5000" badge)

4. **Click any card to navigate** - no manual URL typing needed!

---

## 🎨 Visual Identification

### Unified Dashboard Card
- **Color:** Purple gradient (rgba(99, 102, 241))
- **Badge:** "NEW"
- **Icon:** 🎯
- **Key Tags:** 11 Role DBs, Parallel Queries, Hybrid RAG

### System Overview Card
- **Color:** Green gradient (rgba(16, 185, 129))
- **Badge:** "LIVE"
- **Icon:** 🗺️
- **Key Tags:** 7 Agents, Live Stats, Schemas

### RAG Dashboard Card
- **Color:** Orange gradient (rgba(245, 158, 11))
- **Badge:** "PORT 5000"
- **Icon:** 📊
- **Key Tags:** Flask API, SQL Console, Deep Dive

---

## 🔗 Additional Academy Features

From the main page, you can also access:
- **Roadmaps** - 10 career paths
- **Masterclasses** - 8 deep dives
- **Simulators** - SQL, Linux & Python
- **Cheatsheets** - 6 architecture guides
- **Textbook RAG** - Vector co-reader
- **DB Studio** - Schemas & Vectors
- **Agentic Flow** - LangGraph StateGraph

---

## 📦 All Services Running

After `./start_all.sh`, these services are active:

| Service | Port | URL |
|---------|------|-----|
| Academy Server | 3300 | http://localhost:3300 |
| Multi-DB Dashboard | 5000 | http://localhost:5000 |
| Ollama | 11434 | http://localhost:11434 |

---

## 🛑 Stop All Services

```bash
./stop_all.sh
```

---

## 💡 Pro Tips

1. **Bookmark the main page** (http://localhost:3300) for quick access
2. **All navigation is one-click** from the home page
3. **Cards have hover effects** - they lift up when you hover
4. **System Overview** is great for first-time users to understand the architecture
5. **Unified Dashboard** is your main query interface for cross-domain questions
6. **Original Dashboard** (port 5000) is for deep database inspection

---

## 🆘 Troubleshooting

**Cards not visible?**
- Refresh the page (Ctrl/Cmd + R)
- Clear browser cache (Ctrl/Cmd + Shift + R)

**Links not working?**
- Ensure all services are running: `./start_all.sh`
- Check that ports 3300, 5000, and 11434 are not in use

**Navigation not showing?**
- Make sure you're on http://localhost:3300 (main Academy page)
- The cards appear right after the hero section, before the bento navigation tabs

---

## 📚 Related Documentation

- [STARTUP_GUIDE.md](./STARTUP_GUIDE.md) - Complete startup instructions
- [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) - Database schema and structure
- [AGENTIC_RAG_GUIDE.md](./AGENTIC_RAG_GUIDE.md) - Agentic AI system details

---

**Last Updated:** 2026-10-01  
**Version:** 1.0.0
