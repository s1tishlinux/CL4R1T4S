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
    <title>📊 RAG Multi-Database System Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            color: #020617;
            min-height: 100vh;
            padding: 24px;
        }
        
        .container {
            max-width: 1500px;
            margin: 0 auto;
        }
        
        .header {
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            border-radius: 16px;
            padding: 28px 32px;
            margin-bottom: 24px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        
        .header h1 {
            font-size: 32px;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 8px;
        }
        
        .header p {
            color: #475569;
            font-size: 15px;
            line-height: 1.5;
        }
        
        .top-links {
            display: flex;
            gap: 10px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }
        
        .nav-link-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 7px 14px;
            background: #ffffff;
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            color: #1e293b;
            text-decoration: none;
            font-size: 13px;
            font-weight: 650;
            transition: all 0.2s ease;
        }
        
        .nav-link-btn:hover {
            background: #f8fafc;
            border-color: #0d9488;
            color: #0d9488;
        }
        
        .refresh-btn {
            background: linear-gradient(135deg, #0d9488 0%, #0284c7 100%);
            color: #ffffff;
            border: 1px solid rgba(13, 148, 136, 0.4);
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 650;
            margin-top: 15px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(13, 148, 136, 0.22);
        }
        
        .refresh-btn:hover {
            background: linear-gradient(135deg, #0f766e 0%, #0369a1 100%);
            box-shadow: 0 4px 14px rgba(13, 148, 136, 0.32);
        }
        
        .refresh-btn:active {
            transform: scale(0.97);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .stat-card {
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            transition: all 0.2s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
            border-color: #cbd5e1;
            box-shadow: 0 6px 16px rgba(0,0,0,0.04);
        }
        
        .stat-icon {
            font-size: 30px;
            margin-bottom: 8px;
        }
        
        .stat-value {
            font-size: 28px;
            font-weight: 800;
            color: #0d9488;
            margin-bottom: 4px;
        }
        
        .stat-label {
            color: #64748b;
            font-size: 12px;
            font-weight: 650;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .databases-section {
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            border-radius: 16px;
            padding: 28px 32px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
            margin-bottom: 24px;
        }
        
        .databases-section h2 {
            color: #0f172a;
            margin-bottom: 18px;
            font-size: 22px;
            font-weight: 750;
        }
        
        .database-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
        }
        
        .database-card {
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            color: #0f172a;
            border-radius: 12px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        
        .database-card:hover {
            transform: translateY(-2px);
            border-color: #0d9488;
            box-shadow: 0 8px 20px rgba(13, 148, 136, 0.1);
        }
        
        .database-card:active {
            transform: scale(0.98);
            background: #f0fdf4;
            border-color: #0d9488;
        }
        
        .database-card.empty {
            background: #f8fafc;
            border-color: #e2e8f0;
            opacity: 0.7;
        }
        
        .database-name {
            font-size: 16px;
            font-weight: 750;
            margin-bottom: 10px;
            text-transform: uppercase;
            color: #0d9488;
            letter-spacing: 0.5px;
        }
        
        .database-stats {
            font-size: 13.5px;
            color: #334155;
            line-height: 1.5;
        }
        
        .database-stats div {
            margin: 4px 0;
        }
        
        .tables-section {
            background: #ffffff;
            border: 1.5px solid #e2e8f0;
            border-radius: 16px;
            padding: 28px 32px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
            margin-bottom: 24px;
        }
        
        .table-schema {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 16px;
        }
        
        .table-schema h3 {
            color: #0d9488;
            margin-bottom: 12px;
            font-size: 16px;
        }
        
        .schema-table {
            width: 100%;
            border-collapse: collapse;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
            margin-top: 10px;
        }
        
        .schema-table th {
            background: #f1f5f9;
            color: #0f172a;
            padding: 12px 14px;
            text-align: left;
            font-weight: 700;
            font-size: 13px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .schema-table td {
            padding: 10px 14px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 13px;
            color: #1e293b;
        }
        
        .schema-table tr:last-child td {
            border-bottom: none;
        }
        
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 750;
            margin-left: 5px;
        }
        
        .badge-pk {
            background: #fef2f2;
            color: #991b1b;
            border: 1px solid #fecaca;
        }
        
        .badge-nn {
            background: #fefce8;
            color: #854d0e;
            border: 1px solid #fef08a;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #64748b;
        }
        
        .error {
            background: #fef2f2;
            color: #991b1b;
            border: 1px solid #fecaca;
            padding: 16px 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="top-links">
                <a href="http://localhost:3300/academy/" class="nav-link-btn">🏠 Academy Main (Port 3300)</a>
                <a href="http://localhost:3300/academy/unified-dashboard.html" class="nav-link-btn">🎯 Unified Dashboard</a>
                <a href="http://localhost:3300/academy/rag-management.html" class="nav-link-btn">⚙️ RAG Pipeline</a>
                <a href="http://localhost:3300/academy/system-overview.html" class="nav-link-btn">🗺️ System Overview</a>
            </div>
            <h1>📊 RAG Multi-Database System Dashboard</h1>
            <p>Real-time monitoring of 11 vector databases, schemas, indexes, and storage telemetry.</p>
            <button class="refresh-btn" onclick="loadAllData()">🔄 Refresh Data</button>
            <span id="last-update" style="margin-left: 15px; color: #64748b; font-size: 13px;"></span>
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
