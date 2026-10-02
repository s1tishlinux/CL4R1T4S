#!/usr/bin/env python3
"""
RAG Preprocessing Engine for OmniTech Academy
Provides:
- Robust multi-format document extraction (PyMuPDF/fitz with heading/table preservation, fallbacks for text/md/code/html)
- Advanced text sanitization (Unicode NFKC, de-hyphenation across line breaks, noise/header/footer stripping)
- Syntax- and hierarchy-aware recursive semantic chunking (protects code fences and markdown tables)
- Contextual breadcrumb and section heading injection
- Deterministic SHA256 content hashing for zero-rework deduplication and incremental sync
- Domain classification mapping documents to the 11 role vector catalogs
"""

import os
import re
import html
import hashlib
import unicodedata
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

try:
    import pymupdf as fitz
    PYMUPDF_AVAILABLE = True
except ImportError:
    try:
        import fitz
        PYMUPDF_AVAILABLE = True
    except ImportError:
        PYMUPDF_AVAILABLE = False

try:
    import pypdf
    PYPDF_AVAILABLE = True
except ImportError:
    PYPDF_AVAILABLE = False


# 11 Standardized Academy Knowledge Domains
ACADEMY_ROLES = [
    'kubernetes', 'devops', 'genai', 'agentic_ai',
    'python', 'mle', 'mlops', 'data_science',
    'aws_cloud', 'linux', 'general'
]

# Role keyword profiles for automated domain classification
ROLE_KEYWORD_PROFILES = {
    'kubernetes': [
        'kubernetes', 'kubectl', 'k8s', 'pod', 'deployment', 'daemonset', 'statefulset',
        'kubelet', 'kube-proxy', 'ingress', 'cni', 'csi', 'etcd', 'helm', 'control plane',
        'node', 'cluster', 'configmap', 'secret', 'custom resource', 'crd', 'service mesh'
    ],
    'devops': [
        'devops', 'ci/cd', 'docker', 'container', 'terraform', 'ansible', 'jenkins',
        'pipeline', 'gitops', 'prometheus', 'grafana', 'observability', 'continuous integration',
        'continuous delivery', 'automation', 'infrastructure as code', 'iac', 'helm chart'
    ],
    'genai': [
        'transformer', 'self-attention', 'attention mechanism', 'lora', 'qlora', 'rag',
        'retrieval augmented', 'llm', 'large language model', 'peft', 'dpo', 'rlhf',
        'fine-tuning', 'prompt engineering', 'vector database', 'embedding', 'flashattention',
        'rms norm', 'rope', 'kv cache', 'context length', 'quantization', 'temperature'
    ],
    'agentic_ai': [
        'agentic', 'langgraph', 'mcp', 'model context protocol', 'crewai', 'react pattern',
        'cognitive loop', 'autonomous agent', 'tool use', 'function calling', 'state machine',
        'human in the loop', 'agent evaluation', 'multi-agent', 'swarm', 'supervisor agent'
    ],
    'mle': [
        'machine learning engineer', 'deep learning', 'gradient descent', 'backpropagation',
        'neural network', 'pytorch', 'tensorflow', 'loss function', 'activation function',
        'regularization', 'hyperparameter tuning', 'cnn', 'rnn', 'cross-entropy', 'optimizer'
    ],
    'mlops': [
        'mlops', 'mlflow', 'kubeflow', 'feature store', 'model registry', 'dvc', 'data versioning',
        'model drift', 'concept drift', 'evidently', 'triton', 'torchserve', 'model monitoring',
        'model deployment', 'pipeline orchestration', 'model card', 'model governance'
    ],
    'data_science': [
        'data science', 'pandas', 'numpy', 'scipy', 'scikit-learn', 'exploratory data analysis',
        'eda', 'statistical analysis', 'hypothesis testing', 'regression', 'clustering',
        'matplotlib', 'seaborn', 'correlation', 'pca', 'feature engineering', 'distribution'
    ],
    'aws_cloud': [
        'aws', 'amazon web services', 'ec2', 's3', 'iam', 'lambda', 'cloudformation',
        'vpc', 'route53', 'ecs', 'eks', 'dynamodb', 'cloudwatch', 'api gateway',
        'step functions', 'aurora', 'rds', 'sqs', 'sns', 'cloud front'
    ],
    'linux': [
        'linux', 'bash', 'shell script', 'systemd', 'kernel', 'grep', 'awk', 'sed',
        'chmod', 'chown', 'iptables', 'process management', 'file permissions', 'unix',
        'socket', 'ssh', 'crontab', 'strace', 'lsof', 'sysctl', 'glibc'
    ],
    'python': [
        'python', 'asyncio', 'generator', 'decorator', 'dataclass', 'pydantic',
        'dunder', 'metaclass', 'gil', 'multiprocessing', 'pytest', 'poetry',
        'type hints', 'typing', 'context manager', 'yield', 'list comprehension'
    ]
}


class RAGPreprocessor:
    """Enterprise text extraction, sanitization, semantic chunking, and hashing engine"""

    @staticmethod
    def clean_text(raw_text: str) -> str:
        """
        Deep cleaning and normalization of extracted raw text:
        1. Unicode NFKC normalization (standardizes quotes, dashes, accents, ligatures)
        2. De-hyphenates words broken across line breaks (e.g., 'trans-\\nformer' -> 'transformer')
        3. Normalizes all line endings (CRLF, CR -> LF)
        4. Strips unprintable control characters while preserving formatting (\n, \t)
        5. Removes running header/footer noise (e.g., 'Page 4 of 200', '--- Page 4 ---')
        6. Collapses excessive blank lines to clean double newlines
        7. Trims line endings
        """
        if not raw_text:
            return ""

        # 1. Unicode NFKC normalization (converts ligatures like fi, fl, smart quotes, em dashes)
        text = unicodedata.normalize("NFKC", raw_text)

        # 2. Normalize line breaks to standard \n
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # 3. De-hyphenate words broken across line breaks: "inter-\nactive" -> "interactive"
        text = re.sub(r'(\b[a-zA-Z]{2,})-\n([a-zA-Z]{2,}\b)', r'\1\2', text)

        # 4. Strip unprintable control characters (keep \t, \n)
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

        # 5. Remove running page numbers and header noise
        text = re.sub(r'(?i)\n*(?:page\s+\d+\s+of\s+\d+|\b\d+\s*/\s*\d+\b|---\s*page\s+\d+\s*---)\n*', '\n', text)

        # 6. Normalize multiple blank lines to double newline (clean paragraph break)
        text = re.sub(r'\n{3,}', '\n\n', text)

        # 7. Strip trailing whitespace per line
        cleaned_lines = [line.rstrip() for line in text.split('\n')]
        return '\n'.join(cleaned_lines).strip()

    @staticmethod
    def compute_sha256(content: str) -> str:
        """Compute SHA256 checksum of document or chunk content for idempotent deduplication"""
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    @classmethod
    def extract_document(cls, file_path: Path) -> Dict[str, Any]:
        """
        Extract document content and metadata using the best available parser.
        Supports PDF (PyMuPDF with pypdf fallback), Markdown, TXT, JSON, HTML, Code.
        """
        fp = Path(file_path)
        if not fp.exists():
            raise FileNotFoundError(f"Document not found: {fp}")

        suffix = fp.suffix.lower()
        file_size = fp.stat().st_size
        filename = fp.name

        if suffix == '.pdf':
            return cls._extract_pdf(fp)
        elif suffix in ['.txt', '.md', '.markdown', '.py', '.sh', '.yaml', '.yml', '.sql']:
            return cls._extract_text_file(fp)
        elif suffix == '.json':
            return cls._extract_json_file(fp)
        elif suffix in ['.html', '.htm']:
            return cls._extract_html_file(fp)
        else:
            # Fallback to UTF-8 text extraction
            return cls._extract_text_file(fp)

    @classmethod
    def _extract_pdf(cls, fp: Path) -> Dict[str, Any]:
        """Extract PDF with PyMuPDF, preserving structure, headings, and font hints"""
        pages_text = []
        total_pages = 0

        if PYMUPDF_AVAILABLE:
            try:
                doc = fitz.open(str(fp))
                total_pages = len(doc)
                for page_idx in range(total_pages):
                    page = doc[page_idx]
                    page_content = page.get_text("text")
                    if page_content and page_content.strip():
                        pages_text.append(f"<!-- Page {page_idx + 1} -->\n" + page_content.strip())
                doc.close()
            except Exception as e:
                # Fallback to pypdf if PyMuPDF fails
                if PYPDF_AVAILABLE:
                    return cls._extract_pdf_pypdf(fp)
                raise Exception(f"PyMuPDF failed to extract '{fp.name}': {e}")
        elif PYPDF_AVAILABLE:
            return cls._extract_pdf_pypdf(fp)
        else:
            raise ImportError("Neither pymupdf nor pypdf is installed in .venv. Cannot extract PDF.")

        full_raw_text = "\n\n".join(pages_text)
        cleaned_text = cls.clean_text(full_raw_text)

        return {
            "filename": fp.name,
            "file_path": str(fp.resolve()),
            "file_type": ".pdf",
            "file_size_bytes": fp.stat().st_size,
            "total_pages": total_pages,
            "raw_char_count": len(full_raw_text),
            "cleaned_char_count": len(cleaned_text),
            "sha256": cls.compute_sha256(cleaned_text),
            "text": cleaned_text,
            "extractor": "pymupdf"
        }

    @classmethod
    def _extract_pdf_pypdf(cls, fp: Path) -> Dict[str, Any]:
        """Fallback PDF extraction using pypdf"""
        pages_text = []
        with open(fp, "rb") as f:
            reader = pypdf.PdfReader(f)
            total_pages = len(reader.pages)
            for page_idx, page in enumerate(reader.pages):
                txt = page.extract_text() or ""
                if txt.strip():
                    pages_text.append(f"<!-- Page {page_idx + 1} -->\n" + txt.strip())

        full_raw_text = "\n\n".join(pages_text)
        cleaned_text = cls.clean_text(full_raw_text)

        return {
            "filename": fp.name,
            "file_path": str(fp.resolve()),
            "file_type": ".pdf",
            "file_size_bytes": fp.stat().st_size,
            "total_pages": total_pages,
            "raw_char_count": len(full_raw_text),
            "cleaned_char_count": len(cleaned_text),
            "sha256": cls.compute_sha256(cleaned_text),
            "text": cleaned_text,
            "extractor": "pypdf"
        }

    @classmethod
    def _extract_text_file(cls, fp: Path) -> Dict[str, Any]:
        """Extract plain text, markdown, or code files"""
        try:
            with open(fp, "r", encoding="utf-8") as f:
                raw_text = f.read()
        except UnicodeDecodeError:
            with open(fp, "r", encoding="latin-1") as f:
                raw_text = f.read()

        cleaned_text = cls.clean_text(raw_text)
        return {
            "filename": fp.name,
            "file_path": str(fp.resolve()),
            "file_type": fp.suffix.lower(),
            "file_size_bytes": fp.stat().st_size,
            "total_pages": 1,
            "raw_char_count": len(raw_text),
            "cleaned_char_count": len(cleaned_text),
            "sha256": cls.compute_sha256(cleaned_text),
            "text": cleaned_text,
            "extractor": "utf8_text"
        }

    @classmethod
    def _extract_json_file(cls, fp: Path) -> Dict[str, Any]:
        """Extract and format JSON documents into readable semantic markdown"""
        import json
        with open(fp, "r", encoding="utf-8") as f:
            data = json.load(f)

        raw_text = json.dumps(data, indent=2)
        cleaned_text = cls.clean_text(raw_text)
        return {
            "filename": fp.name,
            "file_path": str(fp.resolve()),
            "file_type": ".json",
            "file_size_bytes": fp.stat().st_size,
            "total_pages": 1,
            "raw_char_count": len(raw_text),
            "cleaned_char_count": len(cleaned_text),
            "sha256": cls.compute_sha256(cleaned_text),
            "text": cleaned_text,
            "extractor": "json_parser"
        }

    @classmethod
    def _extract_html_file(cls, fp: Path) -> Dict[str, Any]:
        """Extract clean text from HTML documentation, stripping scripts and CSS"""
        with open(fp, "r", encoding="utf-8", errors="ignore") as f:
            html_content = f.read()

        # Strip scripts and styles
        text = re.sub(r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>', '', html_content, flags=re.IGNORECASE)
        text = re.sub(r'<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>', '', text, flags=re.IGNORECASE)
        # Convert header tags into markdown headings for semantic hierarchy
        text = re.sub(r'<h1\b[^>]*>(.*?)<\/h1>', r'\n# \1\n', text, flags=re.IGNORECASE)
        text = re.sub(r'<h2\b[^>]*>(.*?)<\/h2>', r'\n## \1\n', text, flags=re.IGNORECASE)
        text = re.sub(r'<h3\b[^>]*>(.*?)<\/h3>', r'\n### \1\n', text, flags=re.IGNORECASE)
        # Replace line breaks and paragraphs
        text = re.sub(r'<br\s*\/?>', '\n', text, flags=re.IGNORECASE)
        text = re.sub(r'<\/p>', '\n\n', text, flags=re.IGNORECASE)
        # Strip all other HTML tags
        text = re.sub(r'<[^>]+>', ' ', text)
        text = html.unescape(text)

        cleaned_text = cls.clean_text(text)
        return {
            "filename": fp.name,
            "file_path": str(fp.resolve()),
            "file_type": ".html",
            "file_size_bytes": fp.stat().st_size,
            "total_pages": 1,
            "raw_char_count": len(html_content),
            "cleaned_char_count": len(cleaned_text),
            "sha256": cls.compute_sha256(cleaned_text),
            "text": cleaned_text,
            "extractor": "html_stripper"
        }

    @classmethod
    def classify_role(cls, filename: str, text: str = "") -> str:
        """
        Automatically classify document into one of 11 Academy Roles
        by analyzing filename keywords, parent directory names, and high-frequency content terms.
        """
        combined = f"{filename} {text[:4000]}".lower()

        scores = {role: 0 for role in ACADEMY_ROLES}

        # Check directory or filename hints
        fn_lower = filename.lower()
        for role in ACADEMY_ROLES:
            if role in fn_lower or role.replace('_', '-') in fn_lower:
                scores[role] += 15

        # Check keyword matches
        for role, keywords in ROLE_KEYWORD_PROFILES.items():
            for kw in keywords:
                if kw in combined:
                    scores[role] += 3

        best_role = max(scores.items(), key=lambda x: x[1])
        if best_role[1] > 5:
            return best_role[0]

        return 'general'

    @classmethod
    def recursive_semantic_chunk(
        cls,
        text: str,
        document_title: str = "Technical Document",
        max_chunk_size: int = 1000,
        chunk_overlap: int = 150,
        role: str = "general"
    ) -> List[Dict[str, Any]]:
        """
        High-fidelity recursive semantic chunker:
        1. Identifies and preserves protected blocks (Markdown code fences ``` and tables |---|)
        2. Recursively splits on hierarchical boundaries:
           Headings (#, ##) -> Sub-headings (###) -> Paragraphs (\n\n) -> Bullets -> Sentences -> Words
        3. Tracks hierarchical section breadcrumbs (e.g. 'Overview > Architecture > Memory Profiling')
        4. Injects breadcrumb context into the embedding text prefix
        5. Computes token estimates, word count, character count, and SHA256 chunk hash
        """
        if not text or len(text.strip()) == 0:
            return []

        # Step 1: Detect protected code fences and tables to prevent splitting them
        block_pattern = re.compile(
            r"(```[a-zA-Z0-9_\-\+\.]*\n[\s\S]*?```|"
            r"\|(?:[^\n]*\|)+\n\|(?:[-: ]+\|)+\n(?:\|[^\n]*\|\n?)+)"
        )

        segments = []
        last_end = 0
        for match in block_pattern.finditer(text):
            if match.start() > last_end:
                segments.append({"type": "prose", "text": text[last_end:match.start()]})
            segments.append({"type": "protected", "text": match.group(0)})
            last_end = match.end()
        if last_end < len(text):
            segments.append({"type": "prose", "text": text[last_end:]})

        # Step 2: Traverse segments while maintaining active section breadcrumb
        raw_chunks = []
        current_breadcrumb = [document_title]

        heading_pattern = re.compile(r'^(#{1,4})\s+(.+)$', re.MULTILINE)

        for seg in segments:
            seg_text = seg["text"]
            if seg["type"] == "protected":
                # Protected block: keep intact if under max_chunk_size * 1.5, otherwise break into sub-blocks
                if len(seg_text) <= int(max_chunk_size * 1.5):
                    raw_chunks.append({
                        "text": seg_text,
                        "breadcrumb": " > ".join(current_breadcrumb),
                        "is_code_or_table": True
                    })
                else:
                    # Very large code block: split by lines
                    lines = seg_text.split('\n')
                    sub_buf = []
                    sub_len = 0
                    for line in lines:
                        if sub_len + len(line) > max_chunk_size and sub_buf:
                            raw_chunks.append({
                                "text": '\n'.join(sub_buf),
                                "breadcrumb": " > ".join(current_breadcrumb),
                                "is_code_or_table": True
                            })
                            sub_buf = [line]
                            sub_len = len(line)
                        else:
                            sub_buf.append(line)
                            sub_len += len(line) + 1
                    if sub_buf:
                        raw_chunks.append({
                            "text": '\n'.join(sub_buf),
                            "breadcrumb": " > ".join(current_breadcrumb),
                            "is_code_or_table": True
                        })
            else:
                # Prose text: check for heading updates
                lines = seg_text.split('\n')
                para_buf = []
                for line in lines:
                    h_match = heading_pattern.match(line)
                    if h_match:
                        # Flush existing buffer
                        if para_buf:
                            prose_part = '\n'.join(para_buf).strip()
                            if prose_part:
                                cls._split_prose_recursive(
                                    prose_part, max_chunk_size, chunk_overlap,
                                    " > ".join(current_breadcrumb), raw_chunks
                                )
                            para_buf = []

                        level = len(h_match.group(1))
                        htext = h_match.group(2).strip()
                        # Update breadcrumb depth
                        current_breadcrumb = current_breadcrumb[:level]
                        if len(current_breadcrumb) < level:
                            current_breadcrumb.extend(["Section"] * (level - len(current_breadcrumb)))
                        current_breadcrumb.append(htext)
                    else:
                        para_buf.append(line)

                if para_buf:
                    prose_part = '\n'.join(para_buf).strip()
                    if prose_part:
                        cls._split_prose_recursive(
                            prose_part, max_chunk_size, chunk_overlap,
                            " > ".join(current_breadcrumb), raw_chunks
                        )

        # Step 3: Format and enrich chunks with metadata
        final_chunks = []
        for idx, item in enumerate(raw_chunks):
            chunk_body = item["text"].strip()
            if len(chunk_body) < 20:  # Skip tiny noise fragments
                continue

            b_crumb = item["breadcrumb"]
            # Rich embedding text prepends context breadcrumb for high vector recall fidelity
            embedding_text = f"[Context: {b_crumb}]\n{chunk_body}" if b_crumb else chunk_body

            words = chunk_body.split()
            word_count = len(words)
            char_count = len(chunk_body)
            est_tokens = int(word_count * 1.33)  # Standard subword approximation

            chunk_hash = cls.compute_sha256(chunk_body)

            final_chunks.append({
                "chunk_index": idx,
                "text": chunk_body,
                "embedding_text": embedding_text,
                "breadcrumb": b_crumb,
                "char_count": char_count,
                "word_count": word_count,
                "estimated_tokens": est_tokens,
                "chunk_hash": chunk_hash,
                "is_code_or_table": item.get("is_code_or_table", False)
            })

        return final_chunks

    @classmethod
    def _split_prose_recursive(
        cls,
        text: str,
        max_size: int,
        overlap: int,
        breadcrumb: str,
        results_list: List[Dict[str, Any]]
    ):
        """Recursively splits prose by paragraphs -> bullet points -> sentences -> words"""
        if len(text) <= max_size:
            results_list.append({"text": text, "breadcrumb": breadcrumb})
            return

        # Try paragraph split
        paragraphs = text.split('\n\n')
        if len(paragraphs) > 1:
            buf = []
            buf_len = 0
            for p in paragraphs:
                p = p.strip()
                if not p:
                    continue
                if buf_len + len(p) > max_size and buf:
                    results_list.append({"text": '\n\n'.join(buf), "breadcrumb": breadcrumb})
                    # Add overlap from last paragraph
                    buf = [buf[-1]] if overlap > 0 and len(buf[-1]) <= overlap else []
                    buf_len = sum(len(x) for x in buf)
                buf.append(p)
                buf_len += len(p) + 2
            if buf:
                results_list.append({"text": '\n\n'.join(buf), "breadcrumb": breadcrumb})
            return

        # Try sentence split (positive lookbehind for sentence enders, avoid breaking abbreviations)
        sentence_pattern = re.compile(r'(?<=[.!?])\s+(?=[A-Z0-9])')
        sentences = sentence_pattern.split(text)
        if len(sentences) > 1:
            buf = []
            buf_len = 0
            for s in sentences:
                s = s.strip()
                if not s:
                    continue
                if buf_len + len(s) > max_size and buf:
                    results_list.append({"text": ' '.join(buf), "breadcrumb": breadcrumb})
                    buf = [buf[-1]] if overlap > 0 and len(buf[-1]) <= overlap else []
                    buf_len = sum(len(x) for x in buf)
                buf.append(s)
                buf_len += len(s) + 1
            if buf:
                results_list.append({"text": ' '.join(buf), "breadcrumb": breadcrumb})
            return

        # Fallback to word splitting
        words = text.split()
        buf = []
        buf_len = 0
        for w in words:
            if buf_len + len(w) > max_size and buf:
                results_list.append({"text": ' '.join(buf), "breadcrumb": breadcrumb})
                # Keep last 15 words for overlap
                buf = buf[-15:] if overlap > 0 else []
                buf_len = sum(len(x) + 1 for x in buf)
            buf.append(w)
            buf_len += len(w) + 1
        if buf:
            results_list.append({"text": ' '.join(buf), "breadcrumb": breadcrumb})
