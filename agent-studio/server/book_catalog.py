"""
Book Catalog System - Organize and list all books by category
Lightweight and optimized for small local LLM models
"""

import sqlite3
import os
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime


class BookCatalog:
    """Manage book catalog across all role databases"""
    
    ROLES = [
        'devops', 'kubernetes', 'python', 'genai', 'agentic_ai',
        'mle', 'mlops', 'data_science', 'aws_cloud', 'linux', 'general'
    ]
    
    ROLE_CATEGORIES = {
        'devops': '🚀 DevOps & CI/CD',
        'kubernetes': '☸️ Kubernetes & Container Orchestration',
        'python': '🐍 Python Development',
        'genai': '🤖 Generative AI & LLMs',
        'agentic_ai': '🎯 Agentic AI & Multi-Agent Systems',
        'mle': '🧠 Machine Learning Engineering',
        'mlops': '⚙️ MLOps & ML Infrastructure',
        'data_science': '📊 Data Science & Analytics',
        'aws_cloud': '☁️ AWS Cloud Services',
        'linux': '🐧 Linux System Administration',
        'general': '📚 General Technology & Computing'
    }
    
    def __init__(self, base_path: str = "/Users/satishgundu/CL4R1T4S-main/books"):
        self.base_path = Path(base_path)
        self.vectors_path = self.base_path / "vectors"
    
    def get_all_books(self) -> Dict[str, List[Dict]]:
        """Get all books organized by category/role"""
        catalog = {}
        total_books = 0
        total_chunks = 0
        
        for role in self.ROLES:
            db_path = self.vectors_path / role / "rag_catalog.db"
            
            if not db_path.exists():
                catalog[role] = {
                    'category': self.ROLE_CATEGORIES.get(role, role),
                    'books': [],
                    'book_count': 0,
                    'chunk_count': 0,
                    'status': 'empty'
                }
                continue
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                # Get books
                cursor.execute("""
                    SELECT 
                        book_id,
                        title,
                        author,
                        subject,
                        total_pages,
                        total_chunks,
                        indexed_at,
                        file_size
                    FROM rag_books
                    ORDER BY indexed_at DESC
                """)
                
                books = []
                for row in cursor.fetchall():
                    books.append({
                        'book_id': row[0],
                        'title': row[1],
                        'author': row[2] or 'Unknown',
                        'subject': row[3] or role,
                        'pages': row[4] or 0,
                        'chunks': row[5] or 0,
                        'indexed_at': row[6],
                        'file_size': row[7] or 0,
                        'role': role
                    })
                
                # Get total chunks for this role
                cursor.execute("SELECT COUNT(*) FROM rag_chunks")
                role_chunk_count = cursor.fetchone()[0]
                
                conn.close()
                
                catalog[role] = {
                    'category': self.ROLE_CATEGORIES.get(role, role),
                    'books': books,
                    'book_count': len(books),
                    'chunk_count': role_chunk_count,
                    'status': 'active' if books else 'empty'
                }
                
                total_books += len(books)
                total_chunks += role_chunk_count
                
            except Exception as e:
                catalog[role] = {
                    'category': self.ROLE_CATEGORIES.get(role, role),
                    'books': [],
                    'book_count': 0,
                    'chunk_count': 0,
                    'status': 'error',
                    'error': str(e)
                }
        
        return {
            'catalog': catalog,
            'summary': {
                'total_books': total_books,
                'total_chunks': total_chunks,
                'roles_with_books': len([r for r in catalog.values() if r['book_count'] > 0]),
                'empty_roles': len([r for r in catalog.values() if r['book_count'] == 0])
            }
        }
    
    def get_books_by_role(self, role: str) -> Dict[str, Any]:
        """Get books for a specific role"""
        if role not in self.ROLES:
            return {'error': f'Invalid role: {role}'}
        
        db_path = self.vectors_path / role / "rag_catalog.db"
        
        if not db_path.exists():
            return {
                'role': role,
                'category': self.ROLE_CATEGORIES.get(role, role),
                'books': [],
                'status': 'no_database'
            }
        
        try:
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    book_id, title, author, subject,
                    total_pages, total_chunks, indexed_at,
                    file_size, file_path
                FROM rag_books
                ORDER BY indexed_at DESC
            """)
            
            books = []
            for row in cursor.fetchall():
                books.append({
                    'book_id': row[0],
                    'title': row[1],
                    'author': row[2] or 'Unknown',
                    'subject': row[3] or role,
                    'pages': row[4] or 0,
                    'chunks': row[5] or 0,
                    'indexed_at': row[6],
                    'file_size': row[7] or 0,
                    'file_path': row[8]
                })
            
            conn.close()
            
            return {
                'role': role,
                'category': self.ROLE_CATEGORIES.get(role, role),
                'books': books,
                'book_count': len(books),
                'status': 'success'
            }
            
        except Exception as e:
            return {
                'role': role,
                'error': str(e),
                'status': 'error'
            }
    
    def search_books(self, search_term: str) -> List[Dict]:
        """Search for books across all roles"""
        search_term_lower = search_term.lower()
        results = []
        
        for role in self.ROLES:
            db_path = self.vectors_path / role / "rag_catalog.db"
            
            if not db_path.exists():
                continue
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT 
                        book_id, title, author, subject,
                        total_pages, total_chunks
                    FROM rag_books
                    WHERE 
                        LOWER(title) LIKE ? OR
                        LOWER(author) LIKE ? OR
                        LOWER(subject) LIKE ?
                """, (f'%{search_term_lower}%', f'%{search_term_lower}%', f'%{search_term_lower}%'))
                
                for row in cursor.fetchall():
                    results.append({
                        'book_id': row[0],
                        'title': row[1],
                        'author': row[2] or 'Unknown',
                        'subject': row[3] or role,
                        'pages': row[4] or 0,
                        'chunks': row[5] or 0,
                        'role': role,
                        'category': self.ROLE_CATEGORIES.get(role, role)
                    })
                
                conn.close()
                
            except Exception:
                continue
        
        return results
    
    def get_catalog_summary(self) -> Dict[str, Any]:
        """Get lightweight summary of catalog (optimized for performance)"""
        summary = {
            'total_roles': len(self.ROLES),
            'roles': {},
            'grand_total_books': 0,
            'grand_total_chunks': 0
        }
        
        for role in self.ROLES:
            db_path = self.vectors_path / role / "rag_catalog.db"
            
            if not db_path.exists():
                summary['roles'][role] = {
                    'category': self.ROLE_CATEGORIES.get(role, role),
                    'books': 0,
                    'chunks': 0,
                    'status': '❌ Empty'
                }
                continue
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                # Quick count queries (optimized)
                cursor.execute("SELECT COUNT(*) FROM rag_books")
                book_count = cursor.fetchone()[0]
                
                cursor.execute("SELECT COUNT(*) FROM rag_chunks")
                chunk_count = cursor.fetchone()[0]
                
                conn.close()
                
                summary['roles'][role] = {
                    'category': self.ROLE_CATEGORIES.get(role, role),
                    'books': book_count,
                    'chunks': chunk_count,
                    'status': '✅ Active' if book_count > 0 else '⚠️ Empty'
                }
                
                summary['grand_total_books'] += book_count
                summary['grand_total_chunks'] += chunk_count
                
            except Exception:
                summary['roles'][role] = {
                    'category': self.ROLE_CATEGORIES.get(role, role),
                    'books': 0,
                    'chunks': 0,
                    'status': '❌ Error'
                }
        
        return summary
    
    def export_catalog_markdown(self) -> str:
        """Export catalog as markdown for easy viewing"""
        all_books = self.get_all_books()
        catalog = all_books['catalog']
        summary = all_books['summary']
        
        md = f"""# 📚 Book Catalog - All Indexed Books

**Last Updated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## 📊 Summary

- **Total Books**: {summary['total_books']}
- **Total Chunks**: {summary['total_chunks']}
- **Active Categories**: {summary['roles_with_books']}/{len(self.ROLES)}
- **Empty Categories**: {summary['empty_roles']}

---

"""
        
        for role, data in catalog.items():
            md += f"\n## {data['category']}\n\n"
            
            if data['status'] == 'empty':
                md += "*No books indexed in this category yet.*\n\n"
                continue
            
            if data['status'] == 'error':
                md += f"*Error loading books: {data.get('error', 'Unknown')}*\n\n"
                continue
            
            md += f"**Books**: {data['book_count']} | **Chunks**: {data['chunk_count']}\n\n"
            
            for book in data['books']:
                md += f"### 📖 {book['title']}\n\n"
                md += f"- **Author**: {book['author']}\n"
                md += f"- **Pages**: {book['pages']}\n"
                md += f"- **Chunks**: {book['chunks']}\n"
                md += f"- **Indexed**: {book['indexed_at']}\n"
                md += f"- **Book ID**: `{book['book_id']}`\n\n"
        
        return md


# Convenience functions
def get_all_books():
    """Quick access to all books"""
    catalog = BookCatalog()
    return catalog.get_all_books()


def get_catalog_summary():
    """Quick access to catalog summary (lightweight)"""
    catalog = BookCatalog()
    return catalog.get_catalog_summary()


def search_books(term: str):
    """Quick book search"""
    catalog = BookCatalog()
    return catalog.search_books(term)


if __name__ == "__main__":
    # Test the catalog
    catalog = BookCatalog()
    summary = catalog.get_catalog_summary()
    
    print("📚 Book Catalog Summary")
    print("=" * 60)
    print(f"Total Books: {summary['grand_total_books']}")
    print(f"Total Chunks: {summary['grand_total_chunks']}")
    print("\nBy Category:")
    for role, data in summary['roles'].items():
        print(f"  {data['category']}: {data['books']} books, {data['chunks']} chunks [{data['status']}]")
