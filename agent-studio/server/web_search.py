"""
Zero-Key Live Web Search Engine for OmniStudio Agent Chatbot.
Executes real-time searches via DuckDuckGo HTML parser with Wikipedia API fallback.
Returns structured titles, snippets, source URLs, and domains for factual LLM grounding.
"""

import html
import json
import logging
import re
import urllib.parse
import urllib.request

logger = logging.getLogger("web_search")

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.8",
}

def clean_ddg_url(raw_url: str) -> str:
    """Extract destination URL from DuckDuckGo redirect link."""
    if "uddg=" in raw_url:
        m = re.search(r"uddg=([^&]+)", raw_url)
        if m:
            return urllib.parse.unquote(m.group(1))
    if raw_url.startswith("//"):
        return "https:" + raw_url
    return raw_url

def extract_domain(url: str) -> str:
    """Extract clean domain name for UI citation chips."""
    try:
        parsed = urllib.parse.urlparse(url)
        netloc = parsed.netloc or parsed.path.split("/")[0]
        return netloc.replace("www.", "")
    except Exception:
        return "web"

def search_duckduckgo(query: str, max_results: int = 5) -> list:
    """Fetch live web results from DuckDuckGo HTML endpoint without API keys."""
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers=DEFAULT_HEADERS)
    
    with urllib.request.urlopen(req, timeout=8) as resp:
        content = resp.read().decode("utf-8", errors="replace")

    blocks = re.findall(
        r"(<div[^>]*class=\"[^\"]*web-result[^\"]*\"[^>]*>.*?)(?=<div[^>]*class=\"[^\"]*web-result[^\"]*\"|$)",
        content,
        re.DOTALL
    )

    results = []
    for b in blocks:
        title_m = re.search(r"<a[^>]*class=\"[^\"]*result__a[^\"]*\"[^>]*href=\"([^\"]+)\"[^>]*>(.*?)</a>", b, re.DOTALL)
        snippet_m = re.search(r"<a[^>]*class=\"[^\"]*result__snippet[^\"]*\"[^>]*>(.*?)</a>", b, re.DOTALL)
        
        if title_m:
            target_url = clean_ddg_url(title_m.group(1))
            title = html.unescape(re.sub(r"<[^>]+>", "", title_m.group(2))).strip()
            snippet = ""
            if snippet_m:
                snippet = html.unescape(re.sub(r"<[^>]+>", "", snippet_m.group(1))).strip()
                
            if title and target_url.startswith("http"):
                results.append({
                    "title": title,
                    "url": target_url,
                    "domain": extract_domain(target_url),
                    "snippet": snippet,
                    "source": "duckduckgo"
                })
        if len(results) >= max_results:
            break

    return results

def search_wikipedia(query: str, max_results: int = 3) -> list:
    """Fallback search using Wikipedia Open API."""
    try:
        api_url = (
            "https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch="
            + urllib.parse.quote(query)
            + "&format=json&utf8=1&srlimit="
            + str(max_results)
        )
        req = urllib.request.Request(api_url, headers=DEFAULT_HEADERS)
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            search_items = data.get("query", {}).get("search", [])
            
            results = []
            for item in search_items:
                title = item.get("title", "")
                snippet = html.unescape(re.sub(r"<[^>]+>", "", item.get("snippet", ""))).strip()
                page_url = f"https://en.wikipedia.org/wiki/{urllib.parse.quote(title.replace(' ', '_'))}"
                results.append({
                    "title": f"{title} - Wikipedia",
                    "url": page_url,
                    "domain": "wikipedia.org",
                    "snippet": snippet,
                    "source": "wikipedia"
                })
            return results
    except Exception as e:
        logger.warning(f"Wikipedia fallback failed: {e}")
        return []

def search_web(query: str, max_results: int = 5) -> dict:
    """
    Main web search tool entrypoint.
    Executes real-time search and returns formatted snippets and citation metadata.
    """
    query = (query or "").strip()
    if not query:
        return {"status": "error", "error": "Query cannot be empty", "results": []}

    results = []
    # Primary: DuckDuckGo
    try:
        results = search_duckduckgo(query, max_results=max_results)
    except Exception as e:
        logger.warning(f"DuckDuckGo search error: {e}")

    # Fallback: Wikipedia if results are empty
    if not results:
        try:
            results = search_wikipedia(query, max_results=max_results)
        except Exception as e:
            logger.warning(f"Secondary search error: {e}")

    # Format synthesis context for LLM prompt injection
    context_lines = []
    for idx, r in enumerate(results, 1):
        context_lines.append(f"[{idx}] Title: {r['title']}\n    URL: {r['url']}\n    Snippet: {r['snippet']}")

    formatted_context = "\n\n".join(context_lines)

    return {
        "status": "success",
        "query": query,
        "count": len(results),
        "results": results,
        "context_text": formatted_context
    }


if __name__ == "__main__":
    import sys
    test_q = sys.argv[1] if len(sys.argv) > 1 else "LangGraph multi agent patterns 2026"
    print(f"Searching web for: {test_q}...")
    res = search_web(test_q, 3)
    print(json.dumps(res, indent=2))
