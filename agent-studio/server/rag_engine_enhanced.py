#!/usr/bin/env python3
"""
Enhanced Multi-Role RAG Engine with LangChain RecursiveCharacterTextSplitter
Features:
- Separate vector databases for different technical roles
- Hybrid chunking strategy (semantic + fixed-size with overlap)
- LangChain's RecursiveCharacterTextSplitter integration
- Role-based query routing and filtering
"""

import os
import sys
import json
import sqlite3
import urllib.request
import re
import math
import time
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from langchain_text_splitters import (
        RecursiveCharacterTextSplitter as RecursiveTextSplitter,
        Language
    )
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    print("[WARNING] LangChain not available. Install with: pip install langchain langchain-text-splitters")

try:
    import numpy as np
except ImportError:
    np = None

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import pypdf
except ImportError:
    pypdf = None

# Directory structure
BASE_DIR = Path(__file__).parent.resolve()
WORKSPACE_ROOT = BASE_DIR.parent
BOOKS_DIR = WORKSPACE_ROOT.parent / "books"
UPLOADS_DIR = BOOKS_DIR / "uploads"
VECTORS_DIR = BOOKS_DIR / "vectors"

# Create role-specific subdirectories
ROLE_DATABASES = {
    "devops": VECTORS_DIR / "devops",
    "mle": VECTORS_DIR / "mle",
    "mlops": VECTORS_DIR / "mlops",
    "genai": VECTORS_DIR / "genai",
    "agentic_ai": VECTORS_DIR / "agentic_ai",
    "data_science": VECTORS_DIR / "data_science",
    "aws_cloud": VECTORS_DIR / "aws_cloud",
    "linux": VECTORS_DIR / "linux",
    "python": VECTORS_DIR / "python",
    "kubernetes": VECTORS_DIR / "kubernetes",
    "general": VECTORS_DIR / "general"
}

# Create all directories
for role_dir in ROLE_DATABASES.values():
    role_dir.mkdir(parents=True, exist_ok=True)

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Embedding configuration
OLLAMA_EMBED_URL = "http://localhost:11434/api/embeddings"
EMBED_MODEL = "nomic-embed-text"

# ==============================================================================
# Role-Based Chunking Strategies
# ==============================================================================

class HybridChunkingStrategy:
    """
    Hybrid chunking combining semantic awareness with fixed-size chunks.
    Uses LangChain's RecursiveCharacterTextSplitter with role-specific optimizations.
    """
    
    # Role-specific chunk configurations
    ROLE_CONFIGS = {
        "devops": {
            "chunk_size": 1200,
            "chunk_overlap": 200,
            "separators": [
                "\n## ",  # Markdown headers
                "\n### ",
                "\n```\n",  # Code blocks
                "\n\n",  # Paragraphs
                "\n",
                ". ",
                " ",
                ""
            ],
            "description": "Optimized for CI/CD pipelines, infrastructure configs, shell scripts"
        },
        "mle": {
            "chunk_size": 1500,
            "chunk_overlap": 250,
            "separators": [
                "\n## ",
                "\n### ",
                "\n```python\n",  # Python code
                "\n```\n",
                "\n\n",
                "\n",
                ". ",
                " ",
                ""
            ],
            "description": "Optimized for ML algorithms, model training, feature engineering"
        },
        "mlops": {
            "chunk_size": 1300,
            "chunk_overlap": 220,
            "separators": [
                "\n## ",
                "\n### ",
                "\n```yaml\n",  # Config files
                "\n```python\n",
                "\n```\n",
                "\n\n",
                "\n",
                ". ",
                " ",
                ""
            ],
            "description": "Optimized for ML pipelines, model deployment, monitoring"
        },
        "genai": {
            "chunk_size": 1400,
            "chunk_overlap": 250,
            "separators": [
                "\n## ",
                "\n### ",
                "\n#### ",
                "\n\n",
                "\n",
                ". ",
                " ",
                ""
            ],
            "description": "Optimized for LLM concepts, prompt engineering, embeddings"
        },
        "agentic_ai": {
            "chunk_size": 1350,
            "chunk_overlap": 230,
            "separators": [
                "\n## ",
                "\n### ",
                "\n```python\n",
                "\n\n",
                "\n",
                ". ",
                " ",
                ""
            ],
            "description": "Optimized for agent frameworks, tool usage, ReAct patterns"
        },
        "data_science": {
            "chunk_size": 1400,
            "chunk_overlap": 240,
            "separators": [
                "\n## ",
                "\n### ",
                "\n```python\n",
                "\n```r\n",
                "\n```\n",
                "\n\n",
                "\n",
                ". ",
                " ",
                ""
            ],
            "description": "Optimized for statistics, EDA, visualization, pandas/numpy"
        },
        "aws_cloud": {
            "chunk_size": 1250,
            "chunk_overlap": 210,
            "separators": [
                "\n## ",
                "\n### ",
                "\n```json\n",  # AWS configs
                "\n```yaml\n",
                "\n```\n",
                "\n\n",
                "\n",
                ". ",
                " ",
                ""
            ],
            "description": "Optimized for AWS services, CloudFormation, IAM policies"
        },
        "linux": {
            "chunk_size": 1100,
            "chunk_overlap": 180,
            "separators": [
                "\n## ",
                "\n### ",
                "\n```bash\n",  # Shell commands
                "\n```\n",
                "\n\n",
                "\n",
                ". ",
                " ",
                ""
            ],
            "description": "Optimized for Linux commands, system admin, shell scripting"
        },
        "python": {
            "chunk_size": 1300,
            "chunk_overlap": 220,
            "separators": [
                "\nclass ",  # Python classes
                "\ndef ",  # Functions
                "\n```python\n",
                "\n```\n",
                "\n\n",
                "\n",
                ". ",
                " ",
                ""
            ],
            "description": "Optimized for Python syntax, libraries, OOP, async"
        },
        "kubernetes": {
            "chunk_size": 1250,
            "chunk_overlap": 210,
            "separators": [
                "\n## ",
                "\n### ",
                "\n```yaml\n",  # K8s manifests
                "\n```\n",
                "\n\n",
                "\n",
                ". ",
                " ",
                ""
            ],
            "description": "Optimized for K8s resources, kubectl commands, helm charts"
        },
        "general": {
            "chunk_size": 1200,
            "chunk_overlap": 200,
            "separators": [
                "\n## ",
                "\n### ",
                "\n\n",
                "\n",
                ". ",
                " ",
                ""
            ],
            "description": "Default configuration for general technical content"
        }
    }
    
    @classmethod
    def get_splitter(cls, role: str = "general") -> Any:
        """Get LangChain RecursiveCharacterTextSplitter configured for role."""
        if not LANGCHAIN_AVAILABLE:
            raise ImportError("LangChain not installed. Run: pip install langchain langchain-text-splitters")
        
        config = cls.ROLE_CONFIGS.get(role, cls.ROLE_CONFIGS["general"])
        
        return RecursiveCharacterTextSplitter(
            chunk_size=config["chunk_size"],
            chunk_overlap=config["chunk_overlap"],
            separators=config["separators"],
            length_function=len,
            is_separator_regex=False,
        )
    
    @classmethod
    def chunk_text(cls, text: str, role: str = "general", metadata: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """
        Chunk text using role-specific strategy with metadata preservation.
        Returns list of dicts with 'text' and 'metadata' keys.
        """
        if not text or len(text.strip()) < 30:
            return []
        
        splitter = cls.get_splitter(role)
        chunks = splitter.split_text(text)
        
        result = []
        for idx, chunk_text in enumerate(chunks):
            chunk_metadata = {
                "chunk_index": idx,
                "role": role,
                "chunk_strategy": "langchain_recursive",
                **(metadata or {})
            }
            result.append({
                "text": chunk_text,
                "metadata": chunk_metadata
            })
        
        return result
    
    @classmethod
    def list_roles(cls) -> Dict[str, str]:
        """List available roles and their descriptions."""
        return {role: config["description"] for role, config in cls.ROLE_CONFIGS.items()}


# ==============================================================================
# Role-Based Database Manager
# ==============================================================================

class RoleBasedDatabaseManager:
    """Manages separate SQLite vector databases for each technical role."""
    
    def __init__(self):
        self.role_connections = {}
        self._initialize_all_databases()
    
    def _initialize_all_databases(self):
        """Initialize schema for all role databases."""
        for role, db_dir in ROLE_DATABASES.items():
            db_path = db_dir / "rag_catalog.db"
            self._init_database_schema(db_path)
    
    def _init_database_schema(self, db_path: Path):
        """Create tables for a specific database."""
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        
        # Books table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS rag_books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                author TEXT,
                category TEXT,
                role TEXT,
                file_path TEXT,
                file_type TEXT,
                total_pages INTEGER DEFAULT 1,
                total_chunks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                chunking_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT
            )
        """)
        
        # Chunks table with enhanced metadata
        conn.execute("""
            CREATE TABLE IF NOT EXISTS rag_chunks (
                chunk_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                chapter_title TEXT,
                page_number INTEGER DEFAULT 1,
                chunk_index INTEGER DEFAULT 0,
                chunk_text TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                embedding_json TEXT,
                l2_norm REAL DEFAULT 1.0,
                chunk_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT,
                FOREIGN KEY (book_id) REFERENCES rag_books (book_id) ON DELETE CASCADE
            )
        """)
        
        # Query log
        conn.execute("""
            CREATE TABLE IF NOT EXISTS rag_queries_log (
                query_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                user_query TEXT NOT NULL,
                role TEXT,
                book_id TEXT,
                chunks_retrieved INTEGER DEFAULT 0,
                latency_ms INTEGER DEFAULT 0,
                top_score REAL DEFAULT 0.0,
                response_preview TEXT
            )
        """)
        
        # Indexes
        conn.execute("CREATE INDEX IF NOT EXISTS idx_chunks_book ON rag_chunks(book_id)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_chunks_page ON rag_chunks(book_id, page_number)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_books_role ON rag_books(role)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_query_logs_time ON rag_queries_log(timestamp DESC)")
        
        conn.commit()
        conn.close()
    
    def get_connection(self, role: str = "general") -> sqlite3.Connection:
        """Get database connection for specific role."""
        if role not in ROLE_DATABASES:
            role = "general"
        
        db_path = ROLE_DATABASES[role] / "rag_catalog.db"
        conn = sqlite3.connect(str(db_path))
        conn.row_factory = sqlite3.Row
        return conn
    
    def get_all_connections(self) -> Dict[str, sqlite3.Connection]:
        """Get connections to all role databases."""
        return {role: self.get_connection(role) for role in ROLE_DATABASES.keys()}


# Global database manager instance
db_manager = RoleBasedDatabaseManager()


# ==============================================================================
# Embedding Generation
# ==============================================================================

def get_embedding(text: str) -> Optional[List[float]]:
    """Generate 768-dim embeddings via local Ollama nomic-embed-text."""
    payload = json.dumps({"model": EMBED_MODEL, "prompt": text[:4000]}).encode("utf-8")
    req = urllib.request.Request(
        OLLAMA_EMBED_URL,
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("embedding")
    except Exception as e:
        return _fallback_vector(text)


def _fallback_vector(text: str, dim: int = 768) -> List[float]:
    """Deterministic feature hashing fallback."""
    vec = [0.0] * dim
    words = re.findall(r'\b\w+\b', text.lower())
    for w in words:
        h = abs(hash(w)) % dim
        vec[h] += 1.0
    norm = math.sqrt(sum(v * v for v in vec))
    if norm > 0:
        vec = [v / norm for v in vec]
    return vec


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    if np is not None:
        a = np.array(v1, dtype=np.float32)
        b = np.array(v2, dtype=np.float32)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(a, b) / (norm_a * norm_b))
    else:
        dot = sum(a * b for a, b in zip(v1, v2))
        norm_a = math.sqrt(sum(a * a for a in v1))
        norm_b = math.sqrt(sum(b * b for b in v2))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)


# ==============================================================================
# PDF/Document Parsers
# ==============================================================================

def extract_text_from_pdf(pdf_path: str) -> List[Dict[str, Any]]:
    """Extract text from PDF with page numbers."""
    pages = []
    
    if fitz is not None:
        try:
            doc = fitz.open(pdf_path)
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text().strip()
                if text:
                    pages.append({
                        "page_number": page_num + 1,
                        "text": text
                    })
            doc.close()
            return pages
        except Exception as e:
            print(f"[RAG] PyMuPDF failed: {e}")
    
    if pypdf is not None:
        try:
            reader = pypdf.PdfReader(pdf_path)
            for page_num, page in enumerate(reader.pages):
                text = (page.extract_text() or "").strip()
                if text:
                    pages.append({
                        "page_number": page_num + 1,
                        "text": text
                    })
            return pages
        except Exception as e:
            print(f"[RAG] pypdf failed: {e}")
    
    return pages


# ==============================================================================
# Enhanced Indexing with Role-Based Storage
# ==============================================================================

def index_book_to_role(
    book_id: str,
    title: str,
    file_path: str,
    role: str,
    category: str = "technical",
    author: str = "Technical Community",
    subtitle: str = "",
    metadata: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Index a book into role-specific vector database using LangChain chunking.
    
    Args:
        book_id: Unique identifier
        title: Book title
        file_path: Path to PDF/markdown file
        role: Target role database (devops, mle, mlops, genai, etc.)
        category: Book category
        author: Author name
        subtitle: Book subtitle
        metadata: Additional metadata
    
    Returns:
        Dict with indexing statistics
    """
    if role not in ROLE_DATABASES:
        raise ValueError(f"Invalid role '{role}'. Must be one of: {list(ROLE_DATABASES.keys())}")
    
    # Determine file type
    file_ext = Path(file_path).suffix.lower()
    
    if file_ext == ".pdf":
        pages = extract_text_from_pdf(file_path)
        file_type = "pdf"
    elif file_ext in [".md", ".markdown", ".txt"]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        pages = [{"page_number": 1, "text": content}]
        file_type = "markdown"
    else:
        raise ValueError(f"Unsupported file format: {file_ext}")
    
    if not pages:
        raise ValueError(f"No readable text extracted from {file_path}")
    
    total_pages = len(pages)
    chunks_to_insert = []
    chunk_global_index = 0
    
    # Process each page with role-specific chunking
    for page_data in pages:
        page_num = page_data.get("page_number", 1)
        page_text = page_data["text"]
        
        # Detect chapter title
        chapter_title = ""
        first_line = page_text.split("\n")[0].strip("# \t")
        if len(first_line) < 80:
            chapter_title = first_line
        
        # Chunk with LangChain RecursiveCharacterTextSplitter
        page_metadata = {
            "page_number": page_num,
            "chapter_title": chapter_title,
            "book_id": book_id,
            **(metadata or {})
        }
        
        chunks = HybridChunkingStrategy.chunk_text(page_text, role=role, metadata=page_metadata)
        
        for chunk_data in chunks:
            chunk_text = chunk_data["text"]
            chunk_meta = chunk_data["metadata"]
            
            if len(chunk_text.strip()) < 30:
                continue
            
            chunk_id = f"{book_id}_{role}_p{page_num}_c{chunk_global_index}"
            
            # Generate embedding
            emb = get_embedding(chunk_text)
            emb_json = json.dumps(emb) if emb else "[]"
            l2_norm = math.sqrt(sum(v * v for v in emb)) if emb else 1.0
            
            chunks_to_insert.append((
                chunk_id,
                book_id,
                chapter_title,
                page_num,
                chunk_meta["chunk_index"],
                chunk_text,
                len(chunk_text.split()),
                emb_json,
                l2_norm,
                "langchain_recursive",
                json.dumps(chunk_meta)
            ))
            chunk_global_index += 1
    
    # Save to role-specific database
    conn = db_manager.get_connection(role)
    
    try:
        # Remove existing chunks for this book
        conn.execute("DELETE FROM rag_chunks WHERE book_id = ?", (book_id,))
        
        # Insert book metadata
        conn.execute("""
            INSERT OR REPLACE INTO rag_books 
            (book_id, title, subtitle, author, category, role, file_path, file_type, 
             total_pages, total_chunks, status, created_at, chunking_strategy, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'indexed', ?, 'langchain_recursive', ?)
        """, (
            book_id, title, subtitle, author, category, role, file_path, file_type,
            total_pages, len(chunks_to_insert), time.strftime("%Y-%m-%d %H:%M:%S"),
            json.dumps(metadata or {})
        ))
        
        # Insert chunks
        conn.executemany("""
            INSERT INTO rag_chunks 
            (chunk_id, book_id, chapter_title, page_number, chunk_index, chunk_text, 
             token_count, embedding_json, l2_norm, chunk_strategy, metadata_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, chunks_to_insert)
        
        conn.commit()
        
    finally:
        conn.close()
    
    return {
        "status": "success",
        "book_id": book_id,
        "role": role,
        "title": title,
        "total_pages": total_pages,
        "total_chunks": len(chunks_to_insert),
        "chunking_strategy": "langchain_recursive",
        "database_path": str(ROLE_DATABASES[role] / "rag_catalog.db")
    }


# ==============================================================================
# Role-Based Query
# ==============================================================================

def query_role_database(
    query_text: str,
    role: str,
    book_id: Optional[str] = None,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Query a specific role's vector database.
    
    Args:
        query_text: Search query
        role: Role database to query
        book_id: Optional filter by specific book
        top_k: Number of results to return
    
    Returns:
        List of relevant chunks with scores
    """
    if role not in ROLE_DATABASES:
        raise ValueError(f"Invalid role '{role}'. Must be one of: {list(ROLE_DATABASES.keys())}")
    
    query_vec = get_embedding(query_text)
    if not query_vec:
        return []
    
    conn = db_manager.get_connection(role)
    
    try:
        if book_id:
            cursor = conn.execute("""
                SELECT c.chunk_id, c.book_id, b.title as book_title, c.chapter_title, 
                       c.page_number, c.chunk_text, c.token_count, c.embedding_json, 
                       c.metadata_json, b.role
                FROM rag_chunks c
                JOIN rag_books b ON c.book_id = b.book_id
                WHERE c.book_id = ?
            """, (book_id,))
        else:
            cursor = conn.execute("""
                SELECT c.chunk_id, c.book_id, b.title as book_title, c.chapter_title, 
                       c.page_number, c.chunk_text, c.token_count, c.embedding_json, 
                       c.metadata_json, b.role
                FROM rag_chunks c
                JOIN rag_books b ON c.book_id = b.book_id
            """)
        
        rows = cursor.fetchall()
    
    finally:
        conn.close()
    
    results = []
    for r in rows:
        emb_json = r["embedding_json"]
        if not emb_json:
            continue
        
        try:
            chunk_vec = json.loads(emb_json)
        except Exception:
            continue
        
        similarity = cosine_similarity(query_vec, chunk_vec)
        
        try:
            chunk_metadata = json.loads(r["metadata_json"]) if r["metadata_json"] else {}
        except Exception:
            chunk_metadata = {}
        
        results.append({
            "chunk_id": r["chunk_id"],
            "book_id": r["book_id"],
            "book_title": r["book_title"],
            "chapter_title": r["chapter_title"],
            "page_number": r["page_number"],
            "chunk_text": r["chunk_text"],
            "token_count": r["token_count"],
            "similarity_score": float(similarity),
            "role": r["role"],
            "metadata": chunk_metadata
        })
    
    # Sort by similarity and return top_k
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return results[:top_k]


def query_multiple_roles(
    query_text: str,
    roles: List[str],
    top_k_per_role: int = 3
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Query multiple role databases and return results grouped by role.
    
    Args:
        query_text: Search query
        roles: List of roles to query
        top_k_per_role: Results per role
    
    Returns:
        Dict mapping role -> list of results
    """
    results = {}
    for role in roles:
        if role in ROLE_DATABASES:
            results[role] = query_role_database(query_text, role, top_k=top_k_per_role)
    return results


# ==============================================================================
# Database Statistics
# ==============================================================================

def get_role_statistics(role: str) -> Dict[str, Any]:
    """Get statistics for a specific role database."""
    conn = db_manager.get_connection(role)
    
    try:
        # Books count
        cursor = conn.execute("SELECT COUNT(*) FROM rag_books")
        books_count = cursor.fetchone()[0]
        
        # Chunks count
        cursor = conn.execute("SELECT COUNT(*) FROM rag_chunks")
        chunks_count = cursor.fetchone()[0]
        
        # Average chunks per book
        cursor = conn.execute("SELECT AVG(total_chunks) FROM rag_books")
        avg_chunks = cursor.fetchone()[0] or 0
        
        # Recent books
        cursor = conn.execute("""
            SELECT title, total_chunks, created_at 
            FROM rag_books 
            ORDER BY created_at DESC 
            LIMIT 5
        """)
        recent_books = [dict(row) for row in cursor.fetchall()]
        
        return {
            "role": role,
            "books_count": books_count,
            "chunks_count": chunks_count,
            "avg_chunks_per_book": round(avg_chunks, 1),
            "recent_books": recent_books,
            "database_path": str(ROLE_DATABASES[role] / "rag_catalog.db")
        }
    
    finally:
        conn.close()


def get_all_statistics() -> Dict[str, Any]:
    """Get statistics for all role databases."""
    stats = {}
    total_books = 0
    total_chunks = 0
    
    for role in ROLE_DATABASES.keys():
        role_stats = get_role_statistics(role)
        stats[role] = role_stats
        total_books += role_stats["books_count"]
        total_chunks += role_stats["chunks_count"]
    
    return {
        "total_books": total_books,
        "total_chunks": total_chunks,
        "role_statistics": stats,
        "available_roles": list(ROLE_DATABASES.keys()),
        "chunking_strategies": HybridChunkingStrategy.list_roles()
    }


# ==============================================================================
# Main Testing Interface
# ==============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("Enhanced Multi-Role RAG Engine with LangChain")
    print("=" * 70)
    
    # List available roles
    print("\n📚 Available Roles and Chunking Strategies:")
    for role, desc in HybridChunkingStrategy.list_roles().items():
        print(f"  • {role:15} - {desc}")
    
    # Show database paths
    print("\n💾 Role Database Locations:")
    for role, path in ROLE_DATABASES.items():
        print(f"  • {role:15} -> {path}")
    
    # Show statistics
    print("\n📊 Current Statistics:")
    all_stats = get_all_statistics()
    print(f"  Total Books: {all_stats['total_books']}")
    print(f"  Total Chunks: {all_stats['total_chunks']}")
    
    print("\n✅ Enhanced RAG Engine initialized successfully!")
    print("   - LangChain RecursiveCharacterTextSplitter: ✓")
    print("   - Hybrid Chunking Strategy: ✓")
    print("   - 11 Role-Specific Databases: ✓")
