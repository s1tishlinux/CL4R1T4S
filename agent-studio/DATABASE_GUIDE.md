# 🗄️ RAG Database Guide - Schemas, Tables & Monitoring

## 📋 Table of Contents

1. [Database Overview](#database-overview)
2. [Schema Details](#schema-details)
3. [Inspection Tools](#inspection-tools)
4. [Web Dashboard](#web-dashboard)
5. [SQL Exports](#sql-exports)
6. [Querying Data](#querying-data)

---

## 🗄️ Database Overview

### Architecture

The RAG system uses **11 separate SQLite databases**, one for each technical role:

```
books/vectors/
├── devops/rag_catalog.db          # DevOps, CI/CD, Docker
├── kubernetes/rag_catalog.db      # K8s, containers, orchestration
├── python/rag_catalog.db          # Python programming
├── genai/rag_catalog.db           # LLMs, prompts, embeddings
├── agentic_ai/rag_catalog.db      # Agents, LangGraph, tools
├── mle/rag_catalog.db             # ML algorithms, training
├── mlops/rag_catalog.db           # ML pipelines, deployment
├── data_science/rag_catalog.db    # Pandas, visualization
├── aws_cloud/rag_catalog.db       # AWS services, cloud
├── linux/rag_catalog.db           # Linux, bash, system admin
└── general/rag_catalog.db         # General technical content
```

### Why Separate Databases?

✅ **Isolated Performance**: Queries only search relevant domains  
✅ **Scalability**: Each database can grow independently  
✅ **Maintainability**: Easy to backup/restore specific roles  
✅ **Optimization**: Role-specific indexing strategies  

---

## 📊 Schema Details

### Table 1: `rag_books`

Stores metadata about indexed books.

```sql
CREATE TABLE rag_books (
    book_id TEXT PRIMARY KEY,              -- Unique book identifier
    title TEXT NOT NULL,                   -- Book title
    subtitle TEXT,                         -- Book subtitle
    author TEXT,                           -- Author name
    category TEXT,                         -- Technical category
    role TEXT,                             -- Target role (devops, k8s, etc.)
    file_path TEXT,                        -- Original file path
    file_type TEXT,                        -- pdf, markdown, json
    total_pages INTEGER DEFAULT 1,         -- Number of pages
    total_chunks INTEGER DEFAULT 0,        -- Number of chunks created
    status TEXT DEFAULT 'pending',         -- indexed, pending, error
    created_at TEXT,                       -- Timestamp
    chunking_strategy TEXT DEFAULT 'langchain_recursive',
    metadata_json TEXT                     -- Additional metadata (JSON)
);
```

**Indexes:**
- `PRIMARY KEY (book_id)` - Fast lookups by book ID
- `idx_books_role (role)` - Fast filtering by role

### Table 2: `rag_chunks`

Stores individual text chunks with embeddings.

```sql
CREATE TABLE rag_chunks (
    chunk_id TEXT PRIMARY KEY,             -- Unique chunk identifier
    book_id TEXT NOT NULL,                 -- Foreign key to rag_books
    chapter_title TEXT,                    -- Chapter/section name
    page_number INTEGER DEFAULT 1,         -- Page number
    chunk_index INTEGER DEFAULT 0,         -- Chunk sequence within page
    chunk_text TEXT NOT NULL,              -- Actual text content
    token_count INTEGER DEFAULT 0,         -- Number of tokens
    embedding_json TEXT,                   -- 768-dim vector (JSON)
    l2_norm REAL DEFAULT 1.0,              -- L2 norm for normalization
    chunk_strategy TEXT DEFAULT 'langchain_recursive',
    metadata_json TEXT,                    -- Chunk metadata (JSON)
    FOREIGN KEY (book_id) REFERENCES rag_books (book_id) ON DELETE CASCADE
);
```

**Indexes:**
- `PRIMARY KEY (chunk_id)` - Fast lookups by chunk ID
- `idx_chunks_book (book_id)` - Fast retrieval of all book chunks
- `idx_chunks_page (book_id, page_number)` - Fast page-level queries

### Table 3: `rag_queries_log`

Logs query history and performance metrics.

```sql
CREATE TABLE rag_queries_log (
    query_id TEXT PRIMARY KEY,             -- Unique query identifier
    timestamp TEXT NOT NULL,               -- Query timestamp
    user_query TEXT NOT NULL,              -- Original user query
    role TEXT,                             -- Target role database
    book_id TEXT,                          -- Specific book (if any)
    chunks_retrieved INTEGER DEFAULT 0,    -- Number of chunks returned
    latency_ms INTEGER DEFAULT 0,          -- Query latency
    top_score REAL DEFAULT 0.0,            -- Best similarity score
    response_preview TEXT                  -- Answer preview
);
```

**Indexes:**
- `PRIMARY KEY (query_id)` - Fast lookups
- `idx_query_logs_time (timestamp DESC)` - Fast time-based queries

---

## 🔍 Inspection Tools

### 1. Command-Line Inspector

**Location:** `agent-studio/server/inspect_databases.py`

#### Quick Statistics

```bash
cd agent-studio/server
python inspect_databases.py --quick
```

**Output:**
```
⚡ QUICK DATABASE STATISTICS
════════════════════════════════════════
📊 System-Wide Statistics:
   Total Books: 25
   Total Chunks: 8,543

📚 Per-Role Breakdown:
   Role               Books     Chunks   Avg/Book
   --------------- -------- ---------- ----------
   devops                 8      2,567      320.9
   kubernetes             5      1,234      246.8
   python                 7      1,890      270.0
   ...
```

#### Full Schema Inspection

```bash
python inspect_databases.py --full
```

**Output:**
```
📊 DATABASE: DEVOPS
═══════════════════════════════════════
📁 Path: /path/to/devops/rag_catalog.db
💾 Size: 12.34 MB
📊 Tables: 3
📄 Total Rows: 2,567

─────────────────────────────────────
📋 TABLE: rag_books
─────────────────────────────────────
📊 Rows: 8 | Size: 0.15 MB

   SCHEMA:
      • book_id           TEXT         [PK]
      • title             TEXT         NOT NULL
      • subtitle          TEXT
      ...

   INDEXES:
      • idx_books_role    ON (role)
      ...
```

#### Export SQL Schemas

```bash
python inspect_databases.py --export-sql
```

Creates: `/books/database_schemas.sql` with all CREATE TABLE statements.

---

## 🌐 Web Dashboard

### Starting the Dashboard

```bash
cd agent-studio/server
python rag_dashboard.py
```

**Or specify a custom port:**
```bash
python rag_dashboard.py --port 8080
```

### Accessing the Dashboard

Open your browser to: **http://localhost:5000**

### Dashboard Features

#### 📊 Overview Section
- **Total Books**: Across all databases
- **Total Chunks**: Total indexed chunks
- **Vector Databases**: Number of databases
- **Active Databases**: Databases with data

#### 📚 Database Grid
- Click any database card to see details
- Color-coded:
  - **Purple gradient**: Active databases
  - **Gray**: Empty databases
- Shows: Tables, Rows, Size per database

#### 📋 Schema Viewer
- Complete table schemas
- Column types and constraints
- Indexes and their columns
- Row counts and sizes

### Dashboard API Endpoints

The dashboard exposes REST APIs:

```
GET /                          # Main dashboard UI
GET /api/stats                 # System-wide statistics
GET /api/databases             # All database info
GET /api/database/{role}       # Specific database details
GET /api/books/{role}          # Books list for a role
```

**Example API Call:**
```bash
curl http://localhost:5000/api/stats | jq
```

**Response:**
```json
{
  "total_books": 25,
  "total_chunks": 8543,
  "role_statistics": {
    "devops": {
      "books_count": 8,
      "chunks_count": 2567,
      "avg_chunks_per_book": 320.9
    },
    ...
  }
}
```

---

## 📄 SQL Exports

### Exported Files

1. **`books/database_schemas.sql`** - All CREATE TABLE statements
2. **`books/database_inspection_report.json`** - Complete inspection data

### Using SQL Schemas

#### View All Schemas

```bash
cat books/database_schemas.sql
```

#### Import to Another Database

```bash
sqlite3 new_database.db < books/database_schemas.sql
```

#### Inspect with SQLite CLI

```bash
sqlite3 books/vectors/devops/rag_catalog.db

# List tables
.tables

# Show schema
.schema rag_books

# Query data
SELECT book_id, title, total_chunks FROM rag_books;
```

---

## 🔎 Querying Data

### Python API

```python
from rag_engine_enhanced import RoleBasedDatabaseManager

# Get database manager
db_manager = RoleBasedDatabaseManager()

# Query a specific role
conn = db_manager.get_connection("kubernetes")

# Get all books
cursor = conn.execute("SELECT * FROM rag_books")
books = cursor.fetchall()

# Get chunks for a book
cursor = conn.execute("""
    SELECT chunk_text, page_number 
    FROM rag_chunks 
    WHERE book_id = ? 
    ORDER BY page_number, chunk_index
""", ("k8s-best-practices",))
chunks = cursor.fetchall()

conn.close()
```

### Direct SQL Queries

```bash
# Count books per role
sqlite3 books/vectors/*/rag_catalog.db \
  "SELECT COUNT(*) FROM rag_books"

# Find largest books
sqlite3 books/vectors/devops/rag_catalog.db \
  "SELECT title, total_chunks FROM rag_books ORDER BY total_chunks DESC LIMIT 5"

# Search chunks by content
sqlite3 books/vectors/kubernetes/rag_catalog.db \
  "SELECT chunk_text FROM rag_chunks WHERE chunk_text LIKE '%pod%' LIMIT 3"
```

### Get Statistics Programmatically

```python
from rag_engine_enhanced import get_all_statistics, get_role_statistics

# System-wide stats
stats = get_all_statistics()
print(f"Total books: {stats['total_books']}")
print(f"Total chunks: {stats['total_chunks']}")

# Per-role stats
k8s_stats = get_role_statistics("kubernetes")
print(f"K8s books: {k8s_stats['books_count']}")
print(f"K8s chunks: {k8s_stats['chunks_count']}")
```

---

## 🛠️ Maintenance Tasks

### Backup Databases

```bash
# Backup all databases
tar -czf rag_databases_backup_$(date +%Y%m%d).tar.gz \
  books/vectors/*/rag_catalog.db

# Backup single database
cp books/vectors/kubernetes/rag_catalog.db \
   backups/kubernetes_$(date +%Y%m%d).db
```

### Vacuum Databases (Reclaim Space)

```bash
# Vacuum all databases
for db in books/vectors/*/rag_catalog.db; do
  echo "Vacuuming $db..."
  sqlite3 "$db" "VACUUM;"
done
```

### Reset a Database

```bash
# Delete and recreate
rm books/vectors/devops/rag_catalog.db

# Re-index books for that role
cd books
python index_books_langgraph.py
```

### Check Database Integrity

```bash
sqlite3 books/vectors/devops/rag_catalog.db "PRAGMA integrity_check;"
```

---

## 📊 Monitoring & Alerts

### Query Performance

```python
import time
from rag_engine_enhanced import query_role_database

start = time.time()
results = query_role_database(
    query="Kubernetes best practices",
    role="kubernetes",
    top_k=5
)
latency = (time.time() - start) * 1000

print(f"Query latency: {latency:.2f}ms")
print(f"Results: {len(results)}")
```

### Database Growth

```bash
# Track size over time
du -h books/vectors/*/rag_catalog.db

# Monitor chunk count
python -c "
from rag_engine_enhanced import get_all_statistics
stats = get_all_statistics()
print(f'Total chunks: {stats[\"total_chunks\"]:,}')
"
```

---

## 🎯 Best Practices

### Indexing
- ✅ Index books incrementally (one role at a time)
- ✅ Monitor database size during indexing
- ✅ Use `--export-sql` to backup schemas

### Querying
- ✅ Query specific roles when possible
- ✅ Use indexes (book_id, page_number)
- ✅ Limit result sets with top_k

### Maintenance
- ✅ Vacuum databases monthly
- ✅ Backup before major changes
- ✅ Monitor query latency

---

## 🚨 Troubleshooting

### "Database locked" Error

```bash
# Check for other processes
lsof books/vectors/devops/rag_catalog.db

# Close connections
fuser -k books/vectors/devops/rag_catalog.db
```

### "Disk full" During Indexing

```bash
# Check space
df -h

# Clean up temp files
rm -rf books/vectors/*/rag_catalog.db-wal
rm -rf books/vectors/*/rag_catalog.db-shm
```

### Dashboard Not Loading

```bash
# Check port availability
lsof -ti:5000

# Try different port
python rag_dashboard.py --port 8080
```

---

## 📚 Additional Resources

- **Inspection Tool**: `server/inspect_databases.py`
- **Web Dashboard**: `server/rag_dashboard.py`
- **API Reference**: See dashboard `/api/*` endpoints
- **SQL Schemas**: `books/database_schemas.sql`

---

## 🎓 Quick Reference

```bash
# View quick stats
python server/inspect_databases.py --quick

# Full inspection
python server/inspect_databases.py --full

# Export schemas
python server/inspect_databases.py --export-sql

# Start dashboard
python server/rag_dashboard.py

# Query specific database
sqlite3 books/vectors/kubernetes/rag_catalog.db

# Get Python stats
python -c "from rag_engine_enhanced import get_all_statistics; \
           import json; print(json.dumps(get_all_statistics(), indent=2))"
```

---

**Last Updated**: October 1, 2026  
**Maintainer**: CL4R1T4S Team
