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

        if self.path.startswith("/api/prompts/catalog"):
            self._handle_prompts_catalog()
            return

        if self.path.startswith("/api/prompts/content"):
            self._handle_prompt_content()
            return

        if self.path.startswith("/api/tools/arsenal"):
            self._handle_tools_arsenal()
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

    def _handle_memory_teach(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            import on_device_memory
            data = json.loads(body)
            label = (data.get("label") or "").strip()
            details = (data.get("details") or data.get("transcript") or "").strip()
            category = (data.get("category") or "gear").strip()
            where_loc = (data.get("where") or data.get("where_loc") or "Workspace").strip()
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
            query = (data.get("query") or data.get("prompt") or data.get("text") or "").strip()
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
            lang = data.get("lang", "python").lower()
            t0 = time.perf_counter()

            if lang in ["python", "py"]:
                res = subprocess.run([sys.executable, "-c", code], capture_output=True, text=True, timeout=12)
                elapsed = round((time.perf_counter() - t0) * 1000, 2)
                self._send_json(200, {
                    "stdout": res.stdout,
                    "stderr": res.stderr,
                    "exit_code": res.returncode,
                    "latency_ms": elapsed
                })
            elif lang in ["javascript", "js", "node"]:
                res = subprocess.run(["node", "-e", code], capture_output=True, text=True, timeout=12)
                elapsed = round((time.perf_counter() - t0) * 1000, 2)
                self._send_json(200, {
                    "stdout": res.stdout,
                    "stderr": res.stderr,
                    "exit_code": res.returncode,
                    "latency_ms": elapsed
                })
            elif lang in ["bash", "sh", "shell"]:
                res = subprocess.run(["bash", "-c", code], capture_output=True, text=True, timeout=12)
                elapsed = round((time.perf_counter() - t0) * 1000, 2)
                self._send_json(200, {
                    "stdout": res.stdout,
                    "stderr": res.stderr,
                    "exit_code": res.returncode,
                    "latency_ms": elapsed
                })
            else:
                self._send_json_error(400, f"Unsupported language: {lang}")
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
            import rag_engine
            books = rag_engine.list_indexed_books()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(books).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_rag_page(self):
        try:
            import rag_engine
            parsed = urllib.parse.urlparse(self.path)
            qs = urllib.parse.parse_qs(parsed.query)
            book_id = qs.get("book_id", [None])[0]
            page_num = int(qs.get("page", [1])[0])

            if not book_id:
                self._send_json_error(400, "Missing book_id")
                return

            with rag_engine.get_db() as conn:
                cursor = conn.execute("""
                    SELECT chunk_text, chapter_title
                    FROM rag_chunks
                    WHERE book_id = ? AND page_number = ?
                    ORDER BY chunk_index ASC
                """, (book_id, page_num))
                rows = cursor.fetchall()

            if not rows:
                self._send_json_error(404, "Page not found")
                return

            page_text = "\n\n".join(r["chunk_text"] for r in rows)
            chapter_title = rows[0]["chapter_title"] if rows else ""

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "book_id": book_id,
                "page_number": page_num,
                "chapter_title": chapter_title,
                "text": page_text
            }).encode("utf-8"))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_rag_query(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            import rag_engine
            data = json.loads(body)
            query = data.get("query", "").strip()
            book_id = data.get("book_id", None)
            top_k = int(data.get("top_k", 4))

            if not query:
                self._send_json_error(400, "Query is required")
                return

            hits = rag_engine.query_rag(query, book_id=book_id, top_k=top_k)

            # Synthesize answer using retrieved context
            context_blocks = []
            for h in hits:
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
                if hits:
                    top = hits[0]
                    answer = f"According to **{top['book_title']}** (Page {top['page_number']}):\n\n> {top['chunk_text'][:350]}...\n\n*(Citations retrieved from local vector database)*"
                else:
                    answer = "No matching passages found in the indexed books."

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps({
                "query": query,
                "answer": answer,
                "citations": hits
            }).encode("utf-8"))
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
            import rag_engine
            telemetry = rag_engine.get_db_telemetry()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(telemetry).encode("utf-8"))
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

            data = rag_engine.get_table_data(table, limit=limit, offset=offset, search=search)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode("utf-8"))
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
            import rag_engine
            req_data = json.loads(body)
            sql = req_data.get("sql", "").strip()
            max_rows = int(req_data.get("max_rows", 100))
            if not sql:
                self._send_json_error(400, "SQL query cannot be empty")
                return

            res = rag_engine.execute_readonly_sql(sql, max_rows=max_rows)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(res).encode("utf-8"))
        except PermissionError as pe:
            self._send_json_error(403, str(pe))
        except Exception as e:
            self._send_json_error(500, str(e))

    def _handle_agent_rag_pipeline(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_len).decode("utf-8")
        try:
            import rag_engine
            req_data = json.loads(body)
            query = req_data.get("query", "").strip()
            book_id = req_data.get("book_id", None)
            top_k = int(req_data.get("top_k", 4))

            if not query:
                self._send_json_error(400, "Query cannot be empty")
                return

            res = rag_engine.run_agentic_rag_pipeline(query, book_id=book_id, top_k=top_k)
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(res).encode("utf-8"))
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

        if self.path.startswith("/api/memory/distill"):
            self._handle_memory_distill()
            return

        if self.path.startswith("/api/books/append"):
            self._handle_books_append()
            return

        if self.path.startswith("/api/repl/execute"):
            self._handle_repl_execute()
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
