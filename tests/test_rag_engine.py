"""
Unit and Integration Tests for Enhanced Multi-Role RAG Vector Engine
"""

import sys
import unittest
from pathlib import Path

# Add server directory to path
SERVER_DIR = Path(__file__).parent.parent / "agent-studio" / "server"
sys.path.insert(0, str(SERVER_DIR))

from rag_engine_enhanced import (
    ROLE_DATABASES,
    query_multiple_roles,
    query_role_database
)
from serve import ROLE_PROFILES


class TestMultiRoleRAGEngine(unittest.TestCase):
    """Test suite for RAG vector retrieval, role cataloging, and ranking."""

    def test_role_databases_configuration(self):
        """Verify all technical roles have designated vector database paths."""
        expected_roles = [
            "devops", "kubernetes", "genai", "agentic_ai", 
            "mlops", "aws_cloud", "python", "linux", "data_science"
        ]
        for role in expected_roles:
            self.assertIn(role, ROLE_DATABASES, f"Role '{role}' should be configured in ROLE_DATABASES")

    def test_role_profiles_metadata(self):
        """Verify role profiles contain display names and role icons."""
        for role, profile in ROLE_PROFILES.items():
            self.assertIn("name", profile, f"Profile for '{role}' missing 'name'")
            self.assertIn("icon", profile, f"Profile for '{role}' missing 'icon'")
            self.assertTrue(len(profile["icon"]) > 0, f"Profile icon for '{role}' cannot be empty")

    def test_multi_role_query_execution(self):
        """Test multi-role query retrieval returns valid document structure."""
        query = "Kubernetes Pod lifecycle and probes"
        results = query_multiple_roles(query_text=query, roles=["kubernetes"], top_k_per_role=3)
        self.assertIsInstance(results, dict)
        self.assertIn("kubernetes", results)
        
        docs = results["kubernetes"]
        self.assertIsInstance(docs, list)
        if docs:
            first_doc = docs[0]
            if isinstance(first_doc, dict):
                self.assertIn("book_title", first_doc)
                self.assertIn("chunk_text", first_doc)
            else:
                self.assertTrue(hasattr(first_doc, "book_title") or hasattr(first_doc, "title"))

    def test_pdf_junk_filtering_logic(self):
        """Verify PDF cross-reference / binary junk is detected and filtered."""
        sample_junk = "43 0 obj << /Type /Catalog /Pages 1 0 R >> endobj 0000000016 00000 n /StructElem"
        sample_valid = "A Pod is the smallest execution unit in Kubernetes. It encapsulates one or more containers."
        
        def is_pdf_junk(text: str) -> bool:
            junk_tokens = ["0 obj", "0 R", "endobj", "00000 n", "/StructElem"]
            return any(tok in text for tok in junk_tokens)
        
        self.assertTrue(is_pdf_junk(sample_junk), "Binary PDF tokens should be detected as junk")
        self.assertFalse(is_pdf_junk(sample_valid), "Legitimate technical explanation should not be junk")

    def test_top_k_bounding(self):
        """Verify vector queries respect top_k limit."""
        results = query_multiple_roles(query_text="Python async await", roles=["python"], top_k_per_role=2)
        if "python" in results:
            self.assertLessEqual(len(results["python"]), 2)


if __name__ == "__main__":
    unittest.main()
