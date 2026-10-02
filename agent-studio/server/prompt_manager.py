"""
Prompt Manager for OmniStudio Academy Agent System
Loads, caches, and formats domain-specific system prompts for each specialized role agent.
"""

import os
from pathlib import Path
from typing import Dict, Any, List, Optional

SERVER_DIR = Path(__file__).resolve().parent
STUDIO_DIR = SERVER_DIR.parent
PROMPTS_DIR = STUDIO_DIR / "prompts" / "agents"

# Mapping from internal role identifier to prompt filename
ROLE_PROMPT_FILES = {
    "supervisor": "supervisor_orchestrator_agent.md",
    "devops": "devops_specialist_agent.md",
    "kubernetes": "kubernetes_architect_agent.md",
    "genai": "genai_architect_agent.md",
    "agentic_ai": "agentic_ai_specialist_agent.md",
    "mlops": "mlops_engineer_agent.md",
    "aws_cloud": "aws_cloud_architect_agent.md",
    "python": "python_specialist_agent.md",
    "linux": "linux_administrator_agent.md",
    "data_science": "data_science_specialist_agent.md",
    "mle": "machine_learning_engineer_agent.md",
    "general": "technical_architect_agent.md"
}

_PROMPT_CACHE: Dict[str, str] = {}


def load_agent_prompt(role: str) -> str:
    """Load the system prompt text for a specific agent role."""
    role_key = role.lower()
    if role_key in _PROMPT_CACHE:
        return _PROMPT_CACHE[role_key]

    filename = ROLE_PROMPT_FILES.get(role_key)
    if not filename:
        filename = ROLE_PROMPT_FILES.get("supervisor", "supervisor_orchestrator_agent.md")

    prompt_path = PROMPTS_DIR / filename
    if prompt_path.is_file():
        try:
            content = prompt_path.read_text(encoding="utf-8").strip()
            _PROMPT_CACHE[role_key] = content
            return content
        except Exception as e:
            return f"Error loading prompt file for {role}: {e}"
    
    return f"You are a specialized {role.replace('_', ' ').title()} Technical Agent."


def get_all_agent_prompts() -> List[Dict[str, Any]]:
    """Enumerate all available agent prompt files with metadata."""
    results = []
    PROMPTS_DIR.mkdir(parents=True, exist_ok=True)

    for role_id, filename in ROLE_PROMPT_FILES.items():
        file_path = PROMPTS_DIR / filename
        exists = file_path.is_file()
        content = ""
        size_bytes = 0
        if exists:
            try:
                content = file_path.read_text(encoding="utf-8").strip()
                size_bytes = len(content.encode("utf-8"))
            except Exception:
                pass

        # Extract title from markdown
        title = role_id.replace("_", " ").title() + " Agent"
        if content.startswith("#"):
            first_line = content.split("\n")[0].strip("# ").strip()
            if first_line:
                title = first_line

        results.append({
            "role": role_id,
            "filename": filename,
            "title": title,
            "relative_path": f"agent-studio/prompts/agents/{filename}",
            "absolute_path": str(file_path),
            "exists": exists,
            "size_bytes": size_bytes,
            "preview": content[:240] + "..." if len(content) > 240 else content
        })

    return results


def build_synthesized_system_prompt(roles: Optional[List[str]] = None) -> str:
    """
    Build a tailored multi-agent system prompt incorporating the directives
    of the specific specialist agents consulted in the query.
    """
    if not roles or len(roles) == 0:
        return load_agent_prompt("supervisor")

    if len(roles) == 1:
        return load_agent_prompt(roles[0])

    # Multi-agent composite prompt
    base_supervisor = load_agent_prompt("supervisor")
    specialist_sections = []

    for r in roles[:3]:  # Top 3 specialists
        p = load_agent_prompt(r)
        specialist_sections.append(f"### Specialist Persona: {r.upper()}\n{p}")

    composite = f"""{base_supervisor}

---
## ACTIVE SPECIALIST DELEGATIONS FOR THIS TASK
{chr(10).join(specialist_sections)}
"""
    return composite


if __name__ == "__main__":
    print(f"Loaded {len(ROLE_PROMPT_FILES)} agent prompt definitions from {PROMPTS_DIR}")
    for item in get_all_agent_prompts():
        print(f" - [{item['role']}] {item['filename']} ({item['size_bytes']} bytes)")
