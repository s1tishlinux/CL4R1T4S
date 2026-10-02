# OmniStudio Academy: Agent Prompts Repository

This directory contains dedicated, specialized system prompt files for every role agent within the platform.

## Directory Structure

```
agent-studio/prompts/agents/
├── supervisor_orchestrator_agent.md   # Master Supervisor & Multi-Agent Orchestrator
├── devops_specialist_agent.md         # DevOps, Docker, CI/CD & IaC Specialist
├── kubernetes_architect_agent.md      # Kubernetes & Cloud-Native Architect
├── genai_architect_agent.md           # Generative AI, LLMs, RAG & vLLM Architect
├── agentic_ai_specialist_agent.md     # Autonomous Multi-Agent & ReAct Specialist
├── mlops_engineer_agent.md            # MLOps, MLflow, Drift & Feature Store Engineer
├── aws_cloud_architect_agent.md       # AWS Cloud Solutions & IAM Architect
├── python_specialist_agent.md         # Python Software Architect & AsyncIO Engineer
├── linux_administrator_agent.md       # Linux Administrator & Kernel Systems Engineer
├── data_science_specialist_agent.md   # Data Science, EDA & Statistics Specialist
├── machine_learning_engineer_agent.md # ML Engineer, PyTorch & Algorithm Specialist
└── technical_architect_agent.md       # Principal Technical & System Design Architect
```

## How It Works

1. **Modular Agent Directives**: Each file specifies the agent's identity, connected vector catalog (`books/vectors/<role>/rag_catalog.db`), core competencies, formatting guidelines, and anti-hallucination standards.
2. **Dynamic Loading (`prompt_manager.py`)**: The server dynamically loads prompts on demand and synthesizes composite multi-agent prompts when queries touch multiple domains.
3. **API Access**: 
   - `GET /api/prompts/agents`: Returns metadata and content for all agent prompts.
   - `POST /api/multi_role_query`: Dynamically injects the corresponding agent prompt into the synthesis pipeline.
