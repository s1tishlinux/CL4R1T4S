#!/usr/bin/env python3
"""
🧪 Test Suite for Advanced Agentic RAG System
Demonstrates all features: routing, decomposition, retrieval, reranking, grading, generation, evaluation
"""

import sys
import json
import time
from pathlib import Path
from typing import Dict, List

# Add current directory to path
BASE_DIR = Path(__file__).parent.resolve()
sys.path.insert(0, str(BASE_DIR))

try:
    from agentic_rag_langgraph import (
        AgenticRAGGraph,
        run_agentic_rag,
        RouterAgent,
        DecomposerAgent,
        RetrieverAgent,
        RerankerAgent,
        GraderAgent,
        GeneratorAgent,
        EvaluatorAgent,
        LANGGRAPH_AVAILABLE
    )
    AGENTIC_RAG_AVAILABLE = True
except ImportError as e:
    print(f"[ERROR] Could not import agentic RAG: {e}")
    AGENTIC_RAG_AVAILABLE = False


# ==============================================================================
# Test Queries by Role
# ==============================================================================

TEST_QUERIES = {
    "kubernetes": [
        "What are Kubernetes best practices for production deployments?",
        "How do I configure horizontal pod autoscaling in K8s?",
        "Explain the difference between Service, Ingress, and LoadBalancer",
    ],
    
    "devops": [
        "What are the key principles of CI/CD pipelines?",
        "How to set up a Jenkins pipeline with GitHub webhooks?",
        "What are Docker multi-stage build best practices?",
    ],
    
    "python": [
        "How do Python decorators work with arguments?",
        "What's the difference between async def and def in Python?",
        "Explain Python context managers and the with statement",
    ],
    
    "genai": [
        "What is RAG (Retrieval Augmented Generation)?",
        "How does prompt engineering improve LLM outputs?",
        "Explain the difference between fine-tuning and prompt engineering",
    ],
    
    "mlops": [
        "What are MLOps best practices for model deployment?",
        "How to implement model monitoring in production?",
        "Explain the ML model lifecycle management",
    ],
    
    "data_science": [
        "What are the steps in exploratory data analysis?",
        "How to handle missing data in pandas?",
        "Explain the bias-variance tradeoff in machine learning",
    ],
    
    "general": [
        "What is the difference between DevOps and MLOps?",
        "Compare microservices and monolithic architectures",
        "How does container orchestration work?",
    ]
}


# ==============================================================================
# Test Individual Agents
# ==============================================================================

def test_router_agent():
    """Test query routing and intent classification."""
    print("\n" + "=" * 80)
    print("🧪 TEST: Router Agent")
    print("=" * 80)
    
    router = RouterAgent()
    
    test_cases = [
        "What are Kubernetes pod security policies?",
        "How to debug Python memory leaks?",
        "Compare AWS Lambda vs Google Cloud Functions",
        "Fix error: connection refused in Docker container",
    ]
    
    for query in test_cases:
        print(f"\nQuery: {query}")
        result = router.route(query)
        print(f"  Intent: {result['intent']}")
        print(f"  Role: {result['role']}")
        print(f"  Decompose: {result['needs_decomposition']}")
        print(f"  Reason: {result['reasoning']}")


def test_decomposer_agent():
    """Test query decomposition for complex questions."""
    print("\n" + "=" * 80)
    print("🧪 TEST: Decomposer Agent")
    print("=" * 80)
    
    decomposer = DecomposerAgent()
    
    complex_query = "Compare Kubernetes and Docker Swarm, and explain when to use each"
    
    print(f"\nComplex Query: {complex_query}")
    sub_queries = decomposer.decompose(complex_query, "comparison")
    
    print(f"\nSub-queries ({len(sub_queries)}):")
    for i, sq in enumerate(sub_queries, 1):
        print(f"  {i}. {sq}")


def test_retriever_agent():
    """Test hybrid retrieval (dense + BM25)."""
    print("\n" + "=" * 80)
    print("🧪 TEST: Retriever Agent (Hybrid: Dense + BM25)")
    print("=" * 80)
    
    retriever = RetrieverAgent()
    
    query = "Kubernetes best practices"
    role = "kubernetes"
    
    print(f"\nQuery: {query}")
    print(f"Role: {role}")
    print(f"Strategy: Reciprocal Rank Fusion (RRF)")
    
    try:
        docs = retriever.retrieve(query, role=role, top_k=5)
        
        print(f"\nRetrieved: {len(docs)} documents")
        
        for i, doc in enumerate(docs, 1):
            print(f"\n  [{i}] {doc.book_title}")
            print(f"      Page: {doc.page_number}")
            print(f"      Dense Score: {doc.dense_score:.4f}")
            print(f"      BM25 Score: {doc.bm25_score:.4f}")
            print(f"      Hybrid Score: {doc.hybrid_score:.4f}")
            print(f"      Content: {doc.content[:150]}...")
    
    except Exception as e:
        print(f"\n  ⚠️  Retrieval test skipped: {e}")


def test_reranker_agent():
    """Test cross-encoder reranking."""
    print("\n" + "=" * 80)
    print("🧪 TEST: Reranker Agent (Cross-Encoder)")
    print("=" * 80)
    
    from agentic_rag_langgraph import RetrievedDocument
    
    reranker = RerankerAgent()
    
    # Create mock documents
    mock_docs = [
        RetrievedDocument(
            chunk_id="doc1",
            book_id="k8s_guide",
            book_title="Kubernetes Guide",
            chapter_title="Production Best Practices",
            page_number=42,
            content="Kubernetes production deployments require proper resource limits, health checks, and monitoring. Always use readiness and liveness probes.",
            dense_score=0.78
        ),
        RetrievedDocument(
            chunk_id="doc2",
            book_id="k8s_basics",
            book_title="Kubernetes Basics",
            chapter_title="Getting Started",
            page_number=5,
            content="Kubernetes is a container orchestration platform that manages Docker containers across a cluster of machines.",
            dense_score=0.65
        ),
    ]
    
    query = "Kubernetes production deployment best practices"
    
    print(f"\nQuery: {query}")
    print(f"Documents: {len(mock_docs)}")
    
    reranked = reranker.rerank(query, mock_docs, top_k=2)
    
    print(f"\nReranked Results:")
    for i, doc in enumerate(reranked, 1):
        print(f"\n  [{i}] {doc.book_title} (Page {doc.page_number})")
        print(f"      Dense Score: {doc.dense_score:.4f}")
        print(f"      Rerank Score: {doc.rerank_score:.4f}")
        print(f"      Improvement: {((doc.rerank_score - doc.dense_score) * 100):.1f}%")


# ==============================================================================
# Test End-to-End Workflow
# ==============================================================================

def test_full_workflow(query: str, role: str = None):
    """Test complete agentic RAG workflow."""
    print("\n" + "=" * 80)
    print(f"🧪 TEST: Full Agentic RAG Workflow")
    print("=" * 80)
    
    print(f"\nQuery: {query}")
    if role:
        print(f"Role: {role}")
    
    print("\n⏳ Processing through LangGraph workflow...")
    print("   Router → [Decomposer?] → Retriever → Reranker → Grader → Generator → Evaluator")
    
    start_time = time.time()
    
    try:
        result = run_agentic_rag(query, role)
        
        elapsed = time.time() - start_time
        
        print(f"\n✅ Completed in {result['processing_time_ms']}ms (wall: {elapsed:.2f}s)")
        
        # Show workflow trace
        print(f"\n📊 Workflow Trace:")
        print(f"   {' → '.join(result['agent_trace'])}")
        
        # Show routing decisions
        print(f"\n🎯 Routing:")
        print(f"   Intent: {result.get('intent', 'N/A')}")
        print(f"   Detected Role: {result.get('detected_role', 'N/A')}")
        print(f"   Needs Decomposition: {result.get('needs_decomposition', False)}")
        
        if result.get('sub_queries'):
            print(f"\n🔀 Sub-queries ({len(result['sub_queries'])}):")
            for i, sq in enumerate(result['sub_queries'], 1):
                print(f"   {i}. {sq}")
        
        # Show retrieval stats
        print(f"\n📚 Retrieval:")
        print(f"   Retrieved: {len(result.get('retrieved_docs', []))} docs")
        print(f"   Reranked: {len(result.get('reranked_docs', []))} docs")
        print(f"   Graded: {len(result.get('graded_docs', []))} docs")
        
        # Show top documents
        if result.get('graded_docs'):
            print(f"\n📄 Top Retrieved Documents:")
            for i, doc in enumerate(result['graded_docs'][:3], 1):
                print(f"\n   [{i}] {doc.book_title}")
                print(f"       Chapter: {doc.chapter_title}")
                print(f"       Page: {doc.page_number}")
                print(f"       Relevance: {doc.relevance_score:.3f}")
                print(f"       Content: {doc.content[:200]}...")
        
        # Show citations
        if result.get('citations'):
            print(f"\n📖 Citations ({len(result['citations'])}):")
            for cite in result['citations']:
                print(f"   [{cite['id']}] {cite['book_title']} - {cite['chapter']} (p.{cite['page']})")
        
        # Show answer
        print(f"\n💬 Generated Answer:")
        print("   " + "-" * 76)
        answer_lines = result.get('answer', 'No answer generated').split('\n')
        for line in answer_lines[:15]:  # First 15 lines
            print(f"   {line}")
        if len(answer_lines) > 15:
            print(f"   ... ({len(answer_lines) - 15} more lines)")
        print("   " + "-" * 76)
        
        # Show evaluation
        eval_details = result.get('evaluation_details', {})
        print(f"\n✅ Evaluation:")
        print(f"   Grounded: {result.get('is_grounded', False)}")
        print(f"   Has Hallucination: {result.get('has_hallucination', False)}")
        print(f"   Confidence: {result.get('confidence_score', 0.0):.1%}")
        print(f"   Verdict: {eval_details.get('verdict', 'N/A')}")
        print(f"   Groundedness: {eval_details.get('groundedness', 0.0):.1%}")
        print(f"   Claims: {eval_details.get('grounded_claims', 0)}/{eval_details.get('total_claims', 0)} grounded")
        
        if eval_details.get('issues'):
            issues = [i for i in eval_details['issues'] if i]
            if issues:
                print(f"\n   ⚠️  Issues: {', '.join(issues)}")
        
        if eval_details.get('strengths'):
            strengths = [s for s in eval_details['strengths'] if s]
            if strengths:
                print(f"   ✨ Strengths: {', '.join(strengths)}")
        
        # Show errors if any
        if result.get('errors'):
            print(f"\n❌ Errors:")
            for error in result['errors']:
                print(f"   • {error}")
        
        return result
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None


# ==============================================================================
# Main Test Runner
# ==============================================================================

def main():
    """Run all tests."""
    print("=" * 80)
    print("🧪 Advanced Agentic RAG System - Test Suite")
    print("=" * 80)
    
    if not AGENTIC_RAG_AVAILABLE:
        print("\n❌ Agentic RAG system not available")
        print("   Install dependencies: pip install langgraph langchain-core")
        return
    
    if not LANGGRAPH_AVAILABLE:
        print("\n❌ LangGraph not available")
        print("   Install: pip install langgraph")
        return
    
    print("\n✅ System loaded successfully")
    
    # Test individual agents
    test_router_agent()
    test_decomposer_agent()
    test_decomposer_agent()
    test_reranker_agent()
    
    # Test full workflow with example queries
    print("\n\n" + "=" * 80)
    print("🚀 FULL WORKFLOW TESTS")
    print("=" * 80)
    
    # Test 1: Kubernetes query
    test_full_workflow(
        "What are Kubernetes best practices for production deployments?",
        role="kubernetes"
    )
    
    # Test 2: Python query
    print("\n\n")
    test_full_workflow(
        "How do Python decorators work with arguments?",
        role="python"
    )
    
    # Test 3: Complex analytical query
    print("\n\n")
    test_full_workflow(
        "Compare microservices and monolithic architectures, and explain when to use each",
        role="devops"
    )
    
    print("\n\n" + "=" * 80)
    print("✅ All tests completed!")
    print("=" * 80)


if __name__ == "__main__":
    main()
