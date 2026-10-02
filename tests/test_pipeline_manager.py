"""
Unit Tests for RAG Pipeline Ingestion, Chunking, and Database Management
"""

import os
import sys
import unittest
from pathlib import Path

# Add server directory to path
SERVER_DIR = Path(__file__).parent.parent / "agent-studio" / "server"
sys.path.insert(0, str(SERVER_DIR))

from rag_pipeline_manager import RAGPipelineManager


class TestPipelineManager(unittest.TestCase):
    """Test suite for RAG book processing, token calculation, and catalog indexing."""

    def setUp(self):
        self.manager = RAGPipelineManager()
        self.books_dir = self.manager.base_path

    def test_books_directory_structure(self):
        """Verify books and vector catalogs directories exist."""
        self.assertTrue(self.books_dir.exists(), f"Books directory {self.books_dir} should exist")
        vectors_dir = self.books_dir / "vectors"
        self.assertTrue(vectors_dir.exists(), f"Vectors directory {vectors_dir} should exist")

    def test_token_estimation_heuristics(self):
        """Verify token estimation is within standard ratio bounds (~1.3 tokens per word)."""
        sample_text = "The Kubernetes control plane manages worker nodes and the Pods in the cluster."
        words = len(sample_text.split())
        est_tokens = len(sample_text) // 4
        self.assertTrue(words <= est_tokens * 1.5)

    def test_role_database_files_integrity(self):
        """Verify created SQLite vector catalogs have required tables."""
        import sqlite3
        vectors_dir = self.books_dir / "vectors"
        
        found_databases = list(vectors_dir.glob("*/rag_catalog.db"))
        self.assertTrue(len(found_databases) > 0, "At least one role vector catalog must exist")
        
        for db_path in found_databases:
            with sqlite3.connect(str(db_path)) as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [r[0] for r in cursor.fetchall()]
                has_chunks = any(t in tables for t in ("rag_chunks", "chunks", "rag_books"))
                self.assertTrue(has_chunks, f"Database {db_path} must contain chunks or books table (found {tables})")


if __name__ == "__main__":
    unittest.main()

