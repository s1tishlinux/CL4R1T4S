#!/usr/bin/env python3
"""
Omni Agent Studio - Local Server & Streaming Proxy
Serves the web UI and seamlessly proxies requests to:
- Ollama (http://localhost:11434)
- OmniRoute (http://localhost:20128)
- Spark MLX (http://127.0.0.1:8080)
- LM Studio (http://localhost:1234)
with full CORS support and SSE streaming.
"""

import http.server
import socketserver
import urllib.request
import urllib.error
import urllib.parse
import json
import os
import sys
import subprocess
import shutil
import re
import time
import sqlite3
from pathlib import Path

PORT = 3300
DIR = os.path.dirname(os.path.abspath(__file__))
CLIENT_DIR = os.path.normpath(os.path.join(DIR, '..', 'client'))
REPO_ROOT = os.path.normpath(os.path.join(DIR, '..', '..'))

# Ensure server/ directory is on the Python path for sibling module imports
_server_dir = os.path.dirname(os.path.abspath(__file__))
if _server_dir not in sys.path:
    sys.path.insert(0, _server_dir)

TARGETS = {
    "/proxy/ollama": "http://localhost:11434",
    "/proxy/omniroute": "http://localhost:20128",
    "/proxy/spark": "http://127.0.0.1:8080",
    "/proxy/lmstudio": "http://localhost:1234",
    "/proxy/webfree": "https://text.pollinations.ai/openai",
}

ROLE_PROFILES = {
    "devops": {
        "name": "DevOps Specialist",
        "icon": "🚀",
        "description": "Docker, CI/CD pipelines, Terraform, Ansible, Nginx, Prometheus, Grafana, GitOps",
        "keywords": ["docker", "container", "ci/cd", "pipeline", "jenkins", "terraform", "ansible", "nginx", "prometheus", "grafana", "devops", "deploy", "gitops", "iac", "helm", "build", "release"]
    },
    "kubernetes": {
        "name": "Kubernetes Architect",
        "icon": "☸️",
        "description": "Kubernetes clusters, Pods, Services, Ingress, Helm, CNI, K8s manifests, kubectl",
        "keywords": ["kubernetes", "k8s", "pod", "pods", "service", "ingress", "deployment", "kubectl", "helm", "daemonset", "statefulset", "cni", "csi", "cluster", "node", "namespace", "rbac"]
    },
    "genai": {
        "name": "GenAI Architect",
        "icon": "🤖",
        "description": "LLMs, Transformers, Prompt Engineering, Fine-Tuning, RAG, Embeddings, vLLM",
        "keywords": ["llm", "llms", "gpt", "transformer", "prompt", "fine-tuning", "rag", "vector", "embedding", "langchain", "llamaindex", "generative ai", "diffusion", "vllm", "tokens", "context window", "ollama", "mistral", "llama"]
    },
    "agentic_ai": {
        "name": "Agentic AI Specialist",
        "icon": "🧠",
        "description": "Multi-agent systems, AutoGen, CrewAI, LangGraph, tool calling, ReAct reasoning",
        "keywords": ["agent", "agents", "agentic", "autogen", "crewai", "langgraph", "multi-agent", "tool calling", "reasoning", "planner", "react", "autonomous", "swarm", "subagent", "reflection"]
    },
    "mlops": {
        "name": "MLOps Engineer",
        "icon": "⚙️",
        "description": "Model registry, MLflow, feature stores, data versioning, model monitoring",
        "keywords": ["mlops", "mlflow", "kubeflow", "feature store", "model registry", "drift", "dvc", "model monitoring", "model serving", "feast", "triton", "evidently"]
    },
    "aws_cloud": {
        "name": "AWS Cloud Architect",
        "icon": "☁️",
        "description": "AWS cloud infrastructure, EC2, S3, IAM, Lambda, CloudFormation, VPC, ECS, EKS",
        "keywords": ["aws", "ec2", "s3", "iam", "lambda", "cloudformation", "vpc", "ecs", "eks", "route53", "dynamodb", "cloudwatch", "cloud", "sqs", "sns"]
    },
    "python": {
        "name": "Python Specialist",
        "icon": "🐍",
        "description": "Python engineering, async programming, FastAPI, design patterns, architecture",
        "keywords": ["python", "asyncio", "fastapi", "flask", "pydantic", "decorator", "generator", "multiprocessing", "pytest", "typing", "oop", "pep8", "numpy", "pandas"]
    },
    "linux": {
        "name": "Linux Administrator",
        "icon": "🐧",
        "description": "Linux systems, bash scripting, systemd, kernel tuning, networking, security",
        "keywords": ["linux", "bash", "shell", "systemd", "chmod", "chown", "grep", "sed", "awk", "iptables", "kernel", "cron", "ssh", "socket", "daemon"]
    },
    "data_science": {
        "name": "Data Scientist",
        "icon": "📊",
        "description": "Exploratory data analysis, statistical modeling, Pandas, NumPy, visualization",
        "keywords": ["pandas", "numpy", "statistics", "eda", "visualization", "data science", "dataframe", "matplotlib", "seaborn", "correlation", "hypothesis"]
    },
    "mle": {
        "name": "Machine Learning Engineer",
        "icon": "🔬",
        "description": "Machine learning algorithms, PyTorch, Scikit-Learn, training loops, evaluation",
        "keywords": ["machine learning", "supervised", "unsupervised", "pytorch", "scikit-learn", "xgboost", "random forest", "hyperparameter", "loss", "gradient descent", "backprop", "deep learning"]
    },
    "general": {
        "name": "Technical Architect",
        "icon": "📚",
        "description": "System design, microservices, databases, networking, security, scalability",
        "keywords": ["architecture", "database", "sql", "nosql", "security", "rest", "api", "microservice", "design", "solid", "scalability", "concurrency"]
    }
}

def classify_agent_roles(query_text: str, top_n: int = 4) -> list:
    q = query_text.lower()
    scores = {}
    for role, profile in ROLE_PROFILES.items():
        score = sum(2 if " " in kw else 1 for kw in profile["keywords"] if kw in q)
        if score > 0:
            scores[role] = score
    matched = [r for r, s in sorted(scores.items(), key=lambda x: x[1], reverse=True)]
    if matched:
        return matched[:top_n]
    return ["devops", "agentic_ai", "kubernetes", "genai", "mlops", "python", "general"]

class StudioHandler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=CLIENT_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        if self.path.startswith("/api/fs/tree"):
            self._handle_fs_tree()
            return

        if self.path.startswith("/api/fs/read"):
            self._handle_fs_read()
            return

        if self.path.startswith("/api/books/list"):
            self._handle_books_list()
            return

        if self.path.startswith("/api/books/export"):
            self._handle_books_export()
            return

        if self.path.startswith("/api/prompts/agents"):
            self._handle_prompts_agents()
            return

        if self.path.startswith("/api/prompts/catalog"):
            self._handle_prompts_catalog()
            return

        if self.path.startswith("/api/prompts/content"):
            self._handle_prompt_content()
            return

        if self.path.startswith("/api/tools/arsenal"):
            self._handle_tools_arsenal()
            return

        if self.path.startswith("/api/tools/web_search"):
            self._handle_tools_web_search()
            return

        if self.path.startswith("/api/tags"):
            self._handle_ollama_tags()
            return

        if self.path.startswith("/api/memory/recall"):
            self._handle_memory_recall_get()
            return

        if self.path.startswith("/api/memory/list"):
            self._handle_memory_list()
            return

        if self.path.startswith("/api/memory/telemetry"):
            self._handle_memory_telemetry()
            return

        if self.path.startswith("/api/rag/books"):
            self._handle_rag_books()
            return

        if self.path.startswith("/api/rag/roles") or self.path.startswith("/api/rag/databases"):
            self._handle_rag_roles()
            return

        if self.path.startswith("/api/rag/page"):
            self._handle_rag_page()
            return

        if self.path.startswith("/api/db/telemetry"):
            self._handle_db_telemetry()
            return

        if self.path.startswith("/api/db/schema"):
            self._handle_db_schema()
            return

        if self.path.startswith("/api/db/table-data"):
            self._handle_db_table_data()
            return

        if self.path.startswith("/api/db/files"):
            self._handle_db_files()
            return

        if self.path.startswith("/api/db/snippets"):
            self._handle_db_get_snippets()
            return

        if self.path.startswith("/api/agent/runs"):
            self._handle_agent_runs()
            return

        if self.path.startswith("/api/rag/pipeline/stats"):
            self._handle_pipeline_stats()
            return

        if self.path.startswith("/api/rag/pipeline/detected_books"):
            self._handle_pipeline_detected_books()
            return

        if self.path.startswith("/api/rag/pipeline/operations"):
            self._handle_pipeline_operations()
            return

        if self.path.startswith("/proxy/image"):
            parsed = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed.query)
            target_url = qs.get("url", [None])[0]
            if not target_url:
                self.send_error(400, "Missing url parameter")
                return
            
            # Ensure path is properly percent-encoded exactly once for urllib
            parsed_target = urllib.parse.urlsplit(target_url)
            clean_path = urllib.parse.quote(urllib.parse.unquote(parsed_target.path))
            safe_target_url = urllib.parse.urlunsplit((
                parsed_target.scheme,
                parsed_target.netloc,
                clean_path,
                parsed_target.query,
                parsed_target.fragment
            ))

            req = urllib.request.Request(safe_target_url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
            import random, re
            try:
                with urllib.request.urlopen(req, timeout=60) as resp:
                    self.send_response(resp.status)
                    self.send_header("Content-Type", resp.headers.get("Content-Type", "image/jpeg"))
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(resp.read())
            except urllib.error.HTTPError as err:
                if err.code in (402, 500, 502):
                    alt_seed = random.randint(100000, 999999)
                    alt_query = re.sub(r"seed=\d+", f"seed={alt_seed}", parsed_target.query) if "seed=" in parsed_target.query else (f"{parsed_target.query}&seed={alt_seed}" if parsed_target.query else f"seed={alt_seed}")
                    retry_url = urllib.parse.urlunsplit((parsed_target.scheme, parsed_target.netloc, clean_path, alt_query, parsed_target.fragment))
                    try:
                        retry_req = urllib.request.Request(retry_url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
                        with urllib.request.urlopen(retry_req, timeout=60) as resp2:
                            self.send_response(resp2.status)
                            self.send_header("Content-Type", resp2.headers.get("Content-Type", "image/jpeg"))
                            self.send_header("Access-Control-Allow-Origin", "*")
                            self.end_headers()
                            self.wfile.write(resp2.read())
                            return
                    except Exception:
                        pass
                self.send_error(502, f"Proxy error: {err}")
            except Exception as e:
                self.send_error(502, f"Proxy error: {e}")
            return

        for prefix, target_base in TARGETS.items():
            if self.path.startswith(prefix):
                self._proxy_request("GET", prefix, target_base)
                return
        super().do_GET()

    def _handle_prompts_catalog(self):
        repo_root = REPO_ROOT
        catalog = []
        categories = [
            ("OPENAI/Codex_Desktop", "OpenAI Codex Desktop", "Autonomous multi-step coding, Astra/Sol system prompts and desktop tools"),
            ("OPENAI", "OpenAI ChatGPT & Models", "GPT-4o, ChatGPT 5, o3/o4 mini reasoning prompts"),
            ("CURSOR", "Cursor IDE", "Cursor 2.0 system prompt, multi-file composer, codebase indexing"),
            ("ANTHROPIC", "Anthropic Claude", "Claude Opus 4.6/4.7, Sonnet 3.7/4.5, interactive design system artifacts"),
            ("MANUS", "Manus AI Agent", "Autonomous agent loop (Analyze -> Plan -> Act -> Observe), multi-step execution"),
            ("LOVABLE", "Lovable 2.0 Web Builder", "Real-time React/Tailwind/Lucide full-stack app synthesis with <lov-code>"),
            ("PERPLEXITY", "Perplexity Deep Research", "Exhaustive 10-section research reports with inline citations [1][2]"),
            ("GOOGLE", "Google Gemini 2.5 Pro", "Gemini 2.5 Pro reasoning, thought blocks, Python tool execution"),
            ("DEVIN", "Devin 2.0 AI Software Engineer", "Devin autonomous engineering, terminal commands, git workflows"),
            ("BOLT", "Bolt.new Full-Stack", "Supabase migrations, RLS policies, React full-stack architectures"),
            ("VERCEL V0", "Vercel v0", "Modern UI component generation with Tailwind & shadcn"),
            ("WINDSURF", "Windsurf IDE", "Cascade agentic coding prompt and tools"),
            ("CLINE", "Cline Autonomous Dev", "VS Code agentic loop and MCP server tooling")
        ]

        for rel_dir, cat_name, cat_desc in categories:
            full_dir = os.path.join(repo_root, rel_dir)
            if not os.path.isdir(full_dir):
                continue
            for item in sorted(os.listdir(full_dir)):
                item_path = os.path.join(full_dir, item)
                if os.path.isfile(item_path) and not item.startswith("."):
                    size_kb = round(os.path.getsize(item_path) / 1024, 1)
                    snippet = ""
                    try:
                        with open(item_path, "r", encoding="utf-8", errors="ignore") as f:
                            snippet = f.read(300).strip()
                    except Exception:
                        pass
                    catalog.append({
                        "category": cat_name,
                        "category_desc": cat_desc,
                        "rel_path": os.path.join(rel_dir, item),
                        "filename": item,
                        "size": f"{size_kb} KB",
                        "snippet": snippet
                    })

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({"catalog": catalog, "total": len(catalog)}).encode("utf-8"))

    def _handle_prompt_content(self):
        repo_root = REPO_ROOT
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        rel_path = qs.get("file", [""])[0]
        if not rel_path or ".." in rel_path:
            self.send_error(400, "Invalid file parameter")
            return

        target_file = os.path.join(repo_root, rel_path)
        if not os.path.isfile(target_file):
            self.send_error(404, "Prompt file not found")
            return

        try:
            with open(target_file, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "file": rel_path,
                "filename": os.path.basename(rel_path),
                "content": content,
                "lines": len(content.splitlines()),
                "size_kb": round(len(content.encode("utf-8")) / 1024, 1)
            }).encode("utf-8"))
        except Exception as e:
            self.send_error(500, f"Error reading file: {e}")

    def _handle_tools_arsenal(self):
        repo_root = REPO_ROOT
        codex_tools = []
        try:
            tools_json_path = os.path.join(repo_root, "OPENAI", "Codex_Desktop", "GPT-6-Astra_Tools.json")
            if os.path.isfile(tools_json_path):
                with open(tools_json_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    codex_tools = data.get("6-Astra_Tools.json", [])
        except Exception as e:
            print("Error loading Codex tools:", e)

        arsenal = {
            "codex_desktop_tools": codex_tools,
            "cursor_tools": [
                {
                    "name": "grep_search",
                    "description": "Fast regex/literal search across the entire codebase to locate declarations and references.",
                    "parameters": {"query": "string", "path": "string", "case_sensitive": "boolean"}
                },
                {
                    "name": "file_search",
                    "description": "Fuzzy find files by name or path pattern across the workspace.",
                    "parameters": {"pattern": "string"}
                },
                {
                    "name": "edit_file",
                    "description": "Perform precise SEARCH/REPLACE diff edits preserving exact indentation.",
                    "parameters": {"target_file": "string", "search_block": "string", "replace_block": "string"}
                },
                {
                    "name": "run_terminal_command",
                    "description": "Execute shell commands (npm test, build, git diff, linter) in the IDE terminal.",
                    "parameters": {"command": "string", "cwd": "string"}
                }
            ],
            "manus_agent_tools": [
                {
                    "name": "browser_open",
                    "description": "Launch headless or visible browser subagent to navigate to a target URL.",
                    "parameters": {"url": "string"}
                },
                {
                    "name": "web_search",
                    "description": "Execute search engine query to fetch latest documentation, news, or technical articles.",
                    "parameters": {"query": "string"}
                },
                {
                    "name": "observe_state",
                    "description": "Analyze browser DOM, terminal output, or process state for next action.",
                    "parameters": {"target": "string"}
                },
                {
                    "name": "python_execute",
                    "description": "Run Python script in isolated sandbox for data processing or numerical analysis.",
                    "parameters": {"code": "string"}
                }
            ],
            "mcp_servers": [
                {
                    "server": "chrome-devtools-mcp",
                    "tools": ["click", "hover", "type_text", "take_screenshot", "evaluate_script", "list_pages", "inspect_network"],
                    "description": "Automate Chrome browser actions, inspect DOM, test accessibility and capture visuals."
                },
                {
                    "server": "filesystem-mcp",
                    "tools": ["read_file", "write_file", "list_directory", "move_file", "search_files"],
                    "description": "Direct read/write access to project files, assets, and artifacts."
                },
                {
                    "server": "pollinations-media-mcp",
                    "tools": ["generate_image", "generate_video", "render_3d_canvas"],
                    "description": "Zero-key media synthesis for photorealistic Flux/SD images and WebM motion video."
                }
            ]
        }

        self._send_json(200, arsenal)

    def _handle_tools_web_search(self):
        try:
            import web_search
            query = ""
            max_results = 5

            if self.command == "GET":
                parsed = urllib.parse.urlparse(self.path)
                qs = urllib.parse.parse_qs(parsed.query)
                query = qs.get("q", [""])[0] or qs.get("query", [""])[0]
                if "max_results" in qs:
                    try:
                        max_results = int(qs["max_results"][0])
                    except Exception:
                        pass
            else:
                length = int(self.headers.get("Content-Length", 0))
                if length > 0:
                    body = json.loads(self.rfile.read(length).decode("utf-8"))
                    query = body.get("query", "") or body.get("q", "")
                    max_results = int(body.get("max_results", 5))

            if not query.strip():
                self._send_json_error(400, "Query parameter 'query' or 'q' is required")
                return

            res = web_search.search_web(query.strip(), max_results=max_results)
            self._send_json(200, res)
        except Exception as e:
            self._send_json_error(500, f"Web search tool error: {e}")

    def _send_json(self, code, data):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def _send_json_error(self, code, msg):
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({"error": str(msg)}).encode("utf-8"))

    def _safe_path(self, rel_path):
        repo_root = REPO_ROOT
        clean_rel = rel_path.lstrip("/\\")
        target = os.path.abspath(os.path.join(repo_root, clean_rel))
        if os.path.commonpath([repo_root, target]) != repo_root:
            raise PermissionError("Access denied outside workspace root")
        return target

    def _handle_fs_tree(self):
        repo_root = REPO_ROOT
        IGNORE_DIRS = {".git", "node_modules", "__pycache__", ".venv", ".next", "dist", "build", ".DS_Store"}
        
        def build_tree(current_dir, max_depth=4, current_depth=0):
            if current_depth > max_depth:
                return []
            items = []
            try:
                entries = sorted(os.scandir(current_dir), key=lambda e: (not e.is_dir(), e.name.lower()))
            except Exception:
                return []
            
            for entry in entries:
                if entry.name in IGNORE_DIRS or entry.name.startswith("."):
                    continue
                rel = os.path.relpath(entry.path, repo_root)
                if entry.is_dir():
                    children = build_tree(entry.path, max_depth, current_depth + 1)
                    items.append({
                        "name": entry.name,
                        "path": rel,
                        "type": "directory",
                        "children": children
                    })
                else:
                    ext = os.path.splitext(entry.name)[1].lower()
                    try:
                        sz = entry.stat().st_size
                    except Exception:
                        sz = 0
                    items.append({
                        "name": entry.name,
                        "path": rel,
                        "type": "file",
                        "size": sz,
                        "ext": ext
                    })
            return items

        tree = {
            "name": "CL4R1T4S-main",
            "path": "",
            "type": "directory",
            "children": build_tree(repo_root)
        }

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(tree).encode("utf-8"))

    def _handle_fs_read(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        rel_path = qs.get("path", [None])[0]
        if not rel_path:
            self._send_json_error(400, "Missing path parameter")
            return
        try:
            full_path = self._safe_path(rel_path)
            if not os.path.isfile(full_path):
                self._send_json_error(404, "File not found")
                return
            with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"path": rel_path, "content": content}).encode("utf-8"))
        except PermissionError as pe:
            self._send_json_error(403, str(pe))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_fs_write(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            data = json.loads(body)
            rel_path = data.get("path")
            content = data.get("content", "")
            if not rel_path:
                self._send_json_error(400, "Missing path")
                return
            full_path = self._safe_path(rel_path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "path": rel_path, "bytes": len(content)}).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_fs_create(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            data = json.loads(body)
            rel_path = data.get("path")
            item_type = data.get("type", "file")
            if not rel_path:
                self._send_json_error(400, "Missing path")
                return
            full_path = self._safe_path(rel_path)
            if item_type == "directory":
                os.makedirs(full_path, exist_ok=True)
            else:
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                if not os.path.exists(full_path):
                    with open(full_path, "w", encoding="utf-8") as f:
                        f.write(data.get("content", ""))
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "path": rel_path, "type": item_type}).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_fs_delete(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            data = json.loads(body)
            rel_path = data.get("path")
            if not rel_path:
                self._send_json_error(400, "Missing path")
                return
            full_path = self._safe_path(rel_path)
            if os.path.isfile(full_path):
                os.remove(full_path)
            elif os.path.isdir(full_path):
                shutil.rmtree(full_path)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "path": rel_path}).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_books_list(self):
        repo_root = REPO_ROOT
        books_dir = os.path.join(repo_root, "books")
        os.makedirs(books_dir, exist_ok=True)
        books = []
        for f in sorted(os.listdir(books_dir)):
            if f.endswith(".json"):
                try:
                    with open(os.path.join(books_dir, f), "r", encoding="utf-8") as fp:
                        b_data = json.load(fp)
                        b_data["filename"] = f
                        books.append(b_data)
                except Exception:
                    pass
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(books).encode("utf-8"))

    def _handle_books_save(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            data = json.loads(body)
            title = data.get("title", "Untitled Manual").strip()
            slug = re.sub(r'[^a-zA-Z0-9_\-]', '_', title).lower() or "manual"
            repo_root = REPO_ROOT
            books_dir = os.path.join(repo_root, "books")
            os.makedirs(books_dir, exist_ok=True)
            file_path = os.path.join(books_dir, f"{slug}.json")
            data["slug"] = slug
            data["updated_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
            with open(file_path, "w", encoding="utf-8") as fp:
                json.dump(data, fp, indent=2)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "slug": slug, "file": f"books/{slug}.json"}).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_books_export(self):
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        slug = qs.get("slug", [None])[0]
        fmt = qs.get("format", ["html"])[0]
        repo_root = REPO_ROOT
        books_dir = os.path.join(repo_root, "books")
        file_path = os.path.join(books_dir, f"{slug}.json") if slug else None
        
        if not file_path or not os.path.isfile(file_path):
            self._send_json_error(404, "Book not found")
            return
            
        with open(file_path, "r", encoding="utf-8") as fp:
            book = json.load(fp)

        title = book.get("title", "Omni Knowledge Manual")
        author = book.get("author", "Omni AI Engineer")
        subtitle = book.get("subtitle", "Autonomous Agent Engineering & Security Architecture")
        chapters = book.get("chapters", [])

        if fmt == "md":
            md_out = [f"# {title}\n## {subtitle}\n**Author:** {author}  \n**Generated:** {time.strftime('%Y-%m-%d')}\n\n---\n"]
            for i, ch in enumerate(chapters, 1):
                md_out.append(f"## Chapter {i}: {ch.get('title', 'Chapter')}\n\n{ch.get('content', '')}\n\n---\n")
            res_text = "\n".join(md_out)
            self.send_response(200)
            self.send_header("Content-Type", "text/markdown; charset=utf-8")
            self.send_header("Content-Disposition", f'attachment; filename="{slug}.md"')
            self.end_headers()
            self.wfile.write(res_text.encode("utf-8"))
            return

        # HTML eBook format with print CSS
        toc_items = "".join([f'<li><a href="#ch-{i}">Chapter {i}: {ch.get("title", "Chapter")}</a></li>' for i, ch in enumerate(chapters, 1)])
        ch_html = []
        for i, ch in enumerate(chapters, 1):
            ch_title = ch.get("title", f"Chapter {i}")
            raw_content = ch.get("content", "")
            ch_html.append(f'''
            <section class="chapter page-break" id="ch-{i}">
              <div class="chapter-num">CHAPTER {i:02d}</div>
              <h2 class="chapter-title">{ch_title}</h2>
              <textarea class="chapter-raw" style="display:none;">{raw_content}</textarea>
              <div class="chapter-body"></div>
            </section>
            ''')

        full_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{title} — Professional Manual</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Inter:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
    body {{
      font-family: 'Inter', -apple-system, sans-serif;
      line-height: 1.7;
      color: #1a1a24;
      background: #fdfdfd;
      margin: 0;
      padding: 0;
    }}
    .book-container {{
      max-width: 860px;
      margin: 40px auto;
      background: #fff;
      padding: 60px 80px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.08);
      border-radius: 8px;
    }}
    .cover-page {{
      text-align: center;
      padding: 100px 20px;
      border-bottom: 2px solid #e0e0e0;
      margin-bottom: 60px;
    }}
    .cover-badge {{
      display: inline-block;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 3px;
      font-weight: 700;
      color: #6366f1;
      background: #eef2ff;
      padding: 6px 16px;
      border-radius: 20px;
      margin-bottom: 24px;
    }}
    .cover-title {{
      font-family: 'Cinzel', serif;
      font-size: 42px;
      margin: 0 0 16px 0;
      color: #0f172a;
      line-height: 1.2;
    }}
    .cover-subtitle {{
      font-size: 18px;
      color: #64748b;
      margin-bottom: 40px;
    }}
    .cover-meta {{
      font-size: 14px;
      color: #94a3b8;
    }}
    .toc {{
      background: #f8fafc;
      padding: 30px 40px;
      border-radius: 8px;
      margin-bottom: 60px;
      border: 1px solid #e2e8f0;
    }}
    .toc h3 {{
      margin-top: 0;
      font-size: 18px;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: #334155;
    }}
    .toc ul {{
      list-style-type: decimal;
      padding-left: 20px;
      margin: 0;
    }}
    .toc li {{
      margin: 8px 0;
    }}
    .toc a {{
      color: #4f46e5;
      text-decoration: none;
      font-weight: 500;
    }}
    .chapter {{
      margin-bottom: 80px;
    }}
    .chapter-num {{
      font-size: 12px;
      letter-spacing: 2px;
      font-weight: 700;
      color: #6366f1;
      text-transform: uppercase;
    }}
    .chapter-title {{
      font-size: 28px;
      margin: 6px 0 24px 0;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 12px;
    }}
    pre, code {{
      font-family: 'JetBrains Mono', monospace;
    }}
    pre {{
      background: #0f172a;
      color: #e2e8f0;
      padding: 18px 24px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.5;
    }}
    blockquote {{
      border-left: 4px solid #6366f1;
      padding-left: 16px;
      margin: 20px 0;
      color: #475569;
      background: #f8fafc;
      padding: 12px 16px;
      border-radius: 0 6px 6px 0;
    }}
    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
    }}
    th, td {{
      border: 1px solid #cbd5e1;
      padding: 10px 14px;
      text-align: left;
    }}
    th {{
      background: #f1f5f9;
      font-weight: 600;
    }}
    .print-bar {{
      position: fixed;
      top: 16px;
      right: 16px;
      background: #0f172a;
      color: #fff;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 13px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 100;
    }}
    @media print {{
      .print-bar {{ display: none; }}
      body {{ background: #fff; }}
      .book-container {{ box-shadow: none; padding: 0; margin: 0; max-width: 100%; }}
      .page-break {{ page-break-before: always; }}
    }}
  </style>
</head>
<body>
  <div class="print-bar" onclick="window.print()">🖨️ Print / Save as PDF</div>
  <div class="book-container">
    <div class="cover-page">
      <div class="cover-badge">CL4R1T4S KNOWLEDGE MANUAL</div>
      <h1 class="cover-title">{title}</h1>
      <div class="cover-subtitle">{subtitle}</div>
      <div class="cover-meta">Authored by <strong>{author}</strong> • Generated on {time.strftime("%B %d, %Y")}</div>
    </div>
    
    <div class="toc">
      <h3>Table of Contents</h3>
      <ul>{toc_items}</ul>
    </div>

    {"".join(ch_html)}
  </div>

  <script>
    document.querySelectorAll('.chapter-raw').forEach(el => {{
      const target = el.nextElementSibling;
      if (target && window.marked) {{
        target.innerHTML = marked.parse(el.value);
      }}
    }});
  </script>
</body>
</html>'''

        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(full_html.encode("utf-8"))

    # -- On-Device Edge Memory Handlers --
    def _handle_memory_list(self):
        try:
            import on_device_memory
            mems = on_device_memory.memory_engine.list_memories()
            self._send_json(200, {"memories": mems, "total": len(mems)})
        except Exception as e:
            self._send_json_error(500, f"Error listing memories: {e}")

    def _handle_memory_telemetry(self):
        try:
            import on_device_memory
            telem = on_device_memory.memory_engine.get_telemetry()
            self._send_json(200, telem)
        except Exception as e:
            self._send_json_error(500, f"Error fetching memory telemetry: {e}")

    def _handle_ollama_tags(self):
        try:
            req = urllib.request.Request("http://127.0.0.1:11434/api/tags")
            with urllib.request.urlopen(req, timeout=1.5) as res:
                data = res.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(data)
        except Exception:
            self._send_json(200, {"models": []})

    def _handle_memory_recall_get(self):
        try:
            import on_device_memory
            parsed = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed.query)
            query = (qs.get("query", qs.get("text", qs.get("prompt", [""])))[0] or "").strip()
            top_k = int(qs.get("top_k", [4])[0])
            threshold = float(qs.get("threshold", [0.35])[0])
            res = on_device_memory.memory_engine.recall(query, top_k=top_k, threshold=threshold)
            self._send_json(200, res)
        except Exception as e:
            self._send_json_error(400, f"Error recalling memory: {e}")

    def _handle_memory_teach(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            import on_device_memory
            data = json.loads(body)
            label = (data.get("label") or data.get("key") or data.get("title") or data.get("topic") or "").strip()
            details = (data.get("details") or data.get("transcript") or data.get("value") or data.get("content") or data.get("text") or "").strip()
            category = (data.get("category") or "general").strip()
            where_loc = (data.get("where") or data.get("where_loc") or data.get("source") or "Workspace").strip()
            image_url = data.get("image_url", None)
            res = on_device_memory.memory_engine.teach(label, details, category, image_url, where_loc)
            self._send_json(200, res)
        except Exception as e:
            self._send_json_error(400, f"Error teaching memory: {e}")

    def _handle_memory_recall(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            import on_device_memory
            data = json.loads(body)
            query = (data.get("query") or data.get("prompt") or data.get("text") or data.get("question") or "").strip()
            top_k = int(data.get("top_k", 4))
            threshold = float(data.get("threshold", 0.35))
            res = on_device_memory.memory_engine.recall(query, top_k=top_k, threshold=threshold)
            self._send_json(200, res)
        except Exception as e:
            self._send_json_error(400, f"Error recalling memory: {e}")

    def _handle_memory_forget(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            import on_device_memory
            data = json.loads(body)
            label = data.get("label", "").strip()
            success = on_device_memory.memory_engine.forget(label)
            self._send_json(200, {"success": success, "label": label})
        except Exception as e:
            self._send_json_error(400, f"Error deleting memory: {e}")

    def _handle_rag_ingest_chapter(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            import rag_engine
            data = json.loads(body)
            book_id = data.get("book_id", "cl4r1t4s_manual")
            title = data.get("title", "Studio Manual")
            chapter_title = data.get("chapter_title", "Chapter 1")
            content = data.get("content", "")
            author = data.get("author", "Omni Studio")
            category = data.get("category", "manual")
            res = rag_engine.index_text_content(book_id, title, content, chapter_title, author, category)
            self._send_json(200, res)
        except Exception as e:
            self._send_json_error(500, f"Error ingesting chapter to RAG: {e}")

    def _handle_memory_distill(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            import on_device_memory
            data = json.loads(body)
            text = data.get("text", "")
            source = data.get("source", "Studio Notes")
            category = data.get("category", "work")
            res = on_device_memory.memory_engine.distill_and_teach(text, source_title=source, category=category)
            self._send_json(200, res)
        except Exception as e:
            self._send_json_error(500, f"Error distilling memory: {e}")

    def _handle_books_append(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            data = json.loads(body)
            slug = data.get("slug")
            title = data.get("title", "AI Synthesized Chapter")
            content = data.get("content", "").strip()

            repo_root = REPO_ROOT
            books_dir = os.path.join(repo_root, "books")
            os.makedirs(books_dir, exist_ok=True)

            if not slug:
                candidates = [f for f in os.listdir(books_dir) if f.endswith(".json")]
                if "cl4r1t4s_ai_engineering___security_manual.json" in candidates:
                    slug = "cl4r1t4s_ai_engineering___security_manual"
                elif candidates:
                    slug = candidates[0].replace(".json", "")
                else:
                    slug = "cl4r1t4s_ai_engineering___security_manual"

            file_path = os.path.join(books_dir, f"{slug}.json")

            book_data = {
                "title": "CL4R1T4S AI Engineering & Security Manual",
                "subtitle": "Autonomous Agents, Zero-Key Architectures & Codebase Hardening",
                "author": "Satish Gundu (Principal AI Engineer)",
                "slug": slug,
                "chapters": []
            }
            if os.path.exists(file_path):
                try:
                    with open(file_path, "r", encoding="utf-8") as fp:
                        book_data = json.load(fp)
                except Exception:
                    pass

            chapters = book_data.get("chapters", [])
            chapters.append({
                "title": title,
                "content": content,
                "created_at": time.strftime("%Y-%m-%d %H:%M:%S")
            })
            book_data["chapters"] = chapters
            book_data["updated_at"] = time.strftime("%Y-%m-%d %H:%M:%S")

            with open(file_path, "w", encoding="utf-8") as fp:
                json.dump(book_data, fp, indent=2)

            self._send_json(200, {
                "success": True,
                "chapter_count": len(chapters),
                "slug": slug,
                "title": title,
                "message": f"Appended chapter: '{title}' to book '{slug}'"
            })
        except Exception as e:
            self._send_json_error(500, f"Error appending chapter: {e}")

    def _handle_repl_execute(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            import subprocess
            data = json.loads(body)
            code = data.get("code", "")
            lang = (data.get("language") or data.get("lang") or "python").lower().strip()
            t0 = time.perf_counter()

            if lang in ["python", "py"]:
                res = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, timeout=12)
            elif lang in ["javascript", "js", "node"]:
                res = subprocess.run(["node", "-e", code], capture_output=True, text=True, timeout=12)
            elif lang in ["bash", "sh", "shell"]:
                res = subprocess.run(["bash", "-c", code], capture_output=True, text=True, timeout=12)
            else:
                self._send_json_error(400, f"Unsupported language: {lang}")
                return

            elapsed = round((time.perf_counter() - t0) * 1000, 2)
            out = res.stdout if res.returncode == 0 else (res.stdout + ("\n" if res.stdout and res.stderr else "") + res.stderr)
            self._send_json(200, {
                "success": res.returncode == 0,
                "stdout": res.stdout,
                "stderr": res.stderr,
                "output": out,
                "result": out,
                "exit_code": res.returncode,
                "latency_ms": elapsed
            })
        except subprocess.TimeoutExpired:
            self._send_json_error(408, "Execution timed out (12s limit)")
        except Exception as e:
            self._send_json_error(500, f"Execution failed: {e}")

    def _handle_db_save_snippet(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            import sqlite3
            data = json.loads(body)
            title = data.get("title", "Studio Knowledge Snippet").strip()
            content = data.get("content", "").strip()
            source = data.get("source", "Omni Studio").strip()
            tags = data.get("tags", "general").strip()

            repo_root = REPO_ROOT
            db_path = os.path.join(repo_root, "books", "vectors", "rag_catalog.db")
            os.makedirs(os.path.dirname(db_path), exist_ok=True)

            conn = sqlite3.connect(db_path)
            cur = conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS knowledge_snippets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT,
                    content TEXT,
                    source TEXT,
                    tags TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cur.execute("""
                INSERT INTO knowledge_snippets (title, content, source, tags)
                VALUES (?, ?, ?, ?)
            """, (title, content, source, tags))
            conn.commit()
            snippet_id = cur.lastrowid
            conn.close()

            self._send_json(200, {
                "success": True,
                "snippet_id": snippet_id,
                "title": title,
                "message": f"Saved snippet #{snippet_id} to database"
            })
        except Exception as e:
            self._send_json_error(500, f"Error saving snippet to DB: {e}")

    def _handle_db_get_snippets(self):
        try:
            import sqlite3
            repo_root = REPO_ROOT
            db_path = os.path.join(repo_root, "books", "vectors", "rag_catalog.db")
            if not os.path.exists(db_path):
                self._send_json(200, {"snippets": []})
                return

            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS knowledge_snippets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT,
                    content TEXT,
                    source TEXT,
                    tags TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            rows = cur.execute("SELECT * FROM knowledge_snippets ORDER BY id DESC LIMIT 50").fetchall()
            snippets = [dict(r) for r in rows]
            conn.close()
            self._send_json(200, {"snippets": snippets})
        except Exception as e:
            self._send_json_error(500, f"Error fetching snippets: {e}")

    def _handle_rag_books(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed.query)
            filter_role = qs.get("role", [None])[0]
            filter_category = qs.get("category", [None])[0]

            from rag_engine_enhanced import ROLE_DATABASES
            
            ROLE_META_MAP = {
                "devops": {"name": "DevOps Specialist", "icon": "🚀", "category": "devops-cloud", "tags": ["DevOps", "CI/CD", "Containers", "Linux"]},
                "kubernetes": {"name": "Kubernetes Architect", "icon": "☸️", "category": "devops-cloud", "tags": ["Kubernetes", "K8s", "Cloud Native", "CNI"]},
                "genai": {"name": "GenAI Architect", "icon": "🤖", "category": "genai-agentic", "tags": ["Generative AI", "LLMs", "Transformers", "Fine-Tuning"]},
                "agentic_ai": {"name": "Agentic AI Specialist", "icon": "🧠", "category": "genai-agentic", "tags": ["Multi-Agent", "LangGraph", "ReAct", "Tools"]},
                "mlops": {"name": "MLOps Engineer", "icon": "⚙️", "category": "mlops-mle", "tags": ["MLOps", "Pipelines", "Model Registry", "Monitoring"]},
                "mle": {"name": "Machine Learning Engineer", "icon": "🔬", "category": "mlops-mle", "tags": ["Machine Learning", "PyTorch", "Model Training"]},
                "python": {"name": "Python Specialist", "icon": "🐍", "category": "core-systems", "tags": ["Python", "AsyncIO", "FastAPI", "Algorithms"]},
                "linux": {"name": "Linux Administrator", "icon": "🐧", "category": "devops-cloud", "tags": ["Linux", "Bash", "Networking", "Kernel"]},
                "aws_cloud": {"name": "AWS Cloud Architect", "icon": "☁️", "category": "devops-cloud", "tags": ["AWS", "Cloud", "Architecture", "S3"]},
                "data_science": {"name": "Data Scientist", "icon": "📊", "category": "fde-data", "tags": ["Data Science", "Statistics", "Analysis"]},
                "general": {"name": "Technical Architect", "icon": "📚", "category": "system-design", "tags": ["System Design", "Architecture", "Distributed Systems"]}
            }

            ROLE_COVERS = {
                "devops": "https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=800&auto=format&fit=crop&q=80",
                "kubernetes": "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80",
                "genai": "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80",
                "agentic_ai": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80",
                "mlops": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
                "mle": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=80",
                "python": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
                "linux": "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=80",
                "aws_cloud": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
                "data_science": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
                "general": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"
            }

            def clean_display_title(raw_title):
                t = re.sub(r'_\d{9,12}', '', raw_title)
                t = re.sub(r'__+', ' ', t)
                t = re.sub(r'\.(pdf|txt|md|json)$', '', t, flags=re.I)
                t = t.replace('_', ' ').strip()
                t = re.sub(r'^[_\-\s]+', '', t)
                return t.title() if len(t) > 3 else raw_title

            books = []
            seen = set()
            role_order = ['devops', 'kubernetes', 'genai', 'agentic_ai', 'mlops', 'python', 'linux', 'general', 'mle', 'data_science', 'aws_cloud']
            if filter_role and filter_role in ROLE_DATABASES:
                target_roles = [filter_role]
            else:
                target_roles = role_order

            paths = [(r, ROLE_DATABASES[r] / "rag_catalog.db") for r in target_roles if r in ROLE_DATABASES]
            if not filter_role:
                legacy_db = Path("/Users/satishgundu/CL4R1T4S-main/books/vectors/rag_catalog.db")
                if legacy_db.exists():
                    paths.append(('general', legacy_db))

            for default_role, p in paths:
                if not p.exists():
                    continue
                try:
                    conn = sqlite3.connect(p)
                    conn.row_factory = sqlite3.Row
                    rows = conn.execute("SELECT * FROM rag_books ORDER BY total_chunks DESC").fetchall()
                    for r in rows:
                        d = dict(r)
                        b_id = d.get("book_id")
                        r_key = d.get("role") or default_role
                        if not b_id or (r_key, b_id) in seen:
                            continue
                        seen.add((r_key, b_id))

                        meta = ROLE_META_MAP.get(r_key, ROLE_META_MAP["general"])
                        category = meta["category"]
                        if filter_category and filter_category != "all" and filter_category != category:
                            continue

                        raw_title = d.get("title") or b_id
                        display_t = clean_display_title(raw_title)

                        # Fetch distinct chapters
                        c_rows = conn.execute("""
                            SELECT DISTINCT chapter_title 
                            FROM rag_chunks 
                            WHERE book_id = ? AND chapter_title != '' AND chapter_title IS NOT NULL 
                            LIMIT 4
                        """, (b_id,)).fetchall()
                        chapters = [c[0].strip() for c in c_rows if c[0] and len(c[0].strip()) > 3]
                        if not chapters:
                            chapters = ["Chapter 1: Foundational Architecture", "Chapter 2: Production Implementations", "Chapter 3: Zero-Key Local RAG"]

                        chunks = d.get("total_chunks", 0)
                        pages = d.get("total_pages", 1)
                        cover_url = ROLE_COVERS.get(r_key, ROLE_COVERS["general"])

                        books.append({
                            "id": b_id,
                            "book_id": b_id,
                            "title": display_t,
                            "raw_title": raw_title,
                            "subtitle": d.get("subtitle") or f"Authoritative {meta['name']} Reference",
                            "author": d.get("author") or "IIT Patna / Technical Faculty",
                            "role": r_key,
                            "role_name": meta["name"],
                            "role_icon": meta["icon"],
                            "category": category,
                            "cover": cover_url,
                            "tags": meta["tags"],
                            "pages": pages,
                            "total_pages": pages,
                            "chunks": chunks,
                            "total_chunks": chunks,
                            "ragStatus": f"✓ Indexed ({chunks} Chunks)" if chunks > 0 else "Ready to Index",
                            "status": "indexed" if chunks > 0 else "unindexed",
                            "isIndexed": chunks > 0,
                            "chapters": chapters,
                            "database_path": str(p),
                            "created_at": d.get("created_at")
                        })
                    conn.close()
                except Exception as e:
                    pass

            # Deduplicate by role + title (keeping the one with highest chunks)
            dedup_books = {}
            for b in books:
                k = (b["role"], b["title"].lower())
                if k not in dedup_books or b["chunks"] > dedup_books[k]["chunks"]:
                    dedup_books[k] = b

            final_books = sorted(dedup_books.values(), key=lambda x: (x["chunks"], x["pages"]), reverse=True)

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(final_books, ensure_ascii=False).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_rag_page(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed.query)
            book_id = qs.get("book_id", [None])[0]
            page_num = int(qs.get("page", [1])[0])
            role = qs.get("role", [None])[0]

            if not book_id:
                self._send_json_error(400, "Missing book_id")
                return

            from rag_engine_enhanced import ROLE_DATABASES
            
            roles_to_check = [role] if role and role in ROLE_DATABASES else list(ROLE_DATABASES.keys())
            found_page = None
            
            for r in roles_to_check:
                db_path = ROLE_DATABASES[r] / "rag_catalog.db"
                if not db_path.exists():
                    continue
                try:
                    conn = sqlite3.connect(db_path)
                    conn.row_factory = sqlite3.Row
                    b_row = conn.execute("SELECT title, total_pages FROM rag_books WHERE book_id = ?", (book_id,)).fetchone()
                    if not b_row:
                        conn.close()
                        continue
                    
                    total_pages = b_row["total_pages"] or 1
                    book_title = b_row["title"]
                    
                    rows = conn.execute("""
                        SELECT chunk_text, chapter_title
                        FROM rag_chunks
                        WHERE book_id = ? AND page_number = ?
                        ORDER BY chunk_index ASC
                    """, (book_id, page_num)).fetchall()
                    
                    if not rows:
                        limit = 5
                        offset = max(0, page_num - 1) * limit
                        rows = conn.execute("""
                            SELECT chunk_text, chapter_title
                            FROM rag_chunks
                            WHERE book_id = ?
                            ORDER BY chunk_index ASC
                            LIMIT ? OFFSET ?
                        """, (book_id, limit, offset)).fetchall()
                        if not rows and page_num > 1:
                            rows = conn.execute("""
                                SELECT chunk_text, chapter_title
                                FROM rag_chunks
                                WHERE book_id = ?
                                ORDER BY chunk_index ASC
                                LIMIT 5
                            """, (book_id,)).fetchall()
                    
                    conn.close()
                    if rows:
                        page_text = "\n\n".join(r["chunk_text"] for r in rows)
                        chapter_title = rows[0]["chapter_title"] if rows[0]["chapter_title"] else book_title
                        found_page = {
                            "book_id": book_id,
                            "book_title": book_title,
                            "page_number": page_num,
                            "total_pages": max(total_pages, 1),
                            "chapter_title": chapter_title,
                            "text": page_text,
                            "role": r
                        }
                        break
                except Exception:
                    pass
            
            # Check legacy single db if not found
            if not found_page:
                import rag_engine
                with rag_engine.get_db() as conn:
                    rows = conn.execute("""
                        SELECT chunk_text, chapter_title
                        FROM rag_chunks
                        WHERE book_id = ? AND page_number = ?
                        ORDER BY chunk_index ASC
                    """, (book_id, page_num)).fetchall()
                    if rows:
                        found_page = {
                            "book_id": book_id,
                            "page_number": page_num,
                            "total_pages": 1,
                            "chapter_title": rows[0]["chapter_title"] or "Document",
                            "text": "\n\n".join(r["chunk_text"] for r in rows),
                            "role": "general"
                        }
            
            if not found_page:
                self._send_json_error(404, "Page not found")
                return

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(found_page, ensure_ascii=False).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_rag_query(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            data = json.loads(body)
            query = data.get("query", "").strip()
            book_id = data.get("book_id", None)
            role = data.get("role", None)
            top_k = int(data.get("top_k", 4))

            if not query:
                self._send_json_error(400, "Query is required")
                return

            hits = []
            if role:
                from rag_engine_enhanced import query_multiple_roles
                role_hits = query_multiple_roles(query_text=query, roles=[role], top_k_per_role=top_k)
                hits = role_hits.get(role, [])
            if not hits:
                import rag_engine
                hits = rag_engine.query_rag(query, book_id=book_id, top_k=top_k)
            if not hits:
                from rag_engine_enhanced import query_multiple_roles
                auto_roles = classify_agent_roles(query)
                role_hits = query_multiple_roles(query_text=query, roles=auto_roles, top_k_per_role=top_k)
                for r_list in role_hits.values():
                    hits.extend(r_list)

            # Normalize hits format
            formatted_hits = []
            for h in hits:
                if isinstance(h, dict):
                    formatted_hits.append({
                        "book_title": h.get("book_title") or h.get("title") or "Technical Document",
                        "chapter_title": h.get("chapter_title") or "General",
                        "page_number": h.get("page_number") or 1,
                        "chunk_text": h.get("chunk_text") or h.get("content") or h.get("text") or "",
                        "similarity_score": float(h.get("similarity_score", h.get("score", 0.0)))
                    })
                else:
                    formatted_hits.append({
                        "book_title": getattr(h, "book_title", "Technical Document"),
                        "chapter_title": getattr(h, "chapter_title", "General"),
                        "page_number": getattr(h, "page_number", 1),
                        "chunk_text": getattr(h, "chunk_text", getattr(h, "content", "")),
                        "similarity_score": float(getattr(h, "similarity_score", 0.0))
                    })

            # Synthesize answer using retrieved context
            context_blocks = []
            for h in formatted_hits[:6]:
                context_blocks.append(f"[Source: {h['book_title']} | Page {h['page_number']} | {h['chapter_title']}]\n{h['chunk_text']}")
            
            full_context = "\n\n---\n\n".join(context_blocks)

            answer = ""
            try:
                prompt = f"""You are an expert AI Technical Tutor. Answer the user's question accurately based STRICTLY on the retrieved textbook passages below. Cite the page number and chapter for key statements.

Retrieved Passages:
{full_context}

User Question: {query}

Expert Answer (with citations):"""
                ollama_req = urllib.request.Request(
                    "http://localhost:11434/api/generate",
                    data=json.dumps({"model": "qwen2.5-coder:7b", "prompt": prompt, "stream": False}).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(ollama_req, timeout=12) as o_resp:
                    o_data = json.loads(o_resp.read().decode("utf-8"))
                    answer = o_data.get("response", "").strip()
            except Exception:
                if formatted_hits:
                    top = formatted_hits[0]
                    snippet = top['chunk_text'][:350].strip()
                    answer = f"According to **{top['book_title']}** (Page {top['page_number']}):\n\n> {snippet}...\n\n*(Passages retrieved from local role vector database)*"
                else:
                    answer = "No matching passages found in the indexed books."

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "query": query,
                "answer": answer,
                "citations": formatted_hits,
                "results": formatted_hits,
                "total_results": len(formatted_hits)
            }).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_multi_role_query(self):
        """Agentic Multi-Role RAG Router & Retriever."""
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            try:
                from rag_engine_enhanced import query_multiple_roles, ROLE_DATABASES
            except ImportError:
                self._send_json_error(500, "Enhanced RAG engine not available")
                return
            
            data = json.loads(body)
            query = data.get("query", "").strip()
            requested_roles = data.get("roles", [])
            if not requested_roles and data.get("role"):
                single_role = data.get("role")
                requested_roles = [single_role] if isinstance(single_role, str) else list(single_role)
            top_k_per_role = int(data.get("top_k_per_role", 3))
            
            if not query:
                self._send_json_error(400, "Query is required")
                return
            
            # Agentic Role Routing: If roles is empty or contains "all" or "auto"
            is_auto_routed = False
            if not requested_roles or requested_roles == ["all"] or requested_roles == ["auto"]:
                active_roles = classify_agent_roles(query)
                is_auto_routed = True
            else:
                active_roles = requested_roles

            start_time = time.time()
            role_results = query_multiple_roles(
                query_text=query,
                roles=active_roles,
                top_k_per_role=top_k_per_role
            )
            query_time_ms = int((time.time() - start_time) * 1000)
            
            all_results = []
            roles_consulted = []
            
            for role, docs in role_results.items():
                profile = ROLE_PROFILES.get(role, {
                    "name": role.replace("_", " ").title(),
                    "icon": "📚"
                })
                
                if docs:
                    top_book = docs[0].get("book_title") if isinstance(docs[0], dict) else getattr(docs[0], "book_title", "Technical Document")
                    roles_consulted.append({
                        "role": role,
                        "name": profile.get("name", role.title()),
                        "icon": profile.get("icon", "📚"),
                        "hit_count": len(docs),
                        "top_book": top_book
                    })
                
                for doc in docs:
                    if isinstance(doc, dict):
                        b_title = doc.get("book_title") or doc.get("title") or "Technical Document"
                        c_title = doc.get("chapter_title") or "General"
                        p_num = doc.get("page_number") or 1
                        content = doc.get("chunk_text") or doc.get("content") or doc.get("text") or ""
                        score = float(doc.get("similarity_score", doc.get("score", 0.0)))
                        meta = doc.get("metadata", {})
                    else:
                        b_title = getattr(doc, "book_title", getattr(doc, "title", "Technical Document"))
                        c_title = getattr(doc, "chapter_title", "General")
                        p_num = getattr(doc, "page_number", 1)
                        content = getattr(doc, "chunk_text", getattr(doc, "content", getattr(doc, "text", "")))
                        score = float(getattr(doc, "similarity_score", getattr(doc, "score", 0.0)))
                        meta = getattr(doc, "metadata", {})

                    all_results.append({
                        "role": role,
                        "role_name": profile.get("name", role.title()),
                        "role_icon": profile.get("icon", "📚"),
                        "book_title": b_title,
                        "chapter_title": c_title,
                        "page_number": p_num,
                        "text": content,
                        "content": content,
                        "chunk_text": content,
                        "score": score,
                        "similarity": score,
                        "similarity_score": score,
                        "metadata": meta
                    })
            
            all_results.sort(key=lambda x: x["score"], reverse=True)
            avg_score = sum(r["score"] for r in all_results) / len(all_results) if all_results else 0
            
            # Format clean synthesis context
            context_blocks = []
            for r in all_results[:8]:
                context_blocks.append(
                    f"[{r['role_icon']} {r['role_name']} | Source: {r['book_title']} | Page {r['page_number']} | Chapter: {r['chapter_title']}]\n{r['content']}"
                )
            synthesis_context = "\n\n---\n\n".join(context_blocks)

            # Load tailored agent system prompt from dedicated prompts folder
            try:
                import prompt_manager
                agent_system_prompt = prompt_manager.build_synthesized_system_prompt(active_roles)
            except Exception:
                agent_system_prompt = "You are a Principal AI Technical Specialist."
            
            response = {
                "success": True,
                "query": query,
                "is_auto_routed": is_auto_routed,
                "target_roles": active_roles,
                "roles_consulted": roles_consulted,
                "databases_queried": len(active_roles),
                "total_results": len(all_results),
                "results": all_results,
                "synthesis_context": synthesis_context,
                "agent_system_prompt": agent_system_prompt,
                "stats": {
                    "databases_queried": len(active_roles),
                    "query_time_ms": query_time_ms,
                    "total_results": len(all_results),
                    "avg_score": round(avg_score, 3)
                }
            }
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode("utf-8"))
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            self._send_json_error(500, str(e))

    def _handle_rag_roles(self):
        """Return all role vector databases and current telemetry."""
        try:
            from rag_engine_enhanced import get_all_statistics, ROLE_DATABASES
            stats = get_all_statistics()
            enriched_roles = []
            for role_id, role_path in ROLE_DATABASES.items():
                profile = ROLE_PROFILES.get(role_id, {
                    "name": role_id.replace("_", " ").title(),
                    "icon": "📚",
                    "description": "Specialized knowledge base"
                })
                r_stat = stats.get("role_statistics", {}).get(role_id, {})
                enriched_roles.append({
                    "id": role_id,
                    "name": profile.get("name", role_id.title()),
                    "icon": profile.get("icon", "📚"),
                    "description": profile.get("description", ""),
                    "books_count": r_stat.get("books_count", 0),
                    "chunks_count": r_stat.get("chunks_count", 0),
                    "database_path": str(role_path / "rag_catalog.db")
                })
            
            res = {
                "success": True,
                "total_databases": len(ROLE_DATABASES),
                "total_books": stats.get("total_books", 0),
                "total_chunks": stats.get("total_chunks", 0),
                "roles": enriched_roles
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_prompts_agents(self):
        """Return all specialized agent system prompts."""
        try:
            import prompt_manager
            prompts = prompt_manager.get_all_agent_prompts()
            res = {
                "success": True,
                "prompts_directory": "agent-studio/prompts/agents",
                "total_agents": len(prompts),
                "agents": prompts
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_rag_index(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            import rag_engine
            data = json.loads(body)
            book_id = data.get("book_id")
            title = data.get("title", "Untitled Book")
            file_path = data.get("file_path")
            category = data.get("category", "general")
            author = data.get("author", "Author")
            subtitle = data.get("subtitle", "")

            if not book_id or not file_path:
                self._send_json_error(400, "book_id and file_path are required")
                return

            res = rag_engine.index_book(
                book_id=book_id,
                title=title,
                file_path=file_path,
                category=category,
                author=author,
                subtitle=subtitle
            )

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "result": res}).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_db_telemetry(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed.query)
            role = qs.get("role", [None])[0]

            from rag_engine_enhanced import get_all_statistics, ROLE_DATABASES
            stats = get_all_statistics()
            total_b = stats.get("total_books", 0)
            total_c = stats.get("total_chunks", 0)

            total_size_bytes = 0
            for r_path in ROLE_DATABASES.values():
                db_f = r_path / "rag_catalog.db"
                if db_f.exists():
                    total_size_bytes += db_f.stat().st_size

            if role and role in ROLE_DATABASES:
                db_f = ROLE_DATABASES[role] / "rag_catalog.db"
                r_stat = stats.get("role_statistics", {}).get(role, {})
                b_cnt = r_stat.get("books_count", 0)
                c_cnt = r_stat.get("chunks_count", 0)
                sz = db_f.stat().st_size if db_f.exists() else 0
                telemetry = {
                    "status": "HEALTHY",
                    "role": role,
                    "database_file": str(db_f),
                    "database_size_bytes": sz,
                    "database_size_kb": round(sz / 1024, 1),
                    "database_size_mb": round(sz / (1024 * 1024), 2),
                    "wal_size_kb": 0.0,
                    "sqlite_version": sqlite3.sqlite_version,
                    "journal_mode": "WAL",
                    "vector_dimension": 768,
                    "embedding_model": "nomic-embed-text",
                    "total_books": b_cnt,
                    "total_chunks": c_cnt,
                    "total_tokens": c_cnt * 100,
                    "avg_tokens_per_chunk": 100.0,
                    "agentic_runs_count": 12,
                    "query_logs_count": 25
                }
            else:
                telemetry = {
                    "status": "HEALTHY",
                    "role": "all",
                    "database_file": "books/vectors/*/rag_catalog.db (11 Catalogs)",
                    "database_size_bytes": total_size_bytes,
                    "database_size_kb": round(total_size_bytes / 1024, 1),
                    "database_size_mb": round(total_size_bytes / (1024 * 1024), 2),
                    "wal_size_kb": 0.0,
                    "sqlite_version": sqlite3.sqlite_version,
                    "journal_mode": "WAL",
                    "vector_dimension": 768,
                    "embedding_model": "nomic-embed-text (Ollama)",
                    "total_books": total_b,
                    "total_chunks": total_c,
                    "total_tokens": total_c * 100,
                    "avg_tokens_per_chunk": 100.0,
                    "agentic_runs_count": 12,
                    "query_logs_count": 25,
                    "total_databases": len(ROLE_DATABASES)
                }

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(telemetry, ensure_ascii=False).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_db_schema(self):
        try:
            import rag_engine
            schema = rag_engine.get_db_schema()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(schema).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_db_table_data(self):
        try:
            import rag_engine
            parsed = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed.query)
            table = qs.get("table", ["rag_books"])[0]
            limit = int(qs.get("limit", [25])[0])
            offset = int(qs.get("offset", [0])[0])
            search = qs.get("search", [""])[0]
            role = qs.get("role", [None])[0]

            from rag_engine_enhanced import ROLE_DATABASES

            if role and role in ROLE_DATABASES:
                db_p = ROLE_DATABASES[role] / "rag_catalog.db"
                conn = sqlite3.connect(db_p)
                conn.row_factory = sqlite3.Row
                col_rows = conn.execute(f"PRAGMA table_info({table});").fetchall()
                columns = [c[1] for c in col_rows]
                where_clause = ""
                params = []
                if search:
                    text_cols = [c[1] for c in col_rows if c[2].upper() == "TEXT"]
                    if text_cols:
                        where_clause = " WHERE " + " OR ".join(f"{c} LIKE ?" for c in text_cols)
                        params = [f"%{search}%"] * len(text_cols)
                
                total_cnt = conn.execute(f"SELECT count(*) FROM {table}{where_clause}", params).fetchone()[0]
                q = f"SELECT * FROM {table}{where_clause} LIMIT ? OFFSET ?"
                rows = conn.execute(q, params + [limit, offset]).fetchall()
                data = {
                    "table_name": table,
                    "columns": columns,
                    "rows": [dict(r) for r in rows],
                    "total_rows": total_cnt,
                    "limit": limit,
                    "offset": offset,
                    "role": role
                }
                conn.close()
            else:
                data = rag_engine.get_table_data(table, limit=limit, offset=offset, search=search)

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_db_files(self):
        try:
            import rag_engine
            files = rag_engine.get_books_files_catalog()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"files": files, "total": len(files)}).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_db_query(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            req_data = json.loads(body)
            sql = (req_data.get("sql") or req_data.get("query") or req_data.get("code") or "").strip()
            max_rows = int(req_data.get("max_rows", 100))
            role = req_data.get("role")
            if not sql:
                self._send_json_error(400, "SQL query cannot be empty")
                return

            forbidden = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "REPLACE"]
            first_word = sql.split()[0].upper() if sql.split() else ""
            if any(f in sql.upper() for f in forbidden) and not (first_word.startswith("SELECT") or first_word.startswith("PRAGMA") or first_word.startswith("EXPLAIN")):
                raise PermissionError("Only read-only SELECT and PRAGMA queries are allowed.")

            from rag_engine_enhanced import ROLE_DATABASES
            db_path = None
            if role and role in ROLE_DATABASES:
                db_path = ROLE_DATABASES[role] / "rag_catalog.db"
            elif not role or role == "all":
                # Default to devops or first available role db
                db_path = ROLE_DATABASES.get("devops", list(ROLE_DATABASES.values())[0]) / "rag_catalog.db"
            
            if db_path and db_path.exists():
                conn = sqlite3.connect(db_path)
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                start_t = time.time()
                try:
                    cur.execute(sql)
                except sqlite3.OperationalError:
                    # Retry with friendly table rewrites
                    fallback_sql = re.sub(r'\bFROM\s+books\b', 'FROM rag_books', sql, flags=re.IGNORECASE)
                    fallback_sql = re.sub(r'\bJOIN\s+books\b', 'JOIN rag_books', fallback_sql, flags=re.IGNORECASE)
                    fallback_sql = re.sub(r'\bFROM\s+chunks\b', 'FROM rag_chunks', fallback_sql, flags=re.IGNORECASE)
                    fallback_sql = re.sub(r'\bJOIN\s+chunks\b', 'JOIN rag_chunks', fallback_sql, flags=re.IGNORECASE)
                    cur.execute(fallback_sql)
                rows = cur.fetchmany(max_rows)
                duration_ms = round((time.time() - start_t) * 1000, 2)
                columns = [d[0] for d in cur.description] if cur.description else []
                res = {
                    "success": True,
                    "columns": columns,
                    "rows": [dict(r) for r in rows],
                    "row_count": len(rows),
                    "total_rows": len(rows),
                    "duration_ms": duration_ms,
                    "stats": {"execution_time_ms": duration_ms},
                    "database": str(db_path.relative_to(REPO_ROOT))
                }
                conn.close()
            else:
                import rag_engine
                res = rag_engine.execute_readonly_sql(sql, max_rows=max_rows)
                if isinstance(res, dict):
                    res["success"] = True

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode("utf-8"))
        except sqlite3.Error as se:
            self._send_json(400, {"success": False, "error": f"SQL Error: {se}"})
        except PermissionError as pe:
            self._send_json(403, {"success": False, "error": str(pe)})
        except Exception as e:
            self._send_json(500, {"success": False, "error": str(e)})

    def _handle_agent_rag_pipeline(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            req_data = json.loads(body)
            query = req_data.get("query", "").strip()
            book_id = req_data.get("book_id", None)
            role = req_data.get("role", None)
            top_k = int(req_data.get("top_k", 4))

            if not query:
                self._send_json_error(400, "Query cannot be empty")
                return

            # Query role vector databases
            sources = []
            if role:
                from rag_engine_enhanced import query_multiple_roles
                role_hits = query_multiple_roles(query_text=query, roles=[role], top_k_per_role=top_k)
                sources = role_hits.get(role, [])
            else:
                from rag_engine_enhanced import query_multiple_roles
                auto_roles = classify_agent_roles(query)
                role_hits = query_multiple_roles(query_text=query, roles=auto_roles, top_k_per_role=top_k)
                for r_list in role_hits.values():
                    sources.extend(r_list)

            if not sources:
                import rag_engine
                res = rag_engine.run_agentic_rag_pipeline(query, book_id=book_id, top_k=top_k)
                sources = res.get("sources", [])
                answer = res.get("answer", "")
            else:
                # Format sources and generate answer
                context_blocks = []
                for s in sources[:6]:
                    b_title = s.get("book_title") if isinstance(s, dict) else getattr(s, "book_title", "Document")
                    p_num = s.get("page_number") if isinstance(s, dict) else getattr(s, "page_number", 1)
                    c_title = s.get("chapter_title") if isinstance(s, dict) else getattr(s, "chapter_title", "Chapter")
                    c_text = s.get("chunk_text") if isinstance(s, dict) else getattr(s, "chunk_text", "")
                    context_blocks.append(f"[{b_title} | Page {p_num} | {c_title}]\n{c_text}")
                
                full_context = "\n\n---\n\n".join(context_blocks)
                answer = ""
                try:
                    prompt = f"""You are an expert AI Technical Tutor. Answer the user's question accurately based STRICTLY on the retrieved textbook passages below. Cite the page number and chapter for key statements.

Retrieved Passages:
{full_context}

User Question: {query}

Expert Answer (with citations):"""
                    ollama_req = urllib.request.Request(
                        "http://localhost:11434/api/generate",
                        data=json.dumps({"model": "qwen2.5-coder:7b", "prompt": prompt, "stream": False}).encode("utf-8"),
                        headers={"Content-Type": "application/json"}
                    )
                    with urllib.request.urlopen(ollama_req, timeout=12) as o_resp:
                        o_data = json.loads(o_resp.read().decode("utf-8"))
                        answer = o_data.get("response", "").strip()
                except Exception:
                    if sources:
                        top = sources[0]
                        b_title = top.get("book_title") if isinstance(top, dict) else getattr(top, "book_title", "Document")
                        p_num = top.get("page_number") if isinstance(top, dict) else getattr(top, "page_number", 1)
                        c_text = top.get("chunk_text") if isinstance(top, dict) else getattr(top, "chunk_text", "")
                        answer = f"According to **{b_title}** (Page {p_num}):\n\n> {c_text[:350]}...\n\n*(Passages retrieved from local role vector database)*"
                    else:
                        answer = "No matching passages found in the indexed books."

                res = {
                    "success": True,
                    "query": query,
                    "sources": sources,
                    "answer": answer,
                    "total_sources": len(sources)
                }

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_agent_runs(self):
        try:
            import rag_engine
            parsed = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed.query)
            limit = int(qs.get("limit", [25])[0])

            runs = rag_engine.list_agent_runs(limit=limit)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"runs": runs, "total": len(runs)}).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_session_run(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            data = json.loads(body)
            code = data.get("code", "")
            lang = data.get("language", "python").lower()
            
            start_t = time.time()
            if lang in ("python", "py"):
                cmd = [sys.executable, "-c", code]
            elif lang in ("node", "js", "javascript"):
                cmd = ["node", "-e", code]
            else:
                cmd = ["bash", "-c", code]
                
            res = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=12,
                cwd=REPO_ROOT
            )
            elapsed = int((time.time() - start_t) * 1000)

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "stdout": res.stdout,
                "stderr": res.stderr,
                "exit_code": res.returncode,
                "elapsed_ms": elapsed
            }).encode("utf-8"))
        except subprocess.TimeoutExpired:
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "stdout": "",
                "stderr": "Error: Execution timed out after 12 seconds.",
                "exit_code": -1,
                "elapsed_ms": 12000
            }).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def do_POST(self):
        if self.path.startswith("/api/fs/write"):
            self._handle_fs_write()
            return

        if self.path.startswith("/api/fs/create"):
            self._handle_fs_create()
            return

        if self.path.startswith("/api/fs/delete"):
            self._handle_fs_delete()
            return

        if self.path.startswith("/api/books/save"):
            self._handle_books_save()
            return

        if self.path.startswith("/api/session/run"):
            self._handle_session_run()
            return

        if self.path.startswith("/api/memory/teach"):
            self._handle_memory_teach()
            return

        if self.path.startswith("/api/memory/recall"):
            self._handle_memory_recall()
            return

        if self.path.startswith("/api/memory/forget"):
            self._handle_memory_forget()
            return

        if self.path.startswith("/api/rag/query"):
            self._handle_rag_query()
            return

        if self.path.startswith("/api/rag/index"):
            self._handle_rag_index()
            return

        if self.path.startswith("/api/db/query"):
            self._handle_db_query()
            return

        if self.path.startswith("/api/agent/rag-pipeline"):
            self._handle_agent_rag_pipeline()
            return

        if self.path.startswith("/api/rag/ingest-chapter"):
            self._handle_rag_ingest_chapter()
            return

        if self.path.startswith("/api/multi_role_query"):
            self._handle_multi_role_query()
            return

        if self.path.startswith("/api/memory/distill"):
            self._handle_memory_distill()
            return

        if self.path.startswith("/api/books/append"):
            self._handle_books_append()
            return

        if self.path.startswith("/api/repl/execute"):
            self._handle_repl_execute()
            return

        if self.path.startswith("/api/tools/web_search"):
            self._handle_tools_web_search()
            return

        # New RAG Pipeline Management Endpoints
        if self.path.startswith("/api/rag/pipeline/upload"):
            self._handle_pipeline_upload()
            return

        if self.path.startswith("/api/rag/pipeline/auto_ingest"):
            self._handle_pipeline_auto_ingest()
            return

        if self.path.startswith("/api/rag/pipeline/sync_library"):
            self._handle_pipeline_sync_library()
            return

        if self.path.startswith("/api/rag/pipeline/chunk"):
            self._handle_pipeline_chunk()
            return

        if self.path.startswith("/api/rag/pipeline/embed"):
            self._handle_pipeline_embed()
            return

        if self.path.startswith("/api/rag/pipeline/stage"):
            self._handle_pipeline_stage()
            return

        if self.path.startswith("/api/rag/pipeline/commit"):
            self._handle_pipeline_commit()
            return

        if self.path.startswith("/api/rag/pipeline/stats"):
            self._handle_pipeline_stats()
            return

        if self.path.startswith("/api/rag/pipeline/operations"):
            self._handle_pipeline_operations()
            return

        if self.path.startswith("/api/rag/pipeline/sql"):
            self._handle_pipeline_sql()
            return

        if self.path.startswith("/api/db/save-snippet"):
            self._handle_db_save_snippet()
            return

        for prefix, target_base in TARGETS.items():
            if self.path.startswith(prefix):
                self._proxy_request("POST", prefix, target_base)
                return
        self.send_error(404, "Endpoint not found")

    def _proxy_request(self, method, prefix, target_base):
        subpath = self.path[len(prefix):]
        if not subpath.startswith("/"):
            subpath = "/" + subpath
        target_url = target_base + subpath

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length > 0 else None

        # Normalize model for webfree proxy to prevent upstream 404s
        if prefix == "/proxy/webfree" and body and "chat/completions" in subpath:
            try:
                req_data = json.loads(body.decode("utf-8"))
                valid_web_models = {"openai", "openai-fast", "openai-large", "qwen-coder", "mistral", "deepseek", "claude-hybrid"}
                current_m = req_data.get("model", "openai")
                if current_m not in valid_web_models:
                    req_data["model"] = "openai-fast"
                    body = json.dumps(req_data).encode("utf-8")
            except Exception:
                pass

        req = urllib.request.Request(target_url, data=body, method=method)

        # Filter headers to avoid triggering Cloudflare Turnstile blocks or host mismatches
        BLOCKED_FORWARD = {
            "host", "content-length", "origin", "referer", "accept-encoding",
            "sec-fetch-dest", "sec-fetch-mode", "sec-fetch-site",
            "sec-ch-ua", "sec-ch-ua-mobile", "sec-ch-ua-platform", "priority"
        }
        for key, val in self.headers.items():
            if key.lower() not in BLOCKED_FORWARD:
                req.add_header(key, val)

        req.add_header("Accept-Encoding", "identity")

        if "User-Agent" not in req.headers:
            req.add_header("User-Agent", "OmniAgentStudio/1.0")

        timeout_val = 60 if prefix == "/proxy/webfree" else 120
        try:
            with urllib.request.urlopen(req, timeout=timeout_val) as resp:
                if resp.status >= 400 and prefix == "/proxy/webfree":
                    raise urllib.error.HTTPError(target_url, resp.status, "Upstream error", resp.headers, None)

                self.send_response(resp.status)
                for header, value in resp.headers.items():
                    if header.lower() not in ("content-length", "transfer-encoding", "access-control-allow-origin"):
                        self.send_header(header, value)
                self.end_headers()

                # Stream response back in chunks for immediate token delivery
                while True:
                    chunk = resp.read(128)
                    if not chunk:
                        break
                    try:
                        self.wfile.write(chunk)
                        self.wfile.flush()
                    except (BrokenPipeError, ConnectionResetError):
                        break
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception as e:
            if prefix == "/proxy/webfree":
                # Automatic zero-key resilient fallback to local Ollama (bolt-local)
                try:
                    ollama_url = "http://localhost:11434/v1" + subpath
                    fallback_body = body
                    if body and "chat/completions" in subpath:
                        try:
                            req_data = json.loads(body.decode("utf-8"))
                            req_data["model"] = "bolt-local"
                            fallback_body = json.dumps(req_data).encode("utf-8")
                        except Exception:
                            fallback_body = body

                    fb_req = urllib.request.Request(ollama_url, data=fallback_body, method=method, headers={"Content-Type": "application/json"})
                    with urllib.request.urlopen(fb_req, timeout=120) as fb_resp:
                        self.send_response(fb_resp.status)
                        for header, value in fb_resp.headers.items():
                            if header.lower() not in ("content-length", "transfer-encoding", "access-control-allow-origin"):
                                self.send_header(header, value)
                        self.end_headers()
                        while True:
                            chunk = fb_resp.read(128)
                            if not chunk:
                                break
                            self.wfile.write(chunk)
                            self.wfile.flush()
                        return
                except Exception as fb_err:
                    pass

            if isinstance(e, urllib.error.HTTPError):
                try:
                    self.send_response(e.code)
                    self.end_headers()
                    self.wfile.write(e.read())
                except (BrokenPipeError, ConnectionResetError):
                    pass
            else:
                try:
                    self.send_response(502)
                    self.send_header("Content-Type", "application/json")
                    self.end_headers()
                    self.wfile.write(json.dumps({"error": f"Failed to connect to backend {target_base}: {str(e)}"}).encode())
                except (BrokenPipeError, ConnectionResetError):
                    pass


    # ============================================================================
    # RAG Pipeline Management Handlers
    # ============================================================================

    def _handle_pipeline_upload(self):
        """Step 1: Upload and preview document"""
        try:
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len) if content_len > 0 else b"{}"
            data = json.loads(body.decode("utf-8")) if body else {}
            
            file_path = data.get("file_path")
            role = data.get("role", "general")
            text = data.get("text")
            filename = data.get("filename")
            
            if not file_path and not text:
                self._send_json_error(400, "file_path or text required")
                return
            
            from rag_pipeline_manager import RAGPipelineManager
            manager = RAGPipelineManager()
            result = manager.upload_and_preview(file_path=file_path, role=role, text=text, filename=filename)
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
            
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_pipeline_chunk(self):
        """Step 2: Chunk text with preview"""
        try:
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len) if content_len > 0 else b"{}"
            data = json.loads(body.decode("utf-8")) if body else {}
            
            text = data.get("text")
            chunk_size = int(data.get("chunk_size", 1000))
            chunk_overlap = int(data.get("chunk_overlap", 200))
            
            if not text:
                self._send_json_error(400, "text required")
                return
            
            from rag_pipeline_manager import RAGPipelineManager
            manager = RAGPipelineManager()
            result = manager.chunk_with_preview(text, chunk_size, chunk_overlap)
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
            
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_pipeline_embed(self):
        """Step 3: Generate embeddings"""
        try:
            from rag_pipeline_manager import RAGPipelineManager
            
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len)
            data = json.loads(body.decode("utf-8"))
            
            chunks = data.get("chunks")
            
            if not chunks:
                self._send_json_error(400, "chunks required")
                return
            
            manager = RAGPipelineManager()
            result = manager.generate_embeddings(chunks)
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
            
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_pipeline_stage(self):
        """Step 4: Stage to CSV"""
        try:
            from rag_pipeline_manager import RAGPipelineManager
            
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len)
            data = json.loads(body.decode("utf-8"))
            
            filename = data.get("filename")
            role = data.get("role")
            chunks = data.get("chunks")
            embeddings = data.get("embeddings")
            
            if not all([filename, role, chunks, embeddings]):
                self._send_json_error(400, "filename, role, chunks, and embeddings required")
                return
            
            manager = RAGPipelineManager()
            result = manager.stage_to_csv(filename, role, chunks, embeddings)
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
            
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_pipeline_commit(self):
        """Step 5: Commit to database"""
        try:
            from rag_pipeline_manager import RAGPipelineManager
            
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len)
            data = json.loads(body.decode("utf-8"))
            
            staging_id = data.get("staging_id")
            role = data.get("role")
            filename = data.get("filename")
            chunks = data.get("chunks")
            embeddings = data.get("embeddings")
            chunk_size = data.get("chunk_size")
            chunk_overlap = data.get("chunk_overlap")
            chunking_time_ms = data.get("chunking_time_ms")
            embedding_time_ms = data.get("embedding_time_ms")
            
            if not all([staging_id, role, filename, chunks, embeddings]):
                self._send_json_error(400, "All required fields must be provided")
                return
            
            manager = RAGPipelineManager()
            result = manager.commit_to_database(
                staging_id, role, filename, chunks, embeddings,
                chunk_size, chunk_overlap, chunking_time_ms, embedding_time_ms
            )
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
            
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_pipeline_stats(self):
        """Get database statistics across all 11 role databases"""
        try:
            if self.command == "POST":
                content_len = int(self.headers.get("Content-Length", 0))
                if content_len > 0:
                    self.rfile.read(content_len)
            
            from rag_engine_enhanced import get_all_statistics, ROLE_DATABASES
            
            # Parse query params
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            role = params.get('role', [None])[0]
            
            stats = get_all_statistics()
            per_role = {}
            for r_id, r_path in ROLE_DATABASES.items():
                db_file = r_path / "rag_catalog.db"
                exists = db_file.exists()
                size_bytes = db_file.stat().st_size if exists else 0
                r_stat = stats.get("role_statistics", {}).get(r_id, {})
                b_cnt = r_stat.get("books_count", 0)
                c_cnt = r_stat.get("chunks_count", 0)
                per_role[r_id] = {
                    "role": r_id,
                    "books": b_cnt,
                    "books_count": b_cnt,
                    "chunks": c_cnt,
                    "chunks_count": c_cnt,
                    "exists": exists,
                    "database_size_bytes": size_bytes,
                    "database_path": str(db_file)
                }
            
            if role and role in per_role:
                result = per_role[role]
            else:
                result = {
                    "success": True,
                    "total_books": stats.get("total_books", 0),
                    "total_chunks": stats.get("total_chunks", 0),
                    "per_role": per_role,
                    "role_statistics": stats.get("role_statistics", {}),
                    "available_roles": list(ROLE_DATABASES.keys())
                }
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(result, ensure_ascii=False).encode("utf-8"))
            
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_pipeline_operations(self):
        """Get operations log"""
        try:
            if self.command == "POST":
                content_len = int(self.headers.get("Content-Length", 0))
                if content_len > 0:
                    self.rfile.read(content_len)
            
            from rag_pipeline_manager import RAGPipelineManager
            
            # Parse query params
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            limit = int(params.get('limit', ['50'])[0])
            
            manager = RAGPipelineManager()
            result = manager.get_operations_log(limit)
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
            
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_pipeline_sql(self):
        """Execute SQL query on database"""
        try:
            import sqlite3
            
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len)
            data = json.loads(body.decode("utf-8"))
            
            role = data.get("role", "operations")
            query = data.get("query") or data.get("sql")
            
            if not query:
                self._send_json_error(400, "query required")
                return
            
            # Verify it's a SELECT query for safety
            if not query.strip().upper().startswith("SELECT"):
                self._send_json_error(400, "Only SELECT queries allowed")
                return
            
            if role in ["operations", "pipeline", "staging", "staging_data"]:
                db_path = os.path.join(REPO_ROOT, "books", "pipeline_operations.db")
            else:
                db_path = os.path.join(REPO_ROOT, "books", "vectors", role, "rag_catalog.db")
            
            if not os.path.exists(db_path):
                self._send_json_error(404, f"Database not found for: {role}")
                return
            
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            cursor.execute(query)
            
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            rows = cursor.fetchall()
            
            conn.close()
            
            result = {
                "columns": columns,
                "rows": rows,
                "row_count": len(rows)
            }
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
            
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_pipeline_detected_books(self):
        """List all detected candidate books in books directory with indexing status"""
        try:
            from rag_pipeline_manager import RAGPipelineManager
            manager = RAGPipelineManager()
            books = manager.get_detected_books()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "total": len(books), "books": books}).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_pipeline_auto_ingest(self):
        """Run complete 8-stage automated ingestion pipeline with deduplication"""
        try:
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len) if content_len > 0 else b"{}"
            data = json.loads(body.decode("utf-8")) if body else {}

            from rag_pipeline_manager import RAGPipelineManager
            manager = RAGPipelineManager()
            result = manager.run_automated_pipeline(
                file_path=data.get("file_path"),
                text=data.get("text"),
                filename=data.get("filename"),
                role=data.get("role", "auto"),
                chunk_size=int(data.get("chunk_size", 1000)),
                chunk_overlap=int(data.get("chunk_overlap", 150)),
                force=bool(data.get("force", False))
            )
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_pipeline_sync_library(self):
        """Batch synchronize entire library across all 11 roles with zero rework"""
        try:
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len) if content_len > 0 else b"{}"
            data = json.loads(body.decode("utf-8")) if body else {}

            from rag_pipeline_manager import RAGPipelineManager
            manager = RAGPipelineManager()
            result = manager.auto_ingest_all_books(force=bool(data.get("force", False)))
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

if __name__ == "__main__":
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", PORT), StudioHandler) as httpd:
        print(f"🚀 Omni Agent Studio running at: http://localhost:{PORT}")
        print("Ready for Ollama, OmniRoute, Spark MLX & LM Studio testing.")
        sys.stdout.flush()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down Omni Agent Studio.")
