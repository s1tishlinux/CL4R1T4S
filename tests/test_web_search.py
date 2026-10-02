"""
Unit and Integration Tests for Live Web Search Engine
"""

import sys
import unittest
from pathlib import Path

# Add server directory to path
SERVER_DIR = Path(__file__).parent.parent / "agent-studio" / "server"
sys.path.insert(0, str(SERVER_DIR))

from web_search import clean_ddg_url, extract_domain, search_web, search_duckduckgo, search_wikipedia


class TestWebSearchEngine(unittest.TestCase):
    """Test suite for live web search and domain extraction."""

    def test_clean_ddg_url_redirection(self):
        """Verify DuckDuckGo redirect URLs are cleanly extracted."""
        ddg_redirect = "https://duckduckgo.com/l/?uddg=https%3A%2F%2Fkubernetes.io%2Fdocs%2Fconcepts%2Fservices-networking%2Fingress%2F&rut=123"
        cleaned = clean_ddg_url(ddg_redirect)
        self.assertEqual(cleaned, "https://kubernetes.io/docs/concepts/services-networking/ingress/")

    def test_extract_domain(self):
        """Verify clean domain formatting for UI citation chips."""
        urls = {
            "https://www.github.com/torvalds/linux": "github.com",
            "https://docs.aws.amazon.com/vpc/latest/userguide/": "docs.aws.amazon.com",
            "https://subdomain.example.org/page?query=1": "subdomain.example.org"
        }
        for url, expected_domain in urls.items():
            self.assertEqual(extract_domain(url), expected_domain)

    def test_search_web_structure(self):
        """Verify search_web returns proper dictionary schema."""
        query = "Python 3.12 release features"
        try:
            res = search_web(query, max_results=3)
            self.assertIsInstance(res, dict)
            self.assertIn("query", res)
            self.assertIn("results", res)
            self.assertIn("context_text", res)
            self.assertIsInstance(res["results"], list)
        except Exception as e:
            # Network-dependent test; if offline, verify graceful fallback
            self.assertIn("HTTP", str(e))


if __name__ == "__main__":
    unittest.main()
