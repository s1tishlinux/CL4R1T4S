-- RAG Database Schemas
-- Generated: 2026-10-01 20:23:25


-- ============================================
-- DATABASE: DEVOPS
-- Path: /Users/satishgundu/CL4R1T4S-main/books/vectors/devops/rag_catalog.db
-- ============================================

CREATE TABLE rag_books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                author TEXT,
                category TEXT,
                role TEXT,
                file_path TEXT,
                file_type TEXT,
                total_pages INTEGER DEFAULT 1,
                total_chunks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                chunking_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT
            );

CREATE TABLE rag_chunks (
                chunk_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                chapter_title TEXT,
                page_number INTEGER DEFAULT 1,
                chunk_index INTEGER DEFAULT 0,
                chunk_text TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                embedding_json TEXT,
                l2_norm REAL DEFAULT 1.0,
                chunk_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT,
                FOREIGN KEY (book_id) REFERENCES rag_books (book_id) ON DELETE CASCADE
            );

CREATE TABLE rag_queries_log (
                query_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                user_query TEXT NOT NULL,
                role TEXT,
                book_id TEXT,
                chunks_retrieved INTEGER DEFAULT 0,
                latency_ms INTEGER DEFAULT 0,
                top_score REAL DEFAULT 0.0,
                response_preview TEXT
            );

CREATE INDEX idx_books_role ON rag_books(role);

CREATE INDEX idx_chunks_book ON rag_chunks(book_id);

CREATE INDEX idx_chunks_page ON rag_chunks(book_id, page_number);

CREATE INDEX idx_query_logs_time ON rag_queries_log(timestamp DESC);


-- ============================================
-- DATABASE: MLE
-- Path: /Users/satishgundu/CL4R1T4S-main/books/vectors/mle/rag_catalog.db
-- ============================================

CREATE TABLE rag_books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                author TEXT,
                category TEXT,
                role TEXT,
                file_path TEXT,
                file_type TEXT,
                total_pages INTEGER DEFAULT 1,
                total_chunks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                chunking_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT
            );

CREATE TABLE rag_chunks (
                chunk_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                chapter_title TEXT,
                page_number INTEGER DEFAULT 1,
                chunk_index INTEGER DEFAULT 0,
                chunk_text TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                embedding_json TEXT,
                l2_norm REAL DEFAULT 1.0,
                chunk_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT,
                FOREIGN KEY (book_id) REFERENCES rag_books (book_id) ON DELETE CASCADE
            );

CREATE TABLE rag_queries_log (
                query_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                user_query TEXT NOT NULL,
                role TEXT,
                book_id TEXT,
                chunks_retrieved INTEGER DEFAULT 0,
                latency_ms INTEGER DEFAULT 0,
                top_score REAL DEFAULT 0.0,
                response_preview TEXT
            );

CREATE INDEX idx_books_role ON rag_books(role);

CREATE INDEX idx_chunks_book ON rag_chunks(book_id);

CREATE INDEX idx_chunks_page ON rag_chunks(book_id, page_number);

CREATE INDEX idx_query_logs_time ON rag_queries_log(timestamp DESC);


-- ============================================
-- DATABASE: MLOPS
-- Path: /Users/satishgundu/CL4R1T4S-main/books/vectors/mlops/rag_catalog.db
-- ============================================

CREATE TABLE rag_books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                author TEXT,
                category TEXT,
                role TEXT,
                file_path TEXT,
                file_type TEXT,
                total_pages INTEGER DEFAULT 1,
                total_chunks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                chunking_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT
            );

CREATE TABLE rag_chunks (
                chunk_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                chapter_title TEXT,
                page_number INTEGER DEFAULT 1,
                chunk_index INTEGER DEFAULT 0,
                chunk_text TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                embedding_json TEXT,
                l2_norm REAL DEFAULT 1.0,
                chunk_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT,
                FOREIGN KEY (book_id) REFERENCES rag_books (book_id) ON DELETE CASCADE
            );

CREATE TABLE rag_queries_log (
                query_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                user_query TEXT NOT NULL,
                role TEXT,
                book_id TEXT,
                chunks_retrieved INTEGER DEFAULT 0,
                latency_ms INTEGER DEFAULT 0,
                top_score REAL DEFAULT 0.0,
                response_preview TEXT
            );

CREATE INDEX idx_books_role ON rag_books(role);

CREATE INDEX idx_chunks_book ON rag_chunks(book_id);

CREATE INDEX idx_chunks_page ON rag_chunks(book_id, page_number);

CREATE INDEX idx_query_logs_time ON rag_queries_log(timestamp DESC);


-- ============================================
-- DATABASE: GENAI
-- Path: /Users/satishgundu/CL4R1T4S-main/books/vectors/genai/rag_catalog.db
-- ============================================

CREATE TABLE rag_books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                author TEXT,
                category TEXT,
                role TEXT,
                file_path TEXT,
                file_type TEXT,
                total_pages INTEGER DEFAULT 1,
                total_chunks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                chunking_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT
            );

CREATE TABLE rag_chunks (
                chunk_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                chapter_title TEXT,
                page_number INTEGER DEFAULT 1,
                chunk_index INTEGER DEFAULT 0,
                chunk_text TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                embedding_json TEXT,
                l2_norm REAL DEFAULT 1.0,
                chunk_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT,
                FOREIGN KEY (book_id) REFERENCES rag_books (book_id) ON DELETE CASCADE
            );

CREATE TABLE rag_queries_log (
                query_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                user_query TEXT NOT NULL,
                role TEXT,
                book_id TEXT,
                chunks_retrieved INTEGER DEFAULT 0,
                latency_ms INTEGER DEFAULT 0,
                top_score REAL DEFAULT 0.0,
                response_preview TEXT
            );

CREATE INDEX idx_books_role ON rag_books(role);

CREATE INDEX idx_chunks_book ON rag_chunks(book_id);

CREATE INDEX idx_chunks_page ON rag_chunks(book_id, page_number);

CREATE INDEX idx_query_logs_time ON rag_queries_log(timestamp DESC);


-- ============================================
-- DATABASE: AGENTIC_AI
-- Path: /Users/satishgundu/CL4R1T4S-main/books/vectors/agentic_ai/rag_catalog.db
-- ============================================

CREATE TABLE rag_books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                author TEXT,
                category TEXT,
                role TEXT,
                file_path TEXT,
                file_type TEXT,
                total_pages INTEGER DEFAULT 1,
                total_chunks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                chunking_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT
            );

CREATE TABLE rag_chunks (
                chunk_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                chapter_title TEXT,
                page_number INTEGER DEFAULT 1,
                chunk_index INTEGER DEFAULT 0,
                chunk_text TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                embedding_json TEXT,
                l2_norm REAL DEFAULT 1.0,
                chunk_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT,
                FOREIGN KEY (book_id) REFERENCES rag_books (book_id) ON DELETE CASCADE
            );

CREATE TABLE rag_queries_log (
                query_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                user_query TEXT NOT NULL,
                role TEXT,
                book_id TEXT,
                chunks_retrieved INTEGER DEFAULT 0,
                latency_ms INTEGER DEFAULT 0,
                top_score REAL DEFAULT 0.0,
                response_preview TEXT
            );

CREATE INDEX idx_books_role ON rag_books(role);

CREATE INDEX idx_chunks_book ON rag_chunks(book_id);

CREATE INDEX idx_chunks_page ON rag_chunks(book_id, page_number);

CREATE INDEX idx_query_logs_time ON rag_queries_log(timestamp DESC);


-- ============================================
-- DATABASE: DATA_SCIENCE
-- Path: /Users/satishgundu/CL4R1T4S-main/books/vectors/data_science/rag_catalog.db
-- ============================================

CREATE TABLE rag_books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                author TEXT,
                category TEXT,
                role TEXT,
                file_path TEXT,
                file_type TEXT,
                total_pages INTEGER DEFAULT 1,
                total_chunks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                chunking_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT
            );

CREATE TABLE rag_chunks (
                chunk_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                chapter_title TEXT,
                page_number INTEGER DEFAULT 1,
                chunk_index INTEGER DEFAULT 0,
                chunk_text TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                embedding_json TEXT,
                l2_norm REAL DEFAULT 1.0,
                chunk_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT,
                FOREIGN KEY (book_id) REFERENCES rag_books (book_id) ON DELETE CASCADE
            );

CREATE TABLE rag_queries_log (
                query_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                user_query TEXT NOT NULL,
                role TEXT,
                book_id TEXT,
                chunks_retrieved INTEGER DEFAULT 0,
                latency_ms INTEGER DEFAULT 0,
                top_score REAL DEFAULT 0.0,
                response_preview TEXT
            );

CREATE INDEX idx_books_role ON rag_books(role);

CREATE INDEX idx_chunks_book ON rag_chunks(book_id);

CREATE INDEX idx_chunks_page ON rag_chunks(book_id, page_number);

CREATE INDEX idx_query_logs_time ON rag_queries_log(timestamp DESC);


-- ============================================
-- DATABASE: AWS_CLOUD
-- Path: /Users/satishgundu/CL4R1T4S-main/books/vectors/aws_cloud/rag_catalog.db
-- ============================================

CREATE TABLE rag_books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                author TEXT,
                category TEXT,
                role TEXT,
                file_path TEXT,
                file_type TEXT,
                total_pages INTEGER DEFAULT 1,
                total_chunks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                chunking_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT
            );

CREATE TABLE rag_chunks (
                chunk_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                chapter_title TEXT,
                page_number INTEGER DEFAULT 1,
                chunk_index INTEGER DEFAULT 0,
                chunk_text TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                embedding_json TEXT,
                l2_norm REAL DEFAULT 1.0,
                chunk_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT,
                FOREIGN KEY (book_id) REFERENCES rag_books (book_id) ON DELETE CASCADE
            );

CREATE TABLE rag_queries_log (
                query_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                user_query TEXT NOT NULL,
                role TEXT,
                book_id TEXT,
                chunks_retrieved INTEGER DEFAULT 0,
                latency_ms INTEGER DEFAULT 0,
                top_score REAL DEFAULT 0.0,
                response_preview TEXT
            );

CREATE INDEX idx_books_role ON rag_books(role);

CREATE INDEX idx_chunks_book ON rag_chunks(book_id);

CREATE INDEX idx_chunks_page ON rag_chunks(book_id, page_number);

CREATE INDEX idx_query_logs_time ON rag_queries_log(timestamp DESC);


-- ============================================
-- DATABASE: LINUX
-- Path: /Users/satishgundu/CL4R1T4S-main/books/vectors/linux/rag_catalog.db
-- ============================================

CREATE TABLE rag_books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                author TEXT,
                category TEXT,
                role TEXT,
                file_path TEXT,
                file_type TEXT,
                total_pages INTEGER DEFAULT 1,
                total_chunks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                chunking_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT
            );

CREATE TABLE rag_chunks (
                chunk_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                chapter_title TEXT,
                page_number INTEGER DEFAULT 1,
                chunk_index INTEGER DEFAULT 0,
                chunk_text TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                embedding_json TEXT,
                l2_norm REAL DEFAULT 1.0,
                chunk_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT,
                FOREIGN KEY (book_id) REFERENCES rag_books (book_id) ON DELETE CASCADE
            );

CREATE TABLE rag_queries_log (
                query_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                user_query TEXT NOT NULL,
                role TEXT,
                book_id TEXT,
                chunks_retrieved INTEGER DEFAULT 0,
                latency_ms INTEGER DEFAULT 0,
                top_score REAL DEFAULT 0.0,
                response_preview TEXT
            );

CREATE INDEX idx_books_role ON rag_books(role);

CREATE INDEX idx_chunks_book ON rag_chunks(book_id);

CREATE INDEX idx_chunks_page ON rag_chunks(book_id, page_number);

CREATE INDEX idx_query_logs_time ON rag_queries_log(timestamp DESC);


-- ============================================
-- DATABASE: PYTHON
-- Path: /Users/satishgundu/CL4R1T4S-main/books/vectors/python/rag_catalog.db
-- ============================================

CREATE TABLE rag_books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                author TEXT,
                category TEXT,
                role TEXT,
                file_path TEXT,
                file_type TEXT,
                total_pages INTEGER DEFAULT 1,
                total_chunks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                chunking_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT
            );

CREATE TABLE rag_chunks (
                chunk_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                chapter_title TEXT,
                page_number INTEGER DEFAULT 1,
                chunk_index INTEGER DEFAULT 0,
                chunk_text TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                embedding_json TEXT,
                l2_norm REAL DEFAULT 1.0,
                chunk_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT,
                FOREIGN KEY (book_id) REFERENCES rag_books (book_id) ON DELETE CASCADE
            );

CREATE TABLE rag_queries_log (
                query_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                user_query TEXT NOT NULL,
                role TEXT,
                book_id TEXT,
                chunks_retrieved INTEGER DEFAULT 0,
                latency_ms INTEGER DEFAULT 0,
                top_score REAL DEFAULT 0.0,
                response_preview TEXT
            );

CREATE INDEX idx_books_role ON rag_books(role);

CREATE INDEX idx_chunks_book ON rag_chunks(book_id);

CREATE INDEX idx_chunks_page ON rag_chunks(book_id, page_number);

CREATE INDEX idx_query_logs_time ON rag_queries_log(timestamp DESC);


-- ============================================
-- DATABASE: KUBERNETES
-- Path: /Users/satishgundu/CL4R1T4S-main/books/vectors/kubernetes/rag_catalog.db
-- ============================================

CREATE TABLE rag_books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                author TEXT,
                category TEXT,
                role TEXT,
                file_path TEXT,
                file_type TEXT,
                total_pages INTEGER DEFAULT 1,
                total_chunks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                chunking_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT
            );

CREATE TABLE rag_chunks (
                chunk_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                chapter_title TEXT,
                page_number INTEGER DEFAULT 1,
                chunk_index INTEGER DEFAULT 0,
                chunk_text TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                embedding_json TEXT,
                l2_norm REAL DEFAULT 1.0,
                chunk_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT,
                FOREIGN KEY (book_id) REFERENCES rag_books (book_id) ON DELETE CASCADE
            );

CREATE TABLE rag_queries_log (
                query_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                user_query TEXT NOT NULL,
                role TEXT,
                book_id TEXT,
                chunks_retrieved INTEGER DEFAULT 0,
                latency_ms INTEGER DEFAULT 0,
                top_score REAL DEFAULT 0.0,
                response_preview TEXT
            );

CREATE INDEX idx_books_role ON rag_books(role);

CREATE INDEX idx_chunks_book ON rag_chunks(book_id);

CREATE INDEX idx_chunks_page ON rag_chunks(book_id, page_number);

CREATE INDEX idx_query_logs_time ON rag_queries_log(timestamp DESC);


-- ============================================
-- DATABASE: GENERAL
-- Path: /Users/satishgundu/CL4R1T4S-main/books/vectors/general/rag_catalog.db
-- ============================================

CREATE TABLE rag_books (
                book_id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                subtitle TEXT,
                author TEXT,
                category TEXT,
                role TEXT,
                file_path TEXT,
                file_type TEXT,
                total_pages INTEGER DEFAULT 1,
                total_chunks INTEGER DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                chunking_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT
            );

CREATE TABLE rag_chunks (
                chunk_id TEXT PRIMARY KEY,
                book_id TEXT NOT NULL,
                chapter_title TEXT,
                page_number INTEGER DEFAULT 1,
                chunk_index INTEGER DEFAULT 0,
                chunk_text TEXT NOT NULL,
                token_count INTEGER DEFAULT 0,
                embedding_json TEXT,
                l2_norm REAL DEFAULT 1.0,
                chunk_strategy TEXT DEFAULT 'langchain_recursive',
                metadata_json TEXT,
                FOREIGN KEY (book_id) REFERENCES rag_books (book_id) ON DELETE CASCADE
            );

CREATE TABLE rag_queries_log (
                query_id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                user_query TEXT NOT NULL,
                role TEXT,
                book_id TEXT,
                chunks_retrieved INTEGER DEFAULT 0,
                latency_ms INTEGER DEFAULT 0,
                top_score REAL DEFAULT 0.0,
                response_preview TEXT
            );

CREATE INDEX idx_books_role ON rag_books(role);

CREATE INDEX idx_chunks_book ON rag_chunks(book_id);

CREATE INDEX idx_chunks_page ON rag_chunks(book_id, page_number);

CREATE INDEX idx_query_logs_time ON rag_queries_log(timestamp DESC);

