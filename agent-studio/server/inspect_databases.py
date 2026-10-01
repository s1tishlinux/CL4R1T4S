#!/usr/bin/env python3
"""
🔍 Database Inspector - View all RAG database schemas, tables, and indexes
"""

import os
import sys
import sqlite3
import json
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

# Add current directory to path
BASE_DIR = Path(__file__).parent.resolve()
sys.path.insert(0, str(BASE_DIR))

try:
    from rag_engine_enhanced import ROLE_DATABASES
    ENHANCED_AVAILABLE = True
except ImportError:
    ENHANCED_AVAILABLE = False


def get_table_schema(conn: sqlite3.Connection, table_name: str) -> List[Dict[str, Any]]:
    """Get schema for a specific table."""
    cursor = conn.execute(f"PRAGMA table_info({table_name})")
    columns = []
    for row in cursor.fetchall():
        columns.append({
            "cid": row[0],
            "name": row[1],
            "type": row[2],
            "notnull": bool(row[3]),
            "default_value": row[4],
            "primary_key": bool(row[5])
        })
    return columns


def get_indexes(conn: sqlite3.Connection, table_name: str) -> List[Dict[str, Any]]:
    """Get indexes for a specific table."""
    cursor = conn.execute(f"PRAGMA index_list({table_name})")
    indexes = []
    for row in cursor.fetchall():
        index_name = row[1]
        # Get index details
        idx_cursor = conn.execute(f"PRAGMA index_info({index_name})")
        columns = [col[2] for col in idx_cursor.fetchall()]
        
        indexes.append({
            "name": index_name,
            "unique": bool(row[2]),
            "columns": columns
        })
    return indexes


def get_table_stats(conn: sqlite3.Connection, table_name: str) -> Dict[str, Any]:
    """Get statistics for a table."""
    cursor = conn.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    
    # Get table size
    cursor = conn.execute(f"SELECT SUM(pgsize) FROM dbstat WHERE name=?", (table_name,))
    size_bytes = cursor.fetchone()[0] or 0
    
    return {
        "row_count": count,
        "size_bytes": size_bytes,
        "size_mb": round(size_bytes / (1024 * 1024), 2)
    }


def inspect_database(db_path: Path, role: str = "unknown") -> Dict[str, Any]:
    """Inspect a complete database."""
    if not db_path.exists():
        return {
            "role": role,
            "path": str(db_path),
            "exists": False,
            "error": "Database file not found"
        }
    
    conn = sqlite3.connect(str(db_path))
    
    try:
        # Get all tables
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        tables = [row[0] for row in cursor.fetchall()]
        
        # Get database file size
        db_size_bytes = db_path.stat().st_size
        
        # Inspect each table
        table_info = {}
        for table in tables:
            table_info[table] = {
                "schema": get_table_schema(conn, table),
                "indexes": get_indexes(conn, table),
                "stats": get_table_stats(conn, table)
            }
        
        # Get database-level stats
        total_rows = sum(info["stats"]["row_count"] for info in table_info.values())
        
        return {
            "role": role,
            "path": str(db_path),
            "exists": True,
            "size_bytes": db_size_bytes,
            "size_mb": round(db_size_bytes / (1024 * 1024), 2),
            "tables": list(tables),
            "table_count": len(tables),
            "total_rows": total_rows,
            "table_details": table_info
        }
    
    finally:
        conn.close()


def print_schema_report(db_info: Dict[str, Any]):
    """Pretty print database schema report."""
    role = db_info["role"]
    
    print(f"\n{'=' * 80}")
    print(f"📊 DATABASE: {role.upper()}")
    print(f"{'=' * 80}")
    
    if not db_info["exists"]:
        print(f"❌ {db_info['error']}")
        return
    
    print(f"📁 Path: {db_info['path']}")
    print(f"💾 Size: {db_info['size_mb']:.2f} MB ({db_info['size_bytes']:,} bytes)")
    print(f"📊 Tables: {db_info['table_count']}")
    print(f"📄 Total Rows: {db_info['total_rows']:,}")
    
    for table_name, table_details in db_info["table_details"].items():
        print(f"\n{'-' * 80}")
        print(f"📋 TABLE: {table_name}")
        print(f"{'-' * 80}")
        
        # Stats
        stats = table_details["stats"]
        print(f"📊 Rows: {stats['row_count']:,} | Size: {stats['size_mb']:.2f} MB")
        
        # Schema
        print(f"\n   SCHEMA:")
        schema = table_details["schema"]
        for col in schema:
            pk = " [PK]" if col["primary_key"] else ""
            nn = " NOT NULL" if col["notnull"] else ""
            default = f" DEFAULT {col['default_value']}" if col['default_value'] else ""
            print(f"      • {col['name']:20} {col['type']:15} {pk}{nn}{default}")
        
        # Indexes
        indexes = table_details["indexes"]
        if indexes:
            print(f"\n   INDEXES:")
            for idx in indexes:
                unique = " [UNIQUE]" if idx["unique"] else ""
                columns = ", ".join(idx["columns"])
                print(f"      • {idx['name']:30} ON ({columns}){unique}")


def inspect_all_databases():
    """Inspect all role-based databases."""
    print("=" * 80)
    print("🔍 RAG DATABASE INSPECTOR")
    print("=" * 80)
    print(f"\n📅 Inspection Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    if not ENHANCED_AVAILABLE:
        print("\n❌ Enhanced RAG engine not available")
        print("   Looking for databases manually...")
        
        # Fallback: scan for databases
        books_dir = BASE_DIR.parent.parent / "books"
        vectors_dir = books_dir / "vectors"
        
        if not vectors_dir.exists():
            print(f"\n❌ Vectors directory not found: {vectors_dir}")
            return
        
        # Find all .db files
        db_files = list(vectors_dir.rglob("*.db"))
        
        if not db_files:
            print(f"\n⚠️  No database files found in {vectors_dir}")
            return
        
        print(f"\n✅ Found {len(db_files)} database files")
        
        for db_path in db_files:
            role = db_path.parent.name
            db_info = inspect_database(db_path, role=role)
            print_schema_report(db_info)
        
        return
    
    # Use role databases from enhanced engine
    print(f"\n✅ Found {len(ROLE_DATABASES)} role databases")
    print("\n📁 Database Locations:")
    for role, path in ROLE_DATABASES.items():
        print(f"   • {role:15} -> {path}")
    
    # Inspect each database
    all_stats = {
        "total_databases": len(ROLE_DATABASES),
        "total_size_mb": 0,
        "total_tables": 0,
        "total_rows": 0,
        "databases": {}
    }
    
    for role, db_dir in ROLE_DATABASES.items():
        db_path = db_dir / "rag_catalog.db"
        db_info = inspect_database(db_path, role=role)
        
        if db_info["exists"]:
            all_stats["total_size_mb"] += db_info["size_mb"]
            all_stats["total_tables"] += db_info["table_count"]
            all_stats["total_rows"] += db_info["total_rows"]
        
        all_stats["databases"][role] = db_info
        print_schema_report(db_info)
    
    # Print summary
    print(f"\n{'=' * 80}")
    print("📊 SUMMARY")
    print(f"{'=' * 80}")
    print(f"📚 Total Databases: {all_stats['total_databases']}")
    print(f"💾 Total Size: {all_stats['total_size_mb']:.2f} MB")
    print(f"📋 Total Tables: {all_stats['total_tables']}")
    print(f"📄 Total Rows: {all_stats['total_rows']:,}")
    
    # Active databases (with data)
    active_dbs = [role for role, info in all_stats["databases"].items() 
                  if info["exists"] and info["total_rows"] > 0]
    
    print(f"\n✅ Active Databases ({len(active_dbs)}):")
    for role in active_dbs:
        info = all_stats["databases"][role]
        print(f"   • {role:15}: {info['total_rows']:6,} rows | {info['size_mb']:6.2f} MB")
    
    # Empty databases
    empty_dbs = [role for role, info in all_stats["databases"].items() 
                 if info["exists"] and info["total_rows"] == 0]
    
    if empty_dbs:
        print(f"\n⚠️  Empty Databases ({len(empty_dbs)}):")
        for role in empty_dbs:
            print(f"   • {role}")
    
    # Save report to JSON
    report_path = BASE_DIR.parent.parent / "books" / "database_inspection_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(all_stats, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Full report saved: {report_path}")


def quick_stats():
    """Quick statistics view."""
    print("=" * 80)
    print("⚡ QUICK DATABASE STATISTICS")
    print("=" * 80)
    
    if not ENHANCED_AVAILABLE:
        print("\n❌ Enhanced RAG engine not available")
        return
    
    from rag_engine_enhanced import get_all_statistics
    
    try:
        stats = get_all_statistics()
        
        print(f"\n📊 System-Wide Statistics:")
        print(f"   Total Books: {stats['total_books']}")
        print(f"   Total Chunks: {stats['total_chunks']}")
        
        print(f"\n📚 Per-Role Breakdown:")
        print(f"   {'Role':<15} {'Books':>8} {'Chunks':>10} {'Avg/Book':>10}")
        print(f"   {'-'*15} {'-'*8} {'-'*10} {'-'*10}")
        
        for role, role_stats in stats["role_statistics"].items():
            if role_stats["books_count"] > 0:
                print(f"   {role:<15} {role_stats['books_count']:>8} "
                      f"{role_stats['chunks_count']:>10} "
                      f"{role_stats['avg_chunks_per_book']:>10.1f}")
        
    except Exception as e:
        print(f"\n❌ Error getting statistics: {e}")


def export_schema_sql():
    """Export CREATE TABLE statements for all databases."""
    print("=" * 80)
    print("📝 EXPORTING SQL SCHEMAS")
    print("=" * 80)
    
    if not ENHANCED_AVAILABLE:
        print("\n❌ Enhanced RAG engine not available")
        return
    
    output_file = BASE_DIR.parent.parent / "books" / "database_schemas.sql"
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("-- RAG Database Schemas\n")
        f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        
        for role, db_dir in ROLE_DATABASES.items():
            db_path = db_dir / "rag_catalog.db"
            
            if not db_path.exists():
                continue
            
            f.write(f"\n-- ============================================\n")
            f.write(f"-- DATABASE: {role.upper()}\n")
            f.write(f"-- Path: {db_path}\n")
            f.write(f"-- ============================================\n\n")
            
            conn = sqlite3.connect(str(db_path))
            
            try:
                # Get all CREATE statements
                cursor = conn.execute(
                    "SELECT sql FROM sqlite_master WHERE type='table' ORDER BY name"
                )
                
                for row in cursor.fetchall():
                    if row[0]:
                        f.write(row[0] + ";\n\n")
                
                # Get all CREATE INDEX statements
                cursor = conn.execute(
                    "SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY name"
                )
                
                for row in cursor.fetchall():
                    if row[0]:
                        f.write(row[0] + ";\n\n")
                
            finally:
                conn.close()
    
    print(f"\n✅ SQL schemas exported to: {output_file}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Inspect RAG databases")
    parser.add_argument("--quick", action="store_true", help="Quick statistics only")
    parser.add_argument("--export-sql", action="store_true", help="Export SQL schemas")
    parser.add_argument("--full", action="store_true", help="Full detailed inspection (default)")
    
    args = parser.parse_args()
    
    if args.quick:
        quick_stats()
    elif args.export_sql:
        export_schema_sql()
    else:
        inspect_all_databases()
