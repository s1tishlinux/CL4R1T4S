#!/usr/bin/env python3
"""
📚 Enhanced Book Indexing with Role-Based Vector Stores
Uses LangChain RecursiveCharacterTextSplitter and role-specific databases
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, List

# Add server directory to path
SCRIPT_DIR = Path(__file__).parent.resolve()
REPO_ROOT = SCRIPT_DIR.parent
SERVER_DIR = REPO_ROOT / "agent-studio" / "server"
sys.path.insert(0, str(SERVER_DIR))

try:
    from rag_engine_enhanced import (
        index_book_to_role,
        get_all_statistics,
        ROLE_DATABASES,
        HybridChunkingStrategy
    )
    ENHANCED_RAG_AVAILABLE = True
except ImportError as e:
    print(f"[ERROR] Could not import enhanced RAG: {e}")
    ENHANCED_RAG_AVAILABLE = False
    sys.exit(1)


# ==============================================================================
# Book-to-Role Mapping
# ==============================================================================

BOOK_ROLE_MAPPING = {
    # DevOps books
    "DevOps": {
        "role": "devops",
        "patterns": ["devops", "ci/cd", "jenkins", "docker", "terraform", "ansible"],
        "category": "devops-infrastructure"
    },
    
    # Python books
    "Python": {
        "role": "python",
        "patterns": ["python", "pandas", "numpy", "flask", "django"],
        "category": "programming"
    },
    
    # Kubernetes books
    "Kubernetes": {
        "role": "kubernetes",
        "patterns": ["kubernetes", "k8s", "kubectl", "helm", "pod", "service"],
        "category": "container-orchestration"
    },
    
    # GenAI books
    "GenAI": {
        "role": "genai",
        "patterns": ["genai", "llm", "gpt", "prompt", "embedding", "transformer"],
        "category": "generative-ai"
    },
    
    # MLOps books
    "MLOps": {
        "role": "mlops",
        "patterns": ["mlops", "mlflow", "kubeflow", "model deployment", "monitoring"],
        "category": "ml-operations"
    },
}


def detect_role_from_filename(filename: str, folder: str) -> str:
    """Detect technical role from filename and folder."""
    filename_lower = filename.lower()
    
    # Check folder-based mapping first
    if folder in BOOK_ROLE_MAPPING:
        return BOOK_ROLE_MAPPING[folder]["role"]
    
    # Keyword-based detection
    if any(kw in filename_lower for kw in ["kubernetes", "k8s"]):
        return "kubernetes"
    elif any(kw in filename_lower for kw in ["devops", "jenkins", "docker", "ci/cd"]):
        return "devops"
    elif any(kw in filename_lower for kw in ["python"]):
        return "python"
    elif any(kw in filename_lower for kw in ["llm", "genai", "gpt", "prompt"]):
        return "genai"
    elif any(kw in filename_lower for kw in ["mlops", "mlflow"]):
        return "mlops"
    elif any(kw in filename_lower for kw in ["ml", "machine learning", "model"]):
        return "mle"
    elif any(kw in filename_lower for kw in ["data science", "pandas", "visualization"]):
        return "data_science"
    elif any(kw in filename_lower for kw in ["aws", "cloud", "s3", "lambda"]):
        return "aws_cloud"
    elif any(kw in filename_lower for kw in ["linux", "bash", "shell"]):
        return "linux"
    elif any(kw in filename_lower for kw in ["agent", "langgraph", "agentic"]):
        return "agentic_ai"
    
    return "general"


def detect_category_from_role(role: str) -> str:
    """Map role to category."""
    role_category_map = {
        "devops": "devops-infrastructure",
        "kubernetes": "container-orchestration",
        "python": "programming",
        "genai": "generative-ai",
        "agentic_ai": "agentic-systems",
        "mle": "machine-learning",
        "mlops": "ml-operations",
        "data_science": "data-analytics",
        "aws_cloud": "cloud-computing",
        "linux": "system-administration",
        "general": "technical-documentation"
    }
    return role_category_map.get(role, "technical-documentation")


# ==============================================================================
# Indexing Functions
# ==============================================================================

def index_books_by_folder(
    books_dir: Path,
    folder_name: str,
    role: str
) -> Dict[str, any]:
    """Index all books in a specific folder."""
    folder_path = books_dir / folder_name
    
    if not folder_path.exists():
        return {
            "folder": folder_name,
            "role": role,
            "status": "skipped",
            "reason": "folder not found"
        }
    
    indexed = []
    errors = []
    
    print(f"\n📁 Processing {folder_name}/ (Role: {role})")
    print("=" * 70)
    
    # Find all PDFs
    pdf_files = list(folder_path.glob("*.pdf"))
    
    for pdf_file in pdf_files:
        book_id = f"{role}_{pdf_file.stem.lower().replace(' ', '_').replace('-', '_')}"
        title = pdf_file.stem.replace("_", " ").replace("-", " ").title()
        category = detect_category_from_role(role)
        
        print(f"\n📚 {title}")
        print(f"   File: {pdf_file.name}")
        print(f"   Role: {role}")
        print(f"   ID: {book_id}")
        
        try:
            result = index_book_to_role(
                book_id=book_id,
                title=title,
                file_path=str(pdf_file),
                role=role,
                category=category,
                author="Technical Community",
                metadata={
                    "source_folder": folder_name,
                    "original_filename": pdf_file.name,
                    "file_size_mb": round(pdf_file.stat().st_size / (1024 * 1024), 2)
                }
            )
            
            indexed.append({
                "book_id": book_id,
                "title": title,
                "role": role,
                "chunks": result["total_chunks"],
                "pages": result["total_pages"],
                "file": pdf_file.name
            })
            
            print(f"   ✅ Indexed: {result['total_chunks']} chunks from {result['total_pages']} pages")
            print(f"   📊 Strategy: {result['chunking_strategy']}")
            
        except Exception as e:
            error_msg = str(e)
            errors.append({
                "title": title,
                "file": pdf_file.name,
                "role": role,
                "error": error_msg
            })
            print(f"   ❌ Error: {error_msg}")
    
    return {
        "folder": folder_name,
        "role": role,
        "indexed": indexed,
        "errors": errors,
        "total_indexed": len(indexed),
        "total_errors": len(errors)
    }


def index_root_pdfs(books_dir: Path) -> Dict[str, any]:
    """Index PDFs in the root books directory."""
    print(f"\n📁 Processing Root PDFs")
    print("=" * 70)
    
    indexed = []
    errors = []
    
    # Find all PDFs in root (excluding folders)
    pdf_files = [f for f in books_dir.glob("*.pdf") if f.is_file()]
    
    for pdf_file in pdf_files:
        # Skip large files
        file_size_mb = pdf_file.stat().st_size / (1024 * 1024)
        if file_size_mb > 10:
            print(f"\n📚 {pdf_file.stem}")
            print(f"   ⏭️  Skipping large file ({file_size_mb:.1f} MB)")
            continue
        
        # Detect role from filename
        role = detect_role_from_filename(pdf_file.name, "")
        category = detect_category_from_role(role)
        
        book_id = f"{role}_root_{pdf_file.stem.lower().replace(' ', '_').replace('-', '_')}"
        title = pdf_file.stem.replace("_", " ").replace("-", " ").title()
        
        print(f"\n📚 {title}")
        print(f"   File: {pdf_file.name}")
        print(f"   Role: {role} (auto-detected)")
        print(f"   Size: {file_size_mb:.1f} MB")
        
        try:
            result = index_book_to_role(
                book_id=book_id,
                title=title,
                file_path=str(pdf_file),
                role=role,
                category=category,
                author="Technical Community",
                metadata={
                    "source_folder": "root",
                    "original_filename": pdf_file.name,
                    "file_size_mb": round(file_size_mb, 2),
                    "auto_detected_role": True
                }
            )
            
            indexed.append({
                "book_id": book_id,
                "title": title,
                "role": role,
                "chunks": result["total_chunks"],
                "pages": result["total_pages"],
                "file": pdf_file.name
            })
            
            print(f"   ✅ Indexed: {result['total_chunks']} chunks from {result['total_pages']} pages")
            
        except Exception as e:
            error_msg = str(e)
            errors.append({
                "title": title,
                "file": pdf_file.name,
                "role": role,
                "error": error_msg
            })
            print(f"   ❌ Error: {error_msg}")
    
    return {
        "folder": "root",
        "indexed": indexed,
        "errors": errors,
        "total_indexed": len(indexed),
        "total_errors": len(errors)
    }


def generate_report(results: List[Dict], output_file: Path):
    """Generate comprehensive indexing report."""
    total_indexed = sum(r["total_indexed"] for r in results)
    total_errors = sum(r["total_errors"] for r in results)
    
    # Group by role
    by_role = {}
    for result in results:
        for book in result.get("indexed", []):
            role = book["role"]
            if role not in by_role:
                by_role[role] = []
            by_role[role].append(book)
    
    report = {
        "timestamp": "2026-10-01",
        "total_books_indexed": total_indexed,
        "total_errors": total_errors,
        "by_role": {
            role: {
                "count": len(books),
                "total_chunks": sum(b["chunks"] for b in books),
                "books": books
            }
            for role, books in by_role.items()
        },
        "errors": [
            e for result in results for e in result.get("errors", [])
        ],
        "folders_processed": [r["folder"] for r in results]
    }
    
    # Save JSON report
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    return report


# ==============================================================================
# Main Execution
# ==============================================================================

def main():
    """Main indexing workflow."""
    print("=" * 80)
    print("📚 Enhanced Book Indexing with LangChain & Role-Based Vector Stores")
    print("=" * 80)
    
    if not ENHANCED_RAG_AVAILABLE:
        print("\n❌ Enhanced RAG engine not available")
        return
    
    # Show available roles and strategies
    print("\n🎯 Available Roles & Chunking Strategies:")
    for role, desc in HybridChunkingStrategy.list_roles().items():
        print(f"   • {role:15} - {desc}")
    
    books_dir = SCRIPT_DIR
    results = []
    
    # Index by folder
    for folder_name, config in BOOK_ROLE_MAPPING.items():
        result = index_books_by_folder(
            books_dir,
            folder_name,
            config["role"]
        )
        results.append(result)
    
    # Index root PDFs
    root_result = index_root_pdfs(books_dir)
    results.append(root_result)
    
    # Generate report
    print("\n" + "=" * 80)
    print("📊 Generating Report...")
    report_file = books_dir / "indexing_report_langgraph.json"
    report = generate_report(results, report_file)
    
    # Print summary
    print("\n" + "=" * 80)
    print("✨ INDEXING COMPLETE")
    print("=" * 80)
    print(f"\n📚 Total Books Indexed: {report['total_books_indexed']}")
    print(f"❌ Total Errors: {report['total_errors']}")
    
    print("\n📊 Books by Role:")
    for role, data in report["by_role"].items():
        print(f"   • {role:15}: {data['count']:2} books, {data['total_chunks']:5} chunks")
    
    print(f"\n📄 Report saved: {report_file}")
    
    # Show database statistics
    print("\n" + "=" * 80)
    print("💾 Database Statistics:")
    print("=" * 80)
    
    try:
        stats = get_all_statistics()
        print(f"\n📚 Total Books: {stats['total_books']}")
        print(f"📄 Total Chunks: {stats['total_chunks']}")
        
        print("\n📊 Per-Role Statistics:")
        for role, role_stats in stats["role_statistics"].items():
            if role_stats["books_count"] > 0:
                print(f"\n   {role.upper()}:")
                print(f"      Books: {role_stats['books_count']}")
                print(f"      Chunks: {role_stats['chunks_count']}")
                print(f"      Avg chunks/book: {role_stats['avg_chunks_per_book']}")
    except Exception as e:
        print(f"   ⚠️  Could not fetch statistics: {e}")
    
    print("\n" + "=" * 80)
    print("🎉 Ready for Agentic RAG Queries!")
    print("=" * 80)
    print("\nNext steps:")
    print("  1. Test queries: python agentic_rag_langgraph.py")
    print("  2. Start server: cd server && python serve.py")
    print("  3. Open Academy: http://localhost:3300")


if __name__ == "__main__":
    main()
