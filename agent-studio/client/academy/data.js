/**
 * OmniTech Academy Data Catalog
 * Comprehensive data for Role Roadmaps, Masterclasses, Simulators, Cheatsheets, and AI Textbooks.
 * Covers: DevOps, MLOps, MLE, GenAI, Agentic AI, FDE, System Design (HLD/LLD), Python, SQL, Linux, Cloud.
 */

const ACADEMY_DATA = {
  categories: [
    { id: "all", label: "All Disciplines", icon: "🌐" },
    { id: "genai-agentic", label: "GenAI & Agentic AI", icon: "🤖" },
    { id: "devops-cloud", label: "DevOps & Cloud", icon: "⚙️" },
    { id: "mlops-mle", label: "MLOps & MLE", icon: "🧠" },
    { id: "fde-data", label: "Forward Deployed & Data", icon: "🚀" },
    { id: "system-design", label: "System Design (HLD/LLD)", icon: "🏛️" },
    { id: "sql-db", label: "SQL & DB Internals", icon: "💾" },
    { id: "core-systems", label: "Python & Linux Core", icon: "⚡" }
  ],

  // 1. ROLE ROADMAPS
  roadmaps: [
    {
      id: "agentic-ai-architect",
      category: "genai-agentic",
      title: "Agentic AI Systems Architect",
      badge: "Highest Demand 2026",
      badgeType: "hot",
      duration: "14 Weeks",
      level: "Advanced",
      summary: "Master autonomous multi-agent networks, LangGraph state machines, Model Context Protocol (MCP), tool-use, and self-correcting cognitive loops.",
      icon: "🤖",
      color: "from-purple-600 to-indigo-900",
      skills: ["LangGraph", "MCP Protocol", "CrewAI", "Memory Systems", "Autonomous Tool Use", "Agent Evaluation"],
      skillsDetails: {
        "LangGraph": {
          icon: "🕸️",
          role: "Cyclic State Machine Engine",
          summary: "StateGraph architecture with TypedDict schemas, conditional edges, checkpointers (SqliteSaver), and human-in-the-loop breakpoints.",
          keyApis: ["StateGraph(AgentState)", "add_conditional_edges()", "SqliteSaver.from_conn_string()", "interrupt_before=['human_gate']"]
        },
        "MCP Protocol": {
          icon: "🔌",
          role: "Open Standard Tool & Resource Protocol",
          summary: "Model Context Protocol for connecting LLMs to external systems via JSON-RPC 2.0 over stdio/SSE transports. Exposes Tools, Resources, and Prompts.",
          keyApis: ["FastMCP('server-name')", "@mcp.tool()", "@mcp.resource()", "mcp.run(transport='stdio')"]
        },
        "CrewAI": {
          icon: "👥",
          role: "Role-Playing Agent Orchestration",
          summary: "Collaborative multi-agent teams with distinct roles, backstories, goal structures, sequential/hierarchical processes, and task delegation.",
          keyApis: ["Agent(role, goal, backstory)", "Task(description, expected_output)", "Crew(agents, tasks, process=Process.hierarchical)"]
        },
        "Memory Systems": {
          icon: "🧠",
          role: "Tri-Tier Persistent Agent Recall",
          summary: "Combines short-term in-context scratchpads, episodic vector memory (session history embeddings), and semantic knowledge graph memory stores.",
          keyApis: ["EpisodicVectorStore.search()", "WorkingMemoryBuffer", "GraphMemoryStore (Entities & Triples)"]
        },
        "Autonomous Tool Use": {
          icon: "🛠️",
          role: "Deterministic Function Calling & Recovery",
          summary: "Parallel tool calling, typed Pydantic/Zod schema enforcement, dynamic tool dispatch, and self-correcting retry loops on execution errors.",
          keyApis: ["pydantic.BaseModel", "tools=[execute_shell, read_file]", "ToolMessage(content, tool_call_id)"]
        },
        "Agent Evaluation": {
          icon: "📊",
          role: "Telemetry, Guardrails & Groundedness",
          summary: "Ragas triad metrics (Faithfulness, Answer Relevance, Context Precision), LangSmith/Phoenix distributed tracing, and prompt injection defense.",
          keyApis: ["ragas.evaluate()", "faithfulness.score()", "Phoenix.trace()", "LlamaGuard / Guardrails AI"]
        }
      },
      milestones: [
        {
          phase: "Phase 1: Foundations",
          title: "Cognitive Loops & Prompt Architecture",
          description: "ReAct pattern, Chain-of-Thought, Tool Calling APIs, Function definitions, Structured Outputs (Pydantic/Zod).",
          keyConcepts: [
            "ReAct Reasoning Cycle: Interleaving Thought (environmental modeling) → Action (tool call) → Observation (tool return) → Reflection.",
            "Deterministic Structured Outputs: Enforcing rigid JSON schemas using Pydantic v2 to eliminate model hallucination in downstream execution.",
            "OpenAPI & Function Schemas: Standardizing tool signatures with typed arguments, docstrings, and strict parameter validations.",
            "Prompt Scaffolding: Chain-of-Thought reasoning tokens, self-consistency majority voting, and zero-shot task decomposition."
          ],
          architectureDiagram: "USER QUERY\n  │\n  ▼\n┌──────────────────────────────────────────────┐\n│           Cognitive Loop (ReAct)             │\n│  1. THOUGHT: Reason over current state       │\n│  2. ACTION: Call typed tool (Pydantic validated) │\n│  3. OBSERVATION: Inspect environment output   │\n│  4. REFLECTION: Decide continue or terminate │\n└──────────────────────────────────────────────┘\n  │\n  ▼\nSTRUCTURED DECISION OUTPUT",
          codeTitle: "Pydantic v2 Structured Output & Cognitive ReAct Step",
          codeSnippet: `from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class ToolCallAction(BaseModel):
    tool: Literal["read_file", "write_file", "bash_exec", "grep_search"] = Field(description="Selected tool")
    args: dict = Field(description="Key-value arguments for tool execution")

class CognitiveStep(BaseModel):
    thought: str = Field(description="Internal reasoning and environmental observation analysis")
    action: ToolCallAction = Field(description="Action to execute")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence in this decision")
    is_terminal: bool = Field(default=False, description="True if goal achieved")

# Example Usage:
step = CognitiveStep(
    thought="Target file exists; need to inspect line range 10-50 for configuration.",
    action=ToolCallAction(tool="read_file", args={"path": "config.yaml", "start_line": 10, "end_line": 50}),
    confidence=0.96
)
print("Validated Schema Output:", step.model_dump_json(indent=2))`,
          ragQuery: "ReAct pattern cognitive loops prompt architecture structured outputs Pydantic",
          quiz: {
            question: "Why is the ReAct (Reasoning + Acting) loop superior to pure Chain-of-Thought prompting for autonomous agents?",
            options: [
              "ReAct consumes fewer tokens on trivial requests.",
              "ReAct grounds the agent's internal reasoning with real-world observations from tool executions, enabling dynamic recovery.",
              "ReAct eliminates the need for vector databases.",
              "ReAct only works with proprietary closed-source models."
            ],
            answer: 1,
            explanation: "ReAct dynamically executes tools and feeds live environment observations back into working memory, allowing agents to correct mistakes and adapt."
          },
          handsOnLab: {
            title: "Lab 1: Build a Deterministic Pydantic Agent Step",
            goal: "Define a Pydantic schema that enforces shell command whitelisting and validates JSON output from an Ollama model.",
            command: "python3 -c 'from pydantic import BaseModel; print(\"Pydantic v2 Ready\")'"
          }
        },
        {
          phase: "Phase 2: State Machines",
          title: "LangGraph & Cyclic Graphs",
          description: "State graphs, conditional routing, human-in-the-loop approvals, time-travel debugging, persistent checkpointing.",
          keyConcepts: [
            "Cyclic vs DAG Workflows: Autonomous engineering tasks require cycles (generate → test → fail → analyze → patch → re-test).",
            "StateGraph Architecture: Central TypedDict state mutated through node functions and custom reducers (e.g. operator.add).",
            "Conditional Edge Routing: Dynamic edge functions that inspect state properties to decide whether to loop, escalate, or terminate.",
            "Checkpointer Snapshots: SqliteSaver serializes state at every step to disk, enabling human approval breakpoints and time-travel replay."
          ],
          architectureDiagram: "┌──────────┐     ┌───────────┐     ┌───────────┐\n│ Planner  │ ──► │ Executor  │ ──► │ Evaluator │\n└──────────┘     └───────────┘     └─────┬─────┘\n                      ▲                   │\n                      │  [retry/patch]    │ Conditional\n                      └───────────────────┤ Routing\n                                          │\n                             [approved]   ▼\n                                        ┌─────────┐\n                                        │   END   │\n                                        └─────────┘",
          codeTitle: "LangGraph Cyclic StateGraph with SqliteSaver Checkpoint",
          codeSnippet: `from typing import TypedDict, Annotated, List
import operator
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver

class AgentState(TypedDict):
    task: str
    messages: Annotated[List[str], operator.add]
    iteration: int
    status: str

def planner(state: AgentState):
    return {"messages": ["Task decomposed into subtasks."], "iteration": 1}

def executor(state: AgentState):
    return {"messages": [f"Step {state['iteration']} executed."], "iteration": state["iteration"] + 1}

def evaluator(state: AgentState):
    # Simulate test evaluation
    if state["iteration"] > 3:
        return {"status": "SUCCESS"}
    return {"status": "RETRY"}

def should_continue(state: AgentState):
    return "end" if state["status"] == "SUCCESS" else "retry"

builder = StateGraph(AgentState)
builder.add_node("planner", planner)
builder.add_node("executor", executor)
builder.add_node("evaluator", evaluator)

builder.set_entry_point("planner")
builder.add_edge("planner", "executor")
builder.add_edge("executor", "evaluator")
builder.add_conditional_edges("evaluator", should_continue, {"retry": "executor", "end": END})

graph = builder.compile()
print("LangGraph State Machine Compiled Successfully!")`,
          ragQuery: "LangGraph state graph cyclic workflows checkpointing conditional routing SqliteSaver",
          quiz: {
            question: "What unique capability does persistent checkpointing (e.g. SqliteSaver) provide in LangGraph state graphs?",
            options: [
              "It accelerates GPU matrix multiplications.",
              "It serializes state snapshots at each node boundary, enabling human-in-the-loop pauses, crash recovery, and time-travel replay.",
              "It replaces SQLite databases with Vector stores.",
              "It eliminates the need for prompt templates."
            ],
            answer: 1,
            explanation: "Persistent checkpointing stores state after every node step, allowing execution to be safely paused for human confirmation and resumed seamlessly."
          },
          handsOnLab: {
            title: "Lab 2: Create a 3-Node Cyclic Graph",
            goal: "Implement a LangGraph state machine that retries a mock failing shell command up to 3 times before succeeding.",
            command: "python3 -c 'import langgraph; print(\"LangGraph Engine Online\")'"
          }
        },
        {
          phase: "Phase 3: Protocols & Tools",
          title: "Model Context Protocol (MCP)",
          description: "Building custom MCP servers (stdio/SSE), connecting agents to filesystem, GitHub, DBs, and Chrome DevTools.",
          keyConcepts: [
            "Open Industry Standard: Created by Anthropic to unify how AI applications connect to external tools, databases, and environments.",
            "Stdio vs SSE Transports: Stdio provides zero-network local process piping; SSE enables secure remote tool exposure over HTTP.",
            "Three Core Primitives: Tools (callable side-effects), Resources (passive data streams), Prompts (parameterized workflow templates).",
            "Ecosystem Integration: Connecting host agents directly to GitHub, PostgreSQL/SQLite, Chrome DevTools, and local filesystems."
          ],
          architectureDiagram: "┌────────────────────────────────────────────────────────┐\n│                HOST (Omni Studio / Claude)             │\n│             AI Model + Orchestrator Engine             │\n└───────────────────────────┬────────────────────────────┘\n                            │ JSON-RPC 2.0 (stdio / SSE)\n         ┌──────────────────┼──────────────────┐\n         ▼                  ▼                  ▼\n┌─────────────────┐┌─────────────────┐┌─────────────────┐\n│  Filesystem MCP ││   Database MCP  ││  DevTools MCP   │\n│  (Read/Write)   ││ (SQLite / PgSQL)││ (Browser/DOM)   │\n└─────────────────┘└─────────────────┘└─────────────────┘",
          codeTitle: "Production FastMCP Server in Python",
          codeSnippet: `from mcp.server.fastmcp import FastMCP
import sqlite3

mcp = FastMCP("Telemetry-Vector-MCP-Server")

@mcp.tool()
def inspect_vector_database(role: str) -> str:
    """Inspect book and chunk counts for a specialized role vector catalog."""
    db_path = f"books/vectors/{role}/rag_catalog.db"
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM rag_books")
        books = cur.fetchone()[0]
        cur.execute("SELECT COUNT(*) FROM rag_chunks")
        chunks = cur.fetchone()[0]
        conn.close()
        return f"Role {role}: {books} books indexed, {chunks} vector chunks online."
    except Exception as e:
        return f"Error opening catalog {role}: {str(e)}"

if __name__ == "__main__":
    mcp.run(transport="stdio")`,
          ragQuery: "Model Context Protocol MCP custom servers stdio SSE tools resources JSON-RPC",
          quiz: {
            question: "In the Model Context Protocol (MCP), what is the difference between a Tool and a Resource?",
            options: [
              "Tools are written in Python; Resources are written in TypeScript.",
              "Tools represent executable functions that cause side-effects; Resources represent read-only context data streams.",
              "Tools require an internet connection; Resources are always local.",
              "There is no difference; they are synonyms."
            ],
            answer: 1,
            explanation: "Tools are callable operations with side-effects (e.g. write file, run command), while Resources provide passive, read-only data streams (e.g. document text, database tables)."
          },
          handsOnLab: {
            title: "Lab 3: Build a Custom FastMCP Tool",
            goal: "Write an MCP tool function that checks disk usage and returns structured JSON telemetry.",
            command: "python3 -c 'import mcp; print(\"MCP Protocol SDK Ready\")'"
          }
        },
        {
          phase: "Phase 4: Multi-Agent Orchestration",
          title: "Hierarchical & Swarm Architectures",
          description: "Supervisor-worker agents, consensus voting, decentralized negotiation, subagent delegation.",
          keyConcepts: [
            "Supervisor-Worker Topology: Central planner decomposes requirements, routes subtasks to specialist workers, and reviews outputs.",
            "Specialized Worker Roles: Code Synthesizer (writes modules), Test Engineer (runs pytest/vitest), Security Auditor (scans vulnerabilities).",
            "Swarm Decentralization: Autonomous agents handing off execution directly to peer agents using typed transition tokens.",
            "Consensus & Voting Protocols: Multi-agent verification where 3 independent reviewer models vote before committing breaking changes."
          ],
          architectureDiagram: "                     ┌──────────────────┐\n                     │ Supervisor Agent │\n                     └────────┬─────────┘\n         ┌────────────────────┼────────────────────┐\n         ▼                    ▼                    ▼\n┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐\n│ Coder Subagent  │  │ Tester Subagent │  │ Auditor Subagent│\n│ (Writes Code)   │  │ (Executes Tests)│  │ (Security Scan) │\n└─────────────────┘  └─────────────────┘  └─────────────────┘",
          codeTitle: "Hierarchical Supervisor Multi-Agent Router",
          codeSnippet: `from typing import Dict, Any

class MultiAgentSupervisor:
    def __init__(self):
        self.workers = {
            "coder": "Implements clean modular code",
            "tester": "Writes & executes unit tests in terminal",
            "auditor": "Scans code for security vulnerabilities"
        }

    def route_next_step(self, context: Dict[str, Any]) -> str:
        if not context.get("code_written"):
            return "coder"
        if not context.get("tests_passed"):
            return "tester"
        if not context.get("security_verified"):
            return "auditor"
        return "COMPLETE"

# Simulation:
supervisor = MultiAgentSupervisor()
ctx = {"code_written": True, "tests_passed": False, "security_verified": False}
next_worker = supervisor.route_next_step(ctx)
print(f"Supervisor routing next subtask to: [{next_worker.upper()}]")`,
          ragQuery: "Supervisor worker multi agent orchestration swarm consensus delegation CrewAI",
          quiz: {
            question: "Why is subagent isolation (giving each agent dedicated system prompts and restricted tools) beneficial?",
            options: [
              "It increases the likelihood of prompt injection across all agents.",
              "It reduces context window clutter, minimizes tool confusion, and enforces principle of least privilege.",
              "It forces agents to run on different physical machines.",
              "It bypasses API rate limits."
            ],
            answer: 1,
            explanation: "Restricting tools and prompts per subagent keeps the context window focused, dramatically lowers hallucination rates, and limits the blast radius of any individual action."
          },
          handsOnLab: {
            title: "Lab 4: Orchestrate a 2-Agent Pair Programming Team",
            goal: "Build a mini-supervisor that delegates code generation to Agent A and review/grading to Agent B.",
            command: "python3 -c 'print(\"Multi-Agent Orchestrator Ready\")'"
          }
        },
        {
          phase: "Phase 5: Production Readiness",
          title: "Guardrails, Memory & Eval",
          description: "Semantic/Episodic memory stores (vector + graph), LangSmith/Phoenix telemetry, prompt injection defense.",
          keyConcepts: [
            "Tri-Tier Memory Systems: Short-term scratchpad buffer, episodic vector memory (session recall), and semantic knowledge graph memory.",
            "Adversarial Guardrails: Defensive prompt shields detecting jailbreaks, prompt leaks, and unauthorized bash invocation attempts.",
            "Ragas Triad Evaluation: Groundedness (faithfulness to facts), Context Relevance (precision of search), and Answer Relevance.",
            "Production Observability: Distributed tracing across LLM calls, tool execution latencies, and token cost telemetry with LangSmith/Phoenix."
          ],
          architectureDiagram: "USER INPUT ──► [Input Guardrail: Jailbreak/Injection Shield]\n                       │ (Passed)\n                       ▼\n            [Agent Cognitive Core]\n                 ▲          ▲\n    Episodic Mem │          │ Semantic Graph Store\n    (Past Runs)  ▼          ▼\n           [Output Guardrail: Pydantic Validation]\n                       │\n                       ▼\n             SAFE VERIFIED RESPONSE",
          codeTitle: "Episodic Vector Memory Recall with Cosine Similarity",
          codeSnippet: `import numpy as np

class EpisodicMemoryStore:
    def __init__(self):
        self.memories = []  # List of tuples: (text, vector_np)

    def store_episode(self, text: str, embedding: list):
        self.memories.append((text, np.array(embedding, dtype=float)))

    def recall_similar(self, query_embedding: list, top_k: int = 2):
        q = np.array(query_embedding, dtype=float)
        scored = []
        for text, m in self.memories:
            sim = np.dot(q, m) / (np.linalg.norm(q) * np.linalg.norm(m) + 1e-9)
            scored.append((sim, text))
        scored.sort(key=lambda x: x[0], reverse=True)
        return scored[:top_k]

# Initialize memory store
mem = EpisodicMemoryStore()
mem.store_episode("User prefers dark mode and Python 3.12 syntax.", [0.8, 0.2, 0.1])
mem.store_episode("User requested strict typing with Pydantic v2.", [0.1, 0.9, 0.3])

recalled = mem.recall_similar([0.15, 0.85, 0.25], top_k=1)
print("Episodic Recall:", recalled[0][1], f"(Score: {recalled[0][0]:.4f})")`,
          ragQuery: "production guardrails episodic memory evaluation LangSmith telemetry prompt injection",
          quiz: {
            question: "In the RAG Triad framework, what does Faithfulness (Groundedness) evaluate?",
            options: [
              "Whether the generated response is entertaining to read.",
              "Whether every claim in the generated answer is directly supported by retrieved context chunks, preventing hallucination.",
              "Whether the model responds within 500 milliseconds.",
              "Whether the user clicked the like button."
            ],
            answer: 1,
            explanation: "Faithfulness evaluates groundedness: ensuring that all factual assertions in the output are strictly verified by retrieved context facts."
          },
          handsOnLab: {
            title: "Lab 5: Measure Groundedness on Agent Outputs",
            goal: "Write a mini-evaluator function that compares an agent's answer against source context and flags unsupported claims.",
            command: "python3 -c 'import numpy; print(\"Telemetry & Memory Stack Ready\")'"
          }
        }
      ],
      capstoneProject: "Autonomous Full-Stack Engineer Agent with MCP tool integration, terminal execution, and git PR creation.",
      capstoneDeepDive: {
        title: "Autonomous Full-Stack Engineer Agent",
        summary: "Build an end-to-end autonomous agent that receives GitHub issue specifications, generates frontend/backend code, executes unit tests in a sandboxed terminal, applies self-correcting patches, and opens a verified Pull Request.",
        architectureSteps: [
          "1. Issue Ingestion: Host agent polls GitHub/Jira via MCP server to parse requirement tickets.",
          "2. Plan & Decompose: Supervisor decomposes ticket into Schema Migrations, API Endpoints, and React/HTML UI.",
          "3. Code Generation: Coder subagent writes files to local workspace using FastMCP filesystem tools.",
          "4. Sandboxed Execution: Tester subagent executes tests in terminal subprocess, streaming logs.",
          "5. Self-Correction Loop: If tests fail, error trace is fed into LangGraph cyclic node to patch code and re-test.",
          "6. Pull Request: Creates Git branch, commits changes, and opens a GitHub PR with full verification summary."
        ],
        requiredTools: ["FastMCP File System", "Bash Execution Sandbox", "GitHub API via MCP", "LangGraph StateGraph", "SqliteSaver Checkpointer"]
      }
    },
    {
      id: "genai-transformers-specialist",
      category: "genai-agentic",
      title: "Generative AI & LLM Systems Specialist",
      badge: "Production Core AI",
      badgeType: "hot",
      duration: "12 Weeks",
      level: "Foundational to Advanced Staff",
      summary: "Comprehensive from-scratch mastery of modern Generative AI systems: Transformer architectures, Scaled Dot-Product & Multi-Head Self-Attention, RoPE & KV-Cache, LoRA/QLoRA Parameter-Efficient Fine-Tuning, Enterprise Hybrid RAG, Vector Databases (HNSW/IVF), and Direct Preference Optimization (DPO/RLHF).",
      icon: "✨",
      color: "from-pink-600 to-rose-900",
      skills: ["Transformers", "Self-Attention", "LoRA / QLoRA", "RAG Pipelines", "Vector Databases", "DPO / RLHF"],
      ragRole: "genai",
      ragCatalog: "books/vectors/genai/rag_catalog.db",
      ragPrompts: [
        { label: "⚡ Scaled Dot-Product & GQA", query: "Scaled Dot-Product Self-Attention equation Multi-Head Grouped-Query Attention" },
        { label: "🧠 KV-Cache Memory Formula", query: "KV Cache memory footprint formula FlashAttention PagedAttention tokens" },
        { label: "🧬 LoRA Rank Decomposition", query: "LoRA Low-Rank Adaptation W0 + alpha/r BA NF4 NormalFloat4 QLoRA" },
        { label: "🔍 Hybrid RAG & Reciprocal Rank Fusion", query: "Reciprocal Rank Fusion RRF BM25 Dense vector search Cross-Encoder reranking" },
        { label: "🗄️ HNSW Vector Indexing", query: "HNSW Hierarchical Navigable Small World graph M efConstruction cosine distance" },
        { label: "⚖️ DPO Preference Loss", query: "Direct Preference Optimization DPO loss Bradley-Terry reference policy chosen rejected" }
      ],
      skillsDetails: {
        "Transformers": {
          icon: "⚡",
          role: "Decoder-Only Autoregressive Sequence Modeling",
          summary: "Master modern autoregressive decoder-only Transformer topologies (Llama 3, Mistral, GPT-4). Covers Byte-Pair Encoding (BPE), token embedding projections, Pre-LN RMSNorm, Rotary Positional Embeddings (RoPE), SwiGLU non-linear gating, and residual stream mechanics.",
          mathematics: "RMSNorm(x) = (x / sqrt(mean(x^2) + eps)) * gamma | SwiGLU(x) = (x W_gate * swish(x W_up)) W_down | RoPE: <R_m q, R_n k> = g(q, k, m-n)",
          keyApis: [
            "torch.nn.Module",
            "tiktoken.get_encoding('cl100k_base')",
            "RMSNorm(dim=4096, eps=1e-6)",
            "SwiGLU(dim=4096, hidden_dim=14336)",
            "RotaryEmbedding(dim=128, max_seq_len=8192)"
          ],
          productionGotchas: "Do not use standard LayerNorm in modern LLMs; RMSNorm eliminates mean-centering and saves 7-10% computation without accuracy loss. Always apply RoPE to Q and K before computing attention, never to V.",
          codeSnippet: `import torch
import torch.nn as nn
import torch.nn.functional as F

class RMSNorm(nn.Module):
    """Root Mean Square Layer Normalization (Llama 3 standard)."""
    def __init__(self, dim: int, eps: float = 1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        variance = x.pow(2).mean(-1, keepdim=True)
        return x * torch.rsqrt(variance + self.eps) * self.weight

class SwiGLUMLP(nn.Module):
    """Swish-Gated Linear Unit feed-forward network."""
    def __init__(self, dim: int, hidden_dim: int):
        super().__init__()
        self.w_gate = nn.Linear(dim, hidden_dim, bias=False)
        self.w_up = nn.Linear(dim, hidden_dim, bias=False)
        self.w_down = nn.Linear(hidden_dim, dim, bias=False)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.w_down(F.silu(self.w_gate(x)) * self.w_up(x))

# Test execution:
x = torch.randn(2, 16, 4096)
norm = RMSNorm(4096)
mlp = SwiGLUMLP(4096, 14336)
out = mlp(norm(x))
print("SwiGLU Output Shape:", out.shape)  # [2, 16, 4096]`
        },
        "Self-Attention": {
          icon: "🧠",
          role: "O(N^2) Context Dependency & Inference Engine",
          summary: "Deep dive into Scaled Dot-Product Attention, Multi-Head Attention (MHA), Multi-Query Attention (MQA), and Grouped-Query Attention (GQA). Learn how to implement KV-Cache for autoregressive generation and FlashAttention-2 tiling to bypass high-bandwidth GPU memory bottlenecks.",
          mathematics: "Attention(Q, K, V) = softmax((Q K^T) / sqrt(d_k) + M) V | KV-Cache: Memory = 2 * layers * kv_heads * d_k * seq_len * batch_size * bytes_per_elem",
          keyApis: [
            "torch.matmul(q, k.transpose(-2, -1))",
            "F.softmax(scores / math.sqrt(d_k), dim=-1)",
            "flash_attn_func(q, k, v, causal=True)",
            "KVCache(max_batch_size, max_seq_len)"
          ],
          productionGotchas: "Unbounded KV-Cache growth causes immediate GPU Out-Of-Memory (OOM) during multi-turn chat. Adopt Grouped-Query Attention (GQA) and PagedAttention (vLLM) to reclaim up to 80% memory.",
          codeSnippet: `import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class GroupedQueryAttention(nn.Module):
    """Grouped-Query Attention (GQA) with KV-Cache support."""
    def __init__(self, dim: int, num_q_heads: int = 32, num_kv_heads: int = 8):
        super().__init__()
        self.dim = dim
        self.num_q_heads = num_q_heads
        self.num_kv_heads = num_kv_heads
        self.head_dim = dim // num_q_heads
        self.num_queries_per_kv = num_q_heads // num_kv_heads

        self.q_proj = nn.Linear(dim, num_q_heads * self.head_dim, bias=False)
        self.k_proj = nn.Linear(dim, num_kv_heads * self.head_dim, bias=False)
        self.v_proj = nn.Linear(dim, num_kv_heads * self.head_dim, bias=False)
        self.out_proj = nn.Linear(dim, dim, bias=False)

    def forward(self, x: torch.Tensor, causal_mask: bool = True) -> torch.Tensor:
        b, seq_len, _ = x.shape
        q = self.q_proj(x).view(b, seq_len, self.num_q_heads, self.head_dim).transpose(1, 2)
        k = self.k_proj(x).view(b, seq_len, self.num_kv_heads, self.head_dim).transpose(1, 2)
        v = self.v_proj(x).view(b, seq_len, self.num_kv_heads, self.head_dim).transpose(1, 2)

        # Expand K and V heads to match Q groups
        k = k.repeat_interleave(self.num_queries_per_kv, dim=1)
        v = v.repeat_interleave(self.num_queries_per_kv, dim=1)

        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.head_dim)
        if causal_mask:
            mask = torch.triu(torch.full((seq_len, seq_len), float('-inf'), device=x.device), diagonal=1)
            scores = scores + mask

        attn_weights = F.softmax(scores, dim=-1)
        out = torch.matmul(attn_weights, v).transpose(1, 2).contiguous().view(b, seq_len, self.dim)
        return self.out_proj(out)

# Verification
gqa = GroupedQueryAttention(dim=1024, num_q_heads=16, num_kv_heads=4)
inp = torch.randn(2, 64, 1024)
res = gqa(inp)
print("GQA Output Tensor Shape:", res.shape)`
        },
        "LoRA / QLoRA": {
          icon: "🧬",
          role: "Parameter-Efficient Fine-Tuning & Quantization",
          summary: "Fine-tune 8B-70B models on consumer GPUs using Low-Rank Adaptation (LoRA) and 4-bit Quantized LoRA (QLoRA). Decomposes weight updates W = W_0 + (alpha/r)(B x A), using NormalFloat4 (NF4) quantization, Double Quantization, and Paged Optimizers.",
          mathematics: "W = W_0 + Delta W = W_0 + (alpha / r) * (B @ A) | B in R^(d x r), A in R^(r x k), r << min(d, k) | Initialized: A ~ N(0, sigma^2), B = 0",
          keyApis: [
            "peft.LoraConfig(r=16, lora_alpha=32, target_modules=['q_proj','v_proj'])",
            "peft.get_peft_model(base_model, lora_config)",
            "bitsandbytes.BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type='nf4')",
            "trl.SFTTrainer"
          ],
          productionGotchas: "Setting alpha too high causes gradient instability. Standard rule: set alpha = 2 * r. Do not quantize LoRA adapter matrices A and B; keep adapters in FP16/BF16 while base model is frozen in NF4.",
          codeSnippet: `import torch
import torch.nn as nn
import math

class LoRALinear(nn.Module):
    """Low-Rank Adaptation Linear Layer wrapper."""
    def __init__(self, base_layer: nn.Linear, r: int = 16, lora_alpha: int = 32):
        super().__init__()
        self.base_layer = base_layer
        self.r = r
        self.scaling = lora_alpha / r

        # Freeze base parameters
        self.base_layer.weight.requires_grad = False
        if self.base_layer.bias is not None:
            self.base_layer.bias.requires_grad = False

        in_features = base_layer.in_features
        out_features = base_layer.out_features

        # Low-rank decomposition matrices
        self.lora_A = nn.Parameter(torch.empty(r, in_features))
        self.lora_B = nn.Parameter(torch.zeros(out_features, r))

        # Kaiming uniform init for A, zero init for B
        nn.init.kaiming_uniform_(self.lora_A, a=math.sqrt(5))

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        base_out = self.base_layer(x)
        lora_out = (x @ self.lora_A.T @ self.lora_B.T) * self.scaling
        return base_out + lora_out

# Test LoRA savings
linear = nn.Linear(4096, 4096)
lora = LoRALinear(linear, r=16, lora_alpha=32)
base_params = sum(p.numel() for p in linear.parameters())
trainable = sum(p.numel() for p in lora.parameters() if p.requires_grad)
print(f"Base Params: {base_params:,} | Trainable LoRA Params: {trainable:,} ({trainable/base_params*100:.2f}%)")`
        },
        "RAG Pipelines": {
          icon: "🔍",
          role: "Enterprise Retrieval-Augmented Generation",
          summary: "Build enterprise RAG pipelines that surpass naive cosine search. Master Hierarchical Parent-Child Chunking, Dense + Sparse (BM25) Hybrid Search, Reciprocal Rank Fusion (RRF), Cross-Encoder Re-Ranking, and Hypothetical Document Embeddings (HyDE).",
          mathematics: "RRF(d) = sum(1 / (k + rank_m(d))) for m in {Dense, Sparse}, k=60 | CrossEncoderScore = CrossEncoder(query + [SEP] + doc_text)",
          keyApis: [
            "rank_bm25.BM25Okapi(tokenized_corpus)",
            "sentence_transformers.CrossEncoder('BAAI/bge-reranker-large')",
            "RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=80)",
            "reciprocal_rank_fusion(dense_ranks, bm25_ranks)"
          ],
          productionGotchas: "Naive vector search fails on exact keyword matching, error codes, and alphanumeric IDs. Always combine dense semantic embeddings with sparse BM25 lexical search and a cross-encoder re-ranker.",
          codeSnippet: `from collections import defaultdict
import numpy as np

def reciprocal_rank_fusion(dense_rankings, sparse_rankings, k=60):
    """Combine dense and sparse search rankings using Reciprocal Rank Fusion."""
    rrf_scores = defaultdict(float)

    for rank, doc_id in enumerate(dense_rankings):
        rrf_scores[doc_id] += 1.0 / (k + rank + 1)

    for rank, doc_id in enumerate(sparse_rankings):
        rrf_scores[doc_id] += 1.0 / (k + rank + 1)

    sorted_docs = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)
    return sorted_docs

# Example RRF calculation:
dense_results = ["doc_A", "doc_B", "doc_C", "doc_D"]
sparse_bm25 = ["doc_C", "doc_A", "doc_E", "doc_B"]
fused = reciprocal_rank_fusion(dense_results, sparse_bm25, k=60)
for rank, (doc, score) in enumerate(fused):
    print(f"Rank {rank+1}: {doc} (RRF Score: {score:.5f})")`
        },
        "Vector Databases": {
          icon: "🗄️",
          role: "High-Dimensional Indexing & ANN Topology",
          summary: "Master Approximate Nearest Neighbor (ANN) search, vector indexing topologies, and embedding storage. Understand HNSW graph construction (M, efConstruction, efSearch), Inverted File Product Quantization (IVF-PQ), distance metrics (Cosine vs Dot vs L2), and embedded engines like SQLite-vec and ChromaDB.",
          mathematics: "Cosine(u, v) = (u . v) / (||u||_2 * ||v||_2) | L2(u, v) = sqrt(sum((u_i - v_i)^2)) | HNSW greedy routing: argmin_{v in N(c)} dist(q, v)",
          keyApis: [
            "sqlite_vec.load(conn)",
            "chromadb.PersistentClient(path='./db')",
            "qdrant_client.QdrantClient(url='http://localhost:6333')",
            "index.hnsw_search(query_vec, k=10, ef_search=64)"
          ],
          productionGotchas: "Normalizing vectors to unit length (L2 norm = 1.0) converts expensive Cosine Similarity into a single high-speed Dot Product. Tuning efSearch higher increases recall but increases latency quadratically.",
          codeSnippet: `import sqlite3
import json
import math

def cosine_similarity(v1, v2):
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_v1 = math.sqrt(sum(a * a for a in v1))
    norm_v2 = math.sqrt(sum(b * b for b in v2))
    return dot / (norm_v1 * norm_v2) if norm_v1 and norm_v2 else 0.0

# Query SQLite vector catalog
conn = sqlite3.connect("books/vectors/genai/rag_catalog.db")
c = conn.cursor()
c.execute("SELECT chunk_id, chapter_title, chunk_text, embedding_json FROM rag_chunks LIMIT 10")
rows = c.fetchall()

sample_query = [0.05] * 768  # 768-dim mock query vector
scored = []
for cid, chap, text, emb_json in rows:
    emb = json.loads(emb_json)
    sim = cosine_similarity(sample_query, emb)
    scored.append((sim, chap, text[:80]))

scored.sort(reverse=True)
print("Top-1 Vector Match:", scored[0])`
        },
        "DPO / RLHF": {
          icon: "⚖️",
          role: "Post-Training Preference Alignment & Safety",
          summary: "Align Large Language Models with human preferences using Direct Preference Optimization (DPO) and Reinforcement Learning from Human Feedback (RLHF). Learn how DPO eliminates reward model and PPO instability by directly optimizing the policy over pairwise chosen (y_w) vs rejected (y_l) completions.",
          mathematics: "L_DPO(theta; pi_ref) = -E_{(x, y_w, y_l)} [ log sigma( beta * log(pi_theta(y_w|x) / pi_ref(y_w|x)) - beta * log(pi_theta(y_l|x) / pi_ref(y_l|x)) ) ]",
          keyApis: [
            "trl.DPOTrainer(model=model, ref_model=ref_model, beta=0.1)",
            "trl.DPOConfig(learning_rate=5e-7, per_device_train_batch_size=2)",
            "ragas.metrics.faithfulness.score()",
            "ragas.metrics.answer_relevancy.score()"
          ],
          productionGotchas: "A beta parameter that is too small leads to reward collapse and model drift. Keep beta between 0.05 and 0.2. Always freeze the reference model pi_ref during DPO backpropagation.",
          codeSnippet: `import torch
import torch.nn.functional as F

def dpo_loss(policy_chosen_logps, policy_rejected_logps,
             reference_chosen_logps, reference_rejected_logps, beta=0.1):
    """Compute Direct Preference Optimization (DPO) loss analytically."""
    pi_logratios = policy_chosen_logps - policy_rejected_logps
    ref_logratios = reference_chosen_logps - reference_rejected_logps
    logits = pi_logratios - ref_logratios

    losses = -F.logsigmoid(beta * logits)
    chosen_rewards = beta * (policy_chosen_logps - reference_chosen_logps).detach()
    rejected_rewards = beta * (policy_rejected_logps - reference_rejected_logps).detach()

    return losses.mean(), chosen_rewards, rejected_rewards

# Example tensor calculation:
loss, r_win, r_loss = dpo_loss(
    policy_chosen_logps=torch.tensor([-1.2, -0.8]),
    policy_rejected_logps=torch.tensor([-2.5, -2.1]),
    reference_chosen_logps=torch.tensor([-1.5, -1.0]),
    reference_rejected_logps=torch.tensor([-2.0, -1.8]),
    beta=0.1
)
print("DPO Mean Loss:", loss.item())`
        }
      },
      milestones: [
        {
          phase: "Phase 1: Foundations",
          title: "Modern Transformer Anatomy & Tokenization",
          description: "Byte-Pair Encoding, token projections, Pre-LN RMSNorm, Rotary Position Embeddings (RoPE), SwiGLU, and residual connections.",
          keyConcepts: [
            "Autoregressive Decoder-Only Topology: P(w_1...w_N) = prod P(w_t | w_1...w_t-1). Next-token generation conditioned on past context.",
            "RMSNorm (Root Mean Square Normalization): Normalizes across hidden dimensions without mean-centering, delivering 7-10% speedup over LayerNorm.",
            "Rotary Positional Embeddings (RoPE): Multiplicative complex 2D rotation preserving relative token distance invariant under inner products.",
            "SwiGLU Activation Units: Non-linear gating with Swish-activated linear units to enable expressive feature transformations in Feed-Forward layers."
          ],
          architectureDiagram: `TOKEN EMBEDDINGS (B, S, D)
       │
       ▼
 ┌───────────┐ ◄────── (Residual Stream)
 │  RMSNorm  │
 └─────┬─────┘
       ▼
 ┌───────────┐
 │ Q, K +RoPE│ ──► Scaled Dot-Product Attention
 └─────┬─────┘
       ▼
 ┌───────────┐ ◄────── (Residual Stream)
 │  RMSNorm  │
 └─────┬─────┘
       ▼
 ┌───────────┐
 │  SwiGLU   │ ──► Feed-Forward Network (dim -> 3.5x -> dim)
 └─────┬─────┘
       ▼
 NEXT-TOKEN LOGITS (B, S, Vocab_Size)`,
          codeTitle: "PyTorch RoPE Positional Encoding & RMSNorm",
          codeSnippet: `import torch
import torch.nn as nn

class RotaryPositionalEmbedding(nn.Module):
    """Rotary Positional Embedding (RoPE) for Q and K projection."""
    def __init__(self, dim: int, max_seq_len: int = 8192, base: float = 10000.0):
        super().__init__()
        self.dim = dim
        inv_freq = 1.0 / (base ** (torch.arange(0, dim, 2).float() / dim))
        t = torch.arange(max_seq_len, dtype=torch.float)
        freqs = torch.outer(t, inv_freq)
        self.register_buffer("cos", freqs.cos())
        self.register_buffer("sin", freqs.sin())

    def forward(self, q: torch.Tensor, k: torch.Tensor, seq_len: int):
        cos = self.cos[:seq_len].unsqueeze(0).unsqueeze(0)  # (1, 1, seq_len, dim/2)
        sin = self.sin[:seq_len].unsqueeze(0).unsqueeze(0)
        # Apply 2D complex rotation
        q_rot = torch.cat([-q[..., 1::2], q[..., ::2]], dim=-1)
        k_rot = torch.cat([-k[..., 1::2], k[..., ::2]], dim=-1)
        return (q * cos) + (q_rot * sin), (k * cos) + (k_rot * sin)

rope = RotaryPositionalEmbedding(dim=64)
q = torch.randn(1, 8, 16, 64)
k = torch.randn(1, 8, 16, 64)
q_out, k_out = rope(q, k, 16)
print("RoPE Q Output Shape:", q_out.shape)`,
          quiz: {
            question: "Why do modern LLMs (Llama 3, Mistral) apply Rotary Positional Embeddings (RoPE) only to Q and K, but never to V?",
            options: [
              "Because V represents content values, not positional routing keys used in dot-product attention calculation.",
              "Because V has a different hidden dimension than Q and K in standard multi-head attention.",
              "Because applying RoPE to V would require doubling GPU VRAM during backward pass.",
              "Because RoPE requires floating point numbers while V values are stored in 8-bit integers."
            ],
            correctIndex: 0,
            explanation: "In Scaled Dot-Product Attention, the positional relationship only governs attention routing weights via the dot product Q @ K^T. Value vectors V represent token representations that get weighted and aggregated, so rotating V would corrupt content semantics."
          },
          handsOnLab: {
            title: "Lab 1: Transformer Layer Parameter & Memory Profiler",
            goal: "Profile memory consumption and floating point operations (FLOPs) of a 32-layer Llama-3 style Transformer block.",
            command: "python -c \"import torch; x = torch.randn(2, 512, 4096); print('Layer Memory Allocated:', x.element_size()*x.nelement() / (1024**2), 'MB')\""
          }
        },
        {
          phase: "Phase 2: Core Math",
          title: "Scaled Dot-Product & Self-Attention Mechanisms",
          description: "Multi-Head Attention (MHA), Grouped-Query Attention (GQA), Multi-Query Attention (MQA), KV-Cache, and FlashAttention-2.",
          keyConcepts: [
            "Scaled Dot-Product Attention: Softmax(Q K^T / sqrt(d_k) + M) V. Scaling prevents softmax saturation and vanishing gradients.",
            "Grouped-Query Attention (GQA): Groups multiple Q heads into single K/V heads, achieving 8x KV-Cache memory reduction.",
            "KV-Cache Autoregressive Speedup: Storing key-value history in VRAM transforms single-token inference complexity from O(N^2) to O(N).",
            "FlashAttention-2 Kernel Tiling: Performs online softmax normalization in GPU SRAM without materializing N x N attention matrices in HBM."
          ],
          architectureDiagram: `  QUERIES (Q)       KEYS (K)
       │                │
       └───────┬────────┘
               ▼
     [ Q @ K^T / sqrt(d) ] ── (Scaled Dot-Product)
               │
               ▼
       [ Causal Mask M ]  ── (Upper-triangular -inf)
               │
               ▼
       [ Softmax (Attn) ] ──► (Attention Weights Heatmap)
               │
               ├────────────────── VALUES (V)
               ▼
       [ Attn_Weights @ V ]
               │
               ▼
         PROJECTION (O)   ──► OUT_TENSOR (B, S, D)`,
          codeTitle: "Causal Grouped-Query Attention with Dynamic KV-Cache",
          codeSnippet: `import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class FastGQA(nn.Module):
    def __init__(self, dim=1024, num_q=16, num_kv=4):
        super().__init__()
        self.head_dim = dim // num_q
        self.q = nn.Linear(dim, num_q * self.head_dim, bias=False)
        self.k = nn.Linear(dim, num_kv * self.head_dim, bias=False)
        self.v = nn.Linear(dim, num_kv * self.head_dim, bias=False)
        self.out = nn.Linear(dim, dim, bias=False)
        self.num_q = num_q
        self.num_kv = num_kv

    def forward(self, x, kv_cache=None):
        b, s, _ = x.shape
        q = self.q(x).view(b, s, self.num_q, self.head_dim).transpose(1, 2)
        k = self.k(x).view(b, s, self.num_kv, self.head_dim).transpose(1, 2)
        v = self.v(x).view(b, s, self.num_kv, self.head_dim).transpose(1, 2)

        if kv_cache is not None:
            cached_k, cached_v = kv_cache
            k = torch.cat([cached_k, k], dim=-2)
            v = torch.cat([cached_v, v], dim=-2)
        new_cache = (k, v)

        # Expand K and V across Q groups (4 queries per KV head)
        k = k.repeat_interleave(self.num_q // self.num_kv, dim=1)
        v = v.repeat_interleave(self.num_q // self.num_kv, dim=1)

        scores = torch.matmul(q, k.transpose(-2, -1)) / math.sqrt(self.head_dim)
        attn = F.softmax(scores, dim=-1)
        res = torch.matmul(attn, v).transpose(1, 2).contiguous().view(b, s, -1)
        return self.out(res), new_cache

model = FastGQA()
x = torch.randn(1, 1, 1024)
out, cache = model(x)
print("KV-Cache Key Shape:", cache[0].shape)`,
          quiz: {
            question: "What is the primary architectural advantage of Grouped-Query Attention (GQA) over standard Multi-Head Attention (MHA)?",
            options: [
              "GQA drastically reduces the GPU VRAM footprint of the KV-Cache while preserving model generation quality.",
              "GQA removes the need for positional encodings by sharing attention heads.",
              "GQA allows the model to process infinite sequence lengths without quantization.",
              "GQA eliminates the softmax step in attention calculation."
            ],
            correctIndex: 0,
            explanation: "During autoregressive text generation, storing K and V projections in the KV-Cache is the primary VRAM bottleneck. GQA shares K and V heads across clusters of Q heads, reducing KV-Cache memory consumption by 4x to 8x with minimal quality impact."
          },
          handsOnLab: {
            title: "Lab 2: Scaled Dot-Product Softmax Saturation Experiment",
            goal: "Observe gradient saturation and verify why 1/sqrt(d_k) scaling is mandatory for numerical stability.",
            command: "python -c \"import torch, math; q = torch.randn(1, 128); k = torch.randn(1, 128); print('Unscaled dot:', (q@k.T).item(), 'Scaled dot:', ((q@k.T)/math.sqrt(128)).item())\""
          }
        },
        {
          phase: "Phase 3: Efficient Adaptation",
          title: "LoRA & QLoRA Parameter-Efficient Fine-Tuning",
          description: "Rank decomposition matrices, NF4 4-bit quantization, Double Quantization, Unsloth kernels, and HuggingFace PEFT.",
          keyConcepts: [
            "Low-Rank Adaptation (LoRA): W = W_0 + (alpha/r) * (B @ A). Freezes base weights W_0 and trains only low-rank matrices A and B.",
            "NormalFloat4 (NF4) Quantization: Quantile-based 4-bit data format preserving maximum entropy for normally distributed neural weights.",
            "Double Quantization (DQ): Quantizes the block quantization constants themselves to save an extra 0.37 bits per parameter.",
            "Zero Inference Overhead: LoRA adapters can be merged back into W_0 prior to production deployment (W_merged = W_0 + alpha/r * B@A)."
          ],
          architectureDiagram: ` INPUT VECTOR (x)
         │
    ┌────┴────────────────────────┐
    ▼                             ▼
┌──────────────────┐      ┌───────────────┐
│ Frozen Weight W0 │      │  LoRA A (r*k) │ (Gaussian Init)
│  (e.g., 4096*4096)│      └───────┬───────┘
│   [FREEZE GRAD]  │              ▼
└────────┬─────────┘      ┌───────────────┐
         │                │  LoRA B (d*r) │ (Zero Init)
         │                └───────┬───────┘
         │                        ▼
         │                 * (alpha / r)
         │                        │
         └───────────┬────────────┘
                     ▼
              [ W0(x) + DeltaW(x) ] ──► OUTPUT`,
          codeTitle: "HuggingFace PEFT QLoRA Fine-Tuning Pipeline",
          codeSnippet: `from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import torch

# 1. 4-Bit NormalFloat Quantization Configuration
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    bnb_4bit_compute_dtype=torch.bfloat16
)

# 2. LoRA Adapter Configuration
peft_config = LoraConfig(
    r=16,
    lora_alpha=32,
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

print("LoRA Target Modules:", peft_config.target_modules)
print("LoRA Rank:", peft_config.r, "| Alpha:", peft_config.lora_alpha)`,
          quiz: {
            question: "Why is matrix B initialized to zero while matrix A is initialized with Gaussian random weights in LoRA?",
            options: [
              "To ensure that Delta W = (alpha/r) * B @ A equals exactly zero at the start of training, leaving model predictions unaltered.",
              "Because zero initialization prevents vanishing gradients in the base model.",
              "To allow matrix B to act as a bias term during backpropagation.",
              "Because PyTorch cannot calculate the determinant of two random matrices."
            ],
            correctIndex: 0,
            explanation: "If both A and B were initialized randomly, Delta W would add random noise to the pre-trained weights at step 0, destroying the base model's knowledge. Initializing B to 0 guarantees Delta W = 0 at the start of fine-tuning."
          },
          handsOnLab: {
            title: "Lab 3: LoRA Parameter Count & VRAM Calculator",
            goal: "Calculate exact trainable parameter percentage when adapting a 7B parameter model at rank r=16.",
            command: "python -c \"d=4096; r=16; layers=32; lora_params = 2 * d * r * 4 * layers; print('Trainable LoRA Params:', f'{lora_params:,}', 'out of 7B (~', round(lora_params/7e9*100, 3), '%)')\""
          }
        },
        {
          phase: "Phase 4: Retrieval Systems",
          title: "Production Hybrid RAG & Vector Databases",
          description: "Dense + Sparse (BM25) search, Reciprocal Rank Fusion (RRF), Cross-Encoder re-rankers, and HNSW graph indexing.",
          keyConcepts: [
            "Dense Semantic vs Sparse Lexical: Dense captures conceptual meaning; Sparse BM25 guarantees exact alphanumeric/code matching.",
            "Reciprocal Rank Fusion (RRF): Combines diverse rankings: RRF(d) = sum(1 / (k + rank_m(d))). Robust against score scale disparities.",
            "Cross-Encoder Re-Ranking: Ingests (query, doc) pairs into full cross-attention to score document relevance with top-tier precision.",
            "HNSW Graph Indexing: Hierarchical Navigable Small World graphs enabling sub-10ms logarithmic Approximate Nearest Neighbor retrieval."
          ],
          architectureDiagram: `  [ USER INQUIRY ]
         │
   ┌─────┴─────────────────────┐
   ▼                           ▼
[ Dense Vector Embed ]    [ Sparse BM25 Tokenize ]
   │                           │
   ▼                           ▼
(SQLite-vec ANN)          (BM25 Lexical Index)
   │                           │
   └─────────────┬─────────────┘
                 ▼
     [ Reciprocal Rank Fusion ] ──► (Top 25 Merged Candidates)
                 │
                 ▼
       [ Cross-Encoder BGE ]    ──► (Top 3 Re-ranked Contexts)
                 │
                 ▼
        [ GENERATOR LLM ]       ──► VERIFIED ANSWER`,
          codeTitle: "Production Hybrid RAG with Reciprocal Rank Fusion",
          codeSnippet: `from collections import defaultdict

class HybridRAGRetriever:
    """Hybrid Dense Vector + Sparse BM25 Retriever with RRF."""
    def __init__(self, vector_engine, bm25_engine, cross_encoder=None):
        self.vector_engine = vector_engine
        self.bm25_engine = bm25_engine
        self.cross_encoder = cross_encoder

    def retrieve(self, query: str, top_k: int = 4, rrf_k: int = 60):
        # 1. Fetch dense candidates
        dense_results = self.vector_engine.query(query, top_k=20)
        # 2. Fetch sparse candidates
        sparse_results = self.bm25_engine.query(query, top_k=20)

        # 3. Reciprocal Rank Fusion
        scores = defaultdict(float)
        doc_store = {}

        for rank, item in enumerate(dense_results):
            scores[item['id']] += 1.0 / (rrf_k + rank + 1)
            doc_store[item['id']] = item

        for rank, item in enumerate(sparse_results):
            scores[item['id']] += 1.0 / (rrf_k + rank + 1)
            doc_store[item['id']] = item

        fused = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
        return [doc_store[doc_id] for doc_id, _ in fused]

print("HybridRAGRetriever initialized with RRF k=60")`,
          quiz: {
            question: "Why does Reciprocal Rank Fusion (RRF) use rank positions (1 / (k + rank)) rather than normalized raw similarity scores?",
            options: [
              "Because BM25 scores (0 to +inf) and vector cosine scores (-1 to +1) have incompatible distributions and cannot be simply averaged.",
              "Because ranking scores require less memory to sort in SQLite.",
              "Because RRF prevents cross-encoders from overfitting.",
              "Because dot product similarity is only compatible with rank calculations."
            ],
            correctIndex: 0,
            explanation: "Raw scores from BM25 and vector embedding models have completely different probability distributions, bounds, and variances. RRF bypasses score calibration issues by relying strictly on the positional rank."
          },
          handsOnLab: {
            title: "Lab 4: SQLite-vec Vector DB Semantic Query Test",
            goal: "Execute a live 768-dimensional cosine similarity search directly against the local genai vector catalog.",
            command: "python -c \"import sqlite3; conn=sqlite3.connect('books/vectors/genai/rag_catalog.db'); print('Total Indexed Chunks:', conn.execute('SELECT count(*) FROM rag_chunks').fetchone()[0])\""
          }
        },
        {
          phase: "Phase 5: Alignment & Eval",
          title: "DPO, RLHF & RAG Triad Verification",
          description: "Direct Preference Optimization, Bradley-Terry preference model, Reference policy, and Ragas automated evaluations.",
          keyConcepts: [
            "DPO Objective: Analytically optimizes policy weights over paired chosen (y_w) vs rejected (y_l) completions without a reward model.",
            "Elimination of PPO: DPO sidesteps RL training instability, actor-critic divergence, and value function estimation errors.",
            "Implicit Reward Function: r(x, y) = beta * log(pi_theta(y|x) / pi_ref(y|x)). Direct derivation from closed-form Bradley-Terry solution.",
            "RAG Triad Evaluation: Automated quantitative scoring of Faithfulness, Answer Relevance, and Context Precision using LLM judges."
          ],
          architectureDiagram: `  PROMPT (x) ──► [ Reference Model pi_ref ] (FROZEN) ──► log pi_ref(y_w), log pi_ref(y_l)
       │
       ▼
  PROMPT (x) ──► [ Active Policy pi_theta ] (TRAINABLE) ──► log pi_theta(y_w), log pi_theta(y_l)
                                                                 │
                                                                 ▼
                                                  [ DPO Objective Loss Function ]
                                                    L_DPO = -log sigma(beta * Delta)
                                                                 │
                                                                 ▼
                                                    [ Backpropagate & Update pi_theta ]`,
          codeTitle: "Custom PyTorch DPO Loss & Evaluation Harness",
          codeSnippet: `import torch
import torch.nn.functional as F

class DirectPreferenceOptimization:
    def __init__(self, beta: float = 0.1):
        self.beta = beta

    def compute_loss(self, pi_chosen, pi_rejected, ref_chosen, ref_rejected):
        """Vectorized DPO loss calculation."""
        # Log-ratio differences between policy and reference
        pi_logratios = pi_chosen - pi_rejected
        ref_logratios = ref_chosen - ref_rejected
        logits = pi_logratios - ref_logratios

        # DPO loss is negative log sigmoid of beta * logits
        losses = -F.logsigmoid(self.beta * logits)
        return losses.mean()

dpo = DirectPreferenceOptimization(beta=0.1)
pi_c = torch.tensor([-0.4, -0.6])
pi_r = torch.tensor([-1.9, -1.8])
ref_c = torch.tensor([-0.9, -0.9])
ref_r = torch.tensor([-1.2, -1.1])
loss = dpo.compute_loss(pi_c, pi_r, ref_c, ref_r)
print("Computed DPO Batch Loss:", loss.item())`,
          quiz: {
            question: "In Direct Preference Optimization (DPO), what is the function of the beta hyperparameter?",
            options: [
              "It controls the penalty weight against diverging too far from the frozen reference policy pi_ref.",
              "It defines the learning rate of the AdamW optimizer.",
              "It dictates the number of negative samples per prompt.",
              "It scales the temperature of the output softmax distribution."
            ],
            correctIndex: 0,
            explanation: "Beta acts as the inverse temperature of the KL-divergence constraint. A higher beta forces the policy to stay strictly close to the reference model, while a lower beta allows more aggressive updates towards preferred completions."
          },
          handsOnLab: {
            title: "Lab 5: Pairwise DPO Loss Verification",
            goal: "Simulate preference gradient updates on chosen vs rejected token sequences using PyTorch.",
            command: "python -c \"import torch, torch.nn.functional as F; print('DPO Loss:', -F.logsigmoid(torch.tensor(1.8)).item())\""
          }
        }
      ],
      capstoneDeepDive: {
        title: "Enterprise High-Throughput Reasoning Engine with Hybrid RAG & LoRA Adapters",
        summary: "Architect an end-to-end production LLM reasoning and retrieval platform: Fine-tune a 4-bit QLoRA adapter on specialized domain instructions, deploy continuous serving with Grouped-Query Attention & PagedAttention, integrate a multi-stage Hybrid RAG retrieval pipeline with SQLite-vec and BGE re-rankers, and enforce safety alignment using DPO.",
        architectureSteps: [
          "1. Data Curation & Tokenization: Prepare high-quality domain instruction datasets with strict chat formatting.",
          "2. Parameter-Efficient Fine-Tuning: Fine-tune 4-bit QLoRA adapters with rank r=16 on target linear projections.",
          "3. Vector Ingestion Pipeline: Parse enterprise PDFs into hierarchical chunks and index into SQLite-vec with 768-dim embeddings.",
          "4. Hybrid Retrieval Engine: Combine BM25 sparse keyword search and dense vector KNN using Reciprocal Rank Fusion (k=60).",
          "5. Cross-Encoder Re-Ranking: Re-rank top 25 candidates down to top 3 contexts with BGE-Reranker-Large.",
          "6. DPO Alignment & Evaluation: Run Direct Preference Optimization on safety pairs and verify Context Precision > 0.90 with Ragas."
        ],
        requiredTools: [
          "PyTorch 2.4+",
          "HuggingFace PEFT & TRL",
          "SQLite-vec 768-Dim Engine",
          "BAAI/BGE-Reranker-Large",
          "Ollama Local Inference",
          "Ragas Evaluation Framework"
        ],
        testingHarnessCode: `import urllib.request
import json

def verify_system_readiness():
    print("Checking Local Vector Catalog & LLM Daemon...")
    try:
        req = urllib.request.Request(
            "http://localhost:3300/api/multi_role_query",
            data=json.dumps({"query": "Self-Attention GQA and LoRA fine-tuning", "roles": ["genai"], "top_k_per_role": 2}).encode(),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            print(f"System Ready! Vector RAG responded with {len(data.get('results', []))} ranked chunks.")
    except Exception as e:
        print("Verification error:", e)

verify_system_readiness()`
      },
      capstoneProject: "Enterprise High-Throughput Reasoning Engine with Hybrid RAG, 4-bit QLoRA Adapters, and DPO Alignment."
    },
    {
      id: "devops-cloud-architect",
      category: "devops-cloud",
      title: "Production DevOps & Cloud Architect",
      badge: "Industry Standard",
      badgeType: "standard",
      duration: "16 Weeks",
      level: "Beginner to Advanced",
      summary: "End-to-end cloud infrastructure mastery: Linux systems, Docker container internals, Kubernetes orchestration, GitOps, and Terraform.",
      icon: "⚙️",
      color: "from-cyan-600 to-blue-900",
      skills: ["Docker", "Kubernetes", "Terraform", "GitHub Actions", "ArgoCD", "Prometheus & Grafana"],
      milestones: [
        {
          phase: "Phase 1: Containers",
          title: "Docker Deep Dive & Multi-Stage Builds",
          description: "Linux namespaces, cgroups, chroot, image layer caching, security scanning (Trivy), minimal alpine/distroless bases.",
          keyConcepts: [
            "Namespaces & Cgroups: The Linux kernel primitives that isolate processes (PID, NET, MNT) and restrict resource usage (CPU, RAM).",
            "Multi-stage Builds: Compile code in a heavy image, then copy only the static binary to a scratch/distroless image to reduce attack surface and size.",
            "Layer Caching: Docker builds images layer by layer. Order matters—put infrequently changing commands (like installing OS packages) at the top.",
            "Image Scanning: Automate vulnerability scanning using tools like Trivy during the CI phase to block vulnerable images from registries."
          ],
          architectureDiagram: `  [ Developer Machine ]
         │ (Dockerfile)
         ▼
    [ Docker Build ] ──► (Trivy Security Scan) 
         │
         ▼
    [ Amazon ECR / Docker Hub ] ──► (Immutable Image Artifact)`,
          codeTitle: "Optimized Multi-Stage Dockerfile for Go Microservice",
          codeSnippet: `# Stage 1: Build
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /api-server main.go

# Stage 2: Production (Distroless)
FROM gcr.io/distroless/static-debian11
COPY --from=builder /api-server /api-server
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/api-server"]`,
          quiz: {
            question: "Why should CGO_ENABLED=0 be used when building a Go binary for a distroless static image?",
            options: [
              "It links the binary statically, ensuring it does not rely on dynamic C libraries (like glibc) which are absent in distroless images.",
              "It disables Go garbage collection to improve container startup time.",
              "It instructs the Docker daemon to ignore cache layers.",
              "It encrypts the binary during compilation."
            ],
            correctIndex: 0,
            explanation: "Distroless images strip out the OS shell, package managers, and standard C libraries (glibc/musl). A dynamically linked binary will crash immediately saying 'file not found'. CGO_ENABLED=0 forces a fully static build."
          },
          handsOnLab: {
            title: "Lab 1: Attack Surface Reduction",
            goal: "Build a standard python:3.9 image vs a python:3.9-slim image and compare vulnerabilities using Trivy.",
            command: "trivy image python:3.9 && trivy image python:3.9-slim"
          }
        },
        {
          phase: "Phase 2: Orchestration",
          title: "Production Kubernetes (K8s)",
          description: "Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, RBAC, and High Availability.",
          keyConcepts: [
            "Control Plane vs Worker Nodes: API Server, etcd, Scheduler, and Controller Manager manage the cluster state, while Kubelet on workers runs Pods.",
            "Deployments & ReplicaSets: Declarative definitions ensuring a specified number of Pods run continuously, supporting rolling updates.",
            "Services & Ingress: Services provide internal networking (ClusterIP) or NodePort. Ingress routes external HTTP/HTTPS traffic to Services.",
            "RBAC: Role-Based Access Control limits what users or service accounts can do (e.g., read pods, create deployments)."
          ],
          architectureDiagram: `       [ External Traffic ]
                │
                ▼
      ┌────────────────────┐
      │   Ingress (Nginx)  │
      └─────────┬──────────┘
                ▼
      ┌────────────────────┐
      │ Service (ClusterIP)│
      └────┬───────────┬───┘
           ▼           ▼
       [ Pod A ]   [ Pod B ]`,
          codeTitle: "Zero-Downtime Rolling Update Deployment",
          codeSnippet: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: backend-api
  template:
    metadata:
      labels:
        app: backend-api
    spec:
      containers:
      - name: api
        image: myregistry.com/api:v2.0
        ports:
        - containerPort: 8080
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10`,
          quiz: {
            question: "What is the primary function of a Readiness Probe in a Kubernetes Deployment?",
            options: [
              "It determines when a Pod is ready to start accepting network traffic from a Service.",
              "It restarts the Pod if it returns a non-200 HTTP status code.",
              "It scales up the Deployment if CPU usage exceeds the threshold.",
              "It injects secrets into the container environment variables."
            ],
            correctIndex: 0,
            explanation: "Readiness probes tell Kubernetes when a container is ready to handle requests. If the probe fails, the endpoint controller removes the Pod's IP from the Service, preventing it from receiving traffic until it recovers. Liveness probes are responsible for restarting failed pods."
          },
          handsOnLab: {
            title: "Lab 2: Rolling Update Test",
            goal: "Apply a new image version to a Deployment and watch the ReplicaSet orchestrate a zero-downtime rollout.",
            command: "kubectl set image deployment/backend-api api=myregistry.com/api:v2.1 && kubectl rollout status deployment/backend-api"
          }
        },
        {
          phase: "Phase 3: Infrastructure as Code",
          title: "Modular Terraform on AWS/GCP",
          description: "State management, remote backends, VPC design, EKS/GKE provisioning, zero-downtime blueprints.",
          keyConcepts: [
            "Declarative IaC: Define the desired state of infrastructure (HCL), and Terraform figures out the API calls to reach that state.",
            "Remote State & Locking: Store terraform.tfstate in a remote backend (e.g., S3) and use a lock table (DynamoDB) to prevent concurrent runs from corrupting state.",
            "Modules: Reusable, parameterized Terraform blocks that encapsulate complex architectures (e.g., a standard VPC with private subnets and NAT gateways).",
            "Plan & Apply: `terraform plan` shows a speculative execution plan (diff) of changes before `terraform apply` executes them."
          ],
          architectureDiagram: ` [ Developer / CI ] ──► (terraform apply)
         │
         ▼
 [ AWS API Gateway ] ◄── (TF State in S3)
         │
    ┌────┴──────────────────────────┐
    ▼                               ▼
 [ VPC / Subnets ]             [ EKS Cluster ]`,
          codeTitle: "Terraform S3 Backend with DynamoDB Locking",
          codeSnippet: `terraform {
  required_version = ">= 1.5.0"
  
  backend "s3" {
    bucket         = "company-tf-state-prod"
    key            = "infrastructure/vpc/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "prod-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false
}`,
          quiz: {
            question: "Why is a DynamoDB table used in an AWS S3 Terraform backend configuration?",
            options: [
              "To lock the state file and prevent race conditions when multiple team members run terraform apply simultaneously.",
              "To store the actual infrastructure resource metadata.",
              "To provide an indexing database for Terraform modules.",
              "To cache AWS API responses and speed up terraform plan."
            ],
            correctIndex: 0,
            explanation: "While S3 securely stores the state file, it doesn't natively support strict mutual exclusion. DynamoDB is used to acquire a state lock, ensuring only one Terraform process can modify the state at a time, preventing corruption."
          },
          handsOnLab: {
            title: "Lab 3: Destroy Safety",
            goal: "Use lifecycle { prevent_destroy = true } on a database resource and attempt a terraform destroy.",
            command: "terraform apply -auto-approve && terraform destroy"
          }
        },
        {
          phase: "Phase 4: CI/CD & GitOps",
          title: "ArgoCD & GitHub Actions",
          description: "Declarative continuous delivery, blue-green & canary deployments, automated rollbacks, Helm charts, Kustomize.",
          keyConcepts: [
            "GitOps: Git is the single source of truth for both code and infrastructure. Changes are made via Pull Requests.",
            "Pull vs Push CI/CD: Traditional CI/CD pushes to production. GitOps (ArgoCD) pulls configuration from Git and actively reconciles cluster state.",
            "Canary Releases: Roll out a new version to a small percentage of users, monitor metrics, and progressively scale up if healthy.",
            "Kustomize & Helm: Tools to template and patch Kubernetes manifests for different environments (dev, staging, prod)."
          ],
          architectureDiagram: ` [ Git Repository ] ◄── (Manifests / Helm)
         ▲
         │ (Watches for changes)
         │
    [ ArgoCD Controller (Running in K8s) ]
         │
         ▼ (Reconciles state)
    [ K8s Cluster (Deployments, Services) ]`,
          codeTitle: "ArgoCD Application Definition",
          codeSnippet: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: payment-service
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/company/payment-service-config.git'
    targetRevision: HEAD
    path: kustomize/overlays/production
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: payments
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true`,
          quiz: {
            question: "In ArgoCD, what does the 'selfHeal: true' sync policy parameter do?",
            options: [
              "It automatically overrides any manual changes made directly to the cluster, forcing it back to the state defined in Git.",
              "It restarts crashed pods automatically.",
              "It rolls back to a previous Git commit if a deployment fails a health check.",
              "It automatically scales up nodes if CPU is exhausted."
            ],
            correctIndex: 0,
            explanation: "selfHeal prevents configuration drift. If an operator manually runs 'kubectl edit' to change a deployment in the cluster, ArgoCD detects the divergence from Git and immediately overwrites the manual change to restore the GitOps state."
          },
          handsOnLab: {
            title: "Lab 4: GitOps Drift Reconciliation",
            goal: "Manually scale a deployment in K8s to 10 replicas and watch ArgoCD immediately revert it to 3 as defined in Git.",
            command: "kubectl scale deployment my-app --replicas=10 && watch kubectl get pods"
          }
        }
      ],
      capstoneDeepDive: {
        title: "Enterprise Global E-Commerce Architecture",
        summary: "Design and implement a multi-region, high-availability architecture on AWS using Terraform. Package microservices with Docker, deploy them via ArgoCD GitOps to an EKS cluster, and establish full observability with Prometheus and Grafana.",
        architectureSteps: [
          "1. Infrastructure: Provision VPCs, subnets, NAT gateways, and an EKS cluster across 3 availability zones using Terraform.",
          "2. Containerization: Write multi-stage Dockerfiles for 4 microservices, scan with Trivy, and push to ECR.",
          "3. GitOps: Set up an ArgoCD controller to watch a manifest repository and deploy Helm charts into the EKS cluster.",
          "4. Networking: Configure an AWS ALB Ingress Controller to route traffic securely to the microservices.",
          "5. Observability: Deploy the kube-prometheus-stack to monitor node metrics and set up PagerDuty alerts for high pod restarts."
        ],
        requiredTools: [
          "AWS CLI & Terraform",
          "Docker & Trivy",
          "Kubernetes (EKS)",
          "ArgoCD",
          "Prometheus / Grafana"
        ],
        testingHarnessCode: `#!/bin/bash
echo "Verifying EKS Cluster Health..."
kubectl get componentstatuses
echo "Checking ArgoCD Application Sync Status..."
argocd app get payment-service | grep "Sync Status"
echo "Simulating Node Failure..."
# Drain node to test pod rescheduling
kubectl drain $(kubectl get nodes -o jsonpath='{.items[0].metadata.name}') --ignore-daemonsets`
      },
      capstoneProject: "Production-grade multi-region Kubernetes cluster managed completely via GitOps with automated canary rollouts."
    },
    {
      id: "mlops-platform-engineer",
      category: "mlops-mle",
      title: "MLOps & ML Platform Engineer",
      badge: "High Growth",
      badgeType: "hot",
      duration: "14 Weeks",
      level: "Intermediate",
      summary: "Bridge the gap between data science and production: automated ML pipelines, model registries, feature stores, and drift monitoring.",
      icon: "🧠",
      color: "from-emerald-600 to-teal-900",
      skills: ["MLflow", "Kubeflow", "Feast", "DVC", "vLLM / Triton", "Evidently AI"],
      milestones: [
        {
          phase: "Phase 1: Experiment Tracking",
          title: "MLflow & DVC Data Versioning",
          description: "Reproducible pipelines, artifact logging, model versioning, S3 integration, Git-backed dataset tracking.",
          keyConcepts: [
            "Experiment Tracking: Centralized logging of hyperparameters, metrics, and models using MLflow to ensure reproducibility.",
            "Data Version Control (DVC): Treat data and models like code. DVC stores large files in S3/GCS while keeping lightweight pointer files in Git.",
            "Model Registry: A central repository (like MLflow Model Registry) to manage the lifecycle of ML models (Staging, Production, Archived).",
            "Artifact Store: Blob storage where the actual serialized models (e.g., .pkl, .pt, .onnx) and large artifacts are physically kept."
          ],
          architectureDiagram: ` [ Data Scientist ] ──► (Git Commit + DVC Push)
         │
         ▼
    [ MLflow Tracking Server ] ◄── (Logs params, metrics)
         │
         ▼
    [ Model Registry (Staging ➔ Production) ]`,
          codeTitle: "MLflow Tracking with DVC Data versioning",
          codeSnippet: `import mlflow
import dvc.api

# Fetch hyperparams and data paths from DVC params.yaml
params = dvc.api.params_show()

mlflow.set_tracking_uri("http://mlflow-server:5000")
mlflow.set_experiment("fraud-detection")

with mlflow.start_run():
    mlflow.log_params(params['train'])
    
    # Train model (mock)
    accuracy = 0.95
    mlflow.log_metric("accuracy", accuracy)
    
    # Log the artifact
    mlflow.sklearn.log_model(model, "model", registered_model_name="FraudModel")`,
          quiz: {
            question: "What is the primary benefit of using DVC alongside Git for Machine Learning projects?",
            options: [
              "It allows versioning of large datasets and model artifacts in remote storage (S3/GCS) while keeping Git repositories small and fast.",
              "It automatically trains models on distributed clusters.",
              "It replaces MLflow as an experiment tracking server.",
              "It compresses neural networks for deployment on edge devices."
            ],
            correctIndex: 0,
            explanation: "Git is not designed to handle large binary files or datasets (often gigabytes or terabytes). DVC solves this by storing the actual data externally and only tracking tiny text-based metadata files in Git."
          },
          handsOnLab: {
            title: "Lab 1: Model Versioning",
            goal: "Initialize a DVC repository, track a 1GB dataset, and push the artifact to a local S3 minio bucket.",
            command: "dvc init && dvc add data/dataset.csv && dvc remote add -d minio s3://mybucket/dvcstore && dvc push"
          }
        },
        {
          phase: "Phase 2: Feature Engineering at Scale",
          title: "Feast Feature Store",
          description: "Online (Redis) and offline (BigQuery/Snowflake) feature stores, point-in-time joins, preventing data leakage.",
          keyConcepts: [
            "Feature Store: A centralized system for defining, storing, and serving ML features for both training (offline) and inference (online).",
            "Offline Store: Used for historical data retrieval (e.g., Snowflake, BigQuery) to generate training datasets without data leakage.",
            "Online Store: A low-latency database (e.g., Redis, DynamoDB) used to serve the latest feature values in real-time to production models.",
            "Point-in-Time Correctness: Crucial for training. Feature stores ensure that for a given event timestamp, only feature data available *before* that timestamp is used."
          ],
          architectureDiagram: ` [ Data Pipelines ] ──► (Feature Computations)
         │
    ┌────┴──────────────────────────┐
    ▼                               ▼
 [ Offline Store (BigQuery) ]  [ Online Store (Redis) ]
    │                               │
    ▼                               ▼
 [ Model Training (Batch) ]    [ Real-Time Inference (API) ]`,
          codeTitle: "Feast Feature View Definition",
          codeSnippet: `from feast import FeatureView, Field, Entity
from feast.types import Float32, Int64
from feast.infra.offline_stores.bigquery_source import BigQuerySource
from datetime import timedelta

driver = Entity(name="driver_id", join_keys=["driver_id"])

driver_stats_source = BigQuerySource(
    table="my_project.my_dataset.driver_stats",
    timestamp_field="event_timestamp"
)

driver_stats_fv = FeatureView(
    name="driver_hourly_stats",
    entities=[driver],
    ttl=timedelta(days=1),
    schema=[
        Field(name="conv_rate", dtype=Float32),
        Field(name="acc_rate", dtype=Float32),
        Field(name="avg_daily_trips", dtype=Int64)
    ],
    online=True,
    source=driver_stats_source,
)`,
          quiz: {
            question: "Why is point-in-time correctness (time travel) critical when building training datasets from a feature store?",
            options: [
              "It prevents data leakage by ensuring the model doesn't train on features that were generated after the target event occurred.",
              "It reduces the storage cost in the offline database.",
              "It allows the model to predict events in the past.",
              "It synchronizes the online and offline stores perfectly."
            ],
            correctIndex: 0,
            explanation: "If you join today's outcome with tomorrow's feature data, the model will learn from the future (data leakage) and perform poorly in production. Point-in-time joins prevent this."
          },
          handsOnLab: {
            title: "Lab 2: Feast Materialization",
            goal: "Materialize historical features from an offline SQLite store to an online Redis store.",
            command: "feast apply && feast materialize-incremental $(date -I)"
          }
        }
      ],
      capstoneDeepDive: {
        title: "Enterprise End-to-End MLOps Platform",
        summary: "Build an automated, continuous training and serving platform. Integrate MLflow for model registry, Feast for online/offline feature serving, and orchestrate the retraining DAG using Apache Airflow.",
        architectureSteps: [
          "1. Data Versioning: Track raw and processed datasets in S3 using DVC and Git.",
          "2. Feature Store: Define driver statistics features in Feast, backing offline data in PostgreSQL and online in Redis.",
          "3. Experiment Tracking: Train an XGBoost model, logging metrics, parameters, and the serialized model to MLflow.",
          "4. Model Serving: Deploy the MLflow model as a REST API container using FastAPI and Triton Inference Server.",
          "5. Monitoring: Monitor prediction drift using Evidently AI and trigger an Airflow DAG to retrain if drift exceeds 0.05."
        ],
        requiredTools: [
          "MLflow & DVC",
          "Feast Feature Store",
          "Apache Airflow",
          "FastAPI & Triton",
          "Evidently AI"
        ],
        testingHarnessCode: `import requests

def test_model_endpoint():
    # 1. Fetch online features from Feast
    # 2. Send payload to MLflow/Triton serving endpoint
    payload = {
        "dataframe_split": {
            "columns": ["conv_rate", "acc_rate", "avg_daily_trips"],
            "data": [[0.5, 0.8, 10]]
        }
    }
    resp = requests.post("http://localhost:8000/invocations", json=payload)
    print("Prediction Result:", resp.json())

test_model_endpoint()`
      },
      capstoneProject: "Automated continuous training and serving platform with Feast feature store and real-time drift alerts."
    },
    {
      id: "mle-foundations",
      category: "mlops-mle",
      title: "Machine Learning Engineer (MLE)",
      badge: "Core Discipline",
      badgeType: "standard",
      duration: "16 Weeks",
      level: "Beginner to Advanced",
      summary: "Solid mathematical grounding, algorithm design, feature engineering, distributed PyTorch, and classical + deep learning modeling.",
      icon: "📊",
      color: "from-amber-600 to-orange-900",
      skills: ["Math for ML", "Scikit-Learn", "PyTorch", "XGBoost", "Distributed Training (DDP)", "Feature Engineering"],
      milestones: [
        { phase: "Phase 1: Applied Mathematics", title: "Linear Algebra & Probability", description: "Eigenvalues, SVD, gradients, Hessian matrices, Bayes theorem, maximum likelihood estimation (MLE), loss surfaces." },
        { phase: "Phase 2: Tabular & Classical ML", title: "Ensembles, GBDT & Scikit-Learn", description: "Random Forests, XGBoost, LightGBM, CatBoost, cross-validation strategies, handling imbalanced data." },
        { phase: "Phase 3: Deep Learning with PyTorch", title: "Custom Architectures & Training Loops", description: "Backpropagation mechanics, optimizers (AdamW, SGD with momentum), learning rate schedulers, regularization (Dropout, LayerNorm)." },
        { phase: "Phase 4: Computer Vision & NLP", title: "CNNs, ResNets & Sequence Models", description: "Convolution operations, vision transformers (ViT), embeddings, tokenization (BPE, WordPiece)." },
        { phase: "Phase 5: Scaling & Production", title: "Distributed Data Parallel (DDP) & FSDP", description: "Multi-GPU training, mixed-precision (FP16/BF16), gradient accumulation, ONNX model export." }
      ],
      capstoneProject: "End-to-end recommendation engine trained with PyTorch DDP and exported to ONNX with sub-10ms latency."
    },
    {
      id: "fde-data-engineer",
      category: "fde-data",
      title: "Forward Deployed Engineer (FDE)",
      badge: "Palantir / Scale AI Track",
      badgeType: "hot",
      duration: "12 Weeks",
      level: "Advanced",
      summary: "The ultimate hybrid role: enterprise high-speed problem solving, streaming data pipelines (Kafka/Flink), custom SDKs, and client deployments.",
      icon: "🚀",
      color: "from-blue-600 to-slate-900",
      skills: ["Apache Kafka", "Flink", "PostgreSQL", "FastAPI", "High-Stakes Prototyping", "Client Architecture"],
      milestones: [
        { phase: "Phase 1: The FDE Mindset", title: "Rapid Prototyping & Client Discovery", description: "Translating ambiguous client business problems into reliable software specs, high-velocity MVP builds under 48 hours." },
        { phase: "Phase 2: Real-Time Streaming", title: "Apache Kafka & Event-Driven Architecture", description: "Partitions, consumer groups, exactly-once semantics, schema registry (Avro/Protobuf), backpressure handling." },
        { phase: "Phase 3: Stream Processing", title: "Apache Flink & Windowed Computations", description: "Event time vs processing time, watermarks, sliding/tumbling windows, stateful stream processing, checkpointing." },
        { phase: "Phase 4: Enterprise Integration", title: "Resilient APIs, Auth & Microservices", description: "OAuth2/SAML SSO, rate limiting, circuit breakers (Resilience4j), transactional outbox pattern, idempotent endpoints." },
        { phase: "Phase 5: Production Deployment", title: "Air-Gapped & On-Prem Delivery", description: "Packaging complex data apps for client clouds (AWS/GCP/Azure) and air-gapped secure on-premise Kubernetes." }
      ],
      capstoneProject: "Real-time fraud detection pipeline processing 50,000 events/sec with Kafka, Flink, and interactive client dashboard."
    },
    {
      id: "system-design-hld-lld",
      category: "system-design",
      title: "System Design Master: HLD & LLD",
      badge: "Staff Eng Prep",
      badgeType: "featured",
      duration: "14 Weeks",
      level: "Intermediate to Advanced",
      summary: "Architect systems handling 100M+ users: High Level Design (scalability, caching, sharding) & Low Level Design (SOLID, design patterns, concurrency).",
      icon: "🏛️",
      color: "from-indigo-600 to-sky-900",
      skills: ["High Level Design (HLD)", "Low Level Design (LLD)", "SOLID", "Caching (Redis)", "Database Sharding", "CAP Theorem"],
      milestones: [
        { phase: "Phase 1: LLD & Design Patterns", title: "Object-Oriented Design & SOLID", description: "Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion, Factory, Observer, Strategy." },
        { phase: "Phase 2: Concurrency in LLD", title: "Thread Pools & Lock-Free Data Structures", description: "Race conditions, mutexes, semaphores, read-write locks, producer-consumer queues, thread-safe caches." },
        { phase: "Phase 3: Scalability Building Blocks", title: "HLD Foundations & Networking", description: "DNS routing, CDN edge caching, reverse proxies (Nginx), Layer 4 vs Layer 7 load balancers, HTTP/2 & gRPC." },
        { phase: "Phase 4: Data Layer Scaling", title: "Replication, Sharding & Consistency", description: "Master-replica setups, horizontal sharding, consistent hashing, distributed consensus (Raft/Paxos), ACID vs BASE." },
        { phase: "Phase 5: Real-World Architecture Cases", title: "Top 10 System Designs", description: "Designing URL Shortener, Twitter Feed, Uber Dispatch, Netflix Video Streaming, Distributed Rate Limiter, Payment Gateway." }
      ],
      capstoneProject: "Complete architectural blueprint & executable LLD code for a distributed, multi-region messaging platform."
    },
    {
      id: "sql-performance-internals",
      category: "sql-db",
      title: "SQL Performance & Database Internals",
      badge: "Deep Systems",
      badgeType: "standard",
      duration: "10 Weeks",
      level: "Intermediate",
      summary: "Master PostgreSQL & MySQL internals: B-Tree indexes, query execution plans, MVCC concurrency, vacuuming, and sub-millisecond query optimization.",
      icon: "💾",
      color: "from-teal-600 to-cyan-900",
      skills: ["EXPLAIN ANALYZE", "B-Tree Indexes", "MVCC", "PostgreSQL Internals", "Query Tuning", "Partitioning"],
      milestones: [
        { phase: "Phase 1: Advanced SQL", title: "Window Functions & CTEs", description: "Dense_rank, lead/lag, rolling averages, recursive Common Table Expressions, lateral joins, JSONB manipulation." },
        { phase: "Phase 2: Index Anatomy", title: "B-Trees, Hash, GiST & GIN", description: "How B-Trees operate on disk, composite index column ordering, covering indexes (INCLUDE clause), index fragmentation." },
        { phase: "Phase 3: Execution Plans", title: "Reading EXPLAIN (ANALYZE, BUFFERS)", description: "Sequential scan vs Index scan vs Index Only scan, Hash Join vs Nested Loop vs Merge Join, buffer cache hits vs disk reads." },
        { phase: "Phase 4: Concurrency & Storage", title: "MVCC, Locks & Write-Ahead Logs", description: "Transaction isolation levels (Read Committed, Repeatable Read, Serializable), phantom reads, row vs table locks, WAL mechanics." },
        { phase: "Phase 5: Scale Strategies", title: "Partitioning & Connection Pooling", description: "Declarative range/list partitioning, PgBouncer transaction pooling, zero-downtime schema migrations." }
      ],
      capstoneProject: "Optimized a 100-million-row database schema from 4.2-second queries down to 8ms with proper indexing and partition pruning."
    },
    {
      id: "python-mastery-systems",
      category: "core-systems",
      title: "Python Internals & Systems Programming",
      badge: "Core Language",
      badgeType: "standard",
      duration: "10 Weeks",
      level: "Intermediate to Advanced",
      summary: "Beyond syntax: Python data model (dunder methods), bytecode, GIL mechanics, asyncio event loops, memory profiling, and C-extensions.",
      icon: "🐍",
      color: "from-yellow-600 to-amber-900",
      skills: ["AsyncIO", "Python Data Model", "GIL & Multiprocessing", "Generators / Iterators", "Memory Profiling", "Clean Code"],
      milestones: [
        { phase: "Phase 1: The Python Data Model", title: "Dunder Magic & Metaclasses", description: "__getitem__, __iter__, __call__, descriptors (__get__, __set__), type creation, class decorators, custom metaclasses." },
        { phase: "Phase 2: Memory & Performance", title: "CPython Internals & Garbage Collection", description: "Reference counting, cyclic GC (generational), __slots__ optimization, sys.getsizeof, memory tracing with tracemalloc." },
        { phase: "Phase 3: Concurrency Mastery", title: "AsyncIO, Threads & Multiprocessing", description: "The event loop mechanics, coroutines vs tasks, async generators, when to use threading vs multiprocessing vs asyncio." },
        { phase: "Phase 4: Clean Architecture", title: "Domain-Driven Design in Python", description: "Dependency injection, repository pattern, dataclasses & Pydantic v2 validation, custom exceptions, robust logging." },
        { phase: "Phase 5: Production Tooling", title: "Packaging & Performance Profiling", description: "Poetry/Uv modern dependency management, cProfile & py-spy profiling, compiling critical bottlenecks with Cython/Mypyc." }
      ],
      capstoneProject: "High-concurrency asynchronous crawler & event processor handling 10,000 websocket connections in pure Python."
    },
    {
      id: "linux-kernel-systems",
      category: "core-systems",
      title: "Linux Systems & Kernel Fundamentals",
      badge: "Deep Systems",
      badgeType: "standard",
      duration: "10 Weeks",
      level: "Intermediate",
      summary: "Understand what runs beneath your code: processes, virtual memory, system calls, the epoll networking engine, and file systems.",
      icon: "🐧",
      color: "from-emerald-700 to-slate-900",
      skills: ["Linux Syscalls", "Virtual Memory", "epoll & Sockets", "Process Management", "Bash Automation", "Strace / eBPF"],
      milestones: [
        { phase: "Phase 1: Processes & Threads", title: "Process Lifecycle & Signals", description: "fork(), execve(), waitpid(), zombie processes, signals (SIGINT, SIGTERM, SIGKILL), scheduling priorities (nice values)." },
        { phase: "Phase 2: Virtual Memory", title: "Paging, mmap & Page Faults", description: "Virtual address space layout, page tables, TLB, demand paging, anonymous memory vs file-backed memory, OOM killer." },
        { phase: "Phase 3: High-Performance I/O", title: "epoll, io_uring & Sockets", description: "Blocking vs Non-blocking I/O, select vs poll vs epoll, event loops, TCP handshake and socket buffers on Linux." },
        { phase: "Phase 4: Diagnostic Mastery", title: "strace, lsof & perf", description: "Tracing system calls with strace, inspecting open file descriptors, CPU profiling with perf, inspecting /proc and /sys." },
        { phase: "Phase 5: Modern Observability", title: "eBPF & Kernel Probes", description: "Introduction to eBPF programs, BCC tools, tracing kernel events safely without kernel modules." }
      ],
      capstoneProject: "Custom lightweight HTTP/1.1 server implemented in C/Python using non-blocking epoll event multiplexing."
    }
  ],

  // 2. MASTERCLASSES
  masterclasses: [
    {
      id: "mc-langgraph-mcp",
      category: "genai-agentic",
      title: "Building Production AI Agents with LangGraph & MCP",
      duration: "3.5 Hours",
      type: "Live Workshop",
      starts: "This Saturday, 2:00 PM",
      instructor: "Staff AI Engineer",
      level: "Advanced",
      tag: "Agentic AI",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      overview: "Construct resilient, stateful AI agents equipped with cyclic graphs, human-in-the-loop approvals, and Model Context Protocol (MCP) integrations.",
      syllabus: [
        "Architecting Agent State: Schemas, Reducers, and Persistent Checkpointing",
        "Cyclic Routing: When to loop, when to branch, and handling tool errors gracefully",
        "Building Model Context Protocol (MCP) servers to expose local tools",
        "Connecting agents to live SQLite, GitHub, and browser automation tools",
        "Deploying and monitoring agent traces with LangSmith"
      ],
      prerequisites: "Python 3.10+, basic understanding of OpenAI or Ollama APIs"
    },
    {
      id: "mc-rag-retrieval",
      category: "genai-agentic",
      title: "Architecting Enterprise Hybrid RAG with Vector DBs",
      duration: "3.5 Hours",
      type: "Live Workshop",
      starts: "Next Sunday, 11:00 AM",
      instructor: "Lead GenAI Architect",
      level: "Intermediate - Advanced",
      tag: "Enterprise RAG",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80",
      overview: "Learn how to bypass basic naive vector search and construct high-precision enterprise RAG pipelines combining BM25, vector search, and cross-encoders.",
      syllabus: [
        "Why standard cosine-similarity vector search fails in production",
        "Hierarchical document chunking: preserving table structures and page numbers",
        "Implementing reciprocal rank fusion (RRF) for Hybrid BM25 + Dense Search",
        "Integrating Cohere & BGE Cross-Encoder re-rankers for top-3 accuracy",
        "Evaluating RAG systems using Faithfulness and Context Precision metrics"
      ],
      prerequisites: "Familiarity with embeddings and Python"
    },
    {
      id: "mc-llm-finetuning",
      category: "genai-agentic",
      title: "Fine-Tuning LLMs with LoRA, QLoRA & Unsloth",
      duration: "4.0 Hours",
      type: "Deep Dive",
      starts: "Upcoming Weekend",
      instructor: "ML Research Scientist",
      level: "Advanced",
      tag: "Model Fine-Tuning",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80",
      overview: "Take open-weight foundation models (Llama 3, Mistral, Qwen) and fine-tune them on custom domain datasets using a single consumer GPU.",
      syllabus: [
        "Low-Rank Adaptation (LoRA) mathematics and rank hyperparameter selection",
        "Quantization mechanics: NormalFloat4 (NF4) and double quantization in QLoRA",
        "Data formatting: instruction tuning datasets and chat templates",
        "Accelerating fine-tuning 5x using Unsloth and FlashAttention-2",
        "Exporting GGUF models for zero-cost local inference with Ollama"
      ],
      prerequisites: "PyTorch fundamentals, HuggingFace transformers"
    },
    {
      id: "mc-k8s-production",
      category: "devops-cloud",
      title: "Production Kubernetes: Networking, Ingress & Security",
      duration: "12 Weeks",
      type: "Comprehensive Track",
      starts: "Cohort Starts Monthly",
      instructor: "Principal DevOps Architect",
      level: "Production Core",
      tag: "Kubernetes Systems",
      image: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80",
      overview: "Deep dive into production Kubernetes cluster management, CNI networking, ingress controllers, cert-manager SSL, and multi-tenant RBAC.",
      syllabus: [
        "Kubernetes internals: API Server, etcd, Kubelet, and Controller Manager",
        "Container Network Interface (CNI): Calico vs Cilium eBPF networking",
        "TLS automation with Cert-Manager and Let's Encrypt",
        "Production stateful sets and persistent volume storage provisioners",
        "Disaster recovery, etcd snapshots, and Velero automated backups"
      ],
      prerequisites: "Docker container experience, basic Linux command line"
    },
    {
      id: "mc-event-driven-kafka",
      category: "fde-data",
      title: "Event-Driven Microservices with Apache Kafka",
      duration: "3.5 Hours",
      type: "Live Workshop",
      starts: "Thursday, 7:00 PM",
      instructor: "Data Platform Lead",
      level: "Intermediate",
      tag: "Streaming Architecture",
      image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
      overview: "Design high-throughput, fault-tolerant distributed streaming systems with Kafka, schema evolution, and transactional outbox patterns.",
      syllabus: [
        "Kafka architecture: brokers, partition distribution, and consumer group rebalancing",
        "Preventing duplicate data: idempotent producers and transactional commits",
        "Schema Registry: managing breaking changes with Apache Avro",
        "Building the Transactional Outbox Pattern with PostgreSQL and Debezium CDC",
        "Monitoring consumer lag with Prometheus and setting critical alerts"
      ],
      prerequisites: "Backend development experience (Python, Go, or Java)"
    },
    {
      id: "mc-system-design-hld",
      category: "system-design",
      title: "High Level Design (HLD) for Massive Scale Systems",
      duration: "12 Weeks",
      type: "Flagship Program",
      starts: "Enrolling Now",
      instructor: "Ex-FAANG Staff Architect",
      level: "Staff / Principal",
      tag: "High-Level Design",
      image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
      overview: "Step-by-step framework to crack Tier-1 system design interviews and design systems serving 500 million daily active users.",
      syllabus: [
        "Capacity estimation: QPS, storage calculation, network bandwidth, and memory sizing",
        "Database selection: SQL vs NoSQL vs NewSQL vs Time-series vs Graph DBs",
        "Distributed caching patterns: Cache-Aside, Write-Through, Write-Behind, Cache Invalidation",
        "Microservices communication: REST vs gRPC vs Event Streams",
        "10 Real-world designs: Distributed Lock, E-Commerce Checkout, Uber Dispatch, WhatsApp Messaging"
      ],
      prerequisites: "Basic software engineering experience"
    },
    {
      id: "mc-sql-performance",
      category: "sql-db",
      title: "SQL Query Tuning & PostgreSQL Internals",
      duration: "3.5 Hours",
      type: "Live Workshop",
      starts: "Next Wednesday, 6:00 PM",
      instructor: "Database Specialist",
      level: "Intermediate - Advanced",
      tag: "Database Internals",
      image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=80",
      overview: "Turn slow 15-second queries into sub-10ms lightning executions by mastering query plan reading, indexing rules, and memory tuning.",
      syllabus: [
        "Demystifying EXPLAIN (ANALYZE, BUFFERS, VERBOSE)",
        "The 5 Cardinal Rules of Composite B-Tree Indexing",
        "Why your query ignored your index: implicit casting and functions on indexed columns",
        "PostgreSQL memory configuration: work_mem, shared_buffers, and maintenance_work_mem",
        "Declarative table partitioning for massive log and transaction tables"
      ],
      prerequisites: "Writing basic SQL SELECT, JOIN, and GROUP BY queries"
    },
    {
      id: "mc-linux-internals",
      category: "core-systems",
      title: "Linux Systems & Non-Blocking epoll Networking",
      duration: "4.0 Hours",
      type: "Hands-on Masterclass",
      starts: "Saturday, 10:00 AM",
      instructor: "Systems Software Engineer",
      level: "Advanced Core",
      tag: "Linux & epoll",
      image: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=80",
      overview: "Look inside the Linux kernel: process creation, virtual memory pages, sockets, and building high-performance event loops with epoll.",
      syllabus: [
        "Linux process isolation: how namespaces and cgroups power Docker containers",
        "System calls dissection: what happens when your code calls read(), write(), and socket()",
        "From select() to epoll(): O(1) event readiness notification",
        "Memory-mapped files with mmap() for zero-copy high performance",
        "Debugging production deadlocks and memory leaks with strace and lsof"
      ],
      prerequisites: "Basic C or Python scripting experience"
    }
  ],

  // 3. INTERACTIVE SIMULATORS
  simulators: [
    {
      id: "sim-sql-runner",
      title: "SQL Performance Sandbox",
      icon: "💾",
      badge: "In-Browser Engine",
      summary: "Write SQL queries, examine execution plans, test indexes, and inspect results against a live, preloaded 10,000-record database table.",
      type: "sql"
    },
    {
      id: "sim-linux-terminal",
      title: "Linux CLI & System Simulator",
      icon: "🐧",
      badge: "Interactive Shell",
      summary: "Interactive virtual bash environment to practice Docker, system diagnostics (top, ps, lsof, curl), file permissions, and process management.",
      type: "linux"
    },
    {
      id: "sim-python-repl",
      title: "Python 3 & Algorithm Playground",
      icon: "🐍",
      badge: "Code Lab",
      summary: "Execute real-time Python algorithms, test data structures, test tokenizers, and experiment with agent prompt routines directly in the browser.",
      type: "python"
    }
  ],

  // 4. CHEATSHEETS & BLUEPRINTS
  resources: [
    {
      id: "res-rag-cheatsheet",
      category: "genai-agentic",
      title: "Production RAG Architecture Blueprint 2026",
      type: "Architecture Spec",
      description: "Visual decision flow for chunking strategies, embedding dimension trade-offs, vector DB selection, and hybrid re-ranking topologies.",
      bullets: ["Chunking Matrix (Tokens vs Semantics)", "Vector DB comparison (SQLite-vec, Chroma, Qdrant, Milvus)", "Re-ranking pipeline diagrams"]
    },
    {
      id: "res-agent-patterns",
      category: "genai-agentic",
      title: "Agentic AI Design Patterns & MCP Specification",
      type: "Design Patterns",
      description: "Comprehensive visual guide to ReAct, Reflection, Plan-and-Solve, Supervisor-Worker, and Model Context Protocol (MCP) JSON schemas.",
      bullets: ["MCP Client-Server Protocol Handshake", "State transition matrices", "Prompt guardrail checklists"]
    },
    {
      id: "res-k8s-commands",
      category: "devops-cloud",
      title: "Kubernetes Production Troubleshooting & Kubectl Cheat Sheet",
      type: "Quick Reference",
      description: "Fast-reference commands for debugging CrashLoopBackOff, OOMKilled pods, inspecting ingress routing, and secret management.",
      bullets: ["Top 30 production kubectl one-liners", "DNS troubleshooting flow in CoreDNS", "Resource quota and limits calculator"]
    },
    {
      id: "res-sql-indexes",
      category: "sql-db",
      title: "PostgreSQL Indexing & EXPLAIN Visual Guide",
      type: "Reference Guide",
      description: "How to interpret every node in EXPLAIN ANALYZE (Seq Scan, Index Scan, Bitmap Heap Scan, Hash Join, Nested Loop).",
      bullets: ["When to use B-Tree vs GIN vs BRIN", "Leftmost prefix rule visual diagram", "Query optimization checklist"]
    },
    {
      id: "res-system-design-formulas",
      category: "system-design",
      title: "System Design Estimation & Latency Numbers",
      type: "System Blueprint",
      description: "Essential numbers every engineer must know: L1 cache latency, SSD read latency, cross-datacenter roundtrips, and storage calculations.",
      bullets: ["Numbers Everyone Should Know (Jeff Dean)", "QPS to Server/RAM sizing formula", "Database capacity planning worksheet"]
    },
    {
      id: "res-linux-diagnostics",
      category: "core-systems",
      title: "Linux Performance Observability in 60 Seconds",
      type: "Diagnostics Guide",
      description: "Brendan Gregg's USE method for CPU, memory, storage, and network troubleshooting (uptime, dmesg, vmstat, mpstat, pidstat, iostat).",
      bullets: ["The 10-step Linux triage routine", "Interpreting CPU load averages correctly", "strace command cheat sheet"]
    }
  ],

  // 5. AI TEXTBOOK LIBRARY (Indexed & Vector RAG Ready)
  textbooks: [
    {
      id: "410cfbb9e564",
      book_id: "410cfbb9e564",
      title: "500 Essential DevOps Commands",
      author: "OmniTech DevOps Practice",
      role: "devops",
      role_name: "DevOps Specialist",
      role_icon: "🚀",
      category: "devops-cloud",
      cover: "https://images.unsplash.com/photo-1618401471353-b98aedd04e11?w=800&auto=format&fit=crop&q=80",
      pages: 47,
      chunks: 415,
      tags: ["DevOps", "Linux", "Docker", "Kubernetes", "CI/CD"],
      ragStatus: "✓ Indexed (415 Chunks)",
      isIndexed: true,
      chapters: [
        "Essential Linux CLI & Shell Scripting",
        "Docker Container Inspection & Management",
        "Kubernetes Cluster Troubleshooting & Networking",
        "CI/CD Pipeline Automation & Monitoring"
      ]
    },
    {
      id: "91825102066a",
      book_id: "91825102066a",
      title: "Top 200 DevOps Engineer Interview Questions & Answers",
      author: "Senior Cloud & Platform Architects",
      role: "devops",
      role_name: "DevOps Specialist",
      role_icon: "🚀",
      category: "devops-cloud",
      cover: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
      pages: 67,
      chunks: 158,
      tags: ["DevOps", "Interviews", "SRE", "Terraform", "GitOps"],
      ragStatus: "✓ Indexed (158 Chunks)",
      isIndexed: true,
      chapters: [
        "Infrastructure as Code: Terraform & CloudFormation",
        "Kubernetes Production Troubleshooting",
        "Observability: Prometheus, Grafana, and Alerting",
        "Zero-Downtime Deployment & Chaos Engineering"
      ]
    },
    {
      id: "book-genai-llm-manual",
      book_id: "book-genai-llm-manual",
      title: "Generative AI & LLM Systems Architect Manual",
      author: "IIT Patna / Technical Faculty",
      role: "genai",
      role_name: "GenAI Architect",
      role_icon: "🤖",
      category: "genai-agentic",
      cover: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800&auto=format&fit=crop&q=80",
      pages: 28,
      chunks: 28,
      tags: ["Transformers", "Self-Attention", "Fine-Tuning", "vLLM", "RAG"],
      ragStatus: "✓ Indexed (28 Chunks)",
      isIndexed: true,
      chapters: [
        "Transformer Multi-Head Attention & KV Cache",
        "PEFT, LoRA & QLoRA Quantized Fine-Tuning",
        "High-Throughput Serving with vLLM & PagedAttention",
        "RAG Retrieval: RRF Dense + Lexical Fusion"
      ]
    },
    {
      id: "5746a41477f0",
      book_id: "5746a41477f0",
      title: "IIT Patna Generative AI with Agentic AI Master Curriculum",
      author: "IIT Patna Faculty & AI Center of Excellence",
      role: "agentic_ai",
      role_name: "Agentic AI Specialist",
      role_icon: "🧠",
      category: "genai-agentic",
      cover: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80",
      pages: 29,
      chunks: 29,
      tags: ["Agentic AI", "LangGraph", "Multi-Agent", "ReAct", "Tool Calling"],
      ragStatus: "✓ Indexed (29 Chunks)",
      isIndexed: true,
      chapters: [
        "Foundational LangGraph StateGraph Architecture",
        "Hierarchical Supervisor & Multi-Agent Swarms",
        "ReAct Reasoning: Thought-Action-Observation Loops",
        "Deterministic Tool Calling & Dynamic Fallbacks"
      ]
    },
    {
      id: "dfeac8b5b0b9",
      book_id: "dfeac8b5b0b9",
      title: "Kubernetes Best Practices: Production Blueprints",
      author: "Brendan Burns & Cloud Native Architects",
      role: "kubernetes",
      role_name: "Kubernetes Architect",
      role_icon: "☸️",
      category: "devops-cloud",
      cover: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80",
      pages: 51,
      chunks: 52,
      tags: ["Kubernetes", "CNI", "Ingress", "Kube-Proxy", "Helm"],
      ragStatus: "✓ Indexed (52 Chunks)",
      isIndexed: true,
      chapters: [
        "Control Plane & Worker Node Internals",
        "Kube-Proxy, iptables & Cilium eBPF Routing",
        "StatefulSets, PersistentVolumes & StorageClasses",
        "Admission Controllers, OPA & Pod Security Standards"
      ]
    },
    {
      id: "da1a66e3fffd",
      book_id: "da1a66e3fffd",
      title: "MLOps Production Engineering & Pipeline Guide",
      author: "Platform Engineering Institute",
      role: "mlops",
      role_name: "MLOps Engineer",
      role_icon: "⚙️",
      category: "mlops-mle",
      cover: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80",
      pages: 184,
      chunks: 178,
      tags: ["MLOps", "MLflow", "Model Registry", "Feature Store", "Drift"],
      ragStatus: "✓ Indexed (178 Chunks)",
      isIndexed: true,
      chapters: [
        "Automated CI/CD for Machine Learning Models",
        "Model Registry, Versioning & Lineage Tracking",
        "Production Inference: Triton, TorchServe, vLLM",
        "Real-Time Data Drift & Concept Drift Detection"
      ]
    },
    {
      id: "59e06e88259a",
      book_id: "59e06e88259a",
      title: "Python for DevOps & System Automation",
      author: "Infrastructure Engineering Guild",
      role: "python",
      role_name: "Python Specialist",
      role_icon: "🐍",
      category: "core-systems",
      cover: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
      pages: 57,
      chunks: 100,
      tags: ["Python", "Automation", "AsyncIO", "Boto3", "CLI"],
      ragStatus: "✓ Indexed (100 Chunks)",
      isIndexed: true,
      chapters: [
        "Subprocess, AsyncIO, and Concurrent Execution",
        "Cloud SDK Automation with Boto3 & Cloud APIs",
        "Building High-Speed CLI Tools with Click & Typer",
        "Automated Server Health Checking & Log Parsing"
      ]
    },
    {
      id: "book-ddia",
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
      role: "general",
      role_name: "Technical Architect",
      role_icon: "📚",
      category: "system-design",
      cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
      pages: 616,
      tags: ["Distributed Systems", "Replication", "Transactions", "Consensus"],
      ragStatus: "Indexed & Ready",
      chapters: [
        "Reliable, Scalable, and Maintainable Applications",
        "Data Models and Query Languages",
        "Storage and Retrieval (LSM-Trees & B-Trees)",
        "Replication & Partitioning",
        "Transactions & ACID Isolation",
        "The Trouble with Distributed Systems & Consensus"
      ]
    },
    {
      id: "book-db-internals",
      title: "Database Internals: Storage & Architecture",
      author: "Alex Petrov",
      role: "general",
      role_name: "Technical Architect",
      role_icon: "💾",
      category: "sql-db",
      cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80",
      pages: 374,
      tags: ["B-Trees", "LSM-Trees", "Concurrency Control", "WAL"],
      ragStatus: "Indexed & Ready",
      chapters: [
        "Storage Engine Architecture & Disk Layout",
        "B-Tree Internals & Page Organization",
        "Log-Structured Storage & Compaction",
        "Transactions, Concurrency Control & 2PL",
        "Write-Ahead Logging (WAL) & Recovery"
      ]
    },
    {
      id: "book-fluent-python",
      title: "Fluent Python: Clear, Concise, and Effective Programming",
      author: "Luciano Ramalho",
      role: "python",
      role_name: "Python Specialist",
      role_icon: "🐍",
      category: "core-systems",
      cover: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
      pages: 1012,
      tags: ["Python Data Model", "Generators", "AsyncIO", "Metaprogramming"],
      ragStatus: "Indexed & Ready",
      chapters: [
        "The Python Data Model & Special Methods",
        "Data Structures: Tuples, Dicts, and Sets",
        "Functions as First-Class Objects & Closures",
        "Iterators, Generators, and Classic Coroutines",
        "AsyncIO & Asynchronous Programming",
        "Metaprogramming, Descriptors & Class Decorators"
      ]
    }
  ]
};
