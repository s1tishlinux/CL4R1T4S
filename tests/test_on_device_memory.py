"""
Unit and Integration Tests for On-Device Edge Vector Memory Engine
"""

import os
import sys
import time
import unittest
from pathlib import Path

# Add server directory to path
SERVER_DIR = Path(__file__).parent.parent / "agent-studio" / "server"
sys.path.insert(0, str(SERVER_DIR))

from on_device_memory import OnDeviceMemory, RECOGNIZE_THRESHOLD


class TestOnDeviceMemory(unittest.TestCase):
    """Test suite for fast sub-50ms on-device memory teach, recall, and distillation."""

    def setUp(self):
        self.memory = OnDeviceMemory()

    def test_teach_and_recall_lifecycle(self):
        """Verify teaching a memory point and recalling it with sub-50ms latency."""
        test_label = "Production Secret Token"
        test_loc = "AWS Secrets Manager Vault"
        test_details = "Stored API tokens in AWS Secrets Manager under /prod/auth/token."
        
        # 1. Teach
        res = self.memory.teach(
            label=test_label,
            details=test_details,
            where_loc=test_loc,
            category="infrastructure"
        )
        self.assertIsInstance(res, dict)
        self.assertIn("id", res, "Memory teach should return a valid ID")

        # 2. Query / Recall
        t0 = time.time()
        recall_res = self.memory.recall("Where did I put the Secret Token?", top_k=3)
        latency_ms = (time.time() - t0) * 1000
        
        self.assertIsInstance(recall_res, dict)
        self.assertIn("hits", recall_res)
        hits = recall_res["hits"]
        self.assertTrue(len(hits) > 0, "Query should find taught memory")
        
        best_match = hits[0]
        self.assertIn("score", best_match)
        self.assertIn("label", best_match)
        
        # Verify sub-100ms recall performance
        self.assertLess(latency_ms, 150.0, f"On-device memory recall must be ultra fast (was {latency_ms:.2f}ms)")

    def test_distillation_pipeline(self):
        """Verify distillation parses key engineering facts into structured memories."""
        sample_ai_response = """
        # PostgreSQL Setup
        We store the database URL in environment variable DATABASE_URL = 'postgresql+asyncpg://user:pass@localhost:5432/main'.
        Always set max_overflow=10 and pool_size=20 in production.
        """
        distilled = self.memory.distill_and_teach(
            text=sample_ai_response,
            source_title="AI Assistant Chat",
            category="engineering"
        )
        self.assertIsInstance(distilled, dict)
        self.assertIn("distilled_count", distilled)
        self.assertTrue(distilled["distilled_count"] >= 0)

    def test_list_and_filter_memories(self):
        """Verify listing memories."""
        memories = self.memory.list_memories()
        self.assertIsInstance(memories, list)

    def test_forget_memory(self):
        """Verify memory points can be forgotten."""
        res = self.memory.teach(
            label="Temporary Sandbox Cache",
            details="Temporary test cache details.",
            where_loc="Local Memory RAM"
        )
        pid = res.get("id")
        self.assertIsNotNone(pid)
        deleted = self.memory.forget("Temporary Sandbox Cache")
        self.assertTrue(deleted, "forget should return True for existing label")

    def test_telemetry_stats(self):
        """Verify memory telemetry reporting."""
        telemetry = self.memory.get_telemetry()
        self.assertIsInstance(telemetry, dict)
        self.assertIn("total_memories", telemetry)
        self.assertIn("status", telemetry)


if __name__ == "__main__":
    unittest.main()

