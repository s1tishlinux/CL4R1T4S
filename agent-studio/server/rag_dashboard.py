#!/usr/bin/env python3
"""
📊 RAG System Dashboard - Web-based monitoring and statistics
Run: python rag_dashboard.py
Access: http://localhost:5000
"""

import os
import sys
import json
import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

# Simple HTTP server
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

BASE_DIR = Path(__file__).parent.resolve()
sys.path.insert(0, str(BASE_DIR))

try:
    from rag_engine_enhanced import (
        ROLE_DATABASES,
        get_all_statistics,
        RoleBasedDatabaseManager
    )
    ENHANCED_AVAILABLE = True
except ImportError:
    ENHANCED_AVAILABLE = False


class RAGDashboardHandler(BaseHTTPRequestHandler):
    """HTTP handler for RAG dashboard."""
    
    def do_GET(self):
        """Handle GET requests."""
        parsed_path = urllib.parse.urlparse(self.path)
        
        if parsed_path.path == "/":
            self.serve_dashboard()
        elif parsed_path.path == "/api/stats":
            self.serve_stats_api()
        elif parsed_path.path == "/api/databases":
            self.serve_databases_api()
        elif parsed_path.path.startswith("/api/database/"):
            role = parsed_path.path.split("/")[-1]
            self.serve_database_details(role)
        elif parsed_path.path.startswith("/api/books/"):
            role = parsed_path.path.split("/")[-1]
            self.serve_books_list(role)
        else:
            self.send_error(404, "Not Found")
    
    def serve_dashboard(self):
        """Serve main dashboard HTML."""
        html = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📊 RAG System Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 20px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            font-size: 36px;
            color: #333;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #666;
            font-size: 16px;
        }
        
        .refresh-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            margin-top: 15px;
            transition: all 0.3s;
        }
        
        .refresh-btn:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            transition: transform 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }
        
        .stat-icon {
            font-size: 36px;
            margin-bottom: 10px;
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #666;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .databases-section {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .databases-section h2 {
            color: #333;
            margin-bottom: 20px;
            font-size: 24px;
        }
        
        .database-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }
        
        .database-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .database-card:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
        
        .database-card.empty {
            background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
            opacity: 0.6;
        }
        
        .database-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        
        .database-stats {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .database-stats div {
            margin: 5px 0;
        }
        
        .tables-section {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .table-schema {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
        }
        
        .table-schema h3 {
            color: #667eea;
            margin-bottom: 15px;
        }
        
        .schema-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .schema-table th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }
        
        .schema-table td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .schema-table tr:last-child td {
            border-bottom: none;
        }
        
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            margin-left: 5px;
        }
        
        .badge-pk {
            background: #e74c3c;
            color: white;
        }
        
        .badge-nn {
            background: #f39c12;
            color: white;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .error {
            background: #fee;
            color: #c33;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 RAG System Dashboard</h1>
            <p>Real-time monitoring of vector databases, schemas, and statistics</p>
            <button class="refresh-btn" onclick="loadAllData()">🔄 Refresh Data</button>
            <span id="last-update" style="margin-left: 15px; color: #999;"></span>
        </div>
        
        <div id="stats-container" class="stats-grid">
            <div class="loading">Loading statistics...</div>
        </div>
        
        <div id="databases-container" class="databases-section">
            <h2>📚 Role-Based Vector Databases</h2>
            <div id="database-list" class="database-list">
                <div class="loading">Loading databases...</div>
            </div>
        </div>
        
        <div id="tables-container" class="tables-section" style="display: none;">
            <h2>📋 Database Schemas & Tables</h2>
            <div id="tables-content"></div>
        </div>
    </div>
    
    <script>
        async function loadAllData() {
            await loadStats();
            await loadDatabases();
            document.getElementById('last-update').textContent = 
                'Last updated: ' + new Date().toLocaleTimeString();
        }
        
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                
                const html = `
                    <div class="stat-card">
                        <div class="stat-icon">📚</div>
                        <div class="stat-value">${data.total_books || 0}</div>
                        <div class="stat-label">Total Books</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📄</div>
                        <div class="stat-value">${(data.total_chunks || 0).toLocaleString()}</div>
                        <div class="stat-label">Total Chunks</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🗄️</div>
                        <div class="stat-value">${Object.keys(data.role_statistics || {}).length}</div>
                        <div class="stat-label">Vector Databases</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">✅</div>
                        <div class="stat-value">${countActiveDBs(data.role_statistics)}</div>
                        <div class="stat-label">Active Databases</div>
                    </div>
                `;
                
                document.getElementById('stats-container').innerHTML = html;
            } catch (error) {
                document.getElementById('stats-container').innerHTML = 
                    '<div class="error">Error loading statistics: ' + error.message + '</div>';
            }
        }
        
        function countActiveDBs(roleStats) {
            if (!roleStats) return 0;
            return Object.values(roleStats).filter(s => s.books_count > 0).length;
        }
        
        async function loadDatabases() {
            try {
                const response = await fetch('/api/databases');
                const data = await response.json();
                
                let html = '';
                for (const [role, info] of Object.entries(data)) {
                    const isEmpty = info.total_rows === 0;
                    const emptyClass = isEmpty ? ' empty' : '';
                    
                    html += `
                        <div class="database-card${emptyClass}" onclick="loadDatabaseDetails('${role}')">
                            <div class="database-name">${role}</div>
                            <div class="database-stats">
                                <div>📊 Tables: ${info.table_count || 0}</div>
                                <div>📄 Rows: ${(info.total_rows || 0).toLocaleString()}</div>
                                <div>💾 Size: ${info.size_mb ? info.size_mb.toFixed(2) : '0.00'} MB</div>
                                ${isEmpty ? '<div>⚠️ Empty Database</div>' : ''}
                            </div>
                        </div>
                    `;
                }
                
                document.getElementById('database-list').innerHTML = html || 
                    '<div class="loading">No databases found</div>';
            } catch (error) {
                document.getElementById('database-list').innerHTML = 
                    '<div class="error">Error loading databases: ' + error.message + '</div>';
            }
        }
        
        async function loadDatabaseDetails(role) {
            try {
                const response = await fetch(`/api/database/${role}`);
                const data = await response.json();
                
                if (!data.exists) {
                    alert(`Database for role "${role}" does not exist yet.`);
                    return;
                }
                
                let html = `<h2>Database: ${role.toUpperCase()}</h2>
                           <p>Path: ${data.path}</p>
                           <p>Size: ${data.size_mb.toFixed(2)} MB | Tables: ${data.table_count} | Rows: ${data.total_rows.toLocaleString()}</p>`;
                
                for (const [tableName, tableDetails] of Object.entries(data.table_details)) {
                    html += `
                        <div class="table-schema">
                            <h3>📋 Table: ${tableName}</h3>
                            <p>Rows: ${tableDetails.stats.row_count.toLocaleString()} | 
                               Size: ${tableDetails.stats.size_mb.toFixed(2)} MB</p>
                            
                            <h4 style="margin-top: 15px; margin-bottom: 10px;">Schema:</h4>
                            <table class="schema-table">
                                <thead>
                                    <tr>
                                        <th>Column</th>
                                        <th>Type</th>
                                        <th>Constraints</th>
                                    </tr>
                                </thead>
                                <tbody>
                    `;
                    
                    for (const col of tableDetails.schema) {
                        const badges = [];
                        if (col.primary_key) badges.push('<span class="badge badge-pk">PK</span>');
                        if (col.notnull) badges.push('<span class="badge badge-nn">NOT NULL</span>');
                        
                        html += `
                            <tr>
                                <td><strong>${col.name}</strong></td>
                                <td>${col.type}</td>
                                <td>${badges.join(' ')}</td>
                            </tr>
                        `;
                    }
                    
                    html += `
                                </tbody>
                            </table>
                    `;
                    
                    if (tableDetails.indexes.length > 0) {
                        html += `
                            <h4 style="margin-top: 15px; margin-bottom: 10px;">Indexes:</h4>
                            <ul>
                        `;
                        for (const idx of tableDetails.indexes) {
                            const unique = idx.unique ? ' [UNIQUE]' : '';
                            html += `<li><strong>${idx.name}</strong> ON (${idx.columns.join(', ')})${unique}</li>`;
                        }
                        html += '</ul>';
                    }
                    
                    html += '</div>';
                }
                
                document.getElementById('tables-content').innerHTML = html;
                document.getElementById('tables-container').style.display = 'block';
                document.getElementById('tables-container').scrollIntoView({ behavior: 'smooth' });
                
            } catch (error) {
                alert('Error loading database details: ' + error.message);
            }
        }
        
        // Load data on page load
        loadAllData();
        
        // Auto-refresh every 30 seconds
        setInterval(loadAllData, 30000);
    </script>
</body>
</html>
        """
        
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(html.encode())
    
    def serve_stats_api(self):
        """Serve statistics API."""
        if not ENHANCED_AVAILABLE:
            self.send_json_response({"error": "Enhanced RAG not available"}, 500)
            return
        
        try:
            from rag_engine_enhanced import get_all_statistics
            stats = get_all_statistics()
            self.send_json_response(stats)
        except Exception as e:
            self.send_json_response({"error": str(e)}, 500)
    
    def serve_databases_api(self):
        """Serve databases list API."""
        if not ENHANCED_AVAILABLE:
            self.send_json_response({"error": "Enhanced RAG not available"}, 500)
            return
        
        try:
            databases_info = {}
            for role, db_dir in ROLE_DATABASES.items():
                db_path = db_dir / "rag_catalog.db"
                databases_info[role] = self.get_database_info(db_path)
            
            self.send_json_response(databases_info)
        except Exception as e:
            self.send_json_response({"error": str(e)}, 500)
    
    def serve_database_details(self, role: str):
        """Serve detailed database information."""
        if not ENHANCED_AVAILABLE:
            self.send_json_response({"error": "Enhanced RAG not available"}, 500)
            return
        
        if role not in ROLE_DATABASES:
            self.send_json_response({"error": f"Unknown role: {role}"}, 404)
            return
        
        try:
            db_path = ROLE_DATABASES[role] / "rag_catalog.db"
            details = self.get_database_details(db_path, role)
            self.send_json_response(details)
        except Exception as e:
            self.send_json_response({"error": str(e)}, 500)
    
    def serve_books_list(self, role: str):
        """Serve books list for a role."""
        if not ENHANCED_AVAILABLE:
            self.send_json_response({"error": "Enhanced RAG not available"}, 500)
            return
        
        if role not in ROLE_DATABASES:
            self.send_json_response({"error": f"Unknown role: {role}"}, 404)
            return
        
        try:
            db_manager = RoleBasedDatabaseManager()
            conn = db_manager.get_connection(role)
            
            cursor = conn.execute("""
                SELECT book_id, title, author, category, total_pages, total_chunks, 
                       created_at, status
                FROM rag_books
                ORDER BY created_at DESC
            """)
            
            books = []
            for row in cursor.fetchall():
                books.append({
                    "book_id": row[0],
                    "title": row[1],
                    "author": row[2],
                    "category": row[3],
                    "total_pages": row[4],
                    "total_chunks": row[5],
                    "created_at": row[6],
                    "status": row[7]
                })
            
            conn.close()
            self.send_json_response({"role": role, "books": books})
        except Exception as e:
            self.send_json_response({"error": str(e)}, 500)
    
    def get_database_info(self, db_path: Path) -> Dict:
        """Get basic database info."""
        if not db_path.exists():
            return {"exists": False, "total_rows": 0, "table_count": 0, "size_mb": 0}
        
        conn = sqlite3.connect(str(db_path))
        try:
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            total_rows = 0
            for table in tables:
                cursor = conn.execute(f"SELECT COUNT(*) FROM {table}")
                total_rows += cursor.fetchone()[0]
            
            size_mb = db_path.stat().st_size / (1024 * 1024)
            
            return {
                "exists": True,
                "total_rows": total_rows,
                "table_count": len(tables),
                "size_mb": size_mb
            }
        finally:
            conn.close()
    
    def get_database_details(self, db_path: Path, role: str) -> Dict:
        """Get detailed database information."""
        if not db_path.exists():
            return {"role": role, "exists": False, "error": "Database not found"}
        
        conn = sqlite3.connect(str(db_path))
        try:
            # Get tables
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            
            table_details = {}
            for table in tables:
                # Schema
                cursor = conn.execute(f"PRAGMA table_info({table})")
                schema = [
                    {
                        "name": row[1],
                        "type": row[2],
                        "notnull": bool(row[3]),
                        "default_value": row[4],
                        "primary_key": bool(row[5])
                    }
                    for row in cursor.fetchall()
                ]
                
                # Indexes
                cursor = conn.execute(f"PRAGMA index_list({table})")
                indexes = []
                for row in cursor.fetchall():
                    index_name = row[1]
                    idx_cursor = conn.execute(f"PRAGMA index_info({index_name})")
                    columns = [col[2] for col in idx_cursor.fetchall()]
                    indexes.append({
                        "name": index_name,
                        "unique": bool(row[2]),
                        "columns": columns
                    })
                
                # Stats
                cursor = conn.execute(f"SELECT COUNT(*) FROM {table}")
                row_count = cursor.fetchone()[0]
                
                cursor = conn.execute(f"SELECT SUM(pgsize) FROM dbstat WHERE name=?", (table,))
                size_bytes = cursor.fetchone()[0] or 0
                
                table_details[table] = {
                    "schema": schema,
                    "indexes": indexes,
                    "stats": {
                        "row_count": row_count,
                        "size_mb": size_bytes / (1024 * 1024)
                    }
                }
            
            total_rows = sum(t["stats"]["row_count"] for t in table_details.values())
            size_mb = db_path.stat().st_size / (1024 * 1024)
            
            return {
                "role": role,
                "path": str(db_path),
                "exists": True,
                "size_mb": size_mb,
                "table_count": len(tables),
                "total_rows": total_rows,
                "table_details": table_details
            }
        finally:
            conn.close()
    
    def send_json_response(self, data: Dict, status: int = 200):
        """Send JSON response."""
        self.send_response(status)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def log_message(self, format, *args):
        """Suppress default logging."""
        pass


def run_dashboard(port: int = 5000):
    """Run the RAG dashboard server."""
    print("=" * 80)
    print("📊 RAG SYSTEM DASHBOARD")
    print("=" * 80)
    print(f"\n🚀 Starting server on http://localhost:{port}")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if not ENHANCED_AVAILABLE:
        print("\n⚠️  Warning: Enhanced RAG engine not available")
        print("   Some features may be limited")
    else:
        print(f"\n✅ Enhanced RAG engine loaded")
        print(f"   Vector databases: {len(ROLE_DATABASES)}")
    
    print(f"\n🌐 Open your browser to: http://localhost:{port}")
    print(f"   Press Ctrl+C to stop\n")
    
    try:
        server = HTTPServer(("", port), RAGDashboardHandler)
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Dashboard stopped")
        server.shutdown()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="RAG System Dashboard")
    parser.add_argument("--port", type=int, default=5000, help="Port to run on (default: 5000)")
    args = parser.parse_args()
    
    run_dashboard(args.port)
