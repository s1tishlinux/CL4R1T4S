"""
RAG Response Formatter with Clear Source Attribution
Shows users exactly where answers come from: Database vs LLM Knowledge
"""

from typing import List, Dict, Any, Optional
from datetime import datetime


class RAGResponseFormatter:
    """Format RAG responses with clear source attribution"""
    
    @staticmethod
    def format_response_with_sources(
        query: str,
        retrieved_chunks: List[Dict[str, Any]],
        answer: str,
        query_time_ms: int = 0
    ) -> Dict[str, Any]:
        """
        Format response with clear indication of source:
        - If chunks found: Show they came from database with citations
        - If no chunks: Clearly mark as LLM general knowledge
        """
        
        has_database_results = len(retrieved_chunks) > 0
        
        if has_database_results:
            # Answer came from YOUR database chunks
            source_type = "database"
            source_confidence = "high"
            source_message = "✅ **Answer from YOUR Database**"
            
            # Format citations
            citations = []
            for i, chunk in enumerate(retrieved_chunks, 1):
                citations.append({
                    "citation_number": i,
                    "source": "database",
                    "book_title": chunk.get('book_title', 'Unknown'),
                    "chapter": chunk.get('chapter_title', 'Unknown Chapter'),
                    "page": chunk.get('page_number', '?'),
                    "relevance_score": chunk.get('score', 0.0),
                    "chunk_preview": chunk.get('chunk_text', '')[:200] + "...",
                    "full_text": chunk.get('chunk_text', '')
                })
            
            # Add citation markers to answer if not already present
            formatted_answer = f"""
{source_message}

{answer}

---

📚 **Sources (From Your Vector Database)**:
"""
            for cite in citations:
                formatted_answer += f"""
{cite['citation_number']}. **{cite['book_title']}**
   - Chapter: {cite['chapter']}
   - Page: {cite['page']}
   - Relevance: {cite['relevance_score']:.2%}
   - Preview: "{cite['chunk_preview']}"
"""
            
            formatted_answer += f"\n⏱️ Query Time: {query_time_ms}ms"
            
        else:
            # No database results - LLM general knowledge
            source_type = "llm_knowledge"
            source_confidence = "low"
            source_message = "⚠️ **No Database Match - Using LLM General Knowledge**"
            citations = []
            
            formatted_answer = f"""
{source_message}

Your question: "{query}"

❌ **No matching content found in your indexed books.**

The answer below is from the LLM's pre-trained knowledge (NOT your database):

{answer}

---

💡 **Recommendations**:
1. Upload relevant documents to your database
2. Use the RAG Pipeline Management to index books on this topic
3. Check if your question matches the content of indexed books

📊 **Database Status**: 0 relevant chunks found
⏱️ Query Time: {query_time_ms}ms
"""
        
        return {
            "query": query,
            "answer": formatted_answer,
            "answer_raw": answer,  # Original answer without formatting
            "source_type": source_type,  # "database" or "llm_knowledge"
            "source_confidence": source_confidence,  # "high", "medium", "low"
            "source_message": source_message,
            "has_database_results": has_database_results,
            "citations": citations,
            "chunk_count": len(retrieved_chunks),
            "query_time_ms": query_time_ms,
            "timestamp": datetime.now().isoformat()
        }
    
    @staticmethod
    def format_multi_role_response(
        query: str,
        role_results: Dict[str, List[Dict]],
        query_time_ms: int = 0
    ) -> Dict[str, Any]:
        """Format multi-role query response with per-role source attribution"""
        
        total_chunks = sum(len(docs) for docs in role_results.values())
        has_any_results = total_chunks > 0
        
        if has_any_results:
            source_message = f"✅ **Found Results Across {len(role_results)} Role Databases**"
            
            formatted_answer = f"""
{source_message}

Query: "{query}"

---

📊 **Results by Role Database**:

"""
            all_citations = []
            citation_num = 1
            
            for role, docs in role_results.items():
                if docs:
                    formatted_answer += f"\n### 🗄️ {role.upper()} Database ({len(docs)} results)\n\n"
                    
                    for doc in docs:
                        formatted_answer += f"""
{citation_num}. **{doc.get('book_title', 'Unknown')}**
   - Page: {doc.get('page_number', '?')} | Chapter: {doc.get('chapter_title', 'Unknown')}
   - Relevance: {doc.get('score', 0.0):.2%}
   - Preview: "{doc.get('chunk_text', '')[:150]}..."

"""
                        all_citations.append({
                            "citation_number": citation_num,
                            "role": role,
                            "source": "database",
                            "book_title": doc.get('book_title', 'Unknown'),
                            "chapter": doc.get('chapter_title', 'Unknown'),
                            "page": doc.get('page_number', '?'),
                            "score": doc.get('score', 0.0),
                            "chunk_preview": doc.get('chunk_text', '')[:200]
                        })
                        citation_num += 1
            
            formatted_answer += f"\n⏱️ Query Time: {query_time_ms}ms"
            
            return {
                "query": query,
                "answer": formatted_answer,
                "source_type": "database",
                "source_confidence": "high",
                "source_message": source_message,
                "has_database_results": True,
                "citations": all_citations,
                "total_chunks": total_chunks,
                "roles_queried": list(role_results.keys()),
                "query_time_ms": query_time_ms
            }
        else:
            source_message = "⚠️ **No Results in Any Database**"
            
            formatted_answer = f"""
{source_message}

Query: "{query}"

❌ **No matching content found** in any of the queried role databases:
{', '.join(role_results.keys())}

💡 **What to do**:
1. Check if relevant books are indexed in these databases
2. Use Database Inspector (Tab 6) to see what content is available
3. Upload documents using RAG Pipeline Management
4. Try simpler or broader search terms

📊 Queried {len(role_results)} databases, found 0 chunks
⏱️ Query Time: {query_time_ms}ms
"""
            
            return {
                "query": query,
                "answer": formatted_answer,
                "source_type": "no_results",
                "source_confidence": "none",
                "source_message": source_message,
                "has_database_results": False,
                "citations": [],
                "total_chunks": 0,
                "roles_queried": list(role_results.keys()),
                "query_time_ms": query_time_ms
            }
    
    @staticmethod
    def create_citation_html(citations: List[Dict]) -> str:
        """Create HTML formatted citations for web display"""
        
        if not citations:
            return "<p>⚠️ No citations available (no database results)</p>"
        
        html = '<div class="citations-container">'
        html += '<h3>📚 Sources from Your Database</h3>'
        
        for cite in citations:
            html += f'''
<div class="citation-card" style="border-left: 3px solid #6366f1; padding: 1rem; margin: 1rem 0; background: rgba(99, 102, 241, 0.05);">
  <div style="font-weight: 700; margin-bottom: 0.5rem;">
    [{cite['citation_number']}] {cite['book_title']}
  </div>
  <div style="font-size: 0.85rem; color: var(--text-secondary);">
    <strong>Chapter:</strong> {cite['chapter']} | 
    <strong>Page:</strong> {cite['page']}
    {' | <strong>Role:</strong> ' + cite.get('role', 'N/A') if 'role' in cite else ''}
  </div>
  <div style="font-size: 0.85rem; margin-top: 0.5rem; color: var(--text-secondary);">
    <strong>Relevance:</strong> {cite.get('relevance_score', cite.get('score', 0)) * 100:.1f}%
  </div>
  <div style="margin-top: 0.75rem; font-style: italic; font-size: 0.9rem;">
    "{cite.get('chunk_preview', '')}"
  </div>
</div>
'''
        
        html += '</div>'
        return html


# Convenience functions
def format_rag_response(query: str, chunks: List[Dict], answer: str, query_time_ms: int = 0) -> Dict:
    """Quick format for single-role RAG response"""
    formatter = RAGResponseFormatter()
    return formatter.format_response_with_sources(query, chunks, answer, query_time_ms)


def format_multi_role_response(query: str, role_results: Dict, query_time_ms: int = 0) -> Dict:
    """Quick format for multi-role RAG response"""
    formatter = RAGResponseFormatter()
    return formatter.format_multi_role_response(query, role_results, query_time_ms)
