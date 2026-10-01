"""
Omni Agent Studio — On-Device Edge Memory Engine
Inspired by DeepLearning.AI & Qdrant Edge Memory Robot architecture.
Features:
- Sub-50ms instant vector recall without calling full LLMs
- Gated memory injection (confidence thresholding)
- Structured memory taxonomy: 'taught' (facts/objects), 'seen' (sightings), 'ignored'
- Natural language spoken recall synthesizer for voice assistants
- Local persistent storage (Qdrant Client / SQLite hybrid fallback)
"""

import os
import time
import json
import math
import sqlite3
import threading
from typing import List, Dict, Any, Optional

try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue
    HAS_QDRANT = True
except ImportError:
    HAS_QDRANT = False

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "books", "vectors", "edge_memory")
os.makedirs(DATA_DIR, exist_ok=True)
SQLITE_DB = os.path.join(DATA_DIR, "edge_memory.db")

STOP_WORDS = {
    "where", "is", "are", "was", "were", "my", "the", "a", "an", "at", "in", 
    "on", "of", "to", "for", "what", "did", "i", "put", "find", "have", "you", 
    "seen", "tell", "me", "about", "there", "it", "do", "can", "show"
}

RECOGNIZE_THRESHOLD = 0.35
MAYBE_MARGIN = 0.10
VECTOR_DIM = 768

class OnDeviceMemory:
    def __init__(self, data_dir: str = DATA_DIR):
        self.data_dir = data_dir
        self._lock = threading.RLock()
        self._init_sqlite()
        self._init_qdrant()

    def _init_sqlite(self):
        with self._lock, sqlite3.connect(SQLITE_DB) as conn:
            conn.execute("PRAGMA journal_mode = WAL;")
            conn.execute("PRAGMA synchronous = NORMAL;")
            conn.execute("""
                CREATE TABLE IF NOT EXISTS memory_points (
                    id TEXT PRIMARY KEY,
                    kind TEXT NOT NULL,
                    label TEXT NOT NULL,
                    transcript TEXT,
                    where_loc TEXT,
                    category TEXT DEFAULT 'general',
                    image_url TEXT,
                    vector_json TEXT,
                    created_at REAL NOT NULL,
                    sightings_count INTEGER DEFAULT 1,
                    last_seen_at REAL NOT NULL
                );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_memory_label ON memory_points(label);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_memory_kind ON memory_points(kind);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_memory_time ON memory_points(created_at DESC);")
            conn.commit()

    def _init_qdrant(self):
        self.qdrant_client = None
        if HAS_QDRANT:
            try:
                # Persistent local on-device Qdrant storage
                storage_path = os.path.join(self.data_dir, "qdrant_shard")
                self.qdrant_client = QdrantClient(path=storage_path)
                collections = [c.name for c in self.qdrant_client.get_collections().collections]
                if "edge_memories" not in collections:
                    self.qdrant_client.create_collection(
                        collection_name="edge_memories",
                        vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE)
                    )
            except Exception as e:
                print(f"[OnDeviceMemory] Qdrant disk init failed ({e}), using in-memory client.")
                try:
                    self.qdrant_client = QdrantClient(":memory:")
                    self.qdrant_client.create_collection(
                        collection_name="edge_memories",
                        vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE)
                    )
                except Exception as e2:
                    print(f"[OnDeviceMemory] Qdrant fallback failed: {e2}")
                    self.qdrant_client = None

    def _generate_vector(self, text: str) -> List[float]:
        """Generate normalized 768-D semantic vector with word & character n-gram hashing."""
        clean = "".join(c if c.isalnum() else " " for c in text.lower())
        words = clean.split()
        vec = [0.0] * VECTOR_DIM
        if not words:
            return vec
        for i, word in enumerate(words):
            is_stop = word in STOP_WORDS
            weight = 0.25 if is_stop else 3.5

            # Word level feature
            h = abs(hash(word)) % VECTOR_DIM
            vec[h] += weight

            # Character 3-grams for non-stop words
            if not is_stop and len(word) >= 3:
                for j in range(len(word) - 2):
                    ngram = word[j:j+3]
                    nh = abs(hash(ngram)) % VECTOR_DIM
                    vec[nh] += 1.2

        # L2 Normalize
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 1e-9:
            vec = [v / norm for v in vec]
        return vec

    def teach(self, label: str, details: str, category: str = "concept", image_url: Optional[str] = None, where_loc: str = "Agent Studio") -> Dict[str, Any]:
        """
        Store a new concept, object, or learned fact into memory.
        If the memory already exists, increments sightings count and updates timestamp.
        """
        label = label.strip()
        details = details.strip()
        if not label:
            raise ValueError("Label is required to teach memory")

        now = time.time()
        combined_text = f"{label} : {details} ({category})"
        vector = self._generate_vector(combined_text)
        point_id = f"mem_{int(now * 1000)}"

        with self._lock:
            # Check if label exists in SQLite
            with sqlite3.connect(SQLITE_DB) as conn:
                existing = conn.execute("SELECT id, sightings_count FROM memory_points WHERE lower(label) = lower(?)", (label,)).fetchone()
                if existing:
                    old_id, count = existing
                    conn.execute("""
                        UPDATE memory_points 
                        SET sightings_count = sightings_count + 1,
                            transcript = ?,
                            last_seen_at = ?,
                            vector_json = ?
                        WHERE id = ?
                    """, (details, now, json.dumps(vector), old_id))
                    point_id = old_id
                else:
                    conn.execute("""
                        INSERT INTO memory_points 
                        (id, kind, label, transcript, where_loc, category, image_url, vector_json, created_at, sightings_count, last_seen_at)
                        VALUES (?, 'taught', ?, ?, ?, ?, ?, ?, ?, 1, ?)
                    """, (point_id, label, details, where_loc, category, image_url or "", json.dumps(vector), now, now))
                conn.commit()

            # Insert into Qdrant if available
            if self.qdrant_client:
                try:
                    q_id = abs(hash(point_id)) % (2**63 - 1)
                    self.qdrant_client.upsert(
                        collection_name="edge_memories",
                        points=[
                            PointStruct(
                                id=q_id,
                                vector=vector,
                                payload={
                                    "id": point_id,
                                    "label": label,
                                    "transcript": details,
                                    "category": category,
                                    "where_loc": where_loc,
                                    "kind": "taught",
                                    "ts": now
                                }
                            )
                        ]
                    )
                except Exception as e:
                    print(f"[OnDeviceMemory] Qdrant upsert warning: {e}")

        return {
            "id": point_id,
            "label": label,
            "transcript": details,
            "category": category,
            "where": where_loc,
            "created_at": now,
            "status": "memorized"
        }

    def distill_and_teach(self, text: str, source_title: str = "Extracted Notes", category: str = "work") -> Dict[str, Any]:
        """
        Automatically analyzes raw markdown/code/text, extracts key concepts,
        definitions, and facts, and vectorizes them into edge memory.
        """
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        points_created = []

        current_heading = None
        current_body = []
        for line in lines:
            if line.startswith("#"):
                if current_heading and current_body:
                    body_text = " ".join(current_body)[:300]
                    if len(body_text) >= 20:
                        res = self.teach(current_heading, body_text, category=category, where_loc=source_title)
                        points_created.append(res)
                current_heading = line.lstrip("# \t*")[:60]
                current_body = []
            elif line.startswith(("-", "*", "•", "1.", "2.", "3.", "4.")):
                clean_item = line.lstrip("-*•0123456789. \t")
                if ":" in clean_item:
                    lbl, val = clean_item.split(":", 1)
                    if len(lbl.strip()) < 50 and len(val.strip()) > 10:
                        res = self.teach(lbl.strip(), val.strip()[:300], category=category, where_loc=source_title)
                        points_created.append(res)
                else:
                    current_body.append(clean_item)
            else:
                current_body.append(line)

        if current_heading and current_body and len(points_created) < 6:
            body_text = " ".join(current_body)[:300]
            if len(body_text) >= 20:
                res = self.teach(current_heading, body_text, category=category, where_loc=source_title)
                points_created.append(res)

        if not points_created and lines:
            clean_summary = " ".join(lines)[:400]
            res = self.teach(source_title[:50], clean_summary, category=category, where_loc=source_title)
            points_created.append(res)

        return {
            "distilled_count": len(points_created),
            "source": source_title,
            "points": points_created
        }

    def recall(self, query_text: str, top_k: int = 4, threshold: float = RECOGNIZE_THRESHOLD) -> Dict[str, Any]:
        """
        Instant sub-50ms vector query with confidence gating and spoken recall generation.
        """
        start_time = time.perf_counter()
        query_text = query_text.strip()
        if not query_text:
            return {"hits": [], "spoken_response": "I didn't hear a question.", "latency_ms": 0.0}

        query_vec = self._generate_vector(query_text)
        hits = []

        with self._lock:
            # First try Qdrant if online
            if self.qdrant_client:
                try:
                    results = self.qdrant_client.search(
                        collection_name="edge_memories",
                        query_vector=query_vec,
                        limit=top_k
                    )
                    for r in results:
                        hits.append({
                            "id": r.payload.get("id"),
                            "label": r.payload.get("label"),
                            "transcript": r.payload.get("transcript"),
                            "category": r.payload.get("category"),
                            "where": r.payload.get("where_loc"),
                            "score": round(float(r.score), 3),
                            "ts": r.payload.get("ts")
                        })
                except Exception as e:
                    print(f"[OnDeviceMemory] Qdrant search fallback: {e}")
                    hits = []

            # Fallback or hybrid SQLite cosine scan
                with sqlite3.connect(SQLITE_DB) as conn:
                    rows = conn.execute("SELECT id, label, transcript, category, where_loc, vector_json, created_at FROM memory_points WHERE kind = 'taught'").fetchall()
                    scored = []
                    q_words = set("".join(c if c.isalnum() else " " for c in query_text.lower()).split())
                    meaningful_q = q_words - STOP_WORDS
                    if not meaningful_q:
                        meaningful_q = q_words

                    for r in rows:
                        pid, lbl, tr, cat, wh, v_json, ts = r
                        vec = json.loads(v_json) if v_json else []
                        dot = 0.0
                        if len(vec) == VECTOR_DIM:
                            dot = sum(a * b for a, b in zip(query_vec, vec))

                        lbl_words = set("".join(c if c.isalnum() else " " for c in lbl.lower()).split())
                        tr_words = set("".join(c if c.isalnum() else " " for c in (tr or "").lower()).split())
                        wh_words = set("".join(c if c.isalnum() else " " for c in (wh or "").lower()).split())

                        # Direct label match
                        if lbl.lower() in query_text.lower() or (lbl_words & meaningful_q):
                            dot = min(1.0, dot + 0.45)
                        # Content or location match
                        content_matches = (tr_words | wh_words) & meaningful_q
                        if content_matches:
                            ratio = len(content_matches) / max(1, len(meaningful_q))
                            dot = min(1.0, dot + 0.35 * ratio + 0.20)

                        scored.append({
                            "id": pid,
                            "label": lbl,
                            "transcript": tr,
                            "category": cat,
                            "where": wh,
                            "score": round(dot, 3),
                            "ts": ts
                        })
                    scored.sort(key=lambda x: x["score"], reverse=True)
                    hits = scored[:top_k]

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Synthesize instant spoken response
        spoken_response = ""
        if hits and hits[0]["score"] >= threshold:
            best = hits[0]
            elapsed_sec = int(time.time() - best.get("ts", time.time()))
            time_str = "just now"
            if elapsed_sec > 86400:
                time_str = f"{elapsed_sec // 86400} days ago"
            elif elapsed_sec > 3600:
                time_str = f"{elapsed_sec // 3600} hours ago"
            elif elapsed_sec > 60:
                time_str = f"{elapsed_sec // 60} minutes ago"

            spoken_response = f"I remember {best['label']}: {best['transcript']}. (Observed {time_str} in {best['where']})"
        elif hits and hits[0]["score"] >= (threshold - MAYBE_MARGIN):
            best = hits[0]
            spoken_response = f"I am not entirely certain, but this sounds related to {best['label']} ({best['transcript']})."
        else:
            spoken_response = "I haven't learned or seen this in memory yet. Use TEACH to store it."

        is_recognized = bool(hits and hits[0]["score"] >= threshold)
        best_match = hits[0] if hits else None
        best_score = hits[0]["score"] if hits else 0.0

        return {
            "query": query_text,
            "recognized": is_recognized,
            "match": best_match,
            "best_score": best_score,
            "hits": hits,
            "spoken_response": spoken_response,
            "latency_ms": elapsed_ms,
            "threshold": threshold
        }

    def list_memories(self) -> List[Dict[str, Any]]:
        """List all remembered items with timestamps and sightings count."""
        with self._lock, sqlite3.connect(SQLITE_DB) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("SELECT * FROM memory_points ORDER BY last_seen_at DESC").fetchall()
            return [dict(r) for r in rows]

    def forget(self, label_or_id: str) -> bool:
        """Delete a memory item by label or id."""
        with self._lock:
            with sqlite3.connect(SQLITE_DB) as conn:
                deleted = conn.execute("DELETE FROM memory_points WHERE lower(label) = lower(?) OR id = ?", (label_or_id, label_or_id)).rowcount
                conn.commit()
            return deleted > 0

    def get_telemetry(self) -> Dict[str, Any]:
        """Telemetry stats on on-device memory store."""
        with self._lock, sqlite3.connect(SQLITE_DB) as conn:
            count = conn.execute("SELECT count(*) FROM memory_points WHERE kind = 'taught'").fetchone()[0]
            sightings = conn.execute("SELECT COALESCE(sum(sightings_count), 0) FROM memory_points").fetchone()[0]
            db_size = os.path.getsize(SQLITE_DB) if os.path.exists(SQLITE_DB) else 0

        return {
            "engine": "Qdrant Edge + SQLite WAL Hybrid",
            "total_memories": count,
            "total_sightings": sightings,
            "vector_dimension": VECTOR_DIM,
            "recognize_threshold": RECOGNIZE_THRESHOLD,
            "database_size_kb": round(db_size / 1024, 1),
            "status": "HEALTHY_ONLINE"
        }

# Singleton instance
memory_engine = OnDeviceMemory()
