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
      milestones: [
        { phase: "Phase 1: Foundations", title: "Cognitive Loops & Prompt Architecture", description: "ReAct pattern, Chain-of-Thought, Tool Calling APIs, Function definitions, Structured Outputs (Pydantic/Zod)." },
        { phase: "Phase 2: State Machines", title: "LangGraph & Cyclic Graphs", description: "State graphs, conditional routing, human-in-the-loop approvals, time-travel debugging, persistent checkpointing." },
        { phase: "Phase 3: Protocols & Tools", title: "Model Context Protocol (MCP)", description: "Building custom MCP servers (stdio/SSE), connecting agents to filesystem, GitHub, DBs, and Chrome DevTools." },
        { phase: "Phase 4: Multi-Agent Orchestration", title: "Hierarchical & Swarm Architectures", description: "Supervisor-worker agents, consensus voting, decentralized negotiation, subagent delegation." },
        { phase: "Phase 5: Production Readiness", title: "Guardrails, Memory & Eval", description: "Semantic/Episodic memory stores (vector + graph), LangSmith/Phoenix telemetry, prompt injection defense." }
      ],
      capstoneProject: "Autonomous Full-Stack Engineer Agent with MCP tool integration, terminal execution, and git PR creation."
    },
    {
      id: "genai-transformers-specialist",
      category: "genai-agentic",
      title: "Generative AI & LLM Specialist",
      badge: "Core AI",
      badgeType: "featured",
      duration: "12 Weeks",
      level: "Intermediate to Advanced",
      summary: "Deep dive into Transformer architectures, Self-Attention mathematics, KV-Cache optimization, Fine-Tuning with LoRA/QLoRA, and production RAG.",
      icon: "✨",
      color: "from-pink-600 to-rose-900",
      skills: ["Transformers", "Self-Attention", "LoRA / QLoRA", "RAG Pipelines", "Vector Databases", "DPO / RLHF"],
      milestones: [
        { phase: "Phase 1: Math & Architecture", title: "Transformer Anatomy from Scratch", description: "Scaled dot-product attention, Multi-Head Attention, RoPE positional encoding, feed-forward layers in PyTorch." },
        { phase: "Phase 2: Inference Optimization", title: "KV Cache & FlashAttention", description: "Memory footprint analysis, decoding strategies (beam search, nucleus sampling), quantization (INT4, FP8, AWQ, GGUF)." },
        { phase: "Phase 3: Parameter-Efficient Fine-Tuning", title: "LoRA, QLoRA & Adapters", description: "Rank decomposition matrices, HuggingFace PEFT, unsloth acceleration, supervised fine-tuning (SFT) on custom datasets." },
        { phase: "Phase 4: Advanced RAG", title: "Hybrid Search & Re-ranking", description: "Dense + Sparse (BM25) retrieval, Cohere/BGE re-rankers, recursive chunking, metadata filtering, chunk context injection." },
        { phase: "Phase 5: Alignment & Eval", title: "DPO, RLHF & RAG Triad", description: "Direct Preference Optimization, TruLens/Ragas evaluation for context relevance, faithfulness, and answer relevance." }
      ],
      capstoneProject: "Multi-Modal Enterprise Textbook QA System with Hybrid RAG, re-ranking, and page-citation accuracy."
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
        { phase: "Phase 1: Containers", title: "Docker Deep Dive & Multi-Stage Builds", description: "Linux namespaces, cgroups, chroot, image layer caching, security scanning (Trivy), minimal alpine/distroless bases." },
        { phase: "Phase 2: Orchestration", title: "Production Kubernetes (K8s)", description: "Pods, Deployments, Services (ClusterIP, NodePort, LoadBalancer), Ingress (Nginx), ConfigMaps, Secrets, RBAC." },
        { phase: "Phase 3: Infrastructure as Code", title: "Modular Terraform on AWS/GCP", description: "State management, remote backends (S3/DynamoDB locks), VPC design, EKS/GKE provisioning, zero-downtime blueprints." },
        { phase: "Phase 4: CI/CD & GitOps", title: "ArgoCD & GitHub Actions", description: "Declarative continuous delivery, blue-green & canary deployments, automated rollbacks, Helm charts, Kustomize." },
        { phase: "Phase 5: Observability", title: "Metrics, Traces & Logs (LGTM Stack)", description: "Prometheus scraping, Grafana dashboards, Loki log aggregation, OpenTelemetry distributed tracing, alert manager." }
      ],
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
        { phase: "Phase 1: Experiment Tracking", title: "MLflow & DVC Data Versioning", description: "Reproducible pipelines, artifact logging, model versioning, S3 integration, Git-backed dataset tracking." },
        { phase: "Phase 2: Feature Engineering at Scale", title: "Feast Feature Store", description: "Online (Redis) and offline (BigQuery/Snowflake) feature stores, point-in-time joins, preventing data leakage." },
        { phase: "Phase 3: Orchestration", title: "Kubeflow & Airflow Pipelines", description: "DAG design for distributed preprocessing, hyperparameter sweeps (Optuna), automated trigger on data arrival." },
        { phase: "Phase 4: High-Throughput Serving", title: "Triton & vLLM Inference Engines", description: "Dynamic batching, concurrent model execution, model compilation (TensorRT-LLM, ONNX Runtime), PagedAttention." },
        { phase: "Phase 5: Post-Deployment Monitoring", title: "Drift Detection & Auto-Retraining", description: "Evidently AI, Kolmogorov-Smirnov test for feature drift, concept drift alerts, automated retraining triggers." }
      ],
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
      rating: 4.95,
      attendees: "1,420 Enrolled",
      tag: "Trending",
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
      rating: 4.92,
      attendees: "2,180 Enrolled",
      tag: "Best Seller",
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
      rating: 4.89,
      attendees: "980 Enrolled",
      tag: "Hands-on Lab",
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
      rating: 4.97,
      attendees: "3,400 Alumni",
      tag: "Flagship",
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
      rating: 4.91,
      attendees: "1,750 Enrolled",
      tag: "Live Demo",
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
      rating: 4.98,
      attendees: "4,600 Alumni",
      tag: "Career Defining",
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
      rating: 4.93,
      attendees: "2,890 Enrolled",
      tag: "High ROI",
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
      rating: 4.94,
      attendees: "1,120 Enrolled",
      tag: "Systems Core",
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
      type: "Architecture PDF",
      downloads: "8.4k",
      description: "Visual decision flow for chunking strategies, embedding dimension trade-offs, vector DB selection, and hybrid re-ranking topologies.",
      bullets: ["Chunking Matrix (Tokens vs Semantics)", "Vector DB comparison (SQLite-vec, Chroma, Qdrant, Milvus)", "Re-ranking pipeline diagrams"]
    },
    {
      id: "res-agent-patterns",
      category: "genai-agentic",
      title: "Agentic AI Design Patterns & MCP Specification",
      type: "Cheat Sheet",
      downloads: "12.1k",
      description: "Comprehensive visual guide to ReAct, Reflection, Plan-and-Solve, Supervisor-Worker, and Model Context Protocol (MCP) JSON schemas.",
      bullets: ["MCP Client-Server Protocol Handshake", "State transition matrices", "Prompt guardrail checklists"]
    },
    {
      id: "res-k8s-commands",
      category: "devops-cloud",
      title: "Kubernetes Production Troubleshooting & Kubectl Cheat Sheet",
      type: "Quick Reference",
      downloads: "19.3k",
      description: "Fast-reference commands for debugging CrashLoopBackOff, OOMKilled pods, inspecting ingress routing, and secret management.",
      bullets: ["Top 30 production kubectl one-liners", "DNS troubleshooting flow in CoreDNS", "Resource quota and limits calculator"]
    },
    {
      id: "res-sql-indexes",
      category: "sql-db",
      title: "PostgreSQL Indexing & EXPLAIN Visual Guide",
      type: "Cheat Sheet",
      downloads: "14.7k",
      description: "How to interpret every node in EXPLAIN ANALYZE (Seq Scan, Index Scan, Bitmap Heap Scan, Hash Join, Nested Loop).",
      bullets: ["When to use B-Tree vs GIN vs BRIN", "Leftmost prefix rule visual diagram", "Query optimization checklist"]
    },
    {
      id: "res-system-design-formulas",
      category: "system-design",
      title: "System Design Estimation & Latency Numbers",
      type: "Blueprint",
      downloads: "22.5k",
      description: "Essential numbers every engineer must know: L1 cache latency, SSD read latency, cross-datacenter roundtrips, and storage calculations.",
      bullets: ["Numbers Everyone Should Know (Jeff Dean)", "QPS to Server/RAM sizing formula", "Database capacity planning worksheet"]
    },
    {
      id: "res-linux-diagnostics",
      category: "core-systems",
      title: "Linux Performance Observability in 60 Seconds",
      type: "Quick Reference",
      downloads: "11.2k",
      description: "Brendan Gregg's USE method for CPU, memory, storage, and network troubleshooting (uptime, dmesg, vmstat, mpstat, pidstat, iostat).",
      bullets: ["The 10-step Linux triage routine", "Interpreting CPU load averages correctly", "strace command cheat sheet"]
    }
  ],

  // 5. AI TEXTBOOK LIBRARY (Ready for Phase B/C RAG & Vector DB Ingestion)
  textbooks: [
    {
      id: "book-ddia",
      title: "Designing Data-Intensive Applications",
      author: "Martin Kleppmann",
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
      id: "book-deep-learning",
      title: "Understanding Deep Learning & Transformers",
      author: "Simon J.D. Prince",
      category: "genai-agentic",
      cover: "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?w=600&auto=format&fit=crop&q=80",
      pages: 540,
      tags: ["Deep Learning", "Transformers", "Self-Attention", "Optimization"],
      ragStatus: "Indexed & Ready",
      chapters: [
        "Supervised Learning & Shallow Neural Networks",
        "Deep Neural Networks & Loss Functions",
        "Optimization & Stochastic Gradient Descent",
        "Convolutional Networks & Residual Connections",
        "Transformers & Self-Attention Mechanisms",
        "Generative Models & Latent Spaces"
      ]
    },
    {
      id: "book-db-internals",
      title: "Database Internals: A Deep Dive into Storage & Architecture",
      author: "Alex Petrov",
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
      id: "book-k8s-running",
      title: "Kubernetes: Up and Running",
      author: "Brendan Burns, Joe Beda, Kelsey Hightower",
      category: "devops-cloud",
      cover: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600&auto=format&fit=crop&q=80",
      pages: 340,
      tags: ["Kubernetes", "Cloud Native", "Containers", "Ingress"],
      ragStatus: "Ready to Index",
      chapters: [
        "Understanding Kubernetes Architecture",
        "Deploying Containers with Pods & ReplicaSets",
        "Service Discovery, Ingress & Routing",
        "Storage Provisioning & Config Management",
        "Rolling Deployments & Canary Releases"
      ]
    },
    {
      id: "book-fluent-python",
      title: "Fluent Python: Clear, Concise, and Effective Programming",
      author: "Luciano Ramalho",
      category: "core-systems",
      cover: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80",
      pages: 1012,
      tags: ["Python Data Model", "Generators", "AsyncIO", "Metaprogramming"],
      ragStatus: "Ready to Index",
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
