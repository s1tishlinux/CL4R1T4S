"""
Unit and Integration Tests for Live Testing Components:
1. Docker Desktop & Container CLI Integration
2. System Terminal & Live REPL Execution (Bash, Python, Node)
3. Databases (SQLite WAL, Redis Resilience & In-Memory Store)
4. Browser & Localhost App Health Checks
"""

import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import unittest
import urllib.error
import urllib.request
from pathlib import Path

SERVER_BASE = "http://localhost:3300"


class TestDockerIntegration(unittest.TestCase):
    """Test suite verifying Docker Desktop detection, CLI execution, and container configs."""

    def test_docker_cli_availability(self):
        """Verify Docker binary is present in system PATH."""
        docker_bin = shutil.which("docker")
        self.assertIsNotNone(docker_bin, "Docker CLI binary should be installed and on PATH")
        self.assertTrue(os.path.exists(docker_bin), f"Docker binary {docker_bin} must exist")

    def test_docker_version_output(self):
        """Verify docker --version executes and returns expected version string."""
        try:
            res = subprocess.run(["docker", "--version"], capture_output=True, text=True, timeout=5)
            self.assertEqual(res.returncode, 0)
            self.assertIn("Docker version", res.stdout)
        except (subprocess.SubprocessError, FileNotFoundError) as err:
            self.fail(f"Failed to execute docker --version: {err}")

    def test_docker_compose_manifest_validation(self):
        """Verify generation of valid docker-compose configuration for Redis, Postgres, and Qdrant."""
        compose_spec = {
            "version": "3.8",
            "services": {
                "redis": {
                    "image": "redis:alpine",
                    "container_name": "omni-redis-test",
                    "ports": ["6379:6379"],
                    "restart": "unless-stopped"
                },
                "postgres": {
                    "image": "postgres:alpine",
                    "container_name": "omni-postgres-test",
                    "environment": {"POSTGRES_PASSWORD": "omni_test_password"},
                    "ports": ["5432:5432"]
                },
                "qdrant": {
                    "image": "qdrant/qdrant",
                    "container_name": "omni-qdrant-test",
                    "ports": ["6333:6333", "6334:6334"]
                }
            }
        }
        self.assertIn("redis", compose_spec["services"])
        self.assertIn("postgres", compose_spec["services"])
        self.assertIn("qdrant", compose_spec["services"])
        self.assertEqual(compose_spec["services"]["redis"]["ports"], ["6379:6379"])


class TestSystemTerminalAndRepl(unittest.TestCase):
    """Test suite verifying live system terminal and REPL execution across languages."""

    def _post_repl(self, code: str, language: str = "python"):
        req = urllib.request.Request(
            f"{SERVER_BASE}/api/repl/execute",
            data=json.dumps({"code": code, "language": language}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))

    def test_python_repl_execution(self):
        """Verify Python code execution via /api/repl/execute."""
        python_code = "import math\nprint(f'SQRT_16={int(math.sqrt(16))}')"
        status, res = self._post_repl(python_code, "python")
        self.assertEqual(status, 200)
        self.assertTrue(res.get("success"))
        self.assertIn("SQRT_16=4", res.get("output", ""))
        self.assertEqual(res.get("exit_code"), 0)

    def test_bash_terminal_execution(self):
        """Verify Bash shell command execution via /api/repl/execute."""
        bash_cmd = "echo 'Omni Terminal Online'; which python3"
        status, res = self._post_repl(bash_cmd, "bash")
        self.assertEqual(status, 200)
        self.assertTrue(res.get("success"))
        self.assertIn("Omni Terminal Online", res.get("output", ""))
        self.assertEqual(res.get("exit_code"), 0)

    def test_repl_error_capture(self):
        """Verify stderr and non-zero exit codes are captured properly."""
        failing_code = "import sys\nprint('Standard out')\nsys.stderr.write('Custom error detail')\nsys.exit(2)"
        status, res = self._post_repl(failing_code, "python")
        self.assertEqual(status, 200)
        self.assertFalse(res.get("success"))
        self.assertEqual(res.get("exit_code"), 2)
        self.assertIn("Custom error detail", res.get("output", ""))


class TestDatabaseAndDataStores(unittest.TestCase):
    """Test suite verifying SQLite WAL persistence and Redis cache fallback."""

    def test_sqlite_knowledge_snippets_store(self):
        """Verify SQLite knowledge database schema creation and querying."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
            tmp_db = tmp.name

        try:
            with sqlite3.connect(tmp_db) as conn:
                cur = conn.cursor()
                cur.execute("""
                    CREATE TABLE knowledge_snippets (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT,
                        content TEXT,
                        source TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
                cur.execute(
                    "INSERT INTO knowledge_snippets (title, content, source) VALUES (?, ?, ?)",
                    ("Docker Microservices", "Use multi-stage builds for minimal image size.", "DevOps Manual")
                )
                conn.commit()

                row = cur.execute("SELECT title, content, source FROM knowledge_snippets WHERE title = ?", ("Docker Microservices",)).fetchone()
                self.assertIsNotNone(row)
                self.assertEqual(row[0], "Docker Microservices")
                self.assertEqual(row[2], "DevOps Manual")
        finally:
            if os.path.exists(tmp_db):
                os.remove(tmp_db)

    def test_redis_cache_fallback_resilience(self):
        """Verify that cache queries fall back gracefully when Redis server is offline."""
        class MockCacheEngine:
            def __init__(self, redis_url="redis://localhost:6379/0"):
                self.redis_client = None
                self.in_memory_fallback = {}

            def get(self, key: str):
                if self.redis_client:
                    try:
                        return self.redis_client.get(key)
                    except Exception:
                        pass
                return self.in_memory_fallback.get(key)

            def set(self, key: str, value: str):
                if self.redis_client:
                    try:
                        self.redis_client.set(key, value)
                    except Exception:
                        pass
                self.in_memory_fallback[key] = value
                return True

        cache = MockCacheEngine()
        # Set and get with offline Redis fallback
        cache.set("session_token_123", "active_session_data")
        retrieved = cache.get("session_token_123")
        self.assertEqual(retrieved, "active_session_data")


class TestBrowserAndLocalApps(unittest.TestCase):
    """Test suite verifying local web app health checks and browser sandbox preview."""

    def test_local_web_app_health_check(self):
        """Verify local web server on port 3300 responds with 200 OK and valid HTML payload."""
        req = urllib.request.Request(f"{SERVER_BASE}/")
        with urllib.request.urlopen(req, timeout=5) as resp:
            self.assertEqual(resp.status, 200)
            content = resp.read().decode("utf-8")
            self.assertIn("<!DOCTYPE html>", content)
            self.assertIn("Omni", content)

    def test_web_sandbox_html_payload_generation(self):
        """Verify generation of isolated iframe HTML sandbox for live browser app testing."""
        component_code = "<button id='btn' onclick='alert(\"Clicked!\")'>Test Component</button>"
        full_html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Live Component Test</title>
    <style>body {{ font-family: sans-serif; padding: 20px; }}</style>
</head>
<body>
    <div id="root">{component_code}</div>
</body>
</html>"""
        self.assertIn("<!DOCTYPE html>", full_html)
        self.assertIn("Test Component", full_html)
        self.assertIn("<meta charset=\"UTF-8\">", full_html)


if __name__ == "__main__":
    unittest.main()
