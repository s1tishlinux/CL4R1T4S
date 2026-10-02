"""
Integration Tests for Live HTTP Server & REST API Endpoints
"""

import json
import unittest
import urllib.error
import urllib.request


SERVER_BASE = "http://localhost:3300"


class TestAPIEndpoints(unittest.TestCase):
    """Test suite verifying all HTTP API routes on serve.py."""

    def _get(self, path: str):
        req = urllib.request.Request(f"{SERVER_BASE}{path}")
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status, resp.read().decode("utf-8")

    def _post_json(self, path: str, payload: dict):
        req = urllib.request.Request(
            f"{SERVER_BASE}{path}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "OmniTestRunner/1.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))

    def test_01_index_html_served(self):
        """Verify homepage loads successfully."""
        status, html = self._get("/")
        self.assertEqual(status, 200)
        self.assertIn("<!DOCTYPE html>", html)
        self.assertIn("Omni", html)

    def test_02_static_assets(self):
        """Verify JavaScript and CSS assets load with HTTP 200."""
        status_js, js = self._get("/app.js")
        self.assertEqual(status_js, 200)
        self.assertIn("state", js)

        status_css, css = self._get("/style.css")
        self.assertEqual(status_css, 200)
        self.assertIn(":root", css)

    def test_03_multi_role_rag_api(self):
        """Verify POST /api/multi_role_query returns matched passages."""
        payload = {"query": "Kubernetes Pod architecture", "roles": ["kubernetes"], "top_k_per_role": 2}
        status, data = self._post_json("/api/multi_role_query", payload)
        self.assertEqual(status, 200)
        self.assertIn("results", data)
        self.assertIn("roles_consulted", data)
        self.assertIsInstance(data["results"], list)

    def test_04_rag_pipeline_stats(self):
        """Verify GET /api/rag/pipeline/stats returns analytics."""
        status, raw = self._get("/api/rag/pipeline/stats")
        self.assertEqual(status, 200)
        data = json.loads(raw)
        self.assertIn("total_chunks", data)
        self.assertIn("available_roles", data)

    def test_05_rag_books_catalog(self):
        """Verify GET /api/rag/books returns books list."""
        status, raw = self._get("/api/rag/books")
        self.assertEqual(status, 200)
        data = json.loads(raw)
        self.assertIsInstance(data, list)

    def test_06_memory_api_lifecycle(self):
        """Verify POST /api/memory/teach, GET /api/memory/list, and POST /api/memory/recall."""
        # 1. Teach
        teach_payload = {
            "label": "CI/CD Test Token",
            "where": "GitHub Secrets",
            "details": "Stored in GH_TOKEN repository secrets.",
            "category": "devops"
        }
        status_add, add_res = self._post_json("/api/memory/teach", teach_payload)
        self.assertEqual(status_add, 200)
        self.assertIn("id", add_res)
        self.assertEqual(add_res.get("status"), "memorized")

        # 2. List
        status_list, raw_list = self._get("/api/memory/list")
        self.assertEqual(status_list, 200)
        list_data = json.loads(raw_list)
        self.assertTrue(isinstance(list_data, list) or (isinstance(list_data, dict) and "memories" in list_data))

        # 3. Recall
        query_payload = {"query": "Where is the CI/CD Token?", "top_k": 2}
        status_q, q_res = self._post_json("/api/memory/recall", query_payload)
        self.assertEqual(status_q, 200)
        self.assertIn("hits", q_res)
        self.assertIn("spoken_response", q_res)

    def test_07_web_search_tool_api(self):
        """Verify POST /api/tools/web_search returns structured search results."""
        payload = {"query": "Python asyncio tutorial", "max_results": 2}
        status, data = self._post_json("/api/tools/web_search", payload)
        self.assertEqual(status, 200)
        self.assertIn("results", data)
        self.assertIn("context_text", data)


if __name__ == "__main__":
    unittest.main()

