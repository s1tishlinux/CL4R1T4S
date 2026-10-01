#!/usr/bin/env python3
"""
Automated Book Indexing Script for CL4R1T4S RAG Engine
Scans /books directory and indexes all PDFs into the vector database
"""

import os
import sys
import json
from pathlib import Path

# Add parent directory to path to import rag_engine
SCRIPT_DIR = Path(__file__).parent.resolve()
REPO_ROOT = SCRIPT_DIR.parent
SERVER_DIR = REPO_ROOT / "agent-studio" / "server"
sys.path.insert(0, str(SERVER_DIR))

from rag_engine import index_book

# Category mappings
CATEGORY_MAP = {
    "DevOps": "devops-cloud",
    "Python": "programming",
    "Kubernetes": "devops-cloud",
    "GenAI": "ai-ml",
    "MLOps": "ai-ml",
}

def scan_and_index_books():
    """Scan books directory and index all PDFs"""
    books_dir = SCRIPT_DIR
    indexed = []
    errors = []
    
    print("🔍 Scanning for PDF books...")
    
    # Scan each category directory
    for category, rag_category in CATEGORY_MAP.items():
        cat_dir = books_dir / category
        if not cat_dir.exists():
            print(f"⚠️  Category directory not found: {category}")
            continue
        
        print(f"\n📁 Processing {category}...")
        
        # Find all PDFs in this category
        for pdf_file in cat_dir.glob("*.pdf"):
            book_id = pdf_file.stem.lower().replace(" ", "-").replace("_", "-")
            title = pdf_file.stem.replace("_", " ").replace("-", " ").title()
            
            print(f"  📚 Indexing: {title}")
            
            try:
                result = index_book(
                    book_id=book_id,
                    title=title,
                    file_path=str(pdf_file),
                    category=rag_category,
                    author="Technical Community",
                    metadata={
                        "category_folder": category,
                        "file_size": pdf_file.stat().st_size,
                        "indexed_date": "2026-10-01"
                    }
                )
                
                if result and result.get("status") == "success":
                    indexed.append({
                        "title": title,
                        "book_id": book_id,
                        "category": category,
                        "file": pdf_file.name
                    })
                    print(f"  ✅ Success: {result.get('chunks', 0)} chunks indexed")
                else:
                    error_msg = result.get("error", "Unknown error") if result else "No result"
                    errors.append({
                        "title": title,
                        "file": pdf_file.name,
                        "error": error_msg
                    })
                    print(f"  ❌ Error: {error_msg}")
                    
            except Exception as e:
                errors.append({
                    "title": title,
                    "file": pdf_file.name,
                    "error": str(e)
                })
                print(f"  ❌ Exception: {e}")
    
    # Also index root-level PDFs (like IIT Patna curriculum)
    print(f"\n📁 Processing root-level PDFs...")
    for pdf_file in books_dir.glob("*.pdf"):
        book_id = pdf_file.stem.lower().replace(" ", "-")
        title = pdf_file.stem.replace("-", " ").replace("_", " ").title()
        
        # Skip large files that were excluded from git
        if pdf_file.stat().st_size > 10 * 1024 * 1024:  # > 10MB
            print(f"  ⏭️  Skipping large file: {title} ({pdf_file.stat().st_size / 1024 / 1024:.1f} MB)")
            continue
        
        print(f"  📚 Indexing: {title}")
        
        try:
            # Determine category from filename
            filename_lower = pdf_file.name.lower()
            if "genai" in filename_lower or "llm" in filename_lower:
                rag_category = "ai-ml"
            elif "devops" in filename_lower:
                rag_category = "devops-cloud"
            elif "data-science" in filename_lower or "ml" in filename_lower:
                rag_category = "ai-ml"
            else:
                rag_category = "general"
            
            result = index_book(
                book_id=book_id,
                title=title,
                file_path=str(pdf_file),
                category=rag_category,
                author="Technical Community",
                metadata={
                    "category_folder": "root",
                    "file_size": pdf_file.stat().st_size,
                    "indexed_date": "2026-10-01"
                }
            )
            
            if result and result.get("status") == "success":
                indexed.append({
                    "title": title,
                    "book_id": book_id,
                    "category": "root",
                    "file": pdf_file.name
                })
                print(f"  ✅ Success: {result.get('chunks', 0)} chunks indexed")
            else:
                error_msg = result.get("error", "Unknown error") if result else "No result"
                errors.append({
                    "title": title,
                    "file": pdf_file.name,
                    "error": error_msg
                })
                print(f"  ❌ Error: {error_msg}")
                
        except Exception as e:
            errors.append({
                "title": title,
                "file": pdf_file.name,
                "error": str(e)
            })
            print(f"  ❌ Exception: {e}")
    
    # Save indexing report
    report = {
        "timestamp": "2026-10-01",
        "total_indexed": len(indexed),
        "total_errors": len(errors),
        "indexed_books": indexed,
        "errors": errors
    }
    
    report_file = books_dir / "indexing_report.json"
    with open(report_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print("\n" + "="*60)
    print(f"✨ Indexing Complete!")
    print(f"  📚 Successfully indexed: {len(indexed)} books")
    print(f"  ❌ Errors: {len(errors)} books")
    print(f"  📄 Report saved: {report_file}")
    print("="*60)
    
    return report

if __name__ == "__main__":
    report = scan_and_index_books()
    
    if report["total_errors"] > 0:
        print("\n⚠️  Some books failed to index. Check indexing_report.json for details.")
        sys.exit(1)
    else:
        print("\n🎉 All books indexed successfully!")
        sys.exit(0)
