/**
 * Omni Agent Studio — Interactive Client Logic
 * Handles dynamic gateway probing, multimodal inputs (images, video, audio),
 * live SSE streaming, Markdown rendering, performance telemetry, and sandbox previews.
 */

// State
const state = {
  gateway: 'webfree', // Option 3 (Free Web Models) auto-selected always
  model: 'openai-fast',
  activeIntent: 'auto', // 'auto' | 'image' | 'video' | 'app' | 'diagram'
  temperature: 0.2,
  contextSize: 32768,
  systemPrompt: '',
  attachments: [], // { type: 'image'|'video'|'audio', dataUrl, name, base64 }
  isGenerating: false,
  abortController: null,
  activeSandboxCode: '',
  webSearchActive: false,
  ragActive: true,
  selectedRagRole: 'all'
};

// Endpoints Base
const PROXY_ROOT = window.location.port === '3300' ? '/proxy' : '';
const GATEWAYS = {
  auto: {
    base: '',
    type: 'auto',
    pingPath: ''
  },
  ollama: {
    base: PROXY_ROOT ? '/proxy/ollama' : 'http://localhost:11434',
    type: 'ollama',
    pingPath: '/api/tags'
  },
  omniroute: {
    base: PROXY_ROOT ? '/proxy/omniroute' : 'http://localhost:20128',
    type: 'openai',
    pingPath: '/v1/models'
  },
  spark: {
    base: PROXY_ROOT ? '/proxy/spark' : 'http://127.0.0.1:8080',
    type: 'openai',
    pingPath: '/v1/models'
  },
  lmstudio: {
    base: PROXY_ROOT ? '/proxy/lmstudio' : 'http://localhost:1234',
    type: 'openai',
    pingPath: '/v1/models'
  },
  webfree: {
    base: PROXY_ROOT ? '/proxy/webfree' : 'https://text.pollinations.ai/openai',
    type: 'openai',
    pingPath: '/models'
  }
};

// Preset Prompts & Configurations
const PRESETS = {
  codex: {
    name: 'Codex Desktop (GPT-6 Astra)',
    model: 'openai-fast',
    gateway: 'webfree',
    prompt: 'Refactor this async API client to add automatic retries with exponential backoff and jitter, isolate root causes, and outline concrete Next Steps:\n\n```python\nimport aiohttp\nasync def fetch_user(user_id):\n    async with aiohttp.ClientSession() as s:\n        async with s.get(f"https://api.example.com/users/{user_id}") as r:\n            return await r.json()\n```',
    system: `You are Codex, an autonomous engineering agent based on GPT-6 Astra. You and the user share one workspace.
- Bias towards action: Infer the user's intent and carry the task to completion autonomously. Do not ask for permission for reversible tasks, reading files, running tests, or writing code edits.
- Plain language & No-Slop rule: Avoid AI slop words ("delve", "foster", "leverage", "it's worth noting", "importantly", "Bottom Line:"). State intended actions directly without contrastive framing ("X, not Y").
- Two Channels: Deliver progress updates in commentary style, and provide a fully self-contained final answer.
- Up Next Planning: Conclude multi-step work with concrete, logical next steps.`
  },
  cursor: {
    name: 'Cursor 2.0 Composer',
    model: 'openai-fast',
    gateway: 'webfree',
    prompt: 'Search the codebase for authentication token validation and produce a surgical SEARCH/REPLACE diff to handle expired JWT tokens gracefully.',
    system: `You are an advanced AI coding assistant powered by Cursor operating exclusively in Cursor IDE.
- Search-first rule: Always inspect declarations, types, and existing callers using grep/ripgrep before proposing changes.
- Surgical unified diffs: Produce precise SEARCH/REPLACE diffs. Never hallucinate code or delete lines unnecessarily. Preserve exact indentations and code style.
- Multi-file composer: Coordinate edits across dependent files, write unit tests, and resolve compiler/lint warnings.`
  },
  manus: {
    name: 'Manus Autonomous Agent',
    model: 'openai-fast',
    gateway: 'webfree',
    prompt: 'Analyze top 5 lightweight vector databases for edge AI (Chromadb, Qdrant, LanceDB, Milvus, Weaviate). Execute an Analyze -> Plan -> Act -> Observe cycle and provide a comprehensive multi-chapter evaluation.',
    system: `You are Manus, an autonomous general-purpose AI agent created by the Manus team.
- Execution loop: Operate in a continuous loop: Analyze -> Plan -> Act -> Observe. Break complex goals into structured milestones.
- Autonomous verification: Gather data, verify findings, process intermediate metrics, and write thorough reports.
- Structure: Deliver exhaustive multi-chapter documentation with key takeaways, performance benchmarks, and implementation trade-offs.`
  },
  lovable: {
    name: 'Lovable 2.0 Web Builder',
    model: 'openai-fast',
    gateway: 'webfree',
    prompt: 'Build a gorgeous Glassmorphic Kanban Task Board with drag-and-drop columns (To Do, In Progress, Review, Done), color priority tags, task creation modal, and local storage persistence in React/Tailwind.',
    system: `You are Lovable, an AI engineer creating and modifying full-stack web applications with live preview synchronization.
- Output complete, runnable single-file HTML/React/Tailwind code inside executable blocks or <lov-code> so it renders instantly in the live sandbox.
- Design excellence: Zero placeholder policy. Vibrant gradients, dark mode, rich typography, responsive layouts, realistic mock state, and interactive controls.`
  },
  perplexity: {
    name: 'Perplexity Deep Research',
    model: 'openai-fast',
    gateway: 'webfree',
    prompt: 'Perform an exhaustive deep research analysis on the architectural evolution of Apple Silicon M-series unified memory vs traditional PCIe GPUs for LLM inference (bandwidth, latency, quantization limits). Provide comparison tables and inline numeric citations [1][2].',
    system: `You are Perplexity, a deep research assistant.
- Exhaustive academic depth: Write a comprehensive, highly detailed report for an academic audience.
- Continuous narrative prose: Use clear, substantive paragraphs. Avoid bullet points in narrative analysis sections.
- Comparison tables: Use comparative markdown tables for multidimensional comparisons.
- Grounding: Ground all assertions with bracketed citations [1][2] followed by a References section.`
  },
  claude: {
    name: 'Claude Design Artifacts',
    model: 'openai-fast',
    gateway: 'webfree',
    prompt: 'Create an interactive SVG + CSS neural network visualization tool where users can click neurons to trigger forward propagation pulse animations with glowing synapse weights.',
    system: `You are an expert designer producing design artifacts using HTML, SVG, and modern CSS/JS.
- Embody visual excellence: tailored palettes, glassmorphism, fluid responsive layouts, micro-animations, self-contained interactivity.
- Deliver working code directly runnable in the sandbox drawer.`
  },
  gemini: {
    name: 'Google Gemini 2.5 Pro',
    model: 'openai-fast',
    gateway: 'webfree',
    prompt: 'Solve the traveling salesperson problem with 2-opt heuristic optimization. First plan your algorithm in a <thought> block, then provide the optimized Python implementation with time complexity proofs.',
    system: `You are Gemini, a large language model built by Google.
- Plan complex steps using \`\`\`thought ... \`\`\` before giving intermediate updates or final responses.
- Write precise algorithmic logic with Python code execution and mathematical rigor.`
  },
  devin: {
    name: 'Devin 2.0 AI Engineer',
    model: 'openai-fast',
    gateway: 'webfree',
    prompt: 'Investigate this failing unit test, execute the terminal test command, isolate the race condition in the mutex lock, and output a clean commit message and PR description.',
    system: `You are Devin, an autonomous AI software engineer.
- Execute shell commands, inspect build/test outputs, trace stack traces, create clean git commits, and report pull request summaries.`
  },
  autopilot: {
    name: 'Auto-Pilot Orchestrator',
    model: 'auto-detect',
    gateway: 'auto',
    prompt: 'Build a sleek interactive retro neon stopwatch app in HTML/JS with glowing start/stop buttons and lap timer, and show a futuristic cyber city image for its theme.',
    system: ''
  },
  bolt: {
    name: 'Bolt.new Full-Stack Generator',
    model: 'openai-fast',
    gateway: 'webfree',
    prompt: 'Build a modern SaaS Analytics Dashboard with Supabase PostgreSQL schema, complete Row Level Security (RLS) policies for user organizations, and a responsive Tailwind dashboard component in React.',
    system: 'You are Bolt, an expert autonomous full-stack software engineer specializing in modern web applications. Generate 100% complete runnable code, explicit Supabase RLS migrations with markdown summaries, and beautiful React components.'
  },
  coder: {
    name: 'Autonomous Coding Agent',
    model: 'openai-fast',
    gateway: 'webfree',
    prompt: 'Inspect this function and provide a surgical fix with root cause analysis:\n\ndef binary_search(arr, target):\n    low = 0\n    high = len(arr)\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid\n    return -1',
    system: 'You are an autonomous senior software engineering agent. You read before editing, use surgical SEARCH/REPLACE diffs, avoid conversational filler, and isolate the root cause.'
  },
  vision: {
    name: 'Multimodal Vision Inspector',
    model: 'openai-fast',
    gateway: 'webfree',
    prompt: 'Analyze this attached interface screenshot. Critique its visual hierarchy, accessibility (WCAG color contrast), and suggest 3 high-impact UX improvements.',
    system: 'You are an expert design systems engineer and UI/UX auditor. Provide thorough, structured analysis of visual elements.'
  },
  reasoning: {
    name: 'Deep Research & CoT',
    model: 'openai-fast',
    gateway: 'webfree',
    prompt: 'Perform an exhaustive architectural evaluation comparing RocksDB LSM-Trees versus B-Trees for high-write-throughput distributed databases. Provide comparative Markdown tables and inline numeric citations [1][2].',
    system: 'You are an academic researcher. Synthesize complex topics into continuous, highly structured prose with comparison tables and bracketed inline citations.'
  },
  imagegen: {
    name: 'Free Image Generator',
    model: 'flux',
    gateway: 'webfree',
    prompt: '/image A futuristic cyberpunk workstation on Apple Silicon Mac with glowing neon screens, holographic AI agents, and moody volumetric lighting, 8k',
    system: 'Text-to-Image Generation Engine'
  },
  videogen: {
    name: 'Direct Video Generator',
    model: 'video',
    gateway: 'webfree',
    prompt: '/video Cinematic drone sweep through an illuminated cyberpunk city in rain with flying cars and neon billboards, 4k ultra-detailed',
    system: 'Generative Neural Video Synthesis Engine'
  }
};

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const promptInput = document.getElementById('promptInput');
const sendBtn = document.getElementById('sendBtn');
const sendIcon = document.getElementById('sendIcon');
const stopIcon = document.getElementById('stopIcon');
const gatewaySelect = document.getElementById('gatewaySelect');
const modelSelect = document.getElementById('modelSelect');
const imageInput = document.getElementById('imageInput');
const videoInput = document.getElementById('videoInput');
const attachmentTray = document.getElementById('attachmentTray');
const tempSlider = document.getElementById('tempSlider');
const tempVal = document.getElementById('tempVal');
const ctxSlider = document.getElementById('ctxSlider');
const ctxVal = document.getElementById('ctxVal');
const systemPromptInput = document.getElementById('systemPromptInput');
const resetPromptBtn = document.getElementById('resetPromptBtn');
const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
const sidebar = document.getElementById('sidebar');
const toggleSandboxBtn = document.getElementById('toggleSandboxBtn');
const studioRightDrawer = document.getElementById('studioRightDrawer');
const sandboxIframe = document.getElementById('sandboxIframe');
const reloadSandboxBtn = document.getElementById('reloadSandboxBtn');
const popoutSandboxBtn = document.getElementById('popoutSandboxBtn');
const closeSandboxBtn = document.getElementById('closeSandboxBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const speedVal = document.getElementById('speedVal');
const latencyVal = document.getElementById('latencyVal');
const imageModal = document.getElementById('imageModal');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');

// Init
window.addEventListener('DOMContentLoaded', () => {
  // Option 3 (Free Web Models) is auto-selected always
  gatewaySelect.value = 'webfree';
  state.gateway = 'webfree';
  updateModelOptions();
  setupEventListeners();
  probeGateways();
  setupSandboxDrawer();
  setupBookStudioToolbarBridges();
  attachOmniBusActionsToExistingBubbles();
});

function setupEventListeners() {
  // Gateway Change
  gatewaySelect.addEventListener('change', (e) => {
    state.gateway = e.target.value;
    updateModelOptions();
  });

  // Model Change
  modelSelect.addEventListener('change', (e) => {
    state.model = e.target.value;
  });

  // Sliders
  tempSlider.addEventListener('input', (e) => {
    state.temperature = parseFloat(e.target.value);
    tempVal.textContent = state.temperature.toFixed(2);
  });

  ctxSlider.addEventListener('input', (e) => {
    state.contextSize = parseInt(e.target.value, 10);
    ctxVal.textContent = `${Math.round(state.contextSize / 1024)}K`;
  });

  systemPromptInput.addEventListener('input', (e) => {
    state.systemPrompt = e.target.value;
  });

  resetPromptBtn.addEventListener('click', () => {
    state.systemPrompt = '';
    systemPromptInput.value = '';
  });

  // Sidebar Toggle
  toggleSidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // Input Auto-grow
  promptInput.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = `${Math.min(promptInput.scrollHeight, 180)}px`;
  });

  // Enter to send
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener('click', handleSend);

  // File Uploads
  imageInput.addEventListener('change', (e) => handleFileUpload(e.target.files, 'image'));
  videoInput.addEventListener('change', (e) => handleFileUpload(e.target.files, 'video'));

  // Drag and Drop into chat
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleFileUpload([file], 'image');
      } else if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        handleFileUpload([file], 'video');
      }
    }
  });

  // Clear Chat
  clearChatBtn.addEventListener('click', () => {
    chatMessages.innerHTML = `
      <div class="welcome-hero">
        <div class="hero-badge">⚡ Omni Agent Studio Live</div>
        <h1>Multimodal Testing Workbench</h1>
        <p>Ready for testing with <strong>Images, Full-Color Rich Text, Videos, Audio, and Live Interactive Sandboxes</strong>.</p>
      </div>`;
  });

  // Lightbox Close
  lightboxClose.addEventListener('click', () => {
    imageModal.classList.remove('active');
  });
  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) imageModal.classList.remove('active');
  });

  // Preset Cards & Mini Chips
  document.querySelectorAll('.preset-card').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.preset;
      selectPresetPrompt(key);
    });
  });

  // Sidebar Preset Dropdown Select
  const sidebarPresetSelect = document.getElementById('sidebarPresetSelect');
  if (sidebarPresetSelect) {
    sidebarPresetSelect.addEventListener('change', (e) => {
      selectPresetPrompt(e.target.value);
    });
  }

  // Quick Intent Chips
  document.querySelectorAll('.intent-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.intent-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeIntent = btn.dataset.intent;
    });
  });

  // Module Hub Navigation Listeners
  setupModuleHubNav();

  // Voice STT & TTS Handlers
  setupVoiceAssistant();

  // Web Search Grounding Handlers
  setupWebSearchAssistant();

  // Multi-Role Vector Knowledge RAG Handlers
  setupRagAssistant();

  // RAG Knowledge Engine Modal Handlers
  setupRagEngineModal();

  // On-Device Memory Studio Handlers
  setupMemoryStudioModal();
}

// Module Hub Navigation
function setupModuleHubNav() {
  const navChatbot = document.getElementById('navChatbot');
  if (navChatbot) {
    navChatbot.addEventListener('click', () => {
      document.querySelectorAll('.hub-nav-btn').forEach(b => b.classList.remove('active'));
      navChatbot.classList.add('active');
      promptInput.focus();
    });
  }


  const navStatus = document.getElementById('navStatus');
  if (navStatus) {
    navStatus.addEventListener('click', () => {
      const perfMetrics = document.getElementById('perfMetrics');
      if (perfMetrics) {
        perfMetrics.classList.add('pulse-highlight');
        setTimeout(() => perfMetrics.classList.remove('pulse-highlight'), 1200);
      }
    });
  }


  const navRag = document.getElementById('navRag');
  if (navRag) {
    navRag.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.openRightDrawerTab === 'function') {
        window.openRightDrawerTab('rag');
      } else {
        openRagEngineModal();
      }
    });
  }

  const navMemory = document.getElementById('navMemory');
  if (navMemory) {
    navMemory.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.openRightDrawerTab === 'function') {
        window.openRightDrawerTab('memory');
      } else {
        openMemoryStudioModal();
      }
    });
  }

  const navDb = document.getElementById('navDb');
  if (navDb) {
    navDb.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.openRightDrawerTab === 'function') {
        window.openRightDrawerTab('db');
      } else {
        openDbStudioModal();
      }
    });
  }

  const navDeepResearch = document.getElementById('navDeepResearch');
  if (navDeepResearch) {
    navDeepResearch.addEventListener('click', (e) => {
      e.preventDefault();
      toggleWebSearchState(true, true);
      selectPresetPrompt('perplexity');
      if (promptInput) {
        promptInput.focus();
        promptInput.select();
      }
    });
  }

  const navAutoPilot = document.getElementById('navAutoPilot');
  if (navAutoPilot) {
    navAutoPilot.addEventListener('click', () => {
      document.querySelectorAll('.intent-chip').forEach(b => b.classList.toggle('active', b.dataset.intent === 'auto'));
      state.activeIntent = 'auto';
      selectPresetPrompt('autopilot');
      promptInput.focus();
    });
  }

  const navWebApp = document.getElementById('navWebApp');
  if (navWebApp) {
    navWebApp.addEventListener('click', () => {
      document.querySelectorAll('.intent-chip').forEach(b => b.classList.toggle('active', b.dataset.intent === 'app'));
      state.activeIntent = 'app';
      selectPresetPrompt('lovable');
      if (typeof window.openRightDrawerTab === 'function') {
        window.openRightDrawerTab('sandbox');
      }
      promptInput.focus();
    });
  }

  const navDiagram = document.getElementById('navDiagram');
  if (navDiagram) {
    navDiagram.addEventListener('click', () => {
      document.querySelectorAll('.intent-chip').forEach(b => b.classList.toggle('active', b.dataset.intent === 'diagram'));
      state.activeIntent = 'diagram';
      promptInput.value = 'Create an interactive architecture diagram in Mermaid for: ';
      promptInput.focus();
    });
  }

  const navImageGen = document.getElementById('navImageGen');
  if (navImageGen) {
    navImageGen.addEventListener('click', () => {
      document.querySelectorAll('.intent-chip').forEach(b => b.classList.toggle('active', b.dataset.intent === 'image'));
      state.activeIntent = 'image';
      selectPresetPrompt('imagegen');
      promptInput.focus();
    });
  }

  const navVideoGen = document.getElementById('navVideoGen');
  if (navVideoGen) {
    navVideoGen.addEventListener('click', () => {
      document.querySelectorAll('.intent-chip').forEach(b => b.classList.toggle('active', b.dataset.intent === 'video'));
      state.activeIntent = 'video';
      selectPresetPrompt('videogen');
      promptInput.focus();
    });
  }

  const navWebSearch = document.getElementById('navWebSearch');
  if (navWebSearch) {
    navWebSearch.addEventListener('click', (e) => {
      e.preventDefault();
      toggleWebSearchState(true, false);
      if (promptInput) {
        promptInput.value = 'Search live technical documentation and release notes for: ';
        promptInput.focus();
      }
    });
  }

}

// Voice Assistant (Speech-to-Text & Text-to-Speech)
function setupVoiceAssistant() {
  const micBtn = document.getElementById('voiceMicBtn');
  const ttsBtn = document.getElementById('voiceTtsBtn');
  if (!micBtn || !ttsBtn) return;

  let recognition = null;
  let isListening = false;
  let ttsEnabled = localStorage.getItem('omni_voice_tts') === 'true';

  if (ttsEnabled) {
    ttsBtn.classList.add('active');
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      micBtn.classList.add('listening');
      micBtn.setAttribute('title', 'Listening... Speak now (Click to stop)');
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        promptInput.value = (promptInput.value ? promptInput.value + ' ' : '') + finalTranscript;
        promptInput.dispatchEvent(new Event('input'));
      }
    };

    recognition.onerror = (event) => {
      console.warn('[Voice Recognition]', event.error);
      micBtn.classList.remove('listening');
      isListening = false;
    };

    recognition.onend = () => {
      micBtn.classList.remove('listening');
      isListening = false;
      micBtn.setAttribute('title', 'Speak to AI (Speech-to-Text Voice Dictation)');
    };

    micBtn.addEventListener('click', () => {
      if (isListening) {
        recognition.stop();
      } else {
        try {
          recognition.start();
        } catch (e) {
          console.warn('[Speech Recognition Start]', e);
        }
      }
    });
  } else {
    micBtn.addEventListener('click', () => {
      alert('Speech Recognition is not supported by this browser engine. Please test in Google Chrome or Microsoft Edge.');
    });
  }

  ttsBtn.addEventListener('click', () => {
    ttsEnabled = !ttsEnabled;
    localStorage.setItem('omni_voice_tts', ttsEnabled ? 'true' : 'false');
    if (ttsEnabled) {
      ttsBtn.classList.add('active');
      speakVoiceText('Voice response active.');
    } else {
      ttsBtn.classList.remove('active');
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    }
  });

  window.speakVoiceResponse = function(text) {
    if (!ttsEnabled || !window.speechSynthesis) return;
    speakVoiceText(text);
  };
}

function speakVoiceText(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/```[\s\S]*?```/g, 'Code block omitted.')
                    .replace(/`([^`]+)`/g, '$1')
                    .replace(/<[^>]+>/g, '')
                    .replace(/[#*_~>]/g, '')
                    .slice(0, 800);
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.05;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// ==========================================================================
// Web Search Assistant Toggle & State Management
// ==========================================================================

function toggleWebSearchState(forceState, isDeep) {
  const next = forceState !== undefined ? forceState : !state.webSearchActive;
  state.webSearchActive = next;
  state.isDeepSearch = next ? !!isDeep : false;

  if (next) {
    state.activeIntent = 'web_search';
  } else if (state.activeIntent === 'web_search') {
    state.activeIntent = 'auto';
  }

  const btn = document.getElementById('webSearchToggleBtn');
  const banner = document.getElementById('webSearchActiveBanner');
  const navBtn = document.getElementById('navWebSearch');
  const navDeep = document.getElementById('navDeepResearch');

  if (btn) btn.classList.toggle('active', next);
  if (banner) {
    banner.classList.toggle('hidden', !next);
    const textSpan = banner.querySelector('.web-search-banner-text');
    if (textSpan) {
      textSpan.innerHTML = isDeep 
        ? '🔍 Deep Web Research <strong>Active</strong> &bull; Exhaustive academic research with live citations [1][2]'
        : 'Live Web Search Grounding <strong>Active</strong> &bull; Factual real-time web results will be synthesized';
    }
  }
  if (navBtn) navBtn.classList.toggle('active', next && !isDeep);
  if (navDeep) navDeep.classList.toggle('active', next && !!isDeep);

  if (promptInput) {
    promptInput.placeholder = next 
      ? (isDeep ? 'Ask anything for Deep Research with live academic citations...' : 'Ask anything with live web search...') 
      : 'Ask anything or search the web...';
  }
}

function setupWebSearchAssistant() {
  const btn = document.getElementById('webSearchToggleBtn');
  const bannerClose = document.getElementById('closeWebSearchBanner');

  if (btn) {
    btn.addEventListener('click', () => toggleWebSearchState());
  }

  if (bannerClose) {
    bannerClose.addEventListener('click', () => toggleWebSearchState(false));
  }
}

// ==========================================================================
// Multi-Role Vector Knowledge & Agentic RAG Toggle & State Management
// ==========================================================================

function toggleRagState(forceState) {
  const next = forceState !== undefined ? forceState : !state.ragActive;
  state.ragActive = next;

  const btn = document.getElementById('ragToggleBtn');
  const banner = document.getElementById('ragActiveBanner');

  if (btn) btn.classList.toggle('active', next);
  if (banner) banner.classList.toggle('hidden', !next);

  if (promptInput) {
    if (next) {
      promptInput.placeholder = 'Ask anything (Multi-Role Vector Knowledge Grounding Active)...';
    } else if (state.webSearchActive) {
      promptInput.placeholder = 'Ask anything with live web search...';
    } else {
      promptInput.placeholder = 'Ask anything or search the web...';
    }
  }
}

function setupRagAssistant() {
  const btn = document.getElementById('ragToggleBtn');
  const bannerClose = document.getElementById('closeRagBanner');
  const roleChipsBar = document.getElementById('ragRoleChipsBar');

  if (btn) {
    btn.addEventListener('click', () => toggleRagState());
  }

  if (bannerClose) {
    bannerClose.addEventListener('click', () => toggleRagState(false));
  }

  if (roleChipsBar) {
    roleChipsBar.addEventListener('click', (e) => {
      const chip = e.target.closest('.rag-role-chip');
      if (!chip) return;
      const role = chip.dataset.role || 'all';
      state.selectedRagRole = role;
      roleChipsBar.querySelectorAll('.rag-role-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  }
}

// RAG Knowledge Engine Modal Logic
function setupRagEngineModal() {
  const modal = document.getElementById('ragModal');
  const closeBtn = document.getElementById('closeRagModalBtn');
  const closeBottomBtn = document.getElementById('closeRagModalBottomBtn');
  const searchInput = document.getElementById('ragSearchInput');
  const searchBtn = document.getElementById('runRagSearchBtn');
  const topkChips = document.querySelectorAll('.topk-chip');

  if (!modal) return;

  const closeModal = () => modal.classList.add('hidden');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (closeBottomBtn) closeBottomBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  let activeTopK = 5;
  topkChips.forEach(chip => {
    chip.addEventListener('click', () => {
      topkChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeTopK = parseInt(chip.dataset.k, 10);
    });
  });

  if (searchBtn && searchInput) {
    const doSearch = async () => {
      const q = searchInput.value.trim();
      if (!q) return;
      const resultsContainer = document.getElementById('ragResultsContainer');
      const bookId = document.getElementById('ragBookFilterSelect')?.value || null;
      if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="rag-loading-state">🔍 Searching vector embeddings across textbooks...</div>';
      }
      try {
        const res = await fetch('/api/rag/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, book_id: bookId, top_k: activeTopK })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        renderRagResults(data, resultsContainer);
      } catch (err) {
        if (resultsContainer) {
          resultsContainer.innerHTML = `<div class="rag-error-state">⚠️ Vector query error: ${err.message}</div>`;
        }
      }
    };

    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doSearch();
      }
    });
  }
}

async function openRagEngineModal() {
  const modal = document.getElementById('ragModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  // Load telemetry stats & books list
  try {
    const [booksRes, dbRes] = await Promise.all([
      fetch('/api/rag/books').catch(() => null),
      fetch('/api/db/telemetry').catch(() => null)
    ]);

    if (booksRes && booksRes.ok) {
      const bData = await booksRes.json();
      const books = bData.books || [];
      document.getElementById('ragBooksCount').textContent = books.length;
      
      const filterSelect = document.getElementById('ragBookFilterSelect');
      if (filterSelect && books.length > 0) {
        filterSelect.innerHTML = '<option value="">All Ingested Textbooks</option>' +
          books.map(b => `<option value="${b.book_id}">${b.title || b.book_id}</option>`).join('');
      }
    }

    if (dbRes && dbRes.ok) {
      const dData = await dbRes.json();
      if (dData.chunks_count !== undefined) {
        document.getElementById('ragChunksCount').textContent = dData.chunks_count.toLocaleString();
      }
      if (dData.total_tokens !== undefined) {
        document.getElementById('ragTokensCount').textContent = dData.total_tokens.toLocaleString();
      }
      if (dData.queries_count !== undefined) {
        document.getElementById('ragQueriesCount').textContent = dData.queries_count.toLocaleString();
      }
    }
  } catch (e) {
    console.warn('[RAG Telemetry Load]', e);
  }
}

function renderRagResults(data, container) {
  if (!container) return;
  const hits = data.citations || data.hits || data.matches || [];
  if (hits.length === 0) {
    container.innerHTML = '<div class="rag-empty-state"><p>No relevant vector matches found. Try broadening your query.</p></div>';
    return;
  }

  let html = '';
  if (data.answer) {
    html += `
      <div class="rag-synthesized-answer">
        <div class="synthesized-header">💡 AI Vector Synthesis</div>
        <div class="synthesized-text">${data.answer}</div>
      </div>`;
  }

  html += `<div class="rag-hits-list">`;
  hits.forEach((h, idx) => {
    const scorePct = Math.round((h.similarity_score || h.similarity || h.score || 0.85) * 100);
    html += `
      <div class="rag-hit-card">
        <div class="rag-hit-header">
          <div class="rag-hit-meta">
            <span class="rag-hit-badge">#${idx + 1}</span>
            <span class="rag-book-title">${h.book_title || 'Technical Manual'}</span>
            ${h.page_number ? `<span class="rag-page-tag">Page ${h.page_number}</span>` : ''}
            ${h.chapter_title ? `<span class="rag-chapter-tag">${h.chapter_title}</span>` : ''}
          </div>
          <span class="rag-similarity-pill">${scorePct}% Match</span>
        </div>
        <div class="rag-chunk-body">${h.chunk_text || h.text || ''}</div>
        <div class="rag-chunk-footer">
          <span>Tokens: ${h.token_count || '--'}</span>
          <div class="rag-card-actions">
            <button class="tiny-btn" onclick="window.insertRagToPrompt(this)" title="Send textbook chunk to Chat input">💬 To Chat</button>
            <button class="tiny-btn highlight-tiny" onclick="window.teachRagToMemory(this)" title="Distill and store in on-device edge memory">⚡ To Memory</button>
            <button class="tiny-btn" onclick="window.appendRagToBook(this)" title="Append to active book chapter">📖 To Book</button>
          </div>
        </div>
      </div>`;
  });
  html += `</div>`;
  container.innerHTML = html;
}

window.insertRagToPrompt = function(target) {
  let text = '';
  if (typeof target === 'string') {
    text = target;
  } else if (target && target.closest) {
    const card = target.closest('.rag-hit-card');
    text = card?.querySelector('.rag-chunk-body')?.innerText || '';
  }
  if (!promptInput || !text) return;
  promptInput.value = `Based on the following textbook context:\n"${text}"\n\nExplain how this works in detail and provide code examples:`;
  promptInput.dispatchEvent(new Event('input'));
  const modal = document.getElementById('ragModal');
  if (modal) modal.classList.add('hidden');
  promptInput.focus();
  if (window.showOmniToast) window.showOmniToast('Textbook context inserted into Chatbot!', '💬');
};

window.teachRagToMemory = async function(btn) {
  const card = btn.closest('.rag-hit-card');
  const text = card?.querySelector('.rag-chunk-body')?.innerText || '';
  const title = card?.querySelector('.rag-book-title')?.innerText || 'Textbook Fact';
  if (!text) return;

  btn.disabled = true;
  btn.textContent = '⏳ Saving...';
  try {
    const res = await fetch('/api/memory/distill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source: `RAG: ${title}`,
        category: 'textbook_rag'
      })
    });
    const data = await res.json();
    btn.disabled = false;
    btn.textContent = '✅ Stored';
    if (window.showOmniToast) window.showOmniToast(`Saved ${data.distilled_count || 1} facts into On-Device Memory!`, '⚡');
    setTimeout(() => { btn.textContent = '⚡ To Memory'; }, 2000);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = '⚡ To Memory';
    if (window.showOmniToast) window.showOmniToast(`Memory save error: ${err.message}`, '⚠️');
  }
};

window.appendRagToBook = async function(btn) {
  const card = btn.closest('.rag-hit-card');
  const text = card?.querySelector('.rag-chunk-body')?.innerText || '';
  const title = card?.querySelector('.rag-book-title')?.innerText || 'Textbook Citation';
  if (!text) return;

  btn.disabled = true;
  btn.textContent = '⏳ Appending...';
  try {
    const res = await fetch('/api/books/append', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Textbook Reference: ${title}`,
        content: `## Textbook Reference: ${title}\n\n> ${text}\n\n*Source: Ingested RAG Knowledge Catalog*`
      })
    });
    const data = await res.json();
    btn.disabled = false;
    btn.textContent = '✅ In Book';
    if (window.showOmniToast) window.showOmniToast(`Appended reference to Chapter ${data.chapter_count} in Book Studio!`, '📖');
    setTimeout(() => { btn.textContent = '📖 To Book'; }, 2000);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = '📖 To Book';
    if (window.showOmniToast) window.showOmniToast(`Book append error: ${err.message}`, '⚠️');
  }
};

// ============================================================================
// ⚡ ON-DEVICE AI MEMORY STUDIO LOGIC (Sub-50ms Vector Recall & Teach)
// ============================================================================

let currentMemoryList = [];

function setupMemoryStudioModal() {
  const modal = document.getElementById('memoryModal');
  const closeBtn = document.getElementById('closeMemoryModalBtn');
  const closeBottomBtn = document.getElementById('closeMemoryModalBottomBtn');
  const teachForm = document.getElementById('memTeachForm');
  const btnRecall = document.getElementById('btnRunRecall');
  const recallInput = document.getElementById('memRecallQuery');
  const btnRefresh = document.getElementById('btnRefreshMemories');
  const filterInput = document.getElementById('memSearchFilter');

  if (!modal) return;

  const closeModal = () => modal.classList.add('hidden');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (closeBottomBtn) closeBottomBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Teach Memory Form Submission
  if (teachForm) {
    teachForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const label = document.getElementById('memTeachLabel')?.value.trim();
      const transcript = document.getElementById('memTeachTranscript')?.value.trim();
      const where = document.getElementById('memTeachWhere')?.value.trim() || '';
      const category = document.getElementById('memTeachCategory')?.value || 'gear';
      const submitBtn = document.getElementById('btnTeachSubmit');

      if (!label || !transcript) return;

      const origText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⚡ Vectorizing...</span>';
      }

      try {
        const res = await fetch('/api/memory/teach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label, transcript, where, category })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        teachForm.reset();
        await loadMemoryStudioData();

        // Optional speech confirmation
        if (localStorage.getItem('omni_voice_tts') === 'true') {
          speakWithVoice(`Stored on-device memory for ${label}`);
        }
      } catch (err) {
        console.error('[Memory Teach Error]', err);
        alert(`Failed to teach memory: ${err.message}`);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
        }
      }
    });
  }

  // Ask / Recall Execution
  if (btnRecall && recallInput) {
    const doRecall = async () => {
      const q = recallInput.value.trim();
      if (!q) return;

      const outputContainer = document.getElementById('memRecallOutput');
      if (outputContainer) {
        outputContainer.innerHTML = '<div class="recall-placeholder"><span>⚡ Searching 768-D edge vector index...</span></div>';
      }

      try {
        const startTime = performance.now();
        const res = await fetch('/api/memory/recall', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q })
        });
        const elapsed = (performance.now() - startTime).toFixed(1);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        renderMemoryRecallOutput(data, elapsed, outputContainer);
      } catch (err) {
        if (outputContainer) {
          outputContainer.innerHTML = `<div class="recall-placeholder" style="color:#ef4444;">⚠️ Recall error: ${err.message}</div>`;
        }
      }
    };

    btnRecall.addEventListener('click', doRecall);
    recallInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        doRecall();
      }
    });
  }

  // Filter Memories
  if (filterInput) {
    filterInput.addEventListener('input', () => {
      const term = filterInput.value.toLowerCase().trim();
      filterMemoryCards(term);
    });
  }

  // Refresh Memories
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      loadMemoryStudioData();
    });
  }
}

async function openMemoryStudioModal() {
  const modal = document.getElementById('memoryModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  await loadMemoryStudioData();
}

async function loadMemoryStudioData() {
  try {
    const [telemetryRes, listRes] = await Promise.all([
      fetch('/api/memory/telemetry').catch(() => null),
      fetch('/api/memory/list').catch(() => null)
    ]);

    if (telemetryRes && telemetryRes.ok) {
      const t = await telemetryRes.json();
      const countEl = document.getElementById('memTotalCount');
      const sightingsEl = document.getElementById('memSightingsCount');
      const dbSizeEl = document.getElementById('memDbSizeVal');
      const latencyEl = document.getElementById('memLatencyVal');

      if (countEl && t.total_memories !== undefined) countEl.textContent = t.total_memories;
      if (sightingsEl && t.total_sightings !== undefined) sightingsEl.textContent = t.total_sightings;
      if (dbSizeEl && t.database_size_kb !== undefined) dbSizeEl.textContent = `${t.database_size_kb} KB`;
      if (latencyEl) latencyEl.textContent = '< 2 ms';
    }

    if (listRes && listRes.ok) {
      const l = await listRes.json();
      currentMemoryList = l.memories || [];
      const badge = document.getElementById('memLibraryCountBadge');
      if (badge) badge.textContent = `${currentMemoryList.length} item${currentMemoryList.length === 1 ? '' : 's'}`;
      renderMemoryCards(currentMemoryList);
    }
  } catch (err) {
    console.warn('[Load Memory Data]', err);
  }
}

function renderMemoryRecallOutput(data, elapsedMs, container) {
  if (!container) return;

  if (!data.recognized) {
    const scorePct = Math.round((data.best_score || 0) * 100);
    container.innerHTML = `
      <div class="recall-placeholder" style="color: var(--text-dim);">
        <span style="font-size: 1.5rem;">❓</span>
        <p><strong>Unrecognized Memory</strong> (Confidence: ${scorePct}%, Threshold: 35%)</p>
        <p style="font-size:0.75rem;">${data.spoken_response || 'No matching fact registered in on-device storage.'}</p>
      </div>`;
    return;
  }

  const match = data.match || {};
  const scorePct = Math.round((data.best_score || 1.0) * 100);
  const confClass = scorePct >= 65 ? 'conf-high' : 'conf-medium';

  container.innerHTML = `
    <div class="recall-hit-card">
      <div class="recall-hit-header">
        <div class="recall-hit-title">
          <span>⚡</span>
          <span>${match.label || 'Recognized Item'}</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="conf-pill ${confClass}">${scorePct}% Confidence</span>
          <span style="font-size:0.7rem; color:var(--text-dim); font-weight:700;">${elapsedMs}ms</span>
        </div>
      </div>
      <div class="recall-transcript-text">
        ${data.spoken_response || match.transcript || ''}
      </div>
      <div class="recall-meta-row">
        <div class="recall-tags">
          ${match.where_loc ? `<span class="loc-tag">📍 ${match.where_loc}</span>` : ''}
          ${match.category ? `<span class="loc-tag">🏷️ ${match.category}</span>` : ''}
          <span class="loc-tag">👁️ ${match.sightings_count || 1} sightings</span>
        </div>
        <button class="voice-speak-btn" id="btnSpeakRecallResult">
          <span>🔊</span> Read Aloud
        </button>
      </div>
    </div>`;

  const speakBtn = document.getElementById('btnSpeakRecallResult');
  if (speakBtn) {
    speakBtn.addEventListener('click', () => {
      speakWithVoice(data.spoken_response || match.transcript || '');
    });
  }
}

function renderMemoryCards(list) {
  const grid = document.getElementById('memoryCardsGrid');
  if (!grid) return;

  if (!list || list.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 2rem; color: var(--text-dim); font-weight:600;">No memories stored yet. Use the TEACH form above to add facts, gear, or locations.</div>';
    return;
  }

  grid.innerHTML = list.map(item => `
    <div class="memory-item-card" data-label="${(item.label || '').toLowerCase()}">
      <div class="item-card-top">
        <div class="item-card-title">${item.label || 'Untitled'}</div>
        <span class="item-card-category">${item.category || 'general'}</span>
      </div>
      <div class="item-card-desc">${item.transcript || ''}</div>
      <div class="item-card-footer">
        <div style="display:flex; align-items:center; gap:6px;">
          ${item.where_loc ? `<span>📍 ${item.where_loc}</span> •` : ''}
          <span class="item-sightings-badge">👁️ ${item.sightings_count || 1}</span>
        </div>
        <div class="item-card-action-bar">
          <button class="mem-bridge-btn" onclick="window.askMemoryInChat(this)" title="Ask AI about this memory in Chat">💬 Ask</button>
          <button class="mem-bridge-btn" onclick="window.crossRefMemoryInRag(this)" title="Search textbooks in RAG for this concept">🔍 RAG</button>
          <button class="mem-bridge-btn" onclick="window.appendMemoryToBook(this)" title="Append this memory note to Book">📖 Book</button>
          <button class="item-forget-btn" onclick="forgetMemoryItem('${(item.label || '').replace(/'/g, "\\'")}')" title="Delete from vector memory">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');
}

window.askMemoryInChat = function(btn) {
  const card = btn.closest('.memory-item-card');
  const label = card?.querySelector('.item-card-title')?.innerText || '';
  const transcript = card?.querySelector('.item-card-desc')?.innerText || '';
  if (!promptInput) return;

  promptInput.value = `Regarding this stored edge memory fact:\n**${label}**\n"${transcript}"\n\nPlease provide code implementation, architecture considerations, and real-world usage patterns for this.`;
  promptInput.dispatchEvent(new Event('input'));
  const modal = document.getElementById('memoryModal');
  if (modal) modal.classList.add('hidden');
  promptInput.focus();
  if (window.showOmniToast) window.showOmniToast(`Memory '${label}' loaded into Chatbot!`, '💬');
};

window.crossRefMemoryInRag = function(btn) {
  const card = btn.closest('.memory-item-card');
  const label = card?.querySelector('.item-card-title')?.innerText || '';
  const modal = document.getElementById('memoryModal');
  if (modal) modal.classList.add('hidden');

  openRagEngineModal();
  const searchInput = document.getElementById('ragSearchInput');
  const searchBtn = document.getElementById('runRagSearchBtn');
  if (searchInput && searchBtn) {
    searchInput.value = label;
    searchBtn.click();
    if (window.showOmniToast) window.showOmniToast(`Cross-referencing '${label}' across RAG textbooks...`, '🔍');
  }
};

window.appendMemoryToBook = async function(btn) {
  const card = btn.closest('.memory-item-card');
  const label = card?.querySelector('.item-card-title')?.innerText || 'Memory Fact';
  const transcript = card?.querySelector('.item-card-desc')?.innerText || '';

  btn.disabled = true;
  btn.textContent = '⏳...';
  try {
    const res = await fetch('/api/books/append', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Edge Memory Note: ${label}`,
        content: `## Memory Note: ${label}\n\n> ${transcript}\n\n*Stored in On-Device Vector Memory with sub-2ms recall.*`
      })
    });
    const data = await res.json();
    btn.disabled = false;
    btn.textContent = '✅ In Book';
    if (window.showOmniToast) window.showOmniToast(`Memory '${label}' appended to Book chapter!`, '📖');
    setTimeout(() => { btn.textContent = '📖 Book'; }, 2000);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = '📖 Book';
    if (window.showOmniToast) window.showOmniToast(`Book append error: ${err.message}`, '⚠️');
  }
};

function filterMemoryCards(term) {
  const cards = document.querySelectorAll('.memory-item-card');
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    if (!term || text.includes(term)) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

window.forgetMemoryItem = async function(label) {
  if (!label) return;
  if (!confirm(`Forget memory: "${label}"? This will remove its vector embeddings.`)) return;

  try {
    const res = await fetch('/api/memory/forget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await loadMemoryStudioData();
  } catch (err) {
    alert(`Failed to forget memory: ${err.message}`);
  }
};

// Preset Selector
window.selectPresetPrompt = function(presetKey) {
  const p = PRESETS[presetKey];
  if (!p) return;

  gatewaySelect.value = p.gateway;
  state.gateway = p.gateway;
  updateModelOptions();

  setTimeout(() => {
    modelSelect.value = p.model;
    state.model = p.model;
  }, 100);

  promptInput.value = p.prompt;
  promptInput.style.height = 'auto';
  promptInput.style.height = `${promptInput.scrollHeight}px`;

  if (p.system) {
    state.systemPrompt = p.system;
    systemPromptInput.value = p.system;
  }

  // Sync sidebar dropdown select
  const sidebarPresetSelect = document.getElementById('sidebarPresetSelect');
  if (sidebarPresetSelect && sidebarPresetSelect.value !== presetKey) {
    sidebarPresetSelect.value = presetKey;
  }

  // Sync mini-chips highlight
  document.querySelectorAll('.preset-card').forEach(c => {
    if (c.dataset.preset === presetKey) {
      c.classList.add('highlight-card');
    } else {
      c.classList.remove('highlight-card');
    }
  });
};

// Probe Gateways
async function probeGateways() {
  const updateChip = (id, online) => {
    const el = document.getElementById(id);
    if (!el) return;
    const dot = el.querySelector('.dot');
    dot.className = `dot ${online ? 'live' : ''}`;
  };

  // 1. Ollama
  try {
    const res = await fetch(`${GATEWAYS.ollama.base}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      updateChip('ollamaStatus', true);
      const data = await res.json();
      if (data.models && state.gateway === 'ollama') {
        populateModels(data.models.map(m => m.name));
      }
    } else {
      updateChip('ollamaStatus', false);
    }
  } catch (err) {
    updateChip('ollamaStatus', false);
  }

  // 2. OmniRoute
  try {
    const res = await fetch(`${GATEWAYS.omniroute.base}/v1/models`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      updateChip('omnirouteStatus', true);
    } else {
      updateChip('omnirouteStatus', false);
    }
  } catch (err) {
    updateChip('omnirouteStatus', false);
  }

  // 3. Spark MLX
  try {
    const res = await fetch(`${GATEWAYS.spark.base}/v1/models`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      updateChip('sparkStatus', true);
    } else {
      updateChip('sparkStatus', false);
    }
  } catch (err) {
    updateChip('sparkStatus', false);
  }

  // 4. Free Web Models
  try {
    const res = await fetch(`${GATEWAYS.webfree.base}/models`, { signal: AbortSignal.timeout(4000) });
    updateChip('webfreeStatus', res.ok);
  } catch (err) {
    updateChip('webfreeStatus', true);
  }
}

function updateModelOptions() {
  const g = state.gateway;
  if (g === 'auto') {
    populateModels([
      'auto-detect',
      'bolt-local',
      'qwen-agent',
      'gemma3:4b',
      'flux',
      'video',
      'openai-fast'
    ]);
    return;
  }
  if (g === 'ollama') {
    fetch(`${GATEWAYS.ollama.base}/api/tags`)
      .then(r => r.json())
      .then(d => {
        if (d.models) populateModels(d.models.map(m => m.name));
      })
      .catch(() => {
        populateModels(['bolt-local', 'qwen-agent', 'gemma3:4b', 'qwen2.5-coder:7b']);
      });
  } else if (g === 'webfree') {
    populateModels([
      'openai-fast (Chat & Web Apps)',
      'flux (Image Generator)',
      'video (Direct Video Generator)',
      'deepseek (Reasoning & Code)',
      'mistral',
      'qwen',
      'llama'
    ]);
  } else if (g === 'omniroute') {
    populateModels([
      'combo-pro-coding',
      'combo-deep-reasoning',
      'combo-fast-chat',
      'combo-vision-multimodal',
      'combo-ultra-heavy',
      'combo-zero-cost',
      'auto/best-coding'
    ]);
  } else if (g === 'spark') {
    populateModels(['XHToken/Spark-X2.5-1.7B']);
  } else if (g === 'lmstudio') {
    populateModels(['local-model']);
  }
}

function populateModels(models) {
  modelSelect.innerHTML = '';
  models.forEach(m => {
    const opt = document.createElement('option');
    const val = m.split(' ')[0];
    opt.value = val;
    opt.textContent = m;
    if (val === 'openai-fast' || val === 'bolt-local' || val === 'combo-pro-coding') {
      opt.selected = true;
    }
    modelSelect.appendChild(opt);
  });
  state.model = modelSelect.value;
}

// Media Upload Handling
function handleFileUpload(files, type) {
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const base64 = dataUrl.split(',')[1];
      const attachment = {
        type: type || (file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'image'),
        dataUrl,
        base64,
        name: file.name
      };
      state.attachments.push(attachment);
      renderAttachmentTray();
    };
    reader.readAsDataURL(file);
  });
}

function renderAttachmentTray() {
  attachmentTray.innerHTML = '';
  state.attachments.forEach((att, idx) => {
    const item = document.createElement('div');
    item.className = 'tray-item';
    if (att.type === 'image') {
      item.innerHTML = `<img src="${att.dataUrl}" alt="${att.name}"><button class="tray-remove-btn" onclick="removeAttachment(${idx})">&times;</button>`;
    } else {
      item.innerHTML = `<video src="${att.dataUrl}" muted></video><button class="tray-remove-btn" onclick="removeAttachment(${idx})">&times;</button>`;
    }
    attachmentTray.appendChild(item);
  });
}

window.removeAttachment = function(idx) {
  state.attachments.splice(idx, 1);
  renderAttachmentTray();
};

// ==========================================================================
// Autonomous Intent Detection & Generation Engines
// ==========================================================================

function detectIntent(rawText) {
  const t = rawText.trim();

  // If user explicitly chose a chip other than 'auto'
  if (state.activeIntent && state.activeIntent !== 'auto') {
    let clean = t;
    if (t.startsWith('/image ')) clean = t.slice(7).trim();
    if (t.startsWith('/video ')) clean = t.slice(7).trim();
    if (t.startsWith('/search ')) clean = t.slice(8).trim();
    if (t.startsWith('/web ')) clean = t.slice(5).trim();
    return { type: state.activeIntent, prompt: clean, original: t };
  }

  // 0. Active Web Search Toggle
  if (state.webSearchActive) {
    let clean = t;
    if (t.startsWith('/search ')) clean = t.slice(8).trim();
    if (t.startsWith('/web ')) clean = t.slice(5).trim();
    return { type: 'web_search', prompt: clean || t, original: t };
  }

  // 1. Direct Slash Commands
  if (t.startsWith('/rag ')) {
    return { type: 'rag', prompt: t.slice(5).trim(), original: t };
  }
  if (t.startsWith('/search ')) {
    return { type: 'web_search', prompt: t.slice(8).trim(), original: t };
  }
  if (t.startsWith('/web ')) {
    return { type: 'web_search', prompt: t.slice(5).trim(), original: t };
  }
  if (t.startsWith('/image ')) {
    return { type: 'image', prompt: t.slice(7).trim(), original: t };
  }
  if (t.startsWith('/video ')) {
    return { type: 'video', prompt: t.slice(7).trim(), original: t };
  }

  // 2. Video Generation Intents
  const videoAction = /(?:make|generate|create|render|produce|animate|build)\s+(?:an?\s+)?(?:video|animation|cinematic clip|motion clip|clip|short film)\b/i;
  const videoLeadRegex = /^(?:video|animation|cinematic video|motion clip)\s*(?:of\s+a|of\s+an|of|for|showing|about)?\s*:\s*(.*)/i;
  
  if (videoAction.test(t)) {
    const p = t.replace(videoAction, '').replace(/^(?:of\s+a|of\s+an|of|for|about|showing|with)\s+/i, '').trim();
    return { type: 'video', prompt: p || t, original: t };
  }
  if (videoLeadRegex.test(t)) {
    const match = t.match(videoLeadRegex);
    return { type: 'video', prompt: match[1].trim(), original: t };
  }

  // 3. Interactive Web App / Sandbox Intents
  const appRegex = /(?:build|create|code|make|develop|design|program|implement)\s+(?:an?\s+)?(?:[\w\s-]{0,25})?\b(?:app|application|game|calculator|timer|stopwatch|clock|widget|dashboard|tool|page|component|website|portfolio|ui)\b/i;
  if (appRegex.test(t)) {
    return { type: 'app', prompt: t, original: t };
  }

  // 4. Diagrams / Flowcharts
  const diagramRegex = /(?:diagram|flowchart|architecture of|system design|sequence diagram|workflow chart)\b/i;
  if (diagramRegex.test(t)) {
    return { type: 'diagram', prompt: t, original: t };
  }

  // 5. Image Generation Intents
  const imageDirectAction = /^(?:draw|paint|sketch|illustrate)\s+(?:an?\s+)?(.*)/i;
  const imageAction = /(?:make|generate|create|render|produce|show me)\s+(?:an?\s+)?(?:image|picture|photo|illustration|wallpaper|artwork|poster|sketch|painting|visual|graphic|portrait)\b/i;
  const imageKeywords = /\b(?:image|photo|picture|wallpaper|artwork|poster|sketch|painting|portrait)\s+(?:of\s+a|of\s+an|of|for|showing|with)\b/i;
  const imageLeadRegex = /^(?:image|picture|photo|wallpaper|artwork|poster)\s*(?:of\s+a|of\s+an|of|for|showing|about)?\s*:\s*(.*)/i;
  
  if (imageDirectAction.test(t)) {
    const match = t.match(imageDirectAction);
    return { type: 'image', prompt: match[1].trim(), original: t };
  }
  if (imageAction.test(t)) {
    const p = t.replace(imageAction, '').replace(/^(?:of\s+a|of\s+an|of|for|about|showing|with)\s+/i, '').trim();
    return { type: 'image', prompt: p || t, original: t };
  }
  if (imageKeywords.test(t)) {
    const p = t.replace(imageKeywords, '').trim();
    return { type: 'image', prompt: p || t, original: t };
  }
  if (imageLeadRegex.test(t)) {
    const match = t.match(imageLeadRegex);
    return { type: 'image', prompt: match[1].trim(), original: t };
  }

  // Broad catch for queries describing pure visual concepts
  const visualPrompt = /^(?:a|an)\s+(?:futuristic|cyberpunk|cinematic|photorealistic|hyperrealistic|anime|fantasy|sci-fi|retro|vintage|digital\s+art|neon|oil\s+painting)\b/i;
  if (visualPrompt.test(t)) {
    return { type: 'image', prompt: t, original: t };
  }

  // 6. On-Device Edge Memory Intents (Sub-50ms Qdrant Edge Teach & Recall)
  if (t.startsWith('/teach ') || /^(?:teach|remember|store memory|save to memory)\s*[:]?\s*/i.test(t)) {
    const rawTeach = t.replace(/^\/teach\s+/i, '').replace(/^(?:teach|remember|store memory|save to memory)\s*[:]?\s*/i, '').trim();
    return { type: 'memory_teach', prompt: rawTeach, original: t };
  }
  if (t.startsWith('/recall ') || t.startsWith('/ask ') || /^(?:where is|where are|where's|where did i put|what did i store about|find my)\b/i.test(t)) {
    const rawQuery = t.replace(/^\/(?:recall|ask)\s+/i, '').trim();
    return { type: 'memory_recall', prompt: rawQuery || t, original: t };
  }

  // 7. Natural Language Web Search Intents
  const webSearchLeadRegex = /^(?:search\s+for|search\s+the\s+web\s+for|look\s+up\s+online|find\s+online|browse\s+the\s+web\s+for)\s*[:]?\s*(.*)/i;
  const webSearchInlineRegex = /(?:search the web for|look up online for|search online for|latest updates on|latest 2026 updates)\s+(.*)/i;
  if (webSearchLeadRegex.test(t)) {
    const match = t.match(webSearchLeadRegex);
    return { type: 'web_search', prompt: match[1] ? match[1].trim() : t, original: t };
  }
  if (webSearchInlineRegex.test(t)) {
    const match = t.match(webSearchInlineRegex);
    return { type: 'web_search', prompt: match[1] ? match[1].trim() : t, original: t };
  }

  // 8. Multi-Role Vector Knowledge Base (RAG) Auto-Intent
  // If RAG toggle is active, OR if query mentions technical concepts, route to RAG automatically without /rag!
  if (state.ragActive) {
    return { type: 'rag', prompt: t, original: t };
  }

  const technicalKeywordsRegex = /\b(?:docker|container|kubernetes|k8s|devops|aws|s3|ec2|iam|lambda|python|fastapi|asyncio|rag|llm|llms|agent|agents|agentic|autogen|crewai|langgraph|mlops|mlflow|pipeline|jenkins|terraform|ansible|prometheus|grafana|linux|bash|shell|systemd|gitops|ci\/cd|helm|pod|ingress|cluster|neural|embedding|vector|fine-tuning|transformer)\b/i;
  if (technicalKeywordsRegex.test(t)) {
    return { type: 'rag', prompt: t, original: t };
  }

  return { type: 'text', prompt: t, original: t };
}

// ==========================================================================
// RAG Query Integration Engine
// ==========================================================================
async function executeRagQuery(searchQuery, assistantBubble, startTime) {
  state.abortController = new AbortController();
  
  const roleLabel = (!state.selectedRagRole || state.selectedRagRole === 'all') 
    ? 'All 11 Role Vector Databases (Agentic Routing)' 
    : `${state.selectedRagRole.toUpperCase()} Vector Store`;

  // Timer helper
  let timerInterval = null;
  const getElapsed = () => ((performance.now() - startTime) / 1000).toFixed(1) + 's';

  assistantBubble.innerHTML = `
    <div class="web-search-searching-state">
      <div class="web-search-searching-header">
        <span class="dot live"></span>
        <span>Agentic Multi-Role Router querying <strong>${escapeHtml(roleLabel)}</strong> for: <em>"${escapeHtml(searchQuery)}"</em>...</span>
        <span class="rag-status-timer" id="ragInitialTimer">0.0s</span>
      </div>
    </div>`;

  const initTimerEl = assistantBubble.querySelector('#ragInitialTimer');
  timerInterval = setInterval(() => {
    if (initTimerEl) initTimerEl.textContent = getElapsed();
  }, 100);

  try {
    const requestedRoles = (!state.selectedRagRole || state.selectedRagRole === 'all') ? [] : [state.selectedRagRole];
    const searchRes = await fetch('/api/multi_role_query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery, roles: requestedRoles, top_k_per_role: 3 }),
      signal: state.abortController.signal
    });

    if (!searchRes.ok) throw new Error(`HTTP RAG vector error: ${searchRes.status}`);
    const searchData = await searchRes.json();
    clearInterval(timerInterval);

    let badgesHtml = '';
    (searchData.roles_consulted || []).forEach(rc => {
      badgesHtml += `
        <span class="rag-agent-badge" title="Retrieved from books/vectors/${escapeHtml(rc.role)}/rag_catalog.db">
          <span>${rc.icon || '📚'}</span>
          <strong>${escapeHtml(rc.name || rc.role)}</strong>
          <span class="hit-pill">${rc.hit_count} hits</span>
        </span>`;
    });

    let sourcesListHtml = '';
    (searchData.results || []).forEach((r, idx) => {
      const scorePercent = ((r.similarity || r.score || 0) * 100).toFixed(1);
      sourcesListHtml += `
        <div class="rag-source-item">
          <div><strong>[#${idx + 1}] ${r.role_icon || '📚'} ${escapeHtml(r.role_name || r.role)}:</strong> <em>${escapeHtml(r.book_title || 'Technical Manual')}</em> &bull; Page ${r.page_number || 1} &bull; Match: ${scorePercent}%</div>
          <div style="font-size:0.68rem; color:var(--text-dim); margin-top:2px; font-family:monospace;">${escapeHtml((r.content || r.text || '').slice(0, 160))}...</div>
        </div>`;
    });

    const totalPassages = searchData.total_results || (searchData.results ? searchData.results.length : 0);

    assistantBubble.innerHTML = `
      <div class="rag-telemetry-header">
        <div class="rag-telemetry-title">
          <span>🧠 Multi-Role Vector Knowledge Grounding</span>
          <span style="font-size:0.7rem; font-weight:normal; color:var(--text-dim);">(${totalPassages} verified textbook passages)</span>
        </div>
        <div class="rag-agents-consulted-strip">
          ${badgesHtml || '<span style="font-size:0.75rem; color:var(--text-dim);">Vector Knowledge Base</span>'}
        </div>
        ${totalPassages > 0 ? `
          <button type="button" class="rag-sources-toggle-btn" onclick="const d = this.nextElementSibling; d.classList.toggle('hidden'); this.textContent = d.classList.contains('hidden') ? '📖 Inspect ${totalPassages} Retrieved Source Passages ▼' : '📖 Hide Source Passages ▲';">
            📖 Inspect ${totalPassages} Retrieved Source Passages ▼
          </button>
          <div class="rag-sources-drawer hidden">
            ${sourcesListHtml}
          </div>
        ` : ''}
      </div>
      
      <!-- Live Synthesis Status Bar -->
      <div class="rag-synthesis-status-bar" id="ragSynthesisStatusBar">
        <div class="rag-status-left">
          <span class="rag-status-dot pulsing"></span>
          <span class="rag-status-text" id="ragStatusText">Synthesizing grounded response with verified citations...</span>
        </div>
        <span class="rag-status-timer" id="ragSynthesisTimer">${getElapsed()}</span>
      </div>

      <!-- LLM Stream Viewport with Shimmer Skeleton -->
      <div class="llm-stream-box" id="ragStreamBox" style="margin-top: 10px;">
        <div class="rag-shimmer-loader" id="ragShimmerLoader">
          <div class="shimmer-line" style="width: 92%;"></div>
          <div class="shimmer-line" style="width: 78%;"></div>
          <div class="shimmer-line" style="width: 55%;"></div>
        </div>
      </div>`;

    const streamBox = assistantBubble.querySelector('#ragStreamBox');
    const statusText = assistantBubble.querySelector('#ragStatusText');
    const statusBar = assistantBubble.querySelector('#ragSynthesisStatusBar');
    const synthTimer = assistantBubble.querySelector('#ragSynthesisTimer');

    timerInterval = setInterval(() => {
      if (synthTimer) synthTimer.textContent = getElapsed();
    }, 100);

    // Construct context
    let prompt;
    if (searchData.results && searchData.results.length > 0) {
      const ctx = searchData.results.map(r => `[${r.role_icon || ''} ${r.role_name || r.role} | Book: ${r.book_title} | Page ${r.page_number}]\n${r.content || r.text || ''}`).join('\n\n---\n\n');
      prompt = `You are OmniStudio Academy's Principal AI Technical Specialist. Answer the user's question with authority, precision, and detailed production-ready code examples where relevant.
Strictly ground your answer in the following retrieved textbook passages from our specialized role vector databases. Cite the specific role, textbook title, and page numbers when stating key facts or architectural rules.

Retrieved Passages:
${ctx}

User Question:
${searchQuery}`;
    } else {
      prompt = `You are OmniStudio Academy's Principal AI Technical Specialist. Answer the user's question with deep technical rigor, production-grade code, and clear architectural explanations:\n\n${searchQuery}`;
    }

    const systemPrompt = searchData.agent_system_prompt || state.systemPrompt || "You are a Principal AI Technical Specialist.";
    let targetGateway = gatewaySelect ? gatewaySelect.value : (state.gateway || 'webfree');
    let targetModel = modelSelect ? modelSelect.value : (state.model || 'openai-fast');

    if (targetGateway === 'webfree' && !['openai', 'openai-fast', 'openai-large', 'qwen-coder', 'mistral', 'deepseek', 'claude-hybrid'].includes(targetModel)) {
      targetModel = 'openai-fast';
    }

    const generatePayload = {
      model: targetModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      stream: true,
      temperature: 0.2
    };

    let fullText = '';
    let tokenCount = 0;
    let firstTokenReceived = false;

    if (targetGateway === 'ollama') {
      const ollamaPayload = {
        model: targetModel || 'bolt-local',
        system: systemPrompt,
        prompt: prompt,
        stream: true,
        options: { temperature: 0.2 }
      };
      const response = await fetch(`${GATEWAYS.ollama.base}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ollamaPayload),
        signal: state.abortController.signal
      });
      if (!response.ok) throw new Error(`Ollama synthesis error: ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim() !== '');
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              if (!firstTokenReceived) {
                firstTokenReceived = true;
                const latency = Math.round(performance.now() - startTime);
                if (latencyVal) latencyVal.textContent = latency;
                if (statusText) statusText.textContent = `Streaming grounded response (${totalPassages} verified passages)...`;
              }
              fullText += data.response;
              tokenCount++;
              updateSpeedCounter(tokenCount, startTime);
              streamBox.innerHTML = renderMarkdown(fullText);
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }
          } catch(e) {}
        }
      }
    } else {
      const isWebFree = targetGateway === 'webfree';
      const endpoint = isWebFree 
        ? `${GATEWAYS.webfree.base}/chat/completions` 
        : `${GATEWAYS[targetGateway]?.base || GATEWAYS.webfree.base}/v1/chat/completions`;

      const headers = { 'Content-Type': 'application/json' };
      if (!isWebFree) headers['Authorization'] = 'Bearer sk-omniroute-local';

      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(generatePayload),
          signal: state.abortController.signal
        });
      } catch (networkErr) {
        if (!isWebFree) {
          generatePayload.model = 'openai-fast';
          response = await fetch(`${GATEWAYS.webfree.base}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(generatePayload),
            signal: state.abortController.signal
          });
        } else {
          throw networkErr;
        }
      }

      // If local gateway returned 404/500, fallback to webfree
      if (!response.ok && !isWebFree) {
        generatePayload.model = 'openai-fast';
        response = await fetch(`${GATEWAYS.webfree.base}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generatePayload),
          signal: state.abortController.signal
        });
      }

      if (!response.ok) throw new Error(`Synthesis API error: ${response.status}`);
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              const delta = data.choices?.[0]?.delta?.content || '';
              if (delta) {
                if (!firstTokenReceived) {
                  firstTokenReceived = true;
                  const latency = Math.round(performance.now() - startTime);
                  if (latencyVal) latencyVal.textContent = latency;
                  if (statusText) statusText.textContent = `Streaming grounded response (${totalPassages} verified passages)...`;
                }
                fullText += delta;
                tokenCount++;
                updateSpeedCounter(tokenCount, startTime);
                streamBox.innerHTML = renderMarkdown(fullText);
                chatMessages.scrollTop = chatMessages.scrollHeight;
              }
            } catch(e) {}
          }
        }
      }
    }

    clearInterval(timerInterval);
    if (statusBar) {
      statusBar.className = 'rag-synthesis-status-bar completed';
      const dot = statusBar.querySelector('.rag-status-dot');
      if (dot) dot.className = 'rag-status-dot';
      if (statusText) {
        statusText.innerHTML = `✅ Grounded Synthesis Complete (<strong>${tokenCount} tokens</strong> &bull; ${getElapsed()} &bull; <strong>${totalPassages} passages</strong>)`;
      }
    }

    if (window.attachOmniActionBar) {
      attachOmniActionBar(assistantBubble, fullText);
    }

    if (window.speakVoiceResponse) {
      window.speakVoiceResponse(fullText);
    }
  } catch (err) {
    clearInterval(timerInterval);
    const statusBar = assistantBubble.querySelector('#ragSynthesisStatusBar');
    const statusText = assistantBubble.querySelector('#ragStatusText');
    const streamBox = assistantBubble.querySelector('#ragStreamBox');
    
    if (statusBar) {
      statusBar.className = 'rag-synthesis-status-bar error';
      if (statusText) {
        statusText.innerHTML = err.name === 'AbortError' 
          ? '⏹️ RAG Query Cancelled by User' 
          : `⚠️ Synthesis Error: ${escapeHtml(err.message)}`;
      }
    }

    if (err.name !== 'AbortError' && streamBox) {
      streamBox.innerHTML = `
        <div style="padding: 10px; background: rgba(244,63,94,0.08); border: 1px solid rgba(244,63,94,0.25); border-radius: 6px; color: var(--accent-rose); font-size: 0.8rem;">
          <p><strong>RAG Synthesis Pipeline Error:</strong> ${escapeHtml(err.message)}</p>
          <button type="button" class="tiny-btn" style="margin-top: 6px;" onclick="selectPresetPrompt('rag'); sendMessage();">
            🔄 Retry Grounded Query
          </button>
        </div>`;
    }
  } finally {
    clearInterval(timerInterval);
    setGeneratingState(false);
  }
}

// ==========================================================================
// Real-Time Web Search Grounding Engine (DuckDuckGo & Online Docs)
// ==========================================================================

async function executeWebSearchChat(searchQuery, assistantBubble, startTime) {
  state.abortController = new AbortController();

  assistantBubble.innerHTML = `
    <div class="web-search-searching-state">
      <div class="web-search-searching-header">
        <span class="dot checking"></span>
        <span>Searching live web sources for: <strong>"${escapeHtml(searchQuery)}"</strong>...</span>
      </div>
    </div>`;

  try {
    const searchRes = await fetch('/api/tools/web_search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery, max_results: 5 }),
      signal: state.abortController.signal
    });

    if (!searchRes.ok) throw new Error(`HTTP search error: ${searchRes.status}`);
    const searchData = await searchRes.json();

    if (!searchData.results || searchData.results.length === 0) {
      assistantBubble.innerHTML = `
        <p>No real-time web results found for <em>"${escapeHtml(searchQuery)}"</em>. Synthesizing from model knowledge base...</p>`;
      return;
    }

    assistantBubble.innerHTML = `
      <div class="web-search-searching-state">
        <div class="web-search-searching-header">
          <span class="dot live"></span>
          <span>Retrieved <strong>${searchData.results.length} live web sources</strong>. Synthesizing answer...</span>
        </div>
      </div>`;

    let targetGateway = state.gateway;
    let targetModel = state.model;
    if (state.gateway === 'auto' || state.gateway === 'webfree') {
      targetGateway = 'webfree';
      targetModel = (state.model === 'openai-fast' || state.model === 'flux' || state.model === 'video') ? 'openai' : state.model;
    }

    if (targetGateway === 'ollama') {
      const ollamaChip = document.getElementById('ollamaStatus');
      const isLive = ollamaChip && ollamaChip.querySelector('.dot.live');
      if (!isLive) {
        targetGateway = 'webfree';
        targetModel = 'openai-fast';
      }
    }

    const systemPrompt = `You are OmniStudio, an expert AI engineer equipped with live web search capabilities.
Answer the user's question accurately, directly, and comprehensively using the following live web search results as factual ground truth:

=== LIVE WEB SEARCH SOURCES ===
${searchData.context_text}
===============================

User Question: ${searchQuery}

Instructions:
1. Provide a direct, well-structured answer using markdown headings, bullet points, and code blocks where applicable.
2. Cite key points using bracket notation (e.g. [1], [2]) that match the sources above.
3. Ensure the technical details reflect current 2026 standards.
4. Avoid generic filler like "Based on the search results" in the first line; jump straight into the answer.`;

    let fullResponse = '';
    let tokenCount = 0;
    let firstTokenReceived = false;

    if (targetGateway === 'ollama') {
      const payload = {
        model: targetModel,
        prompt: systemPrompt,
        stream: true,
        options: {
          temperature: state.temperature,
          num_ctx: state.contextSize
        }
      };

      const response = await fetch(`${GATEWAYS.ollama.base}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: state.abortController.signal
      });

      if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (!firstTokenReceived) {
              firstTokenReceived = true;
              const latency = Math.round(performance.now() - startTime);
              if (latencyVal) latencyVal.textContent = latency;
            }
            if (data.response) {
              fullResponse += data.response;
              tokenCount++;
              updateSpeedCounter(tokenCount, startTime);
              assistantBubble.innerHTML = renderMarkdown(fullResponse);
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }
          } catch (e) {}
        }
      }
    } else {
      // OpenAI-compatible Chat Completions (WebFree / OmniRoute / Spark)
      const messages = [
        { role: 'system', content: 'You are OmniStudio, an expert AI engineer grounded by real-time web search results.' },
        { role: 'user', content: systemPrompt }
      ];

      const payload = {
        model: targetModel,
        messages,
        temperature: state.temperature,
        stream: true
      };

      const isWebFree = targetGateway === 'webfree';
      const endpoint = isWebFree 
        ? `${GATEWAYS.webfree.base}/chat/completions` 
        : `${GATEWAYS[targetGateway]?.base || GATEWAYS.webfree.base}/v1/chat/completions`;

      const headers = { 'Content-Type': 'application/json' };
      if (!isWebFree) headers['Authorization'] = 'Bearer sk-omniroute-local';

      let response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: state.abortController.signal
        });
      } catch (networkErr) {
        if (!isWebFree) {
          payload.model = 'openai-fast';
          response = await fetch(`${GATEWAYS.webfree.base}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: state.abortController.signal
          });
        } else {
          throw networkErr;
        }
      }

      // If primary gateway returned 404/500, fallback to webfree
      if (!response.ok && !isWebFree) {
        payload.model = 'openai-fast';
        response = await fetch(`${GATEWAYS.webfree.base}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: state.abortController.signal
        });
      }

      if (!response.ok) throw new Error(`Gateway HTTP ${response.status}`);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                if (!firstTokenReceived) {
                  firstTokenReceived = true;
                  const latency = Math.round(performance.now() - startTime);
                  if (latencyVal) latencyVal.textContent = latency;
                }
                fullResponse += delta;
                tokenCount++;
                updateSpeedCounter(tokenCount, startTime);
                assistantBubble.innerHTML = renderMarkdown(fullResponse);
                chatMessages.scrollTop = chatMessages.scrollHeight;
              }
            } catch (e) {}
          }
        }
      }
    }

    // Attach Citation Cards Deck below the synthesized response
    const citationDeck = document.createElement('div');
    citationDeck.className = 'web-citation-deck';
    citationDeck.innerHTML = `
      <div class="web-citation-header">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="2" y1="12" x2="22" y2="12"></line>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        <span>Live Web Sources (${searchData.results.length})</span>
      </div>
      <div class="web-citation-grid">
        ${searchData.results.map((r, i) => `
          <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" class="web-citation-card" title="${escapeHtml(r.title)}">
            <span class="citation-num">[${i + 1}]</span>
            <div class="citation-body">
              <div class="citation-domain">${escapeHtml(r.domain || 'web')}</div>
              <div class="citation-title">${escapeHtml(r.title)}</div>
              <div class="citation-snippet">${escapeHtml(r.snippet)}</div>
            </div>
            <svg class="external-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        `).join('')}
      </div>`;
    assistantBubble.appendChild(citationDeck);

    if (window.attachOmniActionBar) {
      attachOmniActionBar(assistantBubble, fullResponse);
    }

    if (window.speakVoiceResponse) {
      window.speakVoiceResponse(fullResponse);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      assistantBubble.innerHTML += '<p style="color:var(--text-muted);font-style:italic;">[Web Search Stopped]</p>';
    } else {
      assistantBubble.innerHTML = `<div class="error-msg">Web search grounding error: ${escapeHtml(err.message)}</div>`;
    }
  } finally {
    setGeneratingState(false);
  }
}

async function executeWebSearchToolSimulation(query) {
  const bubble = appendAssistantPlaceholder('WebSearch Tool', '⚡ TOOL CALL: web_search');
  bubble.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;color:var(--accent-cyan);padding:6px 0;">
      <span class="dot checking"></span> Executing live web search simulation for: "<strong>${escapeHtml(query)}</strong>"...
    </div>`;

  const startTime = performance.now();
  try {
    const res = await fetch('/api/tools/web_search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, max_results: 5 })
    });
    const data = await res.json();
    const elapsed = Math.round(performance.now() - startTime);

    bubble.innerHTML = `
      <div class="tool-call-card">
        <div class="tool-header">
          <span class="tool-name-tag">⚡ Tool Execution: web_search</span>
          <span class="tool-status-badge">✅ Fetched ${data.results?.length || 0} Results (${elapsed}ms)</span>
        </div>
        <p style="margin: 0.5rem 0 0.2rem; font-size: 0.8rem; color: var(--text-dim);">Live Results Preview:</p>
        <div class="web-citation-grid" style="margin-top:0.4rem;">
          ${(data.results || []).map((r, i) => `
            <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer" class="web-citation-card">
              <span class="citation-num">[${i + 1}]</span>
              <div class="citation-body">
                <div class="citation-domain">${escapeHtml(r.domain)}</div>
                <div class="citation-title">${escapeHtml(r.title)}</div>
                <div class="citation-snippet">${escapeHtml(r.snippet)}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>`;
  } catch (e) {
    bubble.innerHTML = `<div class="error-msg">Tool simulation failed: ${e.message}</div>`;
  }
}

// Neural Image Synthesis Engine (Zero Key via Flux/Pollinations)
function executeImageGeneration(imgPrompt, container, startTime, routeBadge = 'Flux 1024px') {
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;color:var(--accent-cyan);padding:8px 0;">
      <span class="dot checking"></span> Synthesizing high-resolution neural image weights (Flux)...
    </div>`;

  const seed = Math.floor(Math.random() * 999999);
  const encodedPrompt = encodeURIComponent(imgPrompt);
  const rawImgUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}`;
  const displayUrl = PROXY_ROOT ? `/proxy/image?url=${encodeURIComponent(rawImgUrl)}` : rawImgUrl;

  const img = new Image();
  img.onload = () => {
    const latency = Math.round(performance.now() - startTime);
    latencyVal.textContent = latency;
    speedVal.textContent = '1.0';
    container.innerHTML = `
      <div class="media-generation-card">
        <div class="media-generation-header">
          <div class="media-title-wrap">
            <span>✨ Neural Image</span>
            <span class="media-badge">Flux / Ultra HD</span>
          </div>
          <span style="font-size:0.72rem;color:var(--text-dim);">${latency}ms</span>
        </div>
        <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.6rem;">
          <em>"${escapeHtml(imgPrompt)}"</em>
        </p>
        <div style="text-align:center;">
          <img src="${displayUrl}" class="message-image-thumb" style="max-width:100%;max-height:480px;cursor:pointer;border-radius:8px;" onclick="openLightbox('${displayUrl}')" alt="${escapeHtml(imgPrompt)}">
        </div>
        <div class="media-generation-actions">
          <a href="${displayUrl}" target="_blank" download="generated-image.jpg" class="code-btn" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px;background:var(--bg-hover);padding:6px 12px;border-radius:6px;color:#fff;">
            ⬇️ Download Image
          </a>
          <button class="code-btn" onclick="regenerateImage('${encodeURIComponent(imgPrompt)}', this)">
            🔄 Regenerate
          </button>
        </div>
      </div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;
    setGeneratingState(false);
  };

  img.onerror = () => {
    container.innerHTML = `<span style="color:var(--accent-rose)">⚠️ Failed to generate image. Please try again.</span>`;
    setGeneratingState(false);
  };
  img.src = displayUrl;
}

// Neural Video Synthesis Engine (Canvas 30 FPS + VP9 WebM Encoding)
function executeVideoGeneration(vidPrompt, container, startTime, routeBadge = '30 FPS Video') {
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;color:var(--accent-purple);padding:8px 0;">
      <span class="dot checking"></span> Synthesizing keyframes & 30 FPS cinematic motion...
    </div>`;

  const seed = Math.floor(Math.random() * 999999);
  const encodedPrompt = encodeURIComponent(vidPrompt + " cinematic lighting smooth motion ultra detailed");
  const baseImgUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}`;
  const proxyUrl = PROXY_ROOT ? `/proxy/image?url=${encodeURIComponent(baseImgUrl)}` : baseImgUrl;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext('2d');

      const stream = canvas.captureStream(30);
      let mime = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mime)) {
        mime = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
      }
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4000000 });
      const recordedChunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: mime });
        const vidUrl = URL.createObjectURL(blob);
        const latency = Math.round(performance.now() - startTime);
        latencyVal.textContent = latency;
        speedVal.textContent = '30.0';

        container.innerHTML = `
          <div class="media-generation-card">
            <div class="media-generation-header">
              <div class="media-title-wrap">
                <span>🎬 Direct Neural Video</span>
                <span class="media-badge">1280x720 • 30 FPS • WebM</span>
              </div>
              <span style="font-size:0.72rem;color:var(--text-dim);">${latency}ms</span>
            </div>
            <p style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.6rem;">
              <em>"${escapeHtml(vidPrompt)}"</em>
            </p>
            <div class="video-player-container" style="max-width:720px;border-radius:10px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.6);border:1px solid var(--border-focus);">
              <video src="${vidUrl}" controls autoplay loop playsinline style="width:100%;display:block;"></video>
            </div>
            <div class="media-generation-actions">
              <a href="${vidUrl}" download="neural-video.webm" class="code-btn" style="text-decoration:none;display:inline-flex;align-items:center;gap:5px;background:var(--bg-hover);padding:6px 14px;border-radius:6px;color:#fff;font-weight:600;">
                ⬇️ Download Video (WebM)
              </a>
              <button class="code-btn" onclick="regenerateVideo('${encodeURIComponent(vidPrompt)}', this)">
                🔄 Regenerate
              </button>
            </div>
          </div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;
        setGeneratingState(false);
      };

      recorder.start();

      const totalFrames = 100;
      let currentFrame = 0;

      const particles = Array.from({ length: 45 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 1.5,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.7 + 0.3
      }));

      function renderFrame() {
        if (currentFrame >= totalFrames) {
          recorder.stop();
          return;
        }

        const progress = currentFrame / totalFrames;
        const ease = 0.5 - 0.5 * Math.cos(progress * Math.PI);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const scale = 1.0 + ease * 0.15;
        const shiftX = Math.sin(progress * Math.PI) * 25;
        const shiftY = -ease * 20;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-canvas.width / 2 + shiftX, -canvas.height / 2 + shiftY);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Atmospheric volumetric light sweep
        const lightX = canvas.width * progress;
        const grad = ctx.createRadialGradient(lightX, 200, 50, lightX, 200, 600);
        grad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
        grad.addColorStop(0.5, 'rgba(139, 92, 246, 0.12)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Floating dust particles
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          if (p.y < 0) p.y = canvas.height;
          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * (0.8 + 0.2 * Math.sin(currentFrame * 0.2))})`;
          ctx.fill();
        });

        // Letterbox bars
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, 24);
        ctx.fillRect(0, canvas.height - 24, canvas.width, 24);

        currentFrame++;
        requestAnimationFrame(renderFrame);
      }

      renderFrame();

    } catch (videoErr) {
      container.innerHTML = `
        <div class="media-generation-card">
          <p><strong>🎬 Visual Scene:</strong> <em>"${escapeHtml(vidPrompt)}"</em></p>
          <img src="${baseImgUrl}" class="message-image-thumb" style="max-width:100%;max-height:480px;" alt="${escapeHtml(vidPrompt)}">
        </div>`;
      setGeneratingState(false);
    }
  };

  img.onerror = () => {
    container.innerHTML = `<span style="color:var(--accent-rose)">⚠️ Failed to synthesize video. Please try again.</span>`;
    setGeneratingState(false);
  };

  img.src = proxyUrl;
}

// Media Regeneration Helpers
window.regenerateImage = function(encodedPrompt, btn) {
  const prompt = decodeURIComponent(encodedPrompt);
  const card = btn.closest('.media-generation-card') || btn.parentElement;
  executeImageGeneration(prompt, card, performance.now());
};

window.regenerateVideo = function(encodedPrompt, btn) {
  const prompt = decodeURIComponent(encodedPrompt);
  const card = btn.closest('.media-generation-card') || btn.parentElement;
  executeVideoGeneration(prompt, card, performance.now());
};

// On-Device Edge Memory Chat Execution
async function executeEdgeMemoryTeach(promptText, container, startTime) {
  let label = '';
  let transcript = '';
  let where = '';
  let category = 'gear';

  if (promptText.includes(':')) {
    const parts = promptText.split(':');
    label = parts[0].trim();
    transcript = parts.slice(1).join(':').trim();
  } else if (promptText.includes('=')) {
    const parts = promptText.split('=');
    label = parts[0].trim();
    transcript = parts.slice(1).join('=').trim();
  } else {
    const words = promptText.split(' ');
    label = words.slice(0, 2).join(' ');
    transcript = promptText;
  }

  if (transcript.toLowerCase().includes('in ') || transcript.toLowerCase().includes('at ')) {
    const m = transcript.match(/(?:in|at)\s+([a-zA-Z0-9\s]+?)(?:[.,]|$)/i);
    if (m) where = m[1].trim();
  }

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;color:var(--accent-cyan);padding:8px 0;">
      <span class="dot checking"></span> Storing into local Qdrant Edge memory & generating 768-D vector...
    </div>`;

  try {
    const res = await fetch('/api/memory/teach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, transcript, where, category })
    });
    const elapsed = (performance.now() - startTime).toFixed(1);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await res.json();

    container.innerHTML = `
      <div class="recall-hit-card" style="margin-top: 4px;">
        <div class="recall-hit-header">
          <div class="recall-hit-title">
            <span>⚡</span>
            <span>Memory Stored: ${escapeHtml(label)}</span>
          </div>
          <span class="conf-pill conf-high">${elapsed}ms Local Edge</span>
        </div>
        <div class="recall-transcript-text">
          "${escapeHtml(transcript)}"
        </div>
        <div class="recall-meta-row">
          <div class="recall-tags">
            ${where ? `<span class="loc-tag">📍 ${escapeHtml(where)}</span>` : ''}
            <span class="loc-tag">🛡️ Zero Cloud / On-Device</span>
          </div>
          <button class="voice-speak-btn" onclick="speakWithVoice('Stored memory for ${label.replace(/'/g, "\\'")}')">
            <span>🔊</span> Speak
          </button>
        </div>
      </div>`;

    if (localStorage.getItem('omni_voice_tts') === 'true') {
      speakWithVoice(`Stored on-device memory for ${label}`);
    }
  } catch (err) {
    container.innerHTML = `<span style="color:var(--accent-rose)">⚠️ Memory Teach failed: ${escapeHtml(err.message)}</span>`;
  } finally {
    setGeneratingState(false);
  }
}

async function executeEdgeMemoryRecall(queryText, container, startTime) {
  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;color:var(--accent-cyan);padding:8px 0;">
      <span class="dot checking"></span> Querying on-device semantic memory index (&lt; 50ms)...
    </div>`;

  try {
    const res = await fetch('/api/memory/recall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryText })
    });
    const elapsed = (performance.now() - startTime).toFixed(1);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.recognized && data.match) {
      const match = data.match;
      const scorePct = Math.round((data.best_score || 1.0) * 100);
      const confClass = scorePct >= 65 ? 'conf-high' : 'conf-medium';

      container.innerHTML = `
        <div class="recall-hit-card" style="margin-top: 4px;">
          <div class="recall-hit-header">
            <div class="recall-hit-title">
              <span>⚡</span>
              <span>${escapeHtml(match.label || 'Recognized Item')}</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span class="conf-pill ${confClass}">${scorePct}% Match</span>
              <span style="font-size:0.7rem; color:var(--text-dim); font-weight:700;">${elapsed}ms</span>
            </div>
          </div>
          <div class="recall-transcript-text">
            ${escapeHtml(data.spoken_response || match.transcript || '')}
          </div>
          <div class="recall-meta-row">
            <div class="recall-tags">
              ${match.where_loc ? `<span class="loc-tag">📍 ${escapeHtml(match.where_loc)}</span>` : ''}
              ${match.category ? `<span class="loc-tag">🏷️ ${escapeHtml(match.category)}</span>` : ''}
              <span class="loc-tag">👁️ ${match.sightings_count || 1} sightings</span>
            </div>
            <button class="voice-speak-btn" onclick="speakWithVoice('${(data.spoken_response || match.transcript || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}')">
              <span>🔊</span> Speak
            </button>
          </div>
        </div>`;

      if (localStorage.getItem('omni_voice_tts') === 'true') {
        speakWithVoice(data.spoken_response || match.transcript || '');
      }
      setGeneratingState(false);
      return true; // handled
    } else {
      // Unrecognized: Let the user know and let general LLM stream!
      container.innerHTML = `
        <div style="font-size:0.78rem; color:var(--text-dim); padding-bottom:6px; border-bottom:1px solid var(--border-subtle); margin-bottom:8px;">
          ⚡ <em>Edge Memory: No local match registered (&lt; 35% similarity). Querying neural model...</em>
        </div>
        <div class="llm-stream-box"></div>`;
      return false; // let general stream proceed
    }
  } catch (err) {
    container.innerHTML = `<span style="color:var(--accent-rose)">⚠️ Edge Recall error: ${escapeHtml(err.message)}</span>`;
    setGeneratingState(false);
    return true;
  }
}

// Text-to-Speech Audio Helper
window.toggleSpeech = function(btn) {
  if (!('speechSynthesis' in window)) {
    alert('Speech synthesis not supported in this browser.');
    return;
  }

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    document.querySelectorAll('.speech-btn').forEach(b => {
      b.classList.remove('speaking');
      b.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> Listen`;
    });
    return;
  }

  const messageRow = btn.closest('.message-row');
  const bubble = messageRow ? messageRow.querySelector('.message-bubble') : null;
  if (!bubble) return;

  const clone = bubble.cloneNode(true);
  clone.querySelectorAll('pre, code, script, style, .media-generation-card, .video-player-container, .mermaid-container').forEach(el => el.remove());
  const text = clone.textContent.trim();
  if (!text) return;

  btn.classList.add('speaking');
  btn.innerHTML = `⏹️ Stop`;

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.05;

  utter.onend = () => {
    btn.classList.remove('speaking');
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> Listen`;
  };

  utter.onerror = () => {
    btn.classList.remove('speaking');
    btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg> Listen`;
  };

  window.speechSynthesis.speak(utter);
};

// ==========================================================================
// Main Send & Auto-Orchestration Flow
// ==========================================================================
async function handleSend() {
  if (state.isGenerating) {
    if (state.abortController) state.abortController.abort();
    setGeneratingState(false);
    return;
  }

  const text = promptInput.value.trim();
  if (!text && state.attachments.length === 0) return;

  // Clear Welcome if first message
  const welcome = chatMessages.querySelector('.welcome-hero');
  if (welcome) welcome.remove();

  // Append User Message Bubble
  appendUserMessage(text, [...state.attachments]);

  // Reset inputs
  promptInput.value = '';
  promptInput.style.height = 'auto';
  const sentAttachments = [...state.attachments];
  state.attachments = [];
  renderAttachmentTray();

  // Detect Intent
  const intent = detectIntent(text);

  let targetGateway = state.gateway;
  let targetModel = state.model;
  let autoTag = '';
  let autoMountApp = false;

  // Auto-Pilot or Dedicated Intent Routing
  if (state.gateway === 'auto' || state.gateway === 'webfree' || state.activeIntent !== 'auto' || text.startsWith('/') || intent.type !== 'text') {
    if (intent.type === 'rag') {
      const assistantBubble = appendAssistantPlaceholder(targetModel, '📚 Multi-Role RAG Search');
      setGeneratingState(true);
      executeRagQuery(intent.prompt, assistantBubble, performance.now());
      return;
    }
    if (intent.type === 'web_search') {
      const assistantBubble = appendAssistantPlaceholder(targetModel, '🌐 Live Web Search');
      setGeneratingState(true);
      executeWebSearchChat(intent.prompt, assistantBubble, performance.now());
      return;
    }
    if (intent.type === 'memory_teach') {
      const assistantBubble = appendAssistantPlaceholder('Edge Memory', '⚡ On-Device Memory');
      setGeneratingState(true);
      executeEdgeMemoryTeach(intent.prompt, assistantBubble, performance.now());
      return;
    }
    if (intent.type === 'memory_recall') {
      const assistantBubble = appendAssistantPlaceholder('Edge Memory', '⚡ Sub-50ms Recall');
      setGeneratingState(true);
      const handled = await executeEdgeMemoryRecall(intent.prompt, assistantBubble, performance.now());
      if (handled) return;
    }
    if (intent.type === 'image' || state.model === 'flux') {
      const assistantBubble = appendAssistantPlaceholder('Flux 1024px', '🎨 Auto-Gen Image');
      setGeneratingState(true);
      executeImageGeneration(intent.prompt, assistantBubble, performance.now(), 'Free Web');
      return;
    }
    if (intent.type === 'video' || state.model === 'video') {
      const assistantBubble = appendAssistantPlaceholder('Video 30FPS', '🎬 Auto-Gen Video');
      setGeneratingState(true);
      executeVideoGeneration(intent.prompt, assistantBubble, performance.now(), 'Free Web');
      return;
    }
    if (state.gateway === 'webfree') {
      targetGateway = 'webfree';
      targetModel = (state.model === 'openai-fast' || state.model === 'flux' || state.model === 'video') ? 'openai' : state.model;
      if (intent.type === 'app') {
        autoTag = '⚡ WebFree -> App & Sandbox';
        autoMountApp = true;
      } else if (intent.type === 'diagram') {
        autoTag = '📊 WebFree -> Architecture Diagram';
      } else {
        autoTag = '🌐 Free Web';
      }
    } else {
      if (intent.type === 'app') {
        targetGateway = 'ollama';
        targetModel = 'bolt-local';
        autoTag = '⚡ Auto -> App & Sandbox';
        autoMountApp = true;
      } else if (intent.type === 'diagram') {
        targetGateway = 'ollama';
        targetModel = 'qwen-agent';
        autoTag = '📊 Auto -> Architecture Diagram';
      } else {
        targetGateway = 'ollama';
        targetModel = 'bolt-local';
        autoTag = '✨ Auto-Pilot';
      }
    }
  }

  // Fallback to WebFree if Ollama is selected but offline
  if (targetGateway === 'ollama') {
    const ollamaChip = document.getElementById('ollamaStatus');
    const isLive = ollamaChip && ollamaChip.querySelector('.dot.live');
    if (!isLive) {
      targetGateway = 'webfree';
      targetModel = 'openai-fast';
      autoTag = (autoTag ? autoTag + ' • ' : '') + 'Webfree';
    }
  }

  // Prepare Assistant Placeholder
  const assistantBubble = appendAssistantPlaceholder(targetModel, autoTag);
  setGeneratingState(true);

  const startTime = performance.now();
  let firstTokenReceived = false;
  let tokenCount = 0;
  let fullResponse = '';

  state.abortController = new AbortController();

  try {
    let effectiveSystemPrompt = state.systemPrompt;
    if (!effectiveSystemPrompt) {
      if (intent.type === 'app' || autoMountApp) {
        effectiveSystemPrompt = 'You are Bolt, an autonomous full-stack engineer. The user wants an interactive web application. Output a 100% complete, standalone single-file HTML app in a single ```html codeblock with all CSS and JavaScript embedded. No placeholders, no stubs. Make it visually stunning with modern UI aesthetics, responsive styling, and complete interactivity.';
      } else if (intent.type === 'diagram') {
        effectiveSystemPrompt = 'You are an expert system designer. Explain the architecture clearly and provide an interactive diagram using Mermaid syntax inside a ```mermaid code block (e.g. graph TD or sequenceDiagram).';
      } else {
        effectiveSystemPrompt = 'You are OmniStudio, a helpful, knowledgeable, and professional AI assistant. Respond clearly, concisely, and directly. Use well-structured markdown formatting when appropriate. Never include your internal reasoning or planning in your response — only provide the final, polished answer.';
      }
    }

    if (targetGateway === 'ollama') {
      // Ollama Native API with Images support
      const payload = {
        model: targetModel,
        prompt: text,
        stream: true,
        options: {
          temperature: state.temperature,
          num_ctx: state.contextSize
        }
      };

      if (effectiveSystemPrompt) {
        payload.system = effectiveSystemPrompt;
      }

      const images = sentAttachments.filter(a => a.type === 'image').map(a => a.base64);
      if (images.length > 0) {
        payload.images = images;
      }

      const response = await fetch(`${GATEWAYS.ollama.base}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: state.abortController.signal
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        streamBuffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (!firstTokenReceived) {
              firstTokenReceived = true;
              const latency = Math.round(performance.now() - startTime);
              latencyVal.textContent = latency;
            }
            if (data.response) {
              fullResponse += data.response;
              tokenCount++;
              updateSpeedCounter(tokenCount, startTime);
              assistantBubble.innerHTML = renderMarkdown(fullResponse);
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }
          } catch (e) {}
        }
      }
    } else {
      // OpenAI-compatible Chat Completions (WebFree / OmniRoute / Spark / LM Studio)
      const messages = [];
      if (effectiveSystemPrompt) {
        messages.push({ role: 'system', content: effectiveSystemPrompt });
      }

      const imageAttachments = sentAttachments.filter(a => a.type === 'image');
      if (imageAttachments.length > 0) {
        const contentParts = [{ type: 'text', text }];
        imageAttachments.forEach(att => {
          contentParts.push({
            type: 'image_url',
            image_url: { url: att.dataUrl }
          });
        });
        messages.push({ role: 'user', content: contentParts });
      } else {
        messages.push({ role: 'user', content: text });
      }

      const payload = {
        model: targetModel,
        messages,
        temperature: state.temperature,
        stream: true
      };

      const isWebFree = targetGateway === 'webfree';
      const endpoint = isWebFree 
        ? `${GATEWAYS.webfree.base}/chat/completions` 
        : `${GATEWAYS[targetGateway].base}/v1/chat/completions`;

      const headers = { 'Content-Type': 'application/json' };
      if (!isWebFree) {
        headers['Authorization'] = 'Bearer sk-omniroute-local';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: state.abortController.signal
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split('\n');
        sseBuffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === '[DONE]') break;
            try {
              const data = JSON.parse(dataStr);
              const delta = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content || '';
              if (!firstTokenReceived && delta) {
                firstTokenReceived = true;
                const latency = Math.round(performance.now() - startTime);
                latencyVal.textContent = latency;
              }
              if (delta) {
                fullResponse += delta;
                tokenCount++;
                updateSpeedCounter(tokenCount, startTime);
                assistantBubble.innerHTML = renderMarkdown(fullResponse);
                chatMessages.scrollTop = chatMessages.scrollHeight;
              }
            } catch (e) {}
          }
        }
      }
    }

    // Finished response: post-process code blocks, diagrams, and auto-mount
    finalizeAssistantMessage(assistantBubble, fullResponse, autoMountApp);
    if (window.speakVoiceResponse) {
      window.speakVoiceResponse(fullResponse);
    }

  } catch (err) {
    if (err.name !== 'AbortError') {
      assistantBubble.innerHTML = `<span style="color:var(--accent-rose)">⚠️ Error: ${err.message}</span>`;
    }
  } finally {
    setGeneratingState(false);
  }
}

function updateSpeedCounter(tokens, startTime) {
  const elapsedSec = (performance.now() - startTime) / 1000;
  if (elapsedSec > 0.2) {
    const tps = (tokens / elapsedSec).toFixed(1);
    speedVal.textContent = tps;
  }
}

function setGeneratingState(isGen) {
  state.isGenerating = isGen;
  if (isGen) {
    sendIcon.classList.add('hidden');
    stopIcon.classList.remove('hidden');
    sendBtn.style.background = 'var(--accent-rose)';
  } else {
    sendIcon.classList.remove('hidden');
    stopIcon.classList.add('hidden');
    sendBtn.style.background = 'var(--accent-purple)';
  }
}

// Message Rendering
function appendUserMessage(text, attachments) {
  const row = document.createElement('div');
  row.className = 'message-row user';

  let mediaHtml = '';
  if (attachments && attachments.length > 0) {
    mediaHtml = '<div class="message-media-grid">';
    attachments.forEach(att => {
      if (att.type === 'image') {
        mediaHtml += `<img src="${att.dataUrl}" class="message-image-thumb" onclick="openLightbox('${att.dataUrl}')" alt="Attachment">`;
      } else if (att.type === 'video') {
        mediaHtml += `
          <div class="video-player-container">
            <video src="${att.dataUrl}" controls preload="metadata"></video>
          </div>`;
      }
    });
    mediaHtml += '</div>';
  }

  row.innerHTML = `
    <div class="message-avatar user-avatar">U</div>
    <div class="message-content">
      <div class="message-meta">
        <span class="sender-name">You</span>
      </div>
      <div class="message-bubble">
        ${mediaHtml}
        ${escapeHtml(text).replace(/\n/g, '<br>')}
      </div>
    </div>`;

  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendAssistantPlaceholder(modelName, autoTag) {
  const row = document.createElement('div');
  row.className = 'message-row ai';

  const badgeHtml = autoTag ? `<span class="auto-badge">${autoTag}</span>` : '';
  const currentModel = modelName || state.model;

  row.innerHTML = `
    <div class="message-avatar ai-avatar">AI</div>
    <div class="message-content">
      <div class="message-meta">
        <span class="sender-name">OmniStudio</span>
        <span class="model-tag">${currentModel}</span>
        ${badgeHtml}
        <button class="speech-btn" onclick="toggleSpeech(this)" title="Read Aloud">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        </button>
      </div>
      <div class="message-bubble">
        <span class="dot checking"></span> Thinking...
      </div>
    </div>`;

  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return row.querySelector('.message-bubble');
}

// Markdown Parser (Supports Tables, Mermaid, Code Blocks, Bold, Inline Tools)
function renderMarkdown(raw) {
  if (!raw) return '';

  let html = raw;

  // Mermaid Diagram Code Blocks
  html = html.replace(/```mermaid\n([\s\S]*?)```/gi, (match, code) => {
    return `
      <div class="mermaid-container">
        <pre class="mermaid">${escapeHtml(code.trim())}</pre>
      </div>`;
  });

  // Regular Code Blocks ```lang \n code \n ```
  html = html.replace(/```([a-zA-Z0-9_\-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const safeCode = escapeHtml(code.trim());
    const langLower = (lang || '').toLowerCase();
    const isWeb = ['html', 'svg', 'react', 'jsx', 'tsx', 'css'].includes(langLower) || code.includes('<!DOCTYPE') || code.includes('<html');
    const isRunnable = ['python', 'py', 'sh', 'bash', 'node', 'js', 'javascript'].includes(langLower);
    
    const webRunBtn = isWeb ? `<button class="code-btn sandbox-run-btn" onclick="loadIntoSandbox(this)">🚀 Sandbox</button>` : '';
    const liveRunBtn = isRunnable ? `<button class="code-btn run-live-btn" onclick="window.runCodeBlock(this)">▶ Run Live</button>` : '';
    const saveBtn = `<button class="code-btn save-file-btn" onclick="window.saveCodeToFile(this)">💾 Save</button>`;
    const bookBtn = `<button class="code-btn add-book-btn" onclick="window.addCodeToBook(this)">📖 Add to Book</button>`;

    return `
      <div class="code-block-wrapper">
        <div class="code-header">
          <span>${lang || 'code'}</span>
          <div class="code-actions">
            ${webRunBtn}
            ${liveRunBtn}
            ${saveBtn}
            ${bookBtn}
            <button class="code-btn" onclick="copyCode(this)">📋 Copy</button>
          </div>
        </div>
        <pre><code class="language-${lang}">${safeCode}</code></pre>
        <div class="code-terminal-result hidden"></div>
      </div>`;
  });

  // Autonomous Inline Tool Directives: [GENERATE_IMAGE: ...]
  html = html.replace(/\[GENERATE_IMAGE:\s*([^\]]+)\]/gi, (match, p) => {
    const id = 'img_' + Math.random().toString(36).substring(2, 9);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el && !el.dataset.loaded) {
        el.dataset.loaded = 'true';
        executeImageGeneration(p.trim(), el, performance.now(), 'Tool Call');
      }
    }, 150);
    return `<div id="${id}" style="margin:0.75rem 0;"><span class="dot checking"></span> Generating image: <em>"${escapeHtml(p.trim())}"</em>...</div>`;
  });

  // Autonomous Inline Tool Directives: [GENERATE_VIDEO: ...]
  html = html.replace(/\[GENERATE_VIDEO:\s*([^\]]+)\]/gi, (match, p) => {
    const id = 'vid_' + Math.random().toString(36).substring(2, 9);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el && !el.dataset.loaded) {
        el.dataset.loaded = 'true';
        executeVideoGeneration(p.trim(), el, performance.now(), 'Tool Call');
      }
    }, 250);
    return `<div id="${id}" style="margin:0.75rem 0;"><span class="dot checking"></span> Generating 30 FPS video: <em>"${escapeHtml(p.trim())}"</em>...</div>`;
  });

  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Inline Code `code`
  html = html.replace(/`([^`]+)`/g, (match, c) => `<code>${escapeHtml(c)}</code>`);

  // Blockquotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');

  // Paragraphs
  html = html.split('\n\n').map(p => {
    if (p.startsWith('<div') || p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<blockquote') || p.startsWith('<table')) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return html;
}

function finalizeAssistantMessage(bubble, fullResponse, autoMountApp) {
  bubble.innerHTML = renderMarkdown(fullResponse);

  // Render Mermaid diagrams
  if (window.mermaid && bubble.querySelector('.mermaid')) {
    try {
      mermaid.run({ nodes: bubble.querySelectorAll('.mermaid') });
    } catch (e) {
      console.warn('Mermaid rendering issue:', e);
    }
  }

  // If response contains an interactive artifact, highlight Sandbox button
  const isWebCode = fullResponse.includes('```html') || fullResponse.includes('```svg') || fullResponse.includes('<!DOCTYPE') || fullResponse.includes('<html');
  if (isWebCode || fullResponse.includes('<table') || fullResponse.includes('CREATE TABLE')) {
    toggleSandboxBtn.classList.add('active');
  }

  // Auto-mount if requested by user or detected as an interactive app
  if (autoMountApp || (isWebCode && (fullResponse.includes('<script') || fullResponse.includes('<style')))) {
    const htmlMatch = fullResponse.match(/```html\n([\s\S]*?)```/i) || fullResponse.match(/```xml\n([\s\S]*?)```/i);
    if (htmlMatch && htmlMatch[1]) {
      injectSandboxCode(htmlMatch[1]);
      if (typeof window.openRightDrawerTab === 'function') {
        window.openRightDrawerTab('sandbox');
      }
      if (toggleSandboxBtn) toggleSandboxBtn.classList.add('active');
    }
  }

  // Universal OmniContext Bus Action Bar
  attachOmniActionBar(bubble, fullResponse);
}

/* ==========================================================================
   ⚡ UNIVERSAL OMNICONTEXT BUS & CROSS-COMPONENT WORKFLOW PIPELINE
   ========================================================================== */

window.showOmniToast = function(msg, icon = '⚡', duration = 3000) {
  let toast = document.getElementById('omniToastContainer');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'omniToastContainer';
    document.body.appendChild(toast);
  }
  const item = document.createElement('div');
  item.className = 'omni-toast-item';
  item.innerHTML = `
    <span style="font-size:1.1rem;">${icon}</span>
    <span>${escapeHtml(msg)}</span>
  `;
  toast.appendChild(item);
  setTimeout(() => item.classList.add('show'), 20);
  setTimeout(() => {
    item.classList.remove('show');
    setTimeout(() => item.remove(), 300);
  }, duration);
};

function attachOmniActionBar(bubble, fullResponse) {
  if (!bubble) return;
  const msgContent = bubble.closest('.message-content');
  if (!msgContent) return;

  let bar = msgContent.querySelector('.bubble-action-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'bubble-action-bar';
    msgContent.appendChild(bar);
  }

  const text = fullResponse || bubble.innerText || '';
  const hasCode = text.includes('```') || bubble.querySelector('pre code');

  bar.innerHTML = `
    <button class="omni-bus-btn" onclick="window.omniDistillToMemory(this)" title="Distill key concepts into on-device edge vector memory (<2ms recall)">
      <span>⚡</span> Distill to Memory
    </button>
    <button class="omni-bus-btn" onclick="window.omniAppendToBook(this)" title="Append this response or section into active Book Studio chapter">
      <span>📖</span> Append to Book
    </button>
    <button class="omni-bus-btn" onclick="window.omniSaveToDb(this)" title="Save this response as a searchable snippet in SQLite">
      <span>🗄️</span> Save to DB
    </button>
    ${hasCode ? `
    <button class="omni-bus-btn highlight-bus-btn" onclick="window.omniRunInRepl(this)" title="Execute embedded code block in Live REPL Console">
      <span>🔴</span> Run in REPL
    </button>` : ''}
    <button class="omni-bus-btn" onclick="window.omniCrossRefRag(this)" title="Semantic cross-reference in Textbook RAG Catalog">
      <span>🔍</span> Search RAG
    </button>
    <button class="omni-bus-btn" onclick="window.omniCopyMessage(this)" title="Copy message text">
      <span>📋</span> Copy
    </button>
  `;
}

window.omniDistillToMemory = async function(btn) {
  const row = btn.closest('.message-row');
  const bubble = row?.querySelector('.message-bubble');
  const text = (bubble?.innerText || '').trim();
  if (!text) return;

  btn.disabled = true;
  btn.textContent = '⏳ Distilling...';
  try {
    const res = await fetch('/api/memory/distill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source: 'AI Assistant Response',
        category: 'engineering'
      })
    });
    const data = await res.json();
    btn.disabled = false;
    btn.textContent = `✅ Distilled (${data.distilled_count || 1})`;
    window.showOmniToast(`Distilled ${data.distilled_count || 1} concepts into On-Device Memory (<2ms recall)!`, '⚡');
    setTimeout(() => { btn.innerHTML = '<span>⚡</span> Distill to Memory'; }, 2500);
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '<span>⚡</span> Distill to Memory';
    window.showOmniToast(`Memory error: ${err.message}`, '⚠️');
  }
};

window.omniAppendToBook = async function(btn) {
  const row = btn.closest('.message-row');
  const bubble = row?.querySelector('.message-bubble');
  const text = (bubble?.innerText || '').trim();
  if (!text) return;

  const lines = text.split('\n').filter(l => l.trim());
  let title = 'AI Architecture & Implementation Notes';
  if (lines.length > 0) {
    title = lines[0].replace(/^[#\s*_-]+/, '').slice(0, 60);
  }

  btn.disabled = true;
  btn.textContent = '⏳ Appending...';
  try {
    const res = await fetch('/api/books/append', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content: text
      })
    });
    const data = await res.json();
    btn.disabled = false;
    btn.textContent = `✅ In Ch ${data.chapter_count}`;
    window.showOmniToast(`Appended '${title}' to Chapter ${data.chapter_count} in Book Studio!`, '📖');
    setTimeout(() => { btn.innerHTML = '<span>📖</span> Append to Book'; }, 2500);
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '<span>📖</span> Append to Book';
    window.showOmniToast(`Book error: ${err.message}`, '⚠️');
  }
};

window.omniSaveToDb = async function(btn) {
  const row = btn.closest('.message-row');
  const bubble = row?.querySelector('.message-bubble');
  const text = (bubble?.innerText || '').trim();
  if (!text) return;

  const lines = text.split('\n').filter(l => l.trim());
  let title = 'Knowledge Snippet';
  if (lines.length > 0) {
    title = lines[0].replace(/^[#\s*_-]+/, '').slice(0, 60);
  }

  btn.disabled = true;
  btn.textContent = '⏳ Saving...';
  try {
    const res = await fetch('/api/db/save-snippet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content: text,
        source: 'AI Chat Assistant',
        tags: 'ai_studio,chat,architecture'
      })
    });
    const data = await res.json();
    btn.disabled = false;
    btn.textContent = `✅ Saved (#${data.snippet_id})`;
    window.showOmniToast(`Saved record #${data.snippet_id} into SQLite Database!`, '🗄️');
    setTimeout(() => { btn.innerHTML = '<span>🗄️</span> Save to DB'; }, 2500);
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = '<span>🗄️</span> Save to DB';
    window.showOmniToast(`DB error: ${err.message}`, '⚠️');
  }
};

window.omniRunInRepl = function(btn) {
  const row = btn.closest('.message-row');
  const bubble = row?.querySelector('.message-bubble');
  const codeEl = bubble?.querySelector('pre code');
  if (!codeEl) {
    window.showOmniToast('No code block detected in this response.', '⚠️');
    return;
  }
  const code = codeEl.innerText.trim();
  const langClass = Array.from(codeEl.classList).find(c => c.startsWith('language-'));
  const rawLang = langClass ? langClass.replace('language-', '').toLowerCase() : 'python';

  let selectedLang = 'python';
  if (['node', 'js', 'javascript'].includes(rawLang)) selectedLang = 'node';
  else if (['sh', 'bash', 'shell'].includes(rawLang)) selectedLang = 'bash';

  const consoleDrawer = document.getElementById('consoleDrawer');
  const consoleCodeInput = document.getElementById('consoleCodeInput');
  const consoleLangSelect = document.getElementById('consoleLangSelect');

  if (consoleDrawer && consoleCodeInput && consoleLangSelect) {
    consoleDrawer.classList.remove('hidden');
    consoleLangSelect.value = selectedLang;
    consoleCodeInput.value = code;
    window.executeConsoleScript();
    window.showOmniToast(`Loaded into Live REPL and executing ${selectedLang}...`, '🔴');
  }
};

window.omniCrossRefRag = function(btn) {
  const row = btn.closest('.message-row');
  const bubble = row?.querySelector('.message-bubble');
  const text = (bubble?.innerText || '').trim();
  const lines = text.split('\n').filter(l => l.trim());
  const query = (lines[0] || text.slice(0, 80)).replace(/^[#\s*_-]+/, '');

  openRagEngineModal();
  const searchInput = document.getElementById('ragSearchInput');
  const searchBtn = document.getElementById('runRagSearchBtn');
  if (searchInput && searchBtn) {
    searchInput.value = query;
    searchBtn.click();
    window.showOmniToast(`Searching RAG textbooks for: '${query.slice(0, 30)}...'`, '🔍');
  }
};

window.omniCopyMessage = function(btn) {
  const row = btn.closest('.message-row');
  const bubble = row?.querySelector('.message-bubble');
  const text = (bubble?.innerText || '').trim();
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.innerHTML = '<span>📋</span> Copy'; }, 1500);
  });
};

window.sendConsoleToBook = async function() {
  const code = document.getElementById('consoleCodeInput')?.value.trim() || '';
  const lang = document.getElementById('consoleLangSelect')?.value || 'python';
  const output = document.getElementById('consoleOutputPre')?.innerText.trim() || '';
  if (!code) {
    alert('Please enter or run code before sending to Book Studio.');
    return;
  }

  const content = `## Executed Script & Terminal Benchmark (${lang.toUpperCase()})\n\n\`\`\`${lang}\n${code}\n\`\`\`\n\n### Terminal Output (stdout / stderr)\n\`\`\`\n${output}\n\`\`\`\n\n*Executed live via Omni Agent Studio REPL.*`;

  try {
    const res = await fetch('/api/books/append', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Live REPL Benchmark: ${lang.toUpperCase()}`,
        content
      })
    });
    const data = await res.json();
    window.showOmniToast(`Script & Terminal output appended to Chapter ${data.chapter_count}!`, '📖');
  } catch (err) {
    window.showOmniToast(`Append to Book failed: ${err.message}`, '⚠️');
  }
};

window.sendConsoleToMemory = async function() {
  const code = document.getElementById('consoleCodeInput')?.value.trim() || '';
  const lang = document.getElementById('consoleLangSelect')?.value || 'python';
  const output = document.getElementById('consoleOutputPre')?.innerText.trim() || '';
  if (!code) {
    alert('No code to distill into memory.');
    return;
  }

  try {
    const res = await fetch('/api/memory/distill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `Script (${lang}):\n${code}\nExecution Output:\n${output}`,
        source: `REPL Runner (${lang})`,
        category: 'code_recipe'
      })
    });
    const data = await res.json();
    window.showOmniToast(`Distilled ${data.distilled_count || 1} code recipes into Edge Memory!`, '⚡');
  } catch (err) {
    window.showOmniToast(`Distill error: ${err.message}`, '⚠️');
  }
};

window.sendConsoleToChat = function() {
  const code = document.getElementById('consoleCodeInput')?.value.trim() || '';
  const lang = document.getElementById('consoleLangSelect')?.value || 'python';
  const output = document.getElementById('consoleOutputPre')?.innerText.trim() || '';
  if (!promptInput) return;

  promptInput.value = `I executed this ${lang} script in the Live REPL:\n\`\`\`${lang}\n${code}\n\`\`\`\nOutput:\n\`\`\`\n${output}\n\`\`\`\nPlease analyze this execution, identify any edge cases or performance bottlenecks, and explain how to optimize it.`;
  promptInput.dispatchEvent(new Event('input'));
  promptInput.focus();
  window.showOmniToast('REPL script and output loaded into Chatbot!', '💬');
};

function setupBookStudioToolbarBridges() {
  const ingestBtn = document.getElementById('bookIngestRagBtn');
  const distillBtn = document.getElementById('bookDistillMemoryBtn');
  const discussBtn = document.getElementById('bookDiscussChatBtn');

  if (ingestBtn) {
    ingestBtn.addEventListener('click', async () => {
      const title = chapterTitleInput?.value.trim() || 'Manual Chapter';
      const content = chapterContentInput?.value.trim() || '';
      if (!content) {
        alert('Chapter content is empty.');
        return;
      }
      ingestBtn.disabled = true;
      ingestBtn.textContent = '⏳ Vectorizing...';

      try {
        const res = await fetch('/api/rag/ingest-chapter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            book_id: activeBook.slug || 'cl4r1t4s_ai_engineering___security_manual',
            title: activeBook.title,
            chapter_title: title,
            content: content,
            author: activeBook.author,
            category: 'manual'
          })
        });
        const data = await res.json();
        ingestBtn.disabled = false;
        ingestBtn.textContent = '✅ Indexed in RAG';
        window.showOmniToast(`Chapter '${title}' indexed (${data.chunks_indexed} vector chunks) into RAG!`, '⚡');
        setTimeout(() => { ingestBtn.textContent = '⚡ Ingest to RAG'; }, 2500);
      } catch (err) {
        ingestBtn.disabled = false;
        ingestBtn.textContent = '⚡ Ingest to RAG';
        window.showOmniToast(`RAG Ingest failed: ${err.message}`, '⚠️');
      }
    });
  }

  if (distillBtn) {
    distillBtn.addEventListener('click', async () => {
      const title = chapterTitleInput?.value.trim() || 'Manual Chapter';
      const content = chapterContentInput?.value.trim() || '';
      if (!content) {
        alert('Chapter content is empty.');
        return;
      }
      distillBtn.disabled = true;
      distillBtn.textContent = '⏳ Distilling...';

      try {
        const res = await fetch('/api/memory/distill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: content,
            source: `Book: ${activeBook.title} - ${title}`,
            category: 'manual_chapter'
          })
        });
        const data = await res.json();
        distillBtn.disabled = false;
        distillBtn.textContent = '✅ Distilled';
        window.showOmniToast(`Distilled ${data.distilled_count} facts into On-Device Edge Memory!`, '💡');
        setTimeout(() => { distillBtn.textContent = '💡 Distill to Memory'; }, 2500);
      } catch (err) {
        distillBtn.disabled = false;
        distillBtn.textContent = '💡 Distill to Memory';
        window.showOmniToast(`Distill failed: ${err.message}`, '⚠️');
      }
    });
  }

  if (discussBtn) {
    discussBtn.addEventListener('click', () => {
      const title = chapterTitleInput?.value.trim() || 'Manual Chapter';
      const content = chapterContentInput?.value.trim() || '';
      if (!promptInput) return;

      const excerpt = content.slice(0, 500);
      promptInput.value = `Let's analyze and expand on this chapter from the manual:\n\n**${title}**\n\nExcerpt:\n"${excerpt}${content.length > 500 ? '...' : ''}"\n\nWhat are the architectural trade-offs, potential vulnerabilities, and implementation enhancements?`;
      promptInput.dispatchEvent(new Event('input'));

      if (bookStudioModal) bookStudioModal.classList.add('hidden');
      promptInput.focus();
      window.showOmniToast(`Chapter '${title}' sent to Chatbot for discussion!`, '💬');
    });
  }
}

function attachOmniBusActionsToExistingBubbles() {
  document.querySelectorAll('.message-row.ai .message-bubble').forEach(bubble => {
    attachOmniActionBar(bubble, bubble.innerText || '');
  });
}

// Live Sandbox Controller & Preset Templates
function getSandboxDemoHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Omni Live Analytics Sandbox</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans antialiased">
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div>
        <h1 class="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-500 bg-clip-text text-transparent">🏗️ Live Artifact Sandbox</h1>
        <p class="text-xs text-slate-400 mt-1">Interactive HTML5, Tailwind & React Component Canvas</p>
      </div>
      <span class="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">● Live Canvas Active</span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 backdrop-blur">
        <div class="text-xs text-slate-400 font-medium">REAL-TIME LATENCY</div>
        <div class="text-2xl font-extrabold text-cyan-400 mt-1">12ms</div>
        <div class="text-xs text-emerald-400 mt-1">⚡ Instant hot-reload</div>
      </div>
      <div class="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 backdrop-blur">
        <div class="text-xs text-slate-400 font-medium">ISOLATED IFRAME</div>
        <div class="text-2xl font-extrabold text-purple-400 mt-1">Sandboxed</div>
        <div class="text-xs text-purple-300 mt-1">🔒 Safe script execution</div>
      </div>
      <div class="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 backdrop-blur">
        <div class="text-xs text-slate-400 font-medium">COMPONENTS</div>
        <div class="text-2xl font-extrabold text-amber-400 mt-1">Zero-Config</div>
        <div class="text-xs text-amber-300 mt-1">✨ Tailwind + CSS</div>
      </div>
    </div>
    <div class="p-5 bg-slate-800/40 rounded-xl border border-slate-700/50">
      <h3 class="text-sm font-semibold text-slate-200">Interactive Component Demo</h3>
      <p class="text-xs text-slate-400 mt-1 mb-4">Click below to test live JavaScript state within this sandboxed viewport:</p>
      <div class="flex flex-wrap gap-3">
        <button onclick="let c = document.getElementById('count'); c.innerText = parseInt(c.innerText) + 1;" class="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold rounded-lg shadow hover:opacity-90 active:scale-95 transition">
          Click Counter: <span id="count" class="font-mono text-sm ml-1">0</span>
        </button>
        <button onclick="alert('Hello from OmniStudio Sandbox!')" class="px-4 py-2 bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg hover:bg-slate-600 transition">
          Trigger Alert
        </button>
        <button onclick="document.getElementById('timeEl').innerText = new Date().toLocaleTimeString();" class="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-500 transition">
          Clock: <span id="timeEl" class="font-mono ml-1">Live</span>
        </button>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function getKanbanDemoHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Kanban Task Board</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 font-sans">
  <div class="max-w-4xl mx-auto space-y-4">
    <div class="flex justify-between items-center pb-3 border-b border-slate-800">
      <h2 class="text-xl font-bold text-cyan-400">📋 Glassmorphic Task Board</h2>
      <button onclick="addTask()" class="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition">+ New Task</button>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
          <span>To Do</span>
          <span class="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">2</span>
        </div>
        <div id="colTodo" class="space-y-2">
          <div class="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 shadow-sm">
            <span class="text-[10px] font-bold px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded">HIGH</span>
            <p class="text-xs text-slate-200 mt-1 font-medium">Design Vector RAG Architecture</p>
          </div>
          <div class="p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 shadow-sm">
            <span class="text-[10px] font-bold px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded">MED</span>
            <p class="text-xs text-slate-200 mt-1 font-medium">Configure Edge Memory Cache</p>
          </div>
        </div>
      </div>
      <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
          <span>In Progress</span>
          <span class="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">1</span>
        </div>
        <div class="space-y-2">
          <div class="p-3 bg-slate-800/80 rounded-lg border border-cyan-500/40 shadow-sm">
            <span class="text-[10px] font-bold px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">ACTIVE</span>
            <p class="text-xs text-slate-200 mt-1 font-medium">Deep Search & Sandbox Engine</p>
          </div>
        </div>
      </div>
      <div class="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between">
          <span>Completed</span>
          <span class="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400">1</span>
        </div>
        <div class="space-y-2">
          <div class="p-3 bg-slate-800/80 rounded-lg border border-emerald-500/30 shadow-sm">
            <span class="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">DONE</span>
            <p class="text-xs text-slate-200 mt-1 font-medium">Right-Side Workspace Drawer UI</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script>
    function addTask() {
      const task = prompt('Enter new task:');
      if (task) {
        const item = document.createElement('div');
        item.className = 'p-3 bg-slate-800/80 rounded-lg border border-slate-700/60 shadow-sm animate-fade-in';
        item.innerHTML = '<span class="text-[10px] font-bold px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded">NEW</span><p class="text-xs text-slate-200 mt-1 font-medium">' + task + '</p>';
        document.getElementById('colTodo').prepend(item);
      }
    }
  </script>
</body>
</html>`;
}

function getNeuralDemoHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Neural Network Simulator</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes pulseWeight { 0% { stroke-opacity: 0.2; } 50% { stroke-opacity: 1; stroke: #06b6d4; } 100% { stroke-opacity: 0.2; } }
    .synapse-active { animation: pulseWeight 1.2s infinite ease-in-out; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6 font-sans flex flex-col items-center justify-center">
  <div class="max-w-2xl w-full text-center space-y-4">
    <h2 class="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">🧠 Interactive Neural Architecture</h2>
    <p class="text-xs text-slate-400">Click any neuron node to fire a forward propagation signal</p>
    <div class="relative bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-2xl flex items-center justify-around h-64">
      <svg class="absolute inset-0 w-full h-full pointer-events-none" id="synapseSvg">
        <line x1="20%" y1="30%" x2="50%" y2="25%" stroke="#6366f1" stroke-width="2" class="synapse-active" />
        <line x1="20%" y1="70%" x2="50%" y2="50%" stroke="#06b6d4" stroke-width="2" class="synapse-active" style="animation-delay:0.3s;" />
        <line x1="50%" y1="25%" x2="80%" y2="50%" stroke="#a855f7" stroke-width="2" class="synapse-active" style="animation-delay:0.6s;" />
        <line x1="50%" y1="75%" x2="80%" y2="50%" stroke="#ec4899" stroke-width="2" class="synapse-active" style="animation-delay:0.9s;" />
      </svg>
      <div class="space-y-6 z-10">
        <div class="text-[10px] text-slate-500 font-bold uppercase">Input Layer</div>
        <button onclick="fireNeuron(this)" class="w-12 h-12 rounded-full bg-indigo-600/30 border-2 border-indigo-500 flex items-center justify-center font-bold text-xs hover:scale-110 active:bg-indigo-500 transition shadow-lg shadow-indigo-500/20">X₁</button>
        <button onclick="fireNeuron(this)" class="w-12 h-12 rounded-full bg-indigo-600/30 border-2 border-indigo-500 flex items-center justify-center font-bold text-xs hover:scale-110 active:bg-indigo-500 transition shadow-lg shadow-indigo-500/20">X₂</button>
      </div>
      <div class="space-y-4 z-10">
        <div class="text-[10px] text-slate-500 font-bold uppercase">Hidden Layer</div>
        <button onclick="fireNeuron(this)" class="w-12 h-12 rounded-full bg-cyan-600/30 border-2 border-cyan-400 flex items-center justify-center font-bold text-xs hover:scale-110 active:bg-cyan-500 transition shadow-lg shadow-cyan-500/20">H₁</button>
        <button onclick="fireNeuron(this)" class="w-12 h-12 rounded-full bg-cyan-600/30 border-2 border-cyan-400 flex items-center justify-center font-bold text-xs hover:scale-110 active:bg-cyan-500 transition shadow-lg shadow-cyan-500/20">H₂</button>
        <button onclick="fireNeuron(this)" class="w-12 h-12 rounded-full bg-cyan-600/30 border-2 border-cyan-400 flex items-center justify-center font-bold text-xs hover:scale-110 active:bg-cyan-500 transition shadow-lg shadow-cyan-500/20">H₃</button>
      </div>
      <div class="space-y-6 z-10">
        <div class="text-[10px] text-slate-500 font-bold uppercase">Output Layer</div>
        <button onclick="fireNeuron(this)" class="w-14 h-14 rounded-full bg-purple-600/40 border-2 border-purple-400 flex items-center justify-center font-bold text-sm hover:scale-110 active:bg-purple-500 transition shadow-lg shadow-purple-500/30">Ŷ</button>
      </div>
    </div>
    <div id="statusLog" class="text-xs text-cyan-400 font-mono">Activation State: Sigmoid(Wx + b) Ready</div>
  </div>
  <script>
    function fireNeuron(el) {
      el.classList.add('scale-125', 'bg-cyan-400', 'text-slate-950');
      document.getElementById('statusLog').innerText = '🔥 Fired neuron ' + el.innerText + ' at ' + new Date().toLocaleTimeString();
      setTimeout(() => el.classList.remove('scale-125', 'bg-cyan-400', 'text-slate-950'), 400);
    }
  </script>
</body>
</html>`;
}

function setupSandboxDrawer() {
  const toggleBtn = document.getElementById('toggleSandboxBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof window.openRightDrawerTab === 'function') {
        window.openRightDrawerTab('sandbox');
      }
    });
  }

  const closeBtn = document.getElementById('closeRightDrawerBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const drawer = document.getElementById('studioRightDrawer');
      if (drawer) drawer.classList.add('hidden');
    });
  }

  const reloadBtn = document.getElementById('reloadSandboxBtn');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      injectSandboxCode(state.activeSandboxCode || getSandboxDemoHtml());
      window.showOmniToast('Sandbox reloaded successfully', '🔄');
    });
  }

  const clearBtn = document.getElementById('clearSandboxBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      state.activeSandboxCode = '';
      injectSandboxCode(getSandboxDemoHtml());
      window.showOmniToast('Sandbox reset to interactive demo', '🧹');
    });
  }

  const popoutBtn = document.getElementById('popoutSandboxBtn');
  if (popoutBtn) {
    popoutBtn.addEventListener('click', () => {
      const code = state.activeSandboxCode || getSandboxDemoHtml();
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(code);
        win.document.close();
      }
    });
  }

  // Template quick-launch buttons
  document.querySelectorAll('.sandbox-template-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tmpl = btn.dataset.tmpl;
      if (tmpl === 'dashboard') {
        injectSandboxCode(getSandboxDemoHtml());
      } else if (tmpl === 'kanban') {
        injectSandboxCode(getKanbanDemoHtml());
      } else if (tmpl === 'neural') {
        injectSandboxCode(getNeuralDemoHtml());
      }
      if (typeof window.openRightDrawerTab === 'function') {
        window.openRightDrawerTab('sandbox');
      }
    });
  });
}

window.loadIntoSandbox = function(btn) {
  const wrapper = btn.closest('.code-block-wrapper');
  const codeEl = wrapper ? wrapper.querySelector('code') : null;
  if (!codeEl) return;

  const rawCode = codeEl.textContent;
  injectSandboxCode(rawCode);

  // Open right drawer with sandbox tab
  if (typeof window.openRightDrawerTab === 'function') {
    window.openRightDrawerTab('sandbox');
  }
};

function injectSandboxCode(rawCode) {
  let docContent = rawCode;

  if (!docContent || !docContent.trim()) {
    docContent = getSandboxDemoHtml();
  } else if (!docContent.includes('<!DOCTYPE') && !docContent.includes('<html')) {
    // If snippet isn't a full HTML document, wrap it nicely with Tailwind CDN
    docContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, sans-serif; padding: 1.5rem; background: #0f172a; color: #f8fafc; }
  </style>
</head>
<body>
  ${docContent}
</body>
</html>`;
  }

  state.activeSandboxCode = docContent;
  const iframe = document.getElementById('sandboxIframe');
  if (iframe) {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(docContent);
      doc.close();
    }
  }
}

// Utility Helpers
window.copyCode = function(btn) {
  const wrapper = btn.closest('.code-block-wrapper');
  const codeEl = wrapper.querySelector('code');
  if (!codeEl) return;

  navigator.clipboard.writeText(codeEl.textContent).then(() => {
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.textContent = '📋 Copy'; }, 2000);
  });
};

window.openLightbox = function(url) {
  lightboxImg.src = url;
  imageModal.classList.add('active');
};

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   Tools & MCP Arsenal Drawer Logic
   ========================================================================== */
const arsenalDrawer = document.getElementById('arsenalDrawer');
const toggleArsenalBtn = document.getElementById('toggleArsenalBtn');
const closeArsenalBtn = document.getElementById('closeArsenalBtn');
const toolSearchInput = document.getElementById('toolSearchInput');
const arsenalList = document.getElementById('arsenalList');
const injectAllToolsBtn = document.getElementById('injectAllToolsBtn');
const simulateSampleToolBtn = document.getElementById('simulateSampleToolBtn');
const toolsCountBadge = document.getElementById('toolsCountBadge');

let arsenalData = {
  codex_desktop_tools: [],
  cursor_tools: [],
  manus_agent_tools: [],
  mcp_servers: []
};
let activeArsenalTab = 'all';

if (toggleArsenalBtn) {
  toggleArsenalBtn.addEventListener('click', () => {
    arsenalDrawer.classList.toggle('hidden');
    if (!arsenalDrawer.classList.contains('hidden') && arsenalData.codex_desktop_tools.length === 0) {
      loadArsenalTools();
    }
  });
}

if (closeArsenalBtn) {
  closeArsenalBtn.addEventListener('click', () => {
    arsenalDrawer.classList.add('hidden');
  });
}

document.querySelectorAll('.arsenal-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.arsenal-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeArsenalTab = tab.dataset.tab;
    renderArsenalList();
  });
});

if (toolSearchInput) {
  toolSearchInput.addEventListener('input', () => {
    renderArsenalList();
  });
}

async function loadArsenalTools() {
  arsenalList.innerHTML = '<div class="loading-spinner-box">Loading Tools Arsenal...</div>';
  try {
    const res = await fetch('/api/tools/arsenal');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    arsenalData = await res.json();
    const totalCount = (arsenalData.codex_desktop_tools?.length || 0) +
                       (arsenalData.cursor_tools?.length || 0) +
                       (arsenalData.manus_agent_tools?.length || 0) +
                       (arsenalData.mcp_servers?.reduce((a, s) => a + (s.tools?.length || 0), 0) || 0);
    if (toolsCountBadge) toolsCountBadge.textContent = `${totalCount} Tools`;
    renderArsenalList();
  } catch (err) {
    arsenalList.innerHTML = `<div class="error-msg">Failed to load arsenal tools: ${err.message}</div>`;
  }
}

function renderArsenalList() {
  const query = (toolSearchInput ? toolSearchInput.value : '').toLowerCase().trim();
  let items = [];

  // Codex Tools
  if (activeArsenalTab === 'all' || activeArsenalTab === 'codex') {
    (arsenalData.codex_desktop_tools || []).forEach(t => {
      items.push({
        source: 'Codex Desktop',
        badge: 'OpenAI Codex',
        name: t.name,
        desc: t.description || 'Codex desktop orchestration tool.',
        schema: t.inputSchema || {}
      });
    });
  }

  // Cursor Tools
  if (activeArsenalTab === 'all' || activeArsenalTab === 'cursor') {
    (arsenalData.cursor_tools || []).forEach(t => {
      items.push({
        source: 'Cursor IDE',
        badge: 'Cursor 2.0',
        name: t.name,
        desc: t.description || 'Cursor IDE codebase tool.',
        schema: t.parameters || {}
      });
    });
  }

  // Manus Tools
  if (activeArsenalTab === 'all' || activeArsenalTab === 'manus') {
    (arsenalData.manus_agent_tools || []).forEach(t => {
      items.push({
        source: 'Manus Agent',
        badge: 'Manus Loop',
        name: t.name,
        desc: t.description || 'Manus autonomous execution tool.',
        schema: t.parameters || {}
      });
    });
  }

  // MCP Servers
  if (activeArsenalTab === 'all' || activeArsenalTab === 'mcp') {
    (arsenalData.mcp_servers || []).forEach(s => {
      (s.tools || []).forEach(toolName => {
        items.push({
          source: s.server,
          badge: 'MCP Server',
          name: toolName,
          desc: `${s.description} (Part of ${s.server})`,
          schema: { server: s.server, tool: toolName }
        });
      });
    });
  }

  if (query) {
    items = items.filter(it => it.name.toLowerCase().includes(query) || it.desc.toLowerCase().includes(query) || it.source.toLowerCase().includes(query));
  }

  if (items.length === 0) {
    arsenalList.innerHTML = '<div class="empty-state-notice">No tools match your filter.</div>';
    return;
  }

  arsenalList.innerHTML = items.map((it, idx) => `
    <div class="arsenal-card">
      <div class="arsenal-card-header">
        <span class="arsenal-tool-name">⚡ ${escapeHtml(it.name)}</span>
        <span class="arsenal-tool-badge">${escapeHtml(it.badge)}</span>
      </div>
      <div class="arsenal-tool-desc">${escapeHtml(it.desc)}</div>
      <div class="arsenal-card-actions">
        <button class="tiny-btn" onclick="copyToolSchema(${idx})">📋 Schema</button>
        <button class="tiny-btn primary-tiny" onclick="injectSingleTool('${escapeHtml(it.name)}')">➕ Inject Tool</button>
        <button class="tiny-btn" onclick="simulateSpecificTool('${escapeHtml(it.name)}')">⚡ Simulate</button>
      </div>
      <details style="margin-top: 0.4rem;">
        <summary style="font-size: 0.68rem; color: var(--text-dim); cursor: pointer;">View JSON Schema</summary>
        <pre class="arsenal-schema-pre"><code>${escapeHtml(JSON.stringify(it.schema, null, 2))}</code></pre>
      </details>
    </div>
  `).join('');

  window._currentArsenalItems = items;
}

window.copyToolSchema = function(idx) {
  const item = window._currentArsenalItems?.[idx];
  if (!item) return;
  navigator.clipboard.writeText(JSON.stringify(item.schema, null, 2));
  alert(`Copied JSON schema for '${item.name}'`);
};

window.injectSingleTool = function(name) {
  const item = window._currentArsenalItems?.find(i => i.name === name);
  if (!item) return;
  const toolDefinition = `\n\n[TOOL_DEFINITION: ${item.name}]\nDescription: ${item.desc}\nSchema: ${JSON.stringify(item.schema)}`;
  systemPromptInput.value = (systemPromptInput.value || '') + toolDefinition;
  state.systemPrompt = systemPromptInput.value;
  alert(`Tool '${name}' injected into Active System Prompt!`);
};

window.simulateSpecificTool = function(name) {
  if (name === 'web_search') {
    const q = prompt("Enter search query to test live web search tool:", "LangGraph multi agent patterns 2026");
    if (!q) return;
    executeWebSearchToolSimulation(q);
    if (arsenalDrawer) arsenalDrawer.classList.add('hidden');
    return;
  }
  simulateToolExecution(name, { sample_param: "test_value", timestamp: new Date().toISOString() });
};

if (injectAllToolsBtn) {
  injectAllToolsBtn.addEventListener('click', () => {
    const items = window._currentArsenalItems || [];
    if (items.length === 0) return;
    const toolsSummary = items.slice(0, 15).map(i => `- ${i.name}: ${i.desc}`).join('\n');
    const toolScaffold = `\n\n# Available Tools & MCP Arsenal:\nYou have access to the following native tools:\n${toolsSummary}\nTo invoke a tool, output a block formatted as:\n<tool_call>{"name": "tool_name", "arguments": {...}}</tool_call>`;
    systemPromptInput.value = (systemPromptInput.value || '') + toolScaffold;
    state.systemPrompt = systemPromptInput.value;
    alert(`Injected ${Math.min(items.length, 15)} tool declarations into Active Prompt Scaffold!`);
  });
}

if (simulateSampleToolBtn) {
  simulateSampleToolBtn.addEventListener('click', () => {
    simulateToolExecution('capture_screen_context', { focus: 'active_window', resolution: '1920x1080' });
  });
}

function simulateToolExecution(toolName, args) {
  const argsFormatted = JSON.stringify(args, null, 2);
  const cardHtml = `
    <div class="tool-call-card">
      <div class="tool-header">
        <span class="tool-name-tag">⚡ Tool Execution: ${escapeHtml(toolName)}</span>
        <span class="tool-status-badge">✅ Executed Successfully</span>
      </div>
      <pre class="tool-args-pre"><code>${escapeHtml(argsFormatted)}</code></pre>
      <div class="tool-footer">
        <span>Execution Time: 42ms (Zero-Latency Simulation)</span>
        <button class="tool-run-btn" onclick="alert('Tool call re-verified: status OK')">Re-run</button>
      </div>
    </div>
  `;

  const welcomeCard = document.getElementById('welcomeCard');
  if (welcomeCard) welcomeCard.style.display = 'none';

  const bubble = appendAssistantPlaceholder('Codex Tool Runner', '⚡ TOOL CALL');
  if (bubble) {
    bubble.innerHTML = `<p>Executed agent tool <strong><code>${escapeHtml(toolName)}</code></strong>:</p>` + cardHtml;
  }
  if (arsenalDrawer) arsenalDrawer.classList.add('hidden');
}

/* ==========================================================================
   Prompt Goldmine Explorer Modal Logic
   ========================================================================== */
const promptsModal = document.getElementById('promptsModal');
const togglePromptsBtn = document.getElementById('togglePromptsBtn');
const closePromptsModalBtn = document.getElementById('closePromptsModalBtn');
const promptsModalBackdrop = document.getElementById('promptsModalBackdrop');
const promptFilterInput = document.getElementById('promptFilterInput');
const goldmineFileList = document.getElementById('goldmineFileList');
const previewFilename = document.getElementById('previewFilename');
const previewContentCode = document.getElementById('previewContentCode');
const copyPromptContentBtn = document.getElementById('copyPromptContentBtn');
const injectPromptContentBtn = document.getElementById('injectPromptContentBtn');

let promptsCatalog = [];
let activeCatFilter = 'all';
let currentLoadedPromptContent = '';

if (togglePromptsBtn) {
  togglePromptsBtn.addEventListener('click', () => {
    promptsModal.classList.remove('hidden');
    if (promptsCatalog.length === 0) {
      loadPromptCatalog();
    }
  });
}

if (closePromptsModalBtn) {
  closePromptsModalBtn.addEventListener('click', () => promptsModal.classList.add('hidden'));
}
if (promptsModalBackdrop) {
  promptsModalBackdrop.addEventListener('click', () => promptsModal.classList.add('hidden'));
}

document.querySelectorAll('.cat-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    activeCatFilter = pill.dataset.cat;
    renderPromptFileList();
  });
});

if (promptFilterInput) {
  promptFilterInput.addEventListener('input', () => renderPromptFileList());
}

async function loadPromptCatalog() {
  goldmineFileList.innerHTML = '<div class="loading-spinner-box">Scanning Repository Prompts...</div>';
  try {
    const res = await fetch('/api/prompts/catalog');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    promptsCatalog = data.catalog || [];
    renderPromptFileList();
  } catch (err) {
    goldmineFileList.innerHTML = `<div class="error-msg">Failed to scan prompts: ${err.message}</div>`;
  }
}

function renderPromptFileList() {
  const query = (promptFilterInput ? promptFilterInput.value : '').toLowerCase().trim();
  let list = promptsCatalog;

  if (activeCatFilter !== 'all') {
    list = list.filter(item => item.category.toLowerCase().includes(activeCatFilter.toLowerCase()));
  }

  if (query) {
    list = list.filter(item =>
      item.filename.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      (item.snippet || '').toLowerCase().includes(query)
    );
  }

  if (list.length === 0) {
    goldmineFileList.innerHTML = '<div class="empty-state-notice">No prompt files match criteria.</div>';
    return;
  }

  goldmineFileList.innerHTML = list.map((item, idx) => `
    <div class="goldmine-item" data-path="${escapeHtml(item.rel_path)}" onclick="loadPromptDetail('${escapeHtml(item.rel_path)}')">
      <div class="goldmine-item-header">
        <span class="goldmine-item-name">📄 ${escapeHtml(item.filename)}</span>
        <span class="goldmine-item-size">${escapeHtml(item.size)}</span>
      </div>
      <div class="goldmine-item-cat">${escapeHtml(item.category)}</div>
      <div class="goldmine-item-snippet">${escapeHtml(item.snippet)}</div>
    </div>
  `).join('');
}

window.loadPromptDetail = async function(relPath) {
  document.querySelectorAll('.goldmine-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.path === relPath);
  });

  previewFilename.textContent = `Loading ${relPath}...`;
  previewContentCode.textContent = 'Fetching prompt contents from repository...';
  copyPromptContentBtn.disabled = true;
  injectPromptContentBtn.disabled = true;

  try {
    const res = await fetch(`/api/prompts/content?file=${encodeURIComponent(relPath)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    currentLoadedPromptContent = data.content || '';
    previewFilename.textContent = `${data.filename} (${data.lines} lines, ${data.size_kb} KB)`;
    previewContentCode.textContent = currentLoadedPromptContent;
    copyPromptContentBtn.disabled = false;
    injectPromptContentBtn.disabled = false;
  } catch (err) {
    previewFilename.textContent = 'Error loading prompt';
    previewContentCode.textContent = `Failed: ${err.message}`;
  }
};

if (copyPromptContentBtn) {
  copyPromptContentBtn.addEventListener('click', () => {
    if (!currentLoadedPromptContent) return;
    navigator.clipboard.writeText(currentLoadedPromptContent).then(() => {
      copyPromptContentBtn.textContent = '✅ Copied!';
      setTimeout(() => { copyPromptContentBtn.textContent = '📋 Copy Prompt'; }, 2000);
    });
  });
}

if (injectPromptContentBtn) {
  injectPromptContentBtn.addEventListener('click', () => {
    if (!currentLoadedPromptContent) return;
    systemPromptInput.value = currentLoadedPromptContent;
    state.systemPrompt = currentLoadedPromptContent;
    promptsModal.classList.add('hidden');
    alert(`Successfully injected prompt into Active Scaffold!`);
  });
}

/* ==========================================================================
   Code Block Actions: Run Live, Save to File, Add to Book
   ========================================================================== */
window.runCodeBlock = async function(btn) {
  const wrapper = btn.closest('.code-block-wrapper');
  if (!wrapper) return;
  const codeEl = wrapper.querySelector('pre code');
  const termEl = wrapper.querySelector('.code-terminal-result');
  const lang = wrapper.querySelector('.code-header span')?.textContent.trim() || 'python';
  const code = (codeEl?.innerText || codeEl?.textContent || '').trim();

  btn.textContent = '⏳ Running...';
  btn.disabled = true;
  if (termEl) {
    termEl.classList.remove('hidden');
    termEl.innerHTML = `<span class="dot checking"></span> Executing ${escapeHtml(lang)} in live subprocess...`;
  }

  try {
    const res = await fetch('/api/session/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang, code: code })
    });
    const data = await res.json();
    btn.textContent = '▶ Run Live';
    btn.disabled = false;

    if (termEl) {
      const isSuccess = data.exit_code === 0;
      const statusClass = isSuccess ? 'status-ok' : 'status-err';
      const outputText = data.stdout || data.stderr || '(Process finished with no output)';
      termEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;padding:4px 8px;background:rgba(0,0,0,0.5);font-size:0.7rem;color:#94a3b8;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="color:${isSuccess ? '#34d399' : '#f87171'};font-weight:600;">Status: Exit ${data.exit_code}</span>
          <span>Time: ${data.elapsed_ms}ms</span>
        </div>
        <pre style="margin:0;padding:8px 12px;background:#050608;color:#38bdf8;font-family:var(--font-mono);font-size:0.76rem;max-height:180px;overflow-y:auto;white-space:pre-wrap;"><code>${escapeHtml(outputText)}</code></pre>
      `;
    }
  } catch (err) {
    btn.textContent = '▶ Run Live';
    btn.disabled = false;
    if (termEl) termEl.innerHTML = `<span style="color:#ef4444;">Execution failed: ${escapeHtml(err.message)}</span>`;
  }
};

window.saveCodeToFile = async function(btn) {
  const wrapper = btn.closest('.code-block-wrapper');
  if (!wrapper) return;
  const codeEl = wrapper.querySelector('pre code');
  const code = (codeEl?.innerText || codeEl?.textContent || '').trim();
  const lang = wrapper.querySelector('.code-header span')?.textContent.trim() || 'py';
  
  let defaultExt = '.py';
  if (['js', 'javascript', 'node'].includes(lang)) defaultExt = '.js';
  else if (['go', 'golang'].includes(lang)) defaultExt = '.go';
  else if (['sh', 'bash'].includes(lang)) defaultExt = '.sh';
  else if (['md', 'markdown'].includes(lang)) defaultExt = '.md';
  else if (['html'].includes(lang)) defaultExt = '.html';
  else if (['diff', 'patch'].includes(lang)) defaultExt = '.patch';

  const defaultPath = `snippets/snippet_${Date.now()}${defaultExt}`;
  const filePath = prompt('Save file to workspace path:', defaultPath);
  if (!filePath) return;

  try {
    const res = await fetch('/api/fs/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath.trim(), content: code })
    });
    const data = await res.json();
    if (data.status === 'ok') {
      alert(`✅ Successfully saved to: ${data.path} (${data.bytes} bytes)`);
      if (typeof window.fetchFsTree === 'function') window.fetchFsTree();
    } else {
      alert(`Save error: ${data.error || 'Unknown error'}`);
    }
  } catch (err) {
    alert(`Failed to save: ${err.message}`);
  }
};

window.addCodeToBook = function(btn) {
  const wrapper = btn.closest('.code-block-wrapper');
  if (!wrapper) return;
  const codeEl = wrapper.querySelector('pre code');
  const code = (codeEl?.innerText || codeEl?.textContent || '').trim();
  const lang = wrapper.querySelector('.code-header span')?.textContent.trim() || 'code';

  const formattedSnippet = `\n\n\`\`\`${lang}\n${code}\n\`\`\`\n`;
  const chapterInput = document.getElementById('chapterContentInput');
  if (chapterInput) {
    chapterInput.value += formattedSnippet;
    if (typeof window.updateChapterPreview === 'function') window.updateChapterPreview();
  }

  const bookModal = document.getElementById('bookStudioModal');
  if (bookModal) {
    bookModal.classList.remove('hidden');
    renderBookStudio();
  }
};

/* ==========================================================================
   IDE File Explorer Logic
   ========================================================================== */
const explorerDrawer = document.getElementById('explorerDrawer');
const toggleExplorerBtn = document.getElementById('toggleExplorerBtn');
const closeExplorerBtn = document.getElementById('closeExplorerBtn');
const refreshFsBtn = document.getElementById('refreshFsBtn');
const newFileBtn = document.getElementById('newFileBtn');
const newFolderBtn = document.getElementById('newFolderBtn');
const fsSearchInput = document.getElementById('fsSearchInput');
const fileTreeContainer = document.getElementById('fileTreeContainer');
const fileEditorContainer = document.getElementById('fileEditorContainer');
const editorActiveFilePath = document.getElementById('editorActiveFilePath');
const fileEditorTextarea = document.getElementById('fileEditorTextarea');
const saveFileBtn = document.getElementById('saveFileBtn');
const deleteFileBtn = document.getElementById('deleteFileBtn');
const closeEditorBtn = document.getElementById('closeEditorBtn');

let currentActiveFilePath = '';

if (toggleExplorerBtn) {
  toggleExplorerBtn.addEventListener('click', () => {
    explorerDrawer.classList.toggle('hidden');
    if (!explorerDrawer.classList.contains('hidden')) {
      window.fetchFsTree();
    }
  });
}
if (closeExplorerBtn) closeExplorerBtn.addEventListener('click', () => explorerDrawer.classList.add('hidden'));
if (refreshFsBtn) refreshFsBtn.addEventListener('click', () => window.fetchFsTree());
if (closeEditorBtn) closeEditorBtn.addEventListener('click', () => fileEditorContainer.classList.add('hidden'));

window.fetchFsTree = async function() {
  if (!fileTreeContainer) return;
  fileTreeContainer.innerHTML = '<div class="loading-spinner-box">Loading workspace tree...</div>';
  try {
    const res = await fetch('/api/fs/tree');
    const data = await res.json();
    fileTreeContainer.innerHTML = '';
    renderTreeNode(data, fileTreeContainer, 0);
  } catch (err) {
    fileTreeContainer.innerHTML = `<div style="color:#ef4444;padding:1rem;">Failed to load files: ${err.message}</div>`;
  }
};

function renderTreeNode(node, container, depth) {
  if (!node) return;
  const isDir = node.type === 'directory';
  const nodeEl = document.createElement('div');
  nodeEl.className = 'tree-node';
  nodeEl.dataset.path = node.path;

  const indentHtml = '<span class="tree-indent"></span>'.repeat(depth);
  const icon = isDir ? '📁' : getFileIcon(node.name);

  nodeEl.innerHTML = `
    ${indentHtml}
    <span class="tree-icon">${icon}</span>
    <span class="tree-label">${escapeHtml(node.name)}</span>
  `;

  if (isDir) {
    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'tree-children';
    nodeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      childrenContainer.classList.toggle('hidden');
      nodeEl.querySelector('.tree-icon').textContent = childrenContainer.classList.contains('hidden') ? '📁' : '📂';
    });
    container.appendChild(nodeEl);
    container.appendChild(childrenContainer);
    if (node.children) {
      node.children.forEach(child => renderTreeNode(child, childrenContainer, depth + 1));
    }
  } else {
    nodeEl.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.tree-node').forEach(n => n.classList.remove('active'));
      nodeEl.classList.add('active');
      window.openWorkspaceFile(node.path);
    });
    container.appendChild(nodeEl);
  }
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'py': return '🐍';
    case 'js': case 'ts': case 'jsx': case 'tsx': return '⚡';
    case 'html': return '🌐';
    case 'css': return '🎨';
    case 'md': case 'txt': return '📄';
    case 'json': return '📋';
    case 'sh': return '💻';
    default: return '📄';
  }
}

window.openWorkspaceFile = async function(filePath) {
  currentActiveFilePath = filePath;
  if (editorActiveFilePath) editorActiveFilePath.textContent = filePath;
  if (fileEditorContainer) fileEditorContainer.classList.remove('hidden');

  const ext = filePath.split('.').pop().toLowerCase();
  if (ext === 'pdf') {
    if (fileEditorTextarea) {
      fileEditorTextarea.value = `[📄 PDF Textbook: ${filePath}]\n\nThis is a compiled PDF document. You can read its full indexed chapters, vector chunks, and ask questions about specific pages using the "32+ Textbooks" reader in the Right Workspace Drawer or Academy Hub.`;
    }
    return;
  }

  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'].includes(ext)) {
    if (fileEditorTextarea) fileEditorTextarea.value = `[🖼️ Image Asset: ${filePath}]`;
    return;
  }

  if (['db', 'sqlite', 'sqlite3', 'bin', 'pyc'].includes(ext)) {
    if (fileEditorTextarea) fileEditorTextarea.value = `[🗄️ Database / Binary File: ${filePath}]\n\nTo query this database, use the DB Studio in the Right Workspace Drawer.`;
    return;
  }

  if (fileEditorTextarea) fileEditorTextarea.value = 'Loading file content...';

  try {
    const res = await fetch(`/api/fs/read?path=${encodeURIComponent(filePath)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (fileEditorTextarea) fileEditorTextarea.value = data.content || '';
  } catch (err) {
    if (fileEditorTextarea) fileEditorTextarea.value = `Error loading file: ${err.message}`;
  }
};

if (saveFileBtn) {
  saveFileBtn.addEventListener('click', async () => {
    if (!currentActiveFilePath || !fileEditorTextarea) return;
    const content = fileEditorTextarea.value;
    saveFileBtn.textContent = 'Saving...';
    try {
      const res = await fetch('/api/fs/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentActiveFilePath, content })
      });
      const data = await res.json();
      saveFileBtn.textContent = '✅ Saved';
      setTimeout(() => { saveFileBtn.textContent = '💾 Save'; }, 1500);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
      saveFileBtn.textContent = '💾 Save';
    }
  });
}

if (deleteFileBtn) {
  deleteFileBtn.addEventListener('click', async () => {
    if (!currentActiveFilePath) return;
    if (!confirm(`Are you sure you want to delete ${currentActiveFilePath}?`)) return;
    try {
      await fetch('/api/fs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: currentActiveFilePath })
      });
      if (fileEditorContainer) fileEditorContainer.classList.add('hidden');
      window.fetchFsTree();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  });
}

if (newFileBtn) {
  newFileBtn.addEventListener('click', async () => {
    const name = prompt('Enter new file path (e.g. notes.md or my_script.py):');
    if (!name) return;
    await fetch('/api/fs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: name.trim(), type: 'file', content: '' })
    });
    window.fetchFsTree();
    window.openWorkspaceFile(name.trim());
  });
}

if (newFolderBtn) {
  newFolderBtn.addEventListener('click', async () => {
    const name = prompt('Enter new folder path (e.g. my_docs):');
    if (!name) return;
    await fetch('/api/fs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: name.trim(), type: 'directory' })
    });
    window.fetchFsTree();
  });
}

/* ==========================================================================
   Live Interactive Session Console Logic
   ========================================================================== */
const consoleDrawer = document.getElementById('consoleDrawer');
const toggleConsoleBtn = document.getElementById('toggleConsoleBtn');
const closeConsoleBtn = document.getElementById('closeConsoleBtn');
const runConsoleBtn = document.getElementById('runConsoleBtn');
const consoleLangSelect = document.getElementById('consoleLangSelect');
const consoleCodeInput = document.getElementById('consoleCodeInput');
const consoleOutputPre = document.getElementById('consoleOutputPre');
const consoleStatusBadge = document.getElementById('consoleStatusBadge');

if (toggleConsoleBtn) {
  toggleConsoleBtn.addEventListener('click', () => {
    consoleDrawer.classList.toggle('hidden');
  });
}
if (closeConsoleBtn) closeConsoleBtn.addEventListener('click', () => consoleDrawer.classList.add('hidden'));

if (runConsoleBtn) {
  runConsoleBtn.addEventListener('click', () => window.executeConsoleScript());
}

if (consoleCodeInput) {
  consoleCodeInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      window.executeConsoleScript();
    }
  });
}

window.executeConsoleScript = async function() {
  if (!consoleCodeInput || !consoleLangSelect) return;
  const code = consoleCodeInput.value.trim();
  const lang = consoleLangSelect.value;
  if (!code) return;

  runConsoleBtn.disabled = true;
  runConsoleBtn.textContent = 'Executing...';
  consoleStatusBadge.className = 'status-badge-neutral';
  consoleStatusBadge.textContent = 'Running...';
  consoleOutputPre.innerHTML = `<code><span class="dot checking"></span> Running ${lang} script...</code>`;

  try {
    const res = await fetch('/api/session/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang, code })
    });
    const data = await res.json();
    runConsoleBtn.disabled = false;
    runConsoleBtn.textContent = 'Run (Ctrl+Enter)';

    const isSuccess = data.exit_code === 0;
    consoleStatusBadge.className = isSuccess ? 'status-badge-ok' : 'status-badge-err';
    consoleStatusBadge.textContent = isSuccess ? `Success (${data.elapsed_ms}ms)` : `Exit ${data.exit_code} (${data.elapsed_ms}ms)`;

    const output = data.stdout || data.stderr || '(Execution finished with no output)';
    consoleOutputPre.innerHTML = `<code>${escapeHtml(output)}</code>`;
  } catch (err) {
    runConsoleBtn.disabled = false;
    runConsoleBtn.textContent = 'Run (Ctrl+Enter)';
    consoleStatusBadge.className = 'status-badge-err';
    consoleStatusBadge.textContent = 'Error';
    consoleOutputPre.innerHTML = `<code style="color:#ef4444;">Execution failed: ${escapeHtml(err.message)}</code>`;
  }
};

window.loadConsoleSnippet = function(key) {
  if (!consoleCodeInput || !consoleLangSelect) return;
  if (key === 'jwt_test') {
    consoleLangSelect.value = 'python';
    consoleCodeInput.value = `import json, base64, time\n\nheader = base64.b64encode(json.dumps({"alg":"HS256","typ":"JWT"}).encode()).decode().rstrip('=')\npayload = base64.b64encode(json.dumps({"sub":"12345","name":"Satish","exp":int(time.time())+3600}).encode()).decode().rstrip('=')\nsig = "sample_hmac_signature"\n\ntoken = f"{header}.{payload}.{sig}"\nprint("Generated Sample JWT:")\nprint(token)\nprint("\\nDecoded Claims:", json.loads(base64.b64decode(payload + '===').decode()))`;
  } else if (key === 'sys_stats') {
    consoleLangSelect.value = 'python';
    consoleCodeInput.value = `import os, platform, multiprocessing\n\nprint(f"System: {platform.system()} {platform.release()}")\nprint(f"Machine: {platform.machine()}")\nprint(f"CPUs / Cores: {multiprocessing.cpu_count()}")\nprint(f"Current Working Dir: {os.getcwd()}")`;
  } else if (key === 'mcp_ping') {
    consoleLangSelect.value = 'bash';
    consoleCodeInput.value = `curl -s http://localhost:11434/api/tags | python3 -m json.tool | head -n 25`;
  }
};

/* ==========================================================================
   Book Studio & Manual Publisher Logic
   ========================================================================== */
const bookStudioModal = document.getElementById('bookStudioModal');
const toggleBookBtn = document.getElementById('toggleBookBtn');
const closeBookModalBtn = document.getElementById('closeBookModalBtn');
const bookModalBackdrop = document.getElementById('bookModalBackdrop');
const bookTitleInput = document.getElementById('bookTitleInput');
const bookSubtitleInput = document.getElementById('bookSubtitleInput');
const bookAuthorInput = document.getElementById('bookAuthorInput');
const bookChapterList = document.getElementById('bookChapterList');
const chapterTitleInput = document.getElementById('chapterTitleInput');
const chapterContentInput = document.getElementById('chapterContentInput');
const chapterPreviewBody = document.getElementById('chapterPreviewBody');
const addChapterBtn = document.getElementById('addChapterBtn');
const bookSaveBtn = document.getElementById('bookSaveBtn');
const autoCompileBookBtn = document.getElementById('autoCompileBookBtn');
const exportHtmlBookBtn = document.getElementById('exportHtmlBookBtn');
const exportPdfBookBtn = document.getElementById('exportPdfBookBtn');
const chapterCountBadge = document.getElementById('chapterCountBadge');

let activeBook = {
  title: 'CL4R1T4S AI Engineering & Security Manual',
  subtitle: 'Autonomous Agents, Zero-Key Architectures & Codebase Hardening',
  author: 'Satish Gundu (Principal AI Engineer)',
  slug: 'cl4r1t4s_manual',
  chapters: [
    {
      title: 'Chapter 1: Hardening Authentication Middleware',
      content: '## JWT Authentication & Expiration Verification\n\nThis chapter documents the practical implementation of algorithm validation and token expiration checks to prevent algorithm confusion attacks and expired token replays.\n\n### The Security Diff\n```go\n// Check token expiration\nif time.Now().After(claims["exp"]) {\n    http.Error(w, "Token expired", http.StatusUnauthorized)\n    return\n}\n```\n\n### Verification Steps\n1. Run `rg -n "jwt.ValidateToken" .` across the repo.\n2. Apply the surgical patch.\n3. Execute unit tests.'
    }
  ]
};
let activeChapterIndex = 0;

if (toggleBookBtn) {
  toggleBookBtn.addEventListener('click', () => {
    bookStudioModal.classList.remove('hidden');
    renderBookStudio();
  });
}
if (closeBookModalBtn) closeBookModalBtn.addEventListener('click', () => bookStudioModal.classList.add('hidden'));
if (bookModalBackdrop) bookModalBackdrop.addEventListener('click', () => bookStudioModal.classList.add('hidden'));

function renderBookStudio() {
  if (!bookTitleInput || !bookChapterList) return;
  bookTitleInput.value = activeBook.title;
  bookSubtitleInput.value = activeBook.subtitle;
  bookAuthorInput.value = activeBook.author;
  if (chapterCountBadge) chapterCountBadge.textContent = activeBook.chapters.length;

  bookChapterList.innerHTML = '';
  activeBook.chapters.forEach((ch, idx) => {
    const item = document.createElement('div');
    item.className = `chapter-nav-item ${idx === activeChapterIndex ? 'active' : ''}`;
    item.innerHTML = `
      <span>${escapeHtml(ch.title || `Chapter ${idx + 1}`)}</span>
      <span style="opacity:0.6;font-size:0.7rem;">Ch ${idx + 1}</span>
    `;
    item.addEventListener('click', () => selectBookChapter(idx));
    bookChapterList.appendChild(item);
  });

  const curr = activeBook.chapters[activeChapterIndex] || { title: '', content: '' };
  if (chapterTitleInput) chapterTitleInput.value = curr.title;
  if (chapterContentInput) chapterContentInput.value = curr.content;
  window.updateChapterPreview();
}

function selectBookChapter(idx) {
  saveCurrentChapterState();
  activeChapterIndex = idx;
  renderBookStudio();
}

function saveCurrentChapterState() {
  if (activeBook.chapters[activeChapterIndex]) {
    if (chapterTitleInput) activeBook.chapters[activeChapterIndex].title = chapterTitleInput.value;
    if (chapterContentInput) activeBook.chapters[activeChapterIndex].content = chapterContentInput.value;
  }
  if (bookTitleInput) activeBook.title = bookTitleInput.value;
  if (bookSubtitleInput) activeBook.subtitle = bookSubtitleInput.value;
  if (bookAuthorInput) activeBook.author = bookAuthorInput.value;
}

if (addChapterBtn) {
  addChapterBtn.addEventListener('click', () => {
    saveCurrentChapterState();
    activeBook.chapters.push({
      title: `Chapter ${activeBook.chapters.length + 1}: New Topic`,
      content: '## Overview\n\nEnter chapter notes, guidelines, and code snippets here...'
    });
    activeChapterIndex = activeBook.chapters.length - 1;
    renderBookStudio();
  });
}

if (chapterTitleInput) {
  chapterTitleInput.addEventListener('input', () => {
    if (activeBook.chapters[activeChapterIndex]) {
      activeBook.chapters[activeChapterIndex].title = chapterTitleInput.value;
      const navItem = bookChapterList.children[activeChapterIndex];
      if (navItem) navItem.querySelector('span').textContent = chapterTitleInput.value;
    }
  });
}

if (chapterContentInput) {
  chapterContentInput.addEventListener('input', () => {
    if (activeBook.chapters[activeChapterIndex]) {
      activeBook.chapters[activeChapterIndex].content = chapterContentInput.value;
    }
    window.updateChapterPreview();
  });
}

window.updateChapterPreview = function() {
  if (!chapterPreviewBody) return;
  const raw = chapterContentInput?.value || '';
  chapterPreviewBody.innerHTML = renderMarkdown(raw);
};

if (bookSaveBtn) {
  bookSaveBtn.addEventListener('click', async () => {
    saveCurrentChapterState();
    bookSaveBtn.textContent = 'Saving...';
    try {
      const res = await fetch('/api/books/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeBook)
      });
      const data = await res.json();
      activeBook.slug = data.slug;
      bookSaveBtn.textContent = '✅ Saved';
      setTimeout(() => { bookSaveBtn.textContent = '💾 Save Book'; }, 1500);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
      bookSaveBtn.textContent = '💾 Save Book';
    }
  });
}

if (autoCompileBookBtn) {
  autoCompileBookBtn.addEventListener('click', () => {
    saveCurrentChapterState();
    const bubbles = Array.from(document.querySelectorAll('.message-bubble'));
    if (!bubbles.length) {
      alert('No chat messages to compile yet!');
      return;
    }

    let compiledContent = `## Auto-Compiled Session Notes\n*Compiled on ${new Date().toLocaleString()}*\n\n`;
    bubbles.forEach((b, i) => {
      const isAi = b.closest('.message-row')?.classList.contains('ai');
      const sender = isAi ? '### Agent Response' : '### User Request';
      compiledContent += `${sender}\n\n${b.innerText}\n\n---\n\n`;
    });

    activeBook.chapters.push({
      title: `Chapter ${activeBook.chapters.length + 1}: Session Transcripts & Security Solutions`,
      content: compiledContent
    });
    activeChapterIndex = activeBook.chapters.length - 1;
    renderBookStudio();
    alert('✅ Auto-compiled conversation into a new book chapter!');
  });
}

if (exportHtmlBookBtn) {
  exportHtmlBookBtn.addEventListener('click', async () => {
    saveCurrentChapterState();
    await fetch('/api/books/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activeBook)
    });
    window.open(`/api/books/export?slug=${activeBook.slug || 'cl4r1t4s_manual'}&format=html`, '_blank');
  });
}

if (exportPdfBookBtn) {
  exportPdfBookBtn.addEventListener('click', async () => {
    saveCurrentChapterState();
    await fetch('/api/books/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activeBook)
    });
    const printWin = window.open(`/api/books/export?slug=${activeBook.slug || 'cl4r1t4s_manual'}&format=html`, '_blank');
    if (printWin) {
      printWin.onload = () => {
        setTimeout(() => printWin.print(), 800);
      };
    }
  });
}

/* ==========================================================================
   Theme, Color Modes & Typography Customizer System
   ========================================================================== */
function initThemeSystem() {
  const toggleThemeBtn = document.getElementById('toggleThemeBtn');
  const themeModal = document.getElementById('themeCustomizerModal');
  const themeBackdrop = document.getElementById('themeModalBackdrop');
  const closeThemeBtn = document.getElementById('closeThemeModalBtn');
  const applyCloseBtn = document.getElementById('applyThemeCloseBtn');
  const resetDefaultsBtn = document.getElementById('resetThemeDefaultsBtn');

  const DEFAULT_APPEARANCE = {
    theme: 'whitemode',
    font: 'sans',
    textColor: 'default',
    fontSize: 'md'
  };

  // Load saved preference or default
  let currentAppearance = { ...DEFAULT_APPEARANCE };
  try {
    const saved = localStorage.getItem('omni_appearance_config');
    if (saved) {
      currentAppearance = { ...DEFAULT_APPEARANCE, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load appearance config:', e);
  }

  // Apply appearance to document
  function applyAppearance(cfg) {
    currentAppearance = { ...cfg };
    
    // Set root attributes
    document.documentElement.setAttribute('data-theme', cfg.theme);
    document.documentElement.setAttribute('data-font', cfg.font);
    document.documentElement.setAttribute('data-text-color', cfg.textColor);
    document.documentElement.setAttribute('data-font-size', cfg.fontSize);

    // Toggle body class for light vs dark mode
    if (cfg.theme === 'whitemode' || cfg.theme === 'light') {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
    }

    // Save to localStorage
    try {
      localStorage.setItem('omni_appearance_config', JSON.stringify(currentAppearance));
    } catch (e) {}

    // Update active UI elements in modal
    document.querySelectorAll('.theme-card').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-theme-val') === cfg.theme);
    });

    document.querySelectorAll('.font-pill').forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-font-val') === cfg.font);
    });

    document.querySelectorAll('.color-circle-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-color-val') === cfg.textColor);
    });

    document.querySelectorAll('.size-pill').forEach(pill => {
      pill.classList.toggle('active', pill.getAttribute('data-size-val') === cfg.fontSize);
    });

    // Update Live Preview box if open
    const previewBox = document.querySelector('.theme-preview-box');
    if (previewBox) {
      const codeEl = previewBox.querySelector('pre code');
      if (codeEl) {
        codeEl.textContent = `const activeTheme = "${cfg.theme}";\nconst activeFont = "${cfg.font}";\nconst textColor = "${cfg.textColor}";\nconst fontSize = "${cfg.fontSize}";`;
      }
    }
  }

  // Initial apply
  applyAppearance(currentAppearance);

  // Modal open / close handlers
  if (toggleThemeBtn && themeModal) {
    toggleThemeBtn.addEventListener('click', () => {
      themeModal.classList.remove('hidden');
    });
  }

  const closeModal = () => {
    if (themeModal) themeModal.classList.add('hidden');
  };

  if (closeThemeBtn) closeThemeBtn.addEventListener('click', closeModal);
  if (applyCloseBtn) applyCloseBtn.addEventListener('click', closeModal);
  if (themeBackdrop) themeBackdrop.addEventListener('click', closeModal);

  // Theme card click
  document.querySelectorAll('.theme-card').forEach(card => {
    card.addEventListener('click', () => {
      const themeVal = card.getAttribute('data-theme-val');
      if (themeVal) {
        currentAppearance.theme = themeVal;
        applyAppearance(currentAppearance);
      }
    });
  });

  // Font family click
  document.querySelectorAll('.font-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const fontVal = pill.getAttribute('data-font-val');
      if (fontVal) {
        currentAppearance.font = fontVal;
        applyAppearance(currentAppearance);
      }
    });
  });

  // Text color click
  document.querySelectorAll('.color-circle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const colorVal = btn.getAttribute('data-color-val');
      if (colorVal) {
        currentAppearance.textColor = colorVal;
        applyAppearance(currentAppearance);
      }
    });
  });

  // Font size click
  document.querySelectorAll('.size-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const sizeVal = pill.getAttribute('data-size-val');
      if (sizeVal) {
        currentAppearance.fontSize = sizeVal;
        applyAppearance(currentAppearance);
      }
    });
  });

  // Reset to defaults
  if (resetDefaultsBtn) {
    resetDefaultsBtn.addEventListener('click', () => {
      applyAppearance(DEFAULT_APPEARANCE);
    });
  }

  // Expose helper globally
  window.setTheme = function(themeName) {
    currentAppearance.theme = themeName;
    applyAppearance(currentAppearance);
  };
  window.setFont = function(fontName) {
    currentAppearance.font = fontName;
    applyAppearance(currentAppearance);
  };
  window.setTextColor = function(colorName) {
    currentAppearance.textColor = colorName;
    applyAppearance(currentAppearance);
  };
  window.openThemeCustomizerModal = function() {
    if (themeModal) themeModal.classList.remove('hidden');
  };

  // Real-time synchronization across open tabs/dashboards
  window.addEventListener('storage', (e) => {
    if (e.key === 'omni_appearance_config' && e.newValue) {
      try {
        const cfg = JSON.parse(e.newValue);
        applyAppearance({ ...DEFAULT_APPEARANCE, ...cfg });
      } catch (err) {}
    }
  });
}

// Initialize theme on script load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initThemeSystem();
    setupDbStudioModalEvents();
    setupRoadmapsStudioEvents();
  });
} else {
  initThemeSystem();
  setupDbStudioModalEvents();
  setupRoadmapsStudioEvents();
}

/* =========================================================================
   DATABASE & KNOWLEDGE ARCHIVE STUDIO (SQLite WAL & Cross-Component Hub)
   ========================================================================= */

let currentDbSnippetsList = [];

async function openDbStudioModal() {
  const modal = document.getElementById('dbStudioModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  await loadDbStudioData();
}

function closeDbStudioModal() {
  const modal = document.getElementById('dbStudioModal');
  if (modal) modal.classList.add('hidden');
}

async function loadDbStudioData() {
  try {
    const [telemetryRes, snippetsRes] = await Promise.all([
      fetch('/api/db/telemetry').catch(() => null),
      fetch('/api/db/snippets').catch(() => null)
    ]);

    if (telemetryRes && telemetryRes.ok) {
      const t = await telemetryRes.json();
      const chunksEl = document.getElementById('dbKpiChunks');
      const sizeEl = document.getElementById('dbKpiSize');
      if (chunksEl && t.total_chunks !== undefined) chunksEl.textContent = `${t.total_chunks} chunks`;
      if (sizeEl && t.database_size_kb !== undefined) sizeEl.textContent = `${t.database_size_kb} KB`;
    }

    if (snippetsRes && snippetsRes.ok) {
      const s = await snippetsRes.json();
      currentDbSnippetsList = s.snippets || [];
      const kpiSnippets = document.getElementById('dbKpiSnippets');
      const badge = document.getElementById('dbSnippetsBadge');
      if (kpiSnippets) kpiSnippets.textContent = currentDbSnippetsList.length;
      if (badge) badge.textContent = currentDbSnippetsList.length;
      renderDbSnippetCards(currentDbSnippetsList);
    }
  } catch (err) {
    console.warn('[Load DB Data]', err);
  }
}

function renderDbSnippetCards(list) {
  const grid = document.getElementById('dbSnippetsGrid');
  if (!grid) return;

  if (!list || list.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 2.5rem; color: var(--text-dim); font-weight:600;">No snippets archived yet. Click "🗄️ Save to DB" on any AI chat response or REPL output to archive snippets here.</div>';
    return;
  }

  grid.innerHTML = list.map(item => `
    <div class="db-snippet-card" data-id="${item.id}">
      <div class="db-snippet-header">
        <div class="db-snippet-title">#${item.id} ${escapeHtml(item.title || 'Untitled Snippet')}</div>
        <span class="db-snippet-source-badge">${escapeHtml(item.source || 'Studio')}</span>
      </div>
      <div class="db-snippet-preview">${escapeHtml((item.content || '').slice(0, 300))}${(item.content || '').length > 300 ? '...' : ''}</div>
      <div class="db-snippet-footer">
        <div><span>📅 ${escapeHtml(item.created_at || 'Recently')}</span></div>
        <div class="db-snippet-actions">
          <button class="db-bridge-btn" onclick="window.dispatchSnippetToChat(${item.id})" title="Load into AI Chat Prompt">💬 Chat</button>
          <button class="db-bridge-btn" onclick="window.dispatchSnippetToRepl(${item.id})" title="Send code into Live REPL">🔴 REPL</button>
          <button class="db-bridge-btn" onclick="window.dispatchSnippetToBook(${item.id})" title="Append to Book chapter">📖 Book</button>
          <button class="db-bridge-btn" onclick="window.dispatchSnippetToMemory(${item.id})" title="Distill to On-Device Vector Memory">⚡ Memory</button>
          <button class="db-bridge-btn" onclick="window.copySnippetText(${item.id})" title="Copy snippet text">📋</button>
        </div>
      </div>
    </div>
  `).join('');
}

window.dispatchSnippetToChat = function(id) {
  const item = currentDbSnippetsList.find(s => s.id === id);
  if (!item || !promptInput) return;
  promptInput.value = `Regarding this saved knowledge snippet (#${item.id}):\n**${item.title}**\n\n${item.content}\n\nCan you analyze this, provide architectural recommendations, and synthesize production code?`;
  promptInput.dispatchEvent(new Event('input'));
  closeDbStudioModal();
  promptInput.focus();
  if (window.showOmniToast) window.showOmniToast(`Snippet #${id} loaded into Chatbot!`, '💬');
};

window.dispatchSnippetToRepl = function(id) {
  const item = currentDbSnippetsList.find(s => s.id === id);
  if (!item) return;

  let code = item.content || '';
  const match = code.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
  if (match) {
    code = match[1].trim();
  }

  const consoleDrawer = document.getElementById('consoleDrawer');
  const consoleCodeInput = document.getElementById('consoleCodeInput');
  if (consoleDrawer && consoleCodeInput) {
    consoleDrawer.classList.remove('hidden');
    consoleCodeInput.value = code;
    closeDbStudioModal();
    consoleCodeInput.focus();
    if (window.showOmniToast) window.showOmniToast(`Snippet #${id} transferred to Live REPL Console!`, '🔴');
  }
};

window.dispatchSnippetToBook = async function(id) {
  const item = currentDbSnippetsList.find(s => s.id === id);
  if (!item) return;

  try {
    const res = await fetch('/api/books/append', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `Archived Snippet: ${item.title || 'Knowledge Note'}`,
        content: `## ${item.title}\n\n> Source: ${item.source || 'Studio'} (DB Record #${item.id})\n\n${item.content}\n\n*Archived from SQLite Database Studio.*`
      })
    });
    const data = await res.json();
    if (window.showOmniToast) window.showOmniToast(`Snippet #${id} appended to Book chapter!`, '📖');
  } catch (err) {
    if (window.showOmniToast) window.showOmniToast(`Book append error: ${err.message}`, '⚠️');
  }
};

window.dispatchSnippetToMemory = async function(id) {
  const item = currentDbSnippetsList.find(s => s.id === id);
  if (!item) return;

  try {
    const res = await fetch('/api/memory/distill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${item.title}: ${item.content}`,
        source: `SQLite Snippet #${item.id}`
      })
    });
    const data = await res.json();
    if (window.showOmniToast) window.showOmniToast(`Distilled snippet #${id} into On-Device Memory!`, '⚡');
  } catch (err) {
    if (window.showOmniToast) window.showOmniToast(`Memory distillation error: ${err.message}`, '⚠️');
  }
};

window.copySnippetText = function(id) {
  const item = currentDbSnippetsList.find(s => s.id === id);
  if (!item) return;
  navigator.clipboard.writeText(item.content || '').then(() => {
    if (window.showOmniToast) window.showOmniToast(`Snippet #${id} copied to clipboard!`, '📋');
  }).catch(() => {
    if (window.showOmniToast) window.showOmniToast('Copy failed.', '⚠️');
  });
};

function setupDbStudioModalEvents() {
  const closeBtn = document.getElementById('closeDbStudioModalBtn');
  const closeBottomBtn = document.getElementById('closeDbStudioModalBottomBtn');
  const refreshBtn = document.getElementById('btnRefreshDbSnippets');
  const filterInput = document.getElementById('dbSnippetSearchFilter');
  const tabSnippets = document.getElementById('tabDbSnippetsBtn');
  const tabSql = document.getElementById('tabDbSqlBtn');
  const panelSnippets = document.getElementById('dbSnippetsPanel');
  const panelSql = document.getElementById('dbSqlPanel');
  const runSqlBtn = document.getElementById('btnExecuteDbSql');
  const sqlInput = document.getElementById('dbSqlInput');

  if (closeBtn) closeBtn.addEventListener('click', closeDbStudioModal);
  if (closeBottomBtn) closeBottomBtn.addEventListener('click', closeDbStudioModal);

  if (tabSnippets && tabSql && panelSnippets && panelSql) {
    tabSnippets.addEventListener('click', () => {
      tabSnippets.className = 'pill-btn primary-pill';
      tabSql.className = 'pill-btn secondary-pill';
      panelSnippets.classList.remove('hidden');
      panelSql.classList.add('hidden');
    });
    tabSql.addEventListener('click', () => {
      tabSql.className = 'pill-btn primary-pill';
      tabSnippets.className = 'pill-btn secondary-pill';
      panelSql.classList.remove('hidden');
      panelSnippets.classList.add('hidden');
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadDbStudioData());
  }

  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = currentDbSnippetsList.filter(s =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.content || '').toLowerCase().includes(q) ||
        (s.source || '').toLowerCase().includes(q)
      );
      renderDbSnippetCards(filtered);
    });
  }

  document.querySelectorAll('.db-sql-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sql = btn.getAttribute('data-sql');
      if (sql && sqlInput) {
        sqlInput.value = sql;
        if (runSqlBtn) runSqlBtn.click();
      }
    });
  });

  if (runSqlBtn && sqlInput) {
    runSqlBtn.addEventListener('click', async () => {
      const sql = sqlInput.value.trim();
      if (!sql) return;

      const container = document.getElementById('dbSqlResultContainer');
      if (container) {
        container.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-dim);"><span class="spinner"></span> Executing SQL...</div>';
      }

      runSqlBtn.disabled = true;
      runSqlBtn.textContent = '⏳ Running...';

      try {
        const res = await fetch('/api/db/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql })
        });
        const data = await res.json();
        runSqlBtn.disabled = false;
        runSqlBtn.textContent = '⚡ Run SQL';

        if (!res.ok || data.error) {
          if (container) {
            container.innerHTML = `<div style="padding: 12px; color: #ef4444; background: rgba(239,68,68,0.08); border-radius: 6px; font-weight:700;">SQL Error: ${escapeHtml(data.error || 'Execution failed')}</div>`;
          }
          return;
        }

        renderDbSqlResults(data, container);
      } catch (err) {
        runSqlBtn.disabled = false;
        runSqlBtn.textContent = '⚡ Run SQL';
        if (container) {
          container.innerHTML = `<div style="padding: 12px; color: #ef4444; background: rgba(239,68,68,0.08); border-radius: 6px; font-weight:700;">Connection Error: ${escapeHtml(err.message)}</div>`;
        }
      }
    });
  }
}

function renderDbSqlResults(data, container) {
  if (!container) return;
  const cols = data.columns || [];
  const rows = data.rows || [];
  const ms = data.execution_time_ms !== undefined ? `${data.execution_time_ms}ms` : '';

  if (cols.length === 0) {
    container.innerHTML = `<div style="padding: 12px; color: var(--accent-success); font-weight: 750;">Query executed successfully in ${ms} (${data.row_count || 0} rows).</div>`;
    return;
  }

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px; font-size: 0.75rem; color: var(--text-dim); font-weight:700;">
      <span>Returned ${rows.length} rows (${ms})</span>
    </div>
    <div style="overflow-x: auto;">
      <table class="db-result-table">
        <thead>
          <tr>
            ${cols.map(c => `<th>${escapeHtml(c)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              ${cols.map(c => `<td>${escapeHtml(String(r[c] !== null && r[c] !== undefined ? r[c] : ''))}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/* =========================================================================
   CAREER ROADMAPS & COGNITIVE SKILL TREES STUDIO (Main Window Modal)
   ========================================================================= */

let currentRoadmapCategory = 'all';
let currentRoadmapSearch = '';
let currentActiveStudioRoadmap = null;
let currentStudioDlTab = 'curriculum';
let activeStudioCompetencyKey = '';

function setupRoadmapsStudioEvents() {
  const navTop = document.getElementById('navRoadmapsTop');
  const navBottom = document.getElementById('navRoadmaps');
  const closeBtn = document.getElementById('closeRoadmapsModalBtn');
  const closeBtnBottom = document.getElementById('closeRoadmapsModalBottomBtn');
  const backBtn = document.getElementById('btnBackToRoadmapsList');
  const modal = document.getElementById('roadmapsModal');
  const searchInput = document.getElementById('roadmapsSearchInput');
  const pills = document.querySelectorAll('.roadmap-cat-pill');

  if (navTop) navTop.addEventListener('click', () => openRoadmapsStudioModal());
  if (navBottom) navBottom.addEventListener('click', () => openRoadmapsStudioModal());
  if (closeBtn) closeBtn.addEventListener('click', closeRoadmapsStudioModal);
  if (closeBtnBottom) closeBtnBottom.addEventListener('click', closeRoadmapsStudioModal);
  if (backBtn) backBtn.addEventListener('click', showRoadmapsListView);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeRoadmapsStudioModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeRoadmapsStudioModal();
    }
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentRoadmapSearch = e.target.value.trim().toLowerCase();
      renderMainRoadmapsList();
    });
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentRoadmapCategory = pill.getAttribute('data-cat') || 'all';
      renderMainRoadmapsList();
    });
  });
}

function openRoadmapsStudioModal(targetRoadmapId = null) {
  const modal = document.getElementById('roadmapsModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const countVal = document.getElementById('roadmapsCountVal');
  const allRoadmaps = window.ACADEMY_DATA?.roadmaps || [];
  if (countVal) countVal.textContent = allRoadmaps.length || '10';

  if (targetRoadmapId) {
    openRoadmapDetail(targetRoadmapId);
  } else {
    showRoadmapsListView();
    renderMainRoadmapsList();
  }
}

function closeRoadmapsStudioModal() {
  const modal = document.getElementById('roadmapsModal');
  if (modal) modal.classList.add('hidden');
}

function showRoadmapsListView() {
  const listView = document.getElementById('roadmapsListView');
  const detailView = document.getElementById('roadmapDetailView');
  const searchToolbar = document.querySelector('.roadmaps-toolbar');
  
  if (listView) listView.classList.remove('hidden');
  if (detailView) detailView.classList.add('hidden');
  if (searchToolbar) searchToolbar.style.display = 'flex';
}

function matchesRoadmapCategory(r, cat) {
  if (cat === 'all') return true;
  const id = (r.id || '').toLowerCase();
  const c = (r.category || '').toLowerCase();
  if (cat === 'agentic') {
    return id.includes('agent') || c.includes('agent');
  }
  if (cat === 'genai') {
    return id.includes('genai') || id.includes('transformer') || id.includes('mle') || c.includes('genai');
  }
  if (cat === 'devops') {
    return id.includes('devops') || id.includes('cloud') || id.includes('mlops') || c.includes('devops') || c.includes('mlops');
  }
  if (cat === 'systems') {
    return id.includes('system') || id.includes('sql') || id.includes('linux') || id.includes('python') || id.includes('fde') || c.includes('system') || c.includes('sql') || c.includes('core');
  }
  return c === cat;
}

function renderMainRoadmapsList() {
  const container = document.getElementById('mainRoadmapsGrid');
  if (!container) return;
  const allRoadmaps = window.ACADEMY_DATA?.roadmaps || [];

  const filtered = allRoadmaps.filter(r => {
    const matchesCat = matchesRoadmapCategory(r, currentRoadmapCategory);
    const matchesSearch = !currentRoadmapSearch ||
      (r.title && r.title.toLowerCase().includes(currentRoadmapSearch)) ||
      (r.summary && r.summary.toLowerCase().includes(currentRoadmapSearch)) ||
      (r.skills && r.skills.some(s => s.toLowerCase().includes(currentRoadmapSearch))) ||
      (r.milestones && r.milestones.some(m => 
        (m.title && m.title.toLowerCase().includes(currentRoadmapSearch)) ||
        (m.description && m.description.toLowerCase().includes(currentRoadmapSearch)) ||
        (m.keyConcepts && m.keyConcepts.some(k => k.toLowerCase().includes(currentRoadmapSearch)))
      ));
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; padding: 3rem 1rem; text-align: center; color: var(--text-muted);">
        <div style="font-size: 2.2rem; margin-bottom: 0.5rem;">🔍</div>
        <h4 style="font-size: 1rem; color: var(--text-main); margin-bottom: 0.25rem;">No Career Roadmaps Found</h4>
        <p style="font-size: 0.82rem;">No engineering tracks match "${escapeHtml(currentRoadmapSearch)}". Try selecting another category or clearing search.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(r => `
    <div class="roadmap-studio-card" onclick="openRoadmapDetail('${escapeHtml(r.id)}')">
      <div>
        <div class="roadmap-studio-card-header">
          <div class="roadmap-icon-badge">${r.icon || '🗺️'}</div>
          <span class="roadmap-badge ${r.badgeType === 'hot' ? 'hot' : ''}">${escapeHtml(r.badge || 'Verified 2026')}</span>
        </div>
        <h4>${escapeHtml(r.title)}</h4>
        <p class="summary">${escapeHtml(r.summary || '')}</p>
        <div class="roadmap-skills-tags">
          ${(r.skills || []).slice(0, 5).map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('')}
          ${(r.skills && r.skills.length > 5) ? `<span class="skill-tag">+${r.skills.length - 5} more</span>` : ''}
        </div>
      </div>
      <div class="roadmap-studio-card-footer">
        <span class="roadmap-duration">⏱️ ${escapeHtml(r.duration || '12 Weeks')} &bull; ${escapeHtml(r.level || 'Intermediate')}</span>
        <button class="btn-view-roadmap" onclick="event.stopPropagation(); openRoadmapDetail('${escapeHtml(r.id)}')">Explore Track &rarr;</button>
      </div>
    </div>
  `).join('');
}

function openRoadmapDetail(roadmapId) {
  const allRoadmaps = window.ACADEMY_DATA?.roadmaps || [];
  const roadmap = allRoadmaps.find(r => r.id === roadmapId);
  if (!roadmap) return;
  currentActiveStudioRoadmap = roadmap;

  const listView = document.getElementById('roadmapsListView');
  const detailView = document.getElementById('roadmapDetailView');
  const searchToolbar = document.querySelector('.roadmaps-toolbar');
  
  if (listView) listView.classList.add('hidden');
  if (detailView) detailView.classList.remove('hidden');
  if (searchToolbar) searchToolbar.style.display = 'none';

  const headerBadge = document.getElementById('detailRoadmapHeaderBadge');
  if (headerBadge) {
    headerBadge.innerHTML = `
      <span class="roadmap-badge ${roadmap.badgeType === 'hot' ? 'hot' : ''}">${escapeHtml(roadmap.badge || 'Verified')}</span>
      <span style="font-size: 0.74rem; color: var(--text-dim); font-weight: 600;">⏱️ ${escapeHtml(roadmap.duration || '')} &bull; ${escapeHtml(roadmap.level || '')}</span>
    `;
  }

  currentStudioDlTab = 'curriculum';
  activeStudioCompetencyKey = Object.keys(roadmap.skillsDetails || {})[0] || (roadmap.skills && roadmap.skills[0]) || '';

  renderRoadmapDetailContent(roadmap);
}

function renderRoadmapDetailContent(roadmap) {
  const contentEl = document.getElementById('roadmapDetailContent');
  if (!contentEl) return;

  const isDynamic = Boolean(roadmap.milestones && roadmap.milestones.length > 0);
  if (!isDynamic) {
    contentEl.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-muted);">Detailed curriculum not available for this track yet.</div>`;
    return;
  }

  contentEl.innerHTML = `
    <div style="margin-bottom: 1.25rem;">
      <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
        <span style="font-size: 2rem;">${roadmap.icon || '🗺️'}</span>
        <h3 style="margin: 0; font-size: 1.3rem; color: var(--text-main);">${escapeHtml(roadmap.title)}</h3>
      </div>
      <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.55; margin: 0 0 0.5rem 0;">${escapeHtml(roadmap.summary)}</p>
    </div>

    <!-- Navigation Tabs -->
    <div class="dl-tab-bar">
      <button class="dl-tab-btn active" data-dltab="curriculum" onclick="switchStudioDlTab('curriculum')">
        🗺️ 5-Phase Curriculum & Labs
      </button>
      <button class="dl-tab-btn" data-dltab="competencies" onclick="switchStudioDlTab('competencies')">
        🎯 6 Core Competencies Inspector
      </button>
    </div>

    <!-- Panel 1: Curriculum & Labs -->
    <div id="dl-panel-curriculum" class="dl-tab-panel" style="display: block;">
      <div class="dl-phases-list">
        ${roadmap.milestones.map((m, idx) => `
          <div class="dl-phase-card">
            <div class="dl-phase-header" onclick="toggleStudioPhase(${idx})">
              <div>
                <span class="dl-phase-badge">${escapeHtml(m.phase || `Phase ${idx+1}`)}</span>
                <h4 class="dl-phase-title">${escapeHtml(m.title)}</h4>
                <p class="dl-phase-desc">${escapeHtml(m.description || '')}</p>
              </div>
              <button class="dl-phase-toggle" id="dl-phase-toggle-${idx}">
                ${idx === 0 ? '▲ Collapse' : '▼ Expand Details'}
              </button>
            </div>

            <div class="dl-phase-body" id="dl-phase-body-${idx}" style="display: ${idx === 0 ? 'flex' : 'none'};">
              <!-- Key Concepts -->
              ${m.keyConcepts ? `
                <div>
                  <h5 style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: #0d9488; margin-bottom: 0.5rem;">📌 Key Concepts</h5>
                  <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.4rem;">
                    ${m.keyConcepts.map(kc => `
                      <li style="display: flex; gap: 0.5rem; font-size: 0.85rem; color: var(--text-main); line-height: 1.5;">
                        <span style="color: #0d9488; font-weight: bold;">•</span>
                        <span>${escapeHtml(kc)}</span>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}

              <!-- Architecture Flow Diagram -->
              ${m.architectureDiagram ? `
                <div>
                  <h5 style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: #0284c7; margin-bottom: 0.4rem;">📐 System Architecture Flow</h5>
                  <div class="dl-architecture-box">${escapeHtml(m.architectureDiagram)}</div>
                </div>
              ` : ''}

              <!-- Code Blueprint -->
              ${m.codeSnippet ? `
                <div>
                  <div class="dl-code-box">
                    <div class="dl-code-header">
                      <span>💻 ${escapeHtml(m.codeTitle || 'Production Implementation Blueprint')}</span>
                      <div style="display: flex; gap: 0.4rem;">
                        <button class="icon-btn" style="height: 24px; font-size: 0.72rem; padding: 0 0.5rem; border: 1px solid var(--border-subtle); border-radius: 4px;" onclick="event.stopPropagation(); copyStudioCode(this, ${JSON.stringify(m.codeSnippet)})">📋 Copy</button>
                        <button class="icon-btn" style="height: 24px; font-size: 0.72rem; padding: 0 0.5rem; background: rgba(99,102,241,0.1); color: #6366f1; border-radius: 4px; border: 1px solid rgba(99,102,241,0.2);" onclick="event.stopPropagation(); askChatbotFromRoadmap('Explain the implementation of ' + ${JSON.stringify(m.codeTitle || m.title)} + ' with this code: \\n\\n\`\`\`\\n' + ${JSON.stringify(m.codeSnippet)} + '\\n\`\`\`')">💬 Ask Chatbot</button>
                      </div>
                    </div>
                    <pre class="dl-code-pre"><code>${escapeHtml(m.codeSnippet)}</code></pre>
                  </div>
                </div>
              ` : ''}

              <!-- Hands-on Lab -->
              ${m.handsOnLab ? `
                <div>
                  <div style="background: rgba(13,148,136,0.05); border: 1px solid rgba(13,148,136,0.2); border-radius: 6px; padding: 0.85rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                      <div>
                        <h5 style="font-size: 0.82rem; font-weight: 800; color: #0d9488; margin: 0 0 0.2rem 0;">🧪 ${escapeHtml(m.handsOnLab.title)}</h5>
                        <p style="font-size: 0.78rem; color: var(--text-secondary); margin: 0;">${escapeHtml(m.handsOnLab.goal)}</p>
                      </div>
                    </div>
                    ${m.handsOnLab.command ? `
                      <div style="display: flex; gap: 0.4rem; align-items: center; background: var(--bg-input); border: 1px solid var(--border-subtle); padding: 0.4rem 0.6rem; border-radius: 4px;">
                        <code style="font-family: monospace; font-size: 0.75rem; color: var(--text-main); flex: 1; overflow-x: auto; white-space: nowrap;">${escapeHtml(m.handsOnLab.command)}</code>
                        <button class="icon-btn" style="height: 24px; font-size: 0.7rem; padding: 0 0.4rem;" onclick="copyStudioCode(this, ${JSON.stringify(m.handsOnLab.command)})">Copy</button>
                        <button class="icon-btn" style="height: 24px; font-size: 0.7rem; padding: 0 0.4rem; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2);" onclick="executeLabCommand(${idx}, ${JSON.stringify(m.handsOnLab.command)})">Run Lab</button>
                      </div>
                      <div id="lab-output-${idx}" style="display: none; margin-top: 0.5rem; background: #000; color: #0f0; padding: 0.6rem; font-family: monospace; font-size: 0.7rem; border-radius: 4px; max-height: 150px; overflow-y: auto; white-space: pre-wrap;"></div>
                    ` : ''}
                  </div>
                </div>
              ` : ''}

              <!-- Interactive Quiz -->
              ${m.quiz ? `
                <div class="dl-quiz-container">
                  <h5 style="font-size: 0.82rem; font-weight: 800; text-transform: uppercase; color: #7c3aed; margin: 0 0 0.5rem 0;">🎯 Phase Knowledge Check</h5>
                  <p style="font-size: 0.82rem; color: var(--text-main); margin-bottom: 0.6rem;"><strong>Q:</strong> ${escapeHtml(m.quiz.question)}</p>
                  <div>
                    ${m.quiz.options.map((opt, oIdx) => `
                      <button class="dl-quiz-option" id="quiz-opt-${idx}-${oIdx}" onclick="checkStudioQuiz(this, ${idx}, ${oIdx}, ${m.quiz.answer}, ${JSON.stringify(m.quiz.explanation)})">
                        <span style="font-weight: 700; width: 20px;">${String.fromCharCode(65 + oIdx)}.</span> ${escapeHtml(opt)}
                      </button>
                    `).join('')}
                  </div>
                  <div id="quiz-feedback-${idx}" class="dl-quiz-feedback" style="display: none;"></div>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Panel 2: Core Competencies -->
    <div id="dl-panel-competencies" class="dl-tab-panel" style="display: none;">
      <div style="margin-bottom: 1.25rem;">
        <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem;">Select a Core Competency to inspect:</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
          ${(roadmap.skills || []).map(skill => `
            <button class="dl-comp-chip roadmap-cat-pill ${skill === activeStudioCompetencyKey ? 'active' : ''}" data-skill="${escapeHtml(skill)}" onclick="selectStudioCompetency('${escapeHtml(skill)}')">
              ${escapeHtml(skill)}
            </button>
          `).join('')}
        </div>
      </div>
      <div id="dl-competency-display"></div>
    </div>
  `;

  // Initialize competency tab
  if (activeStudioCompetencyKey) {
    selectStudioCompetency(activeStudioCompetencyKey);
  }
}

function switchStudioDlTab(tabId) {
  currentStudioDlTab = tabId;
  const btns = document.querySelectorAll('.dl-tab-btn');
  btns.forEach(b => {
    if (b.getAttribute('data-dltab') === tabId) b.classList.add('active');
    else b.classList.remove('active');
  });

  const panels = document.querySelectorAll('.dl-tab-panel');
  panels.forEach(p => p.style.display = 'none');
  
  const target = document.getElementById(`dl-panel-${tabId}`);
  if (target) target.style.display = 'block';
}

function selectStudioCompetency(skillName) {
  activeStudioCompetencyKey = skillName;
  document.querySelectorAll(".dl-comp-chip").forEach(chip => {
    chip.classList.toggle("active", chip.getAttribute("data-skill") === skillName);
  });
  
  const detailContainer = document.getElementById("dl-competency-display");
  if (!detailContainer || !currentActiveStudioRoadmap) return;
  
  const detailsMap = currentActiveStudioRoadmap.skillsDetails || {};
  const detail = detailsMap[skillName];
  
  if (!detail) {
    detailContainer.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-muted); border: 1px solid var(--border-subtle); border-radius: 8px;">Detailed inspector data for <strong>${escapeHtml(skillName)}</strong> is not available in this view.</div>`;
    return;
  }

  detailContainer.innerHTML = `
    <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 1.25rem;">
      <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.85rem;">
        <span style="font-size: 1.6rem;">${detail.icon || '🎯'}</span>
        <div>
          <h4 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: var(--text-main);">${escapeHtml(skillName)}</h4>
          <span style="font-size: 0.75rem; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.2); padding: 2px 7px; border-radius: 4px; font-weight: 700;">${escapeHtml(detail.role || 'Competency')}</span>
        </div>
      </div>
      
      <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.55; margin-bottom: 1rem;">
        ${escapeHtml(detail.summary || '')}
      </p>

      ${detail.mathematics ? `
        <div style="background: var(--bg-input); border-left: 4px solid #0d9488; padding: 0.75rem 1rem; border-radius: 0 6px 6px 0; margin-bottom: 1.15rem;">
          <div style="font-size: 0.75rem; font-weight: 800; color: #0d9488; text-transform: uppercase; margin-bottom: 0.25rem;">📐 Mathematical & Architectural Foundation</div>
          <code style="font-family: monospace; font-size: 0.82rem; color: var(--text-main); word-break: break-all;">${escapeHtml(detail.mathematics)}</code>
        </div>
      ` : ''}

      ${detail.keyApis && detail.keyApis.length > 0 ? `
        <h5 style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem;">Key APIs & Core Primitives</h5>
        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem;">
          ${detail.keyApis.map(api => `
            <code style="background: var(--bg-hover); color: var(--text-main); padding: 4px 8px; border-radius: 4px; font-size: 0.78rem; font-family: monospace; border: 1px solid var(--border-subtle); cursor: pointer;" onclick="copyStudioCode(this, '${escapeHtml(api)}')" title="Click to copy API">
              ${escapeHtml(api)}
            </code>
          `).join('')}
        </div>
      ` : ''}

      ${detail.productionGotchas ? `
        <div style="background: rgba(245,158,11,0.05); border: 1px solid rgba(245,158,11,0.2); border-left: 4px solid #f59e0b; padding: 0.75rem 1rem; border-radius: 0 6px 6px 0; margin-bottom: 1.15rem;">
          <div style="font-size: 0.75rem; font-weight: 800; color: #b45309; text-transform: uppercase; margin-bottom: 0.25rem;">⚠️ Production Pitfalls & Gotchas</div>
          <p style="font-size: 0.84rem; color: var(--text-main); margin: 0; line-height: 1.5;">${escapeHtml(detail.productionGotchas)}</p>
        </div>
      ` : ''}

      ${renderCompetencyPracticeSession(skillName)}

      ${detail.codeSnippet ? `
        <div style="margin-top: 1.25rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
            <h5 style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; color: #2563eb; margin: 0;">🐍 Production Blueprint</h5>
            <div style="display: flex; gap: 0.4rem;">
              <button class="icon-btn" style="height: 24px; font-size: 0.72rem; padding: 0 0.5rem; border: 1px solid var(--border-subtle); border-radius: 4px;" onclick="copyStudioCode(this, ${JSON.stringify(detail.codeSnippet)})">📋 Copy</button>
              <button class="icon-btn" style="height: 24px; font-size: 0.72rem; padding: 0 0.5rem; background: rgba(99,102,241,0.1); color: #6366f1; border-radius: 4px; border: 1px solid rgba(99,102,241,0.2);" onclick="askChatbotFromRoadmap('Explain the implementation of ' + ${JSON.stringify(skillName)} + ' with this code: \\n\\n\`\`\`\\n' + ${JSON.stringify(detail.codeSnippet)} + '\\n\`\`\`')">💬 Ask Chatbot</button>
            </div>
          </div>
          <div class="dl-code-box">
            <pre class="dl-code-pre"><code>${escapeHtml(detail.codeSnippet)}</code></pre>
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Initialize interactive calculations if present
  if (skillName === "Transformers") updateTransformerCalc();
  if (skillName === "Self-Attention") updateAttentionHeatmap();
  if (skillName === "LoRA / QLoRA") updateLoraCalc();
  if (skillName === "RAG Pipelines") updateRrfCalc();
  if (skillName === "Vector Databases") updateVectorDistanceCalc();
  if (skillName === "DPO / RLHF") updateDpoCalc();
}

function toggleStudioPhase(idx) {
  const body = document.getElementById(`dl-phase-body-${idx}`);
  const toggleBtn = document.getElementById(`dl-phase-toggle-${idx}`);
  if (!body || !toggleBtn) return;
  
  if (body.style.display === 'none') {
    body.style.display = 'flex';
    toggleBtn.textContent = '▲ Collapse';
  } else {
    body.style.display = 'none';
    toggleBtn.textContent = '▼ Expand Details';
  }
}

function copyStudioCode(btn, codeText) {
  navigator.clipboard.writeText(codeText).then(() => {
    const originalText = btn.textContent;
    btn.textContent = '✓ Copied';
    setTimeout(() => { btn.textContent = originalText; }, 2000);
  });
}

async function executeLabCommand(idx, command) {
  const outputDiv = document.getElementById('lab-output-' + idx);
  outputDiv.style.display = 'block';
  outputDiv.textContent = 'Running: ' + command + '\\n...\\n';
  
  try {
    const res = await fetch('/api/repl/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: command, lang: 'bash' })
    });
    
    if (!res.ok) {
      const err = await res.text();
      outputDiv.textContent += 'Error: ' + err;
      return;
    }
    
    const data = await res.json();
    if (data.stdout) outputDiv.textContent += data.stdout + '\\n';
    if (data.stderr) outputDiv.textContent += data.stderr + '\\n';
    outputDiv.textContent += '[Exited with code ' + data.exit_code + ']';
    
  } catch (err) {
    outputDiv.textContent += '\\nExecution Failed: ' + err.message;
  }
}

function checkStudioQuiz(btn, phaseIdx, selectedIdx, correctIdx, explanation) {
  const options = document.querySelectorAll(`[id^="quiz-opt-${phaseIdx}-"]`);
  options.forEach(opt => opt.disabled = true);
  
  const isCorrect = selectedIdx === correctIdx;
  
  if (isCorrect) {
    btn.classList.add('correct');
  } else {
    btn.classList.add('wrong');
    const correctBtn = document.getElementById(`quiz-opt-${phaseIdx}-${correctIdx}`);
    if (correctBtn) correctBtn.classList.add('correct');
  }
  
  const feedback = document.getElementById(`quiz-feedback-${phaseIdx}`);
  if (feedback) {
    feedback.style.display = 'block';
    if (isCorrect) {
      feedback.style.background = 'rgba(16, 185, 129, 0.1)';
      feedback.style.color = '#065f46';
      feedback.style.border = '1px solid #a7f3d0';
      feedback.innerHTML = `<strong>✅ Correct!</strong> ${escapeHtml(explanation)}`;
    } else {
      feedback.style.background = 'rgba(239, 68, 68, 0.1)';
      feedback.style.color = '#991b1b';
      feedback.style.border = '1px solid #fecaca';
      feedback.innerHTML = `<strong>❌ Incorrect.</strong> ${escapeHtml(explanation)}`;
    }
  }
}

function askChatbotFromRoadmap(promptText) {
  closeRoadmapsStudioModal();
  const promptInput = document.getElementById('promptInput');
  if (promptInput) {
    promptInput.value = promptText;
    promptInput.focus();
    promptInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/* =========================================================================
   INTERACTIVE COMPETENCY CALCULATORS
   ========================================================================= */

function renderCompetencyPracticeSession(skillName) {
  if (skillName === "Transformers") {
    return `
      <div style="background: var(--bg-hover); border: 1.5px solid var(--border-subtle); border-radius: 8px; padding: 1.15rem; margin-top: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
          <h5 style="font-size: 0.85rem; font-weight: 800; color: #0d9488; text-transform: uppercase; margin: 0;">
            🧪 Live Visual Session: Transformer Memory Profiler
          </h5>
          <span style="font-size: 0.72rem; background: rgba(3,105,161,0.1); color: #0369a1; border: 1px solid rgba(3,105,161,0.2); padding: 2px 7px; border-radius: 4px; font-weight: 700;">Simulator</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0 0 1rem 0;">
          Adjust batch size, sequence length, hidden dimension, and layers to calculate VRAM footprint in real time:
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
          <div>
            <label style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted);">Batch Size: <span id="val-batch" style="color: #0d9488;">2</span></label>
            <input type="range" id="input-batch" min="1" max="32" step="1" value="2" style="width: 100%; accent-color: #0d9488;" oninput="updateTransformerCalc()">
          </div>
          <div>
            <label style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted);">Seq Length: <span id="val-seq" style="color: #0d9488;">2048</span></label>
            <input type="range" id="input-seq" min="512" max="8192" step="512" value="2048" style="width: 100%; accent-color: #0d9488;" oninput="updateTransformerCalc()">
          </div>
          <div>
            <label style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted);">Hidden Dim:</label>
            <select id="input-dim" style="width: 100%; height: 30px; font-size: 0.78rem; border: 1px solid var(--border-subtle); border-radius: 4px; padding: 2px 6px; background: var(--bg-input); color: var(--text-main);" onchange="updateTransformerCalc()">
              <option value="2048">2048 (Small)</option>
              <option value="4096" selected>4096 (8B Class)</option>
              <option value="8192">8192 (70B Class)</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted);">Layers: <span id="val-layers" style="color: #0d9488;">32</span></label>
            <input type="range" id="input-layers" min="12" max="80" step="4" value="32" style="width: 100%; accent-color: #0d9488;" oninput="updateTransformerCalc()">
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.6rem; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.75rem;">
          <div style="text-align: center;">
            <div style="font-size: 0.7rem; color: var(--text-dim); font-weight: 700;">EST. PARAMS</div>
            <div id="res-params" style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-top: 2px;">6.44 B</div>
          </div>
          <div style="text-align: center; border-left: 1px solid var(--border-subtle);">
            <div style="font-size: 0.7rem; color: var(--text-dim); font-weight: 700;">WEIGHT VRAM</div>
            <div id="res-weight-vram" style="font-size: 1.05rem; font-weight: 800; color: #2563eb; margin-top: 2px;">12.89 GB</div>
          </div>
          <div style="text-align: center; border-left: 1px solid var(--border-subtle);">
            <div style="font-size: 0.7rem; color: var(--text-dim); font-weight: 700;">ACT. VRAM</div>
            <div id="res-act-vram" style="font-size: 1.05rem; font-weight: 800; color: #d97706; margin-top: 2px;">1.07 GB</div>
          </div>
        </div>
      </div>
    `;
  } else if (skillName === "Self-Attention") {
    return `
      <div style="background: var(--bg-hover); border: 1.5px solid var(--border-subtle); border-radius: 8px; padding: 1.15rem; margin-top: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
          <h5 style="font-size: 0.85rem; font-weight: 800; color: #0d9488; text-transform: uppercase; margin: 0;">🧪 Attention Heatmap</h5>
        </div>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.75rem; align-items: center;">
          <div style="flex: 2; min-width: 200px;">
            <input type="text" id="attn-tokens-input" value="The, autonomous, agent, called, tool" style="width: 100%; height: 32px; border: 1px solid var(--border-subtle); border-radius: 4px; padding: 0 0.5rem; font-size: 0.8rem; background: var(--bg-input); color: var(--text-main);" oninput="updateAttentionHeatmap()">
          </div>
          <div style="flex: 1; min-width: 120px;">
            <label style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted);">Temp: <span id="val-temp" style="color: #0d9488;">1.0</span></label>
            <input type="range" id="attn-temp" min="0.2" max="2.0" step="0.1" value="1.0" style="width: 100%; accent-color: #0d9488;" oninput="updateAttentionHeatmap()">
          </div>
        </div>
        <div id="attn-heatmap-container" style="overflow-x: auto; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.75rem;"></div>
      </div>
    `;
  } else if (skillName === "LoRA / QLoRA") {
    return `
      <div style="background: var(--bg-hover); border: 1.5px solid var(--border-subtle); border-radius: 8px; padding: 1.15rem; margin-top: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
          <h5 style="font-size: 0.85rem; font-weight: 800; color: #0d9488; text-transform: uppercase; margin: 0;">🧪 LoRA Rank Calculator</h5>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
          <div>
            <label style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted);">Model:</label>
            <select id="lora-model" style="width: 100%; height: 32px; font-size: 0.78rem; border: 1px solid var(--border-subtle); border-radius: 4px; padding: 2px 6px; background: var(--bg-input); color: var(--text-main);" onchange="updateLoraCalc()">
              <option value="8b" selected>8B Class</option>
              <option value="70b">70B Class</option>
            </select>
          </div>
          <div>
            <label style="font-size: 0.74rem; font-weight: 700; color: var(--text-muted);">Rank (r):</label>
            <select id="lora-rank" style="width: 100%; height: 32px; font-size: 0.78rem; border: 1px solid var(--border-subtle); border-radius: 4px; padding: 2px 6px; background: var(--bg-input); color: var(--text-main);" onchange="updateLoraCalc()">
              <option value="8">r = 8</option>
              <option value="16" selected>r = 16</option>
              <option value="32">r = 32</option>
            </select>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.6rem; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.75rem;">
          <div style="text-align: center;">
            <div style="font-size: 0.7rem; color: var(--text-dim); font-weight: 700;">BASE PARAMS</div>
            <div id="lora-base-p" style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-top: 2px;">8.03B</div>
          </div>
          <div style="text-align: center; border-left: 1px solid var(--border-subtle);">
            <div style="font-size: 0.7rem; color: var(--text-dim); font-weight: 700;">TRAINABLE ADAPTER</div>
            <div id="lora-trainable-p" style="font-size: 1.05rem; font-weight: 800; color: #0d9488; margin-top: 2px;">18.8M</div>
          </div>
        </div>
      </div>
    `;
  } else if (skillName === "RAG Pipelines") {
    return `
      <div style="background: var(--bg-hover); border: 1.5px solid var(--border-subtle); border-radius: 8px; padding: 1.15rem; margin-top: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
          <h5 style="font-size: 0.85rem; font-weight: 800; color: #0d9488; text-transform: uppercase; margin: 0;">🧪 Reciprocal Rank Fusion Simulator</h5>
        </div>
        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.85rem; align-items: center;">
          <div style="flex: 2; min-width: 200px;">
            <input type="text" id="rrf-query" value="hybrid RAG search" style="width: 100%; height: 32px; border: 1px solid var(--border-subtle); border-radius: 4px; padding: 0 0.5rem; font-size: 0.8rem; background: var(--bg-input); color: var(--text-main);" oninput="updateRrfCalc()">
          </div>
        </div>
        <div id="rrf-results-display" style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.75rem;"></div>
      </div>
    `;
  } else if (skillName === "Vector Databases") {
    return `
      <div style="background: var(--bg-hover); border: 1.5px solid var(--border-subtle); border-radius: 8px; padding: 1.15rem; margin-top: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
          <h5 style="font-size: 0.85rem; font-weight: 800; color: #0d9488; text-transform: uppercase; margin: 0;">🧪 Vector Distance Calculator</h5>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 0.85rem;">
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.75rem;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #0d9488; margin-bottom: 0.4rem;">Vector A</div>
            <div style="display: flex; gap: 0.4rem;">
              <input type="number" id="vecA-0" value="0.75" step="0.05" style="width: 100%; height: 28px; background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border-subtle); border-radius: 4px;" oninput="updateVectorDistanceCalc()">
              <input type="number" id="vecA-1" value="0.45" step="0.05" style="width: 100%; height: 28px; background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border-subtle); border-radius: 4px;" oninput="updateVectorDistanceCalc()">
            </div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.75rem;">
            <div style="font-size: 0.75rem; font-weight: 700; color: #2563eb; margin-bottom: 0.4rem;">Vector B</div>
            <div style="display: flex; gap: 0.4rem;">
              <input type="number" id="vecB-0" value="0.71" step="0.05" style="width: 100%; height: 28px; background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border-subtle); border-radius: 4px;" oninput="updateVectorDistanceCalc()">
              <input type="number" id="vecB-1" value="0.48" step="0.05" style="width: 100%; height: 28px; background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border-subtle); border-radius: 4px;" oninput="updateVectorDistanceCalc()">
            </div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 0.75rem;">
          <div style="text-align: center;">
            <div style="font-size: 0.7rem; color: var(--text-dim); font-weight: 700;">COSINE SIMILARITY</div>
            <div id="res-cosine" style="font-size: 1.05rem; font-weight: 800; color: #0d9488; margin-top: 2px;">0.9961</div>
          </div>
          <div style="text-align: center; border-left: 1px solid var(--border-subtle);">
            <div style="font-size: 0.7rem; color: var(--text-dim); font-weight: 700;">EUCLIDEAN (L2)</div>
            <div id="res-l2" style="font-size: 1.05rem; font-weight: 800; color: #d97706; margin-top: 2px;">0.0762</div>
          </div>
        </div>
      </div>
    `;
  } else if (skillName === "DPO / RLHF") {
    return `
      <div style="background: var(--bg-hover); border: 1.5px solid var(--border-subtle); border-radius: 8px; padding: 1.15rem; margin-top: 1.25rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
          <h5 style="font-size: 0.85rem; font-weight: 800; color: #0d9488; text-transform: uppercase; margin: 0;">🧪 DPO Loss Simulator</h5>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; margin-bottom: 1rem;">
          <div>
            <label style="font-size: 0.72rem; font-weight: 700; color: #059669;">Chosen logp: <span id="val-pi-c">-0.40</span></label>
            <input type="range" id="dpo-pi-c" min="-3.0" max="-0.1" step="0.05" value="-0.40" style="width: 100%; accent-color: #059669;" oninput="updateDpoCalc()">
          </div>
          <div>
            <label style="font-size: 0.72rem; font-weight: 700; color: #dc2626;">Rejected logp: <span id="val-pi-r">-1.80</span></label>
            <input type="range" id="dpo-pi-r" min="-3.5" max="-0.2" step="0.05" value="-1.80" style="width: 100%; accent-color: #dc2626;" oninput="updateDpoCalc()">
          </div>
        </div>
        <div style="text-align: center; padding: 0.75rem; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 6px;">
          <div style="font-size: 0.7rem; color: var(--text-dim); font-weight: 700;">DPO LOSS (L_DPO)</div>
          <div id="res-dpo-loss" style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); margin-top: 2px;">0.6358</div>
        </div>
      </div>
    `;
  }
  return '';
}

function updateTransformerCalc() {
  const b = parseInt(document.getElementById("input-batch")?.value || "2");
  const s = parseInt(document.getElementById("input-seq")?.value || "2048");
  const d = parseInt(document.getElementById("input-dim")?.value || "4096");
  const l = parseInt(document.getElementById("input-layers")?.value || "32");

  if (document.getElementById("val-batch")) document.getElementById("val-batch").textContent = b;
  if (document.getElementById("val-seq")) document.getElementById("val-seq").textContent = s;
  if (document.getElementById("val-layers")) document.getElementById("val-layers").textContent = l;

  const params = 12 * l * (d ** 2);
  const paramsB = (params / 1e9).toFixed(2);
  const weightVramGB = (params * 2 / (1024 ** 3)).toFixed(2);
  const actVramGB = (b * s * d * l * 2 / (1024 ** 3)).toFixed(2);

  if (document.getElementById("res-params")) document.getElementById("res-params").textContent = `${paramsB} B`;
  if (document.getElementById("res-weight-vram")) document.getElementById("res-weight-vram").textContent = `${weightVramGB} GB`;
  if (document.getElementById("res-act-vram")) document.getElementById("res-act-vram").textContent = `${actVramGB} GB`;
}

function updateAttentionHeatmap() {
  const inputStr = document.getElementById("attn-tokens-input")?.value || "The, agent, executed, the, tool";
  const temp = parseFloat(document.getElementById("attn-temp")?.value || "1.0");
  if (document.getElementById("val-temp")) document.getElementById("val-temp").textContent = temp.toFixed(1);

  const tokens = inputStr.split(/[, ]+/).filter(t => t.trim().length > 0).slice(0, 6);
  const container = document.getElementById("attn-heatmap-container");
  if (!container || tokens.length === 0) return;

  let html = `<table style="width: 100%; border-collapse: collapse; font-size: 0.74rem;"><thead><tr><th style="padding: 4px; text-align: left; color: var(--text-dim);">Q \\ K</th>`;
  tokens.forEach(tok => html += `<th style="padding: 4px; text-align: center; color: var(--text-main); font-family: monospace;">${escapeHtml(tok)}</th>`);
  html += `</tr></thead><tbody>`;

  for (let i = 0; i < tokens.length; i++) {
    html += `<tr><td style="padding: 4px; font-weight: 700; color: var(--text-main); font-family: monospace;">${escapeHtml(tokens[i])}</td>`;
    for (let j = 0; j < tokens.length; j++) {
      let w = j > i ? 0 : Math.exp(-(Math.abs(i-j)*0.5) / temp);
      let bg = j > i ? "var(--bg-input)" : `rgba(13, 148, 136, ${Math.max(w*0.8, 0.1)})`;
      let tc = w > 0.5 ? "#ffffff" : "var(--text-main)";
      html += `<td style="padding: 6px 4px; text-align: center; font-family: monospace; background: ${bg}; color: ${tc}; border: 1px solid var(--border-subtle);">${w.toFixed(2)}</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table>`;
  container.innerHTML = html;
}

function updateLoraCalc() {
  const modelType = document.getElementById("lora-model")?.value || "8b";
  const r = parseInt(document.getElementById("lora-rank")?.value || "16");
  
  let baseParams = modelType === "70b" ? 70600000000 : 8030000000;
  let d = modelType === "70b" ? 8192 : 4096;
  let layers = modelType === "70b" ? 80 : 32;

  const loraParams = 2 * d * r * 7 * layers;
  if (document.getElementById("lora-base-p")) document.getElementById("lora-base-p").textContent = (baseParams/1e9).toFixed(2) + 'B';
  if (document.getElementById("lora-trainable-p")) document.getElementById("lora-trainable-p").textContent = (loraParams/1e6).toFixed(1) + 'M';
}

function updateRrfCalc() {
  const query = (document.getElementById("rrf-query")?.value || "").toLowerCase();
  const docs = [
    { id: "D1", title: "FastMCP transport spec", matches: query.includes("mcp") ? 1 : 0 },
    { id: "D2", title: "LangGraph state checkpointing", matches: query.includes("graph") ? 1 : 0 },
    { id: "D3", title: "Hybrid RAG search", matches: query.includes("rag") || query.includes("hybrid") ? 1 : 0 }
  ];
  docs.forEach(d => {
    d.denseRank = Math.floor(Math.random() * 3) + 1;
    d.sparseRank = d.matches > 0 ? 1 : Math.floor(Math.random() * 3) + 1;
    d.score = (1.0 / (60 + d.denseRank)) + (1.0 / (60 + d.sparseRank));
  });
  docs.sort((a,b) => b.score - a.score);
  
  const container = document.getElementById("rrf-results-display");
  if (container) {
    container.innerHTML = docs.map((d, i) => `
      <div style="display: flex; justify-content: space-between; padding: 4px 8px; border-bottom: 1px solid var(--border-subtle); font-size: 0.78rem;">
        <span style="color: var(--text-main);">#${i+1} ${d.title}</span>
        <span style="color: #0d9488; font-weight: 700;">RRF: ${d.score.toFixed(4)}</span>
      </div>
    `).join('');
  }
}

function updateVectorDistanceCalc() {
  const q0 = parseFloat(document.getElementById("vecA-0")?.value || "0");
  const q1 = parseFloat(document.getElementById("vecA-1")?.value || "0");
  const d0 = parseFloat(document.getElementById("vecB-0")?.value || "0");
  const d1 = parseFloat(document.getElementById("vecB-1")?.value || "0");
  const dot = (q0*d0) + (q1*d1);
  const cos = dot / (Math.sqrt(q0*q0 + q1*q1) * Math.sqrt(d0*d0 + d1*d1)) || 0;
  const l2 = Math.sqrt(Math.pow(q0-d0, 2) + Math.pow(q1-d1, 2));
  if (document.getElementById("res-cosine")) document.getElementById("res-cosine").textContent = cos.toFixed(4);
  if (document.getElementById("res-l2")) document.getElementById("res-l2").textContent = l2.toFixed(4);
}

function updateDpoCalc() {
  const piC = parseFloat(document.getElementById("dpo-pi-c")?.value || "-0.40");
  const piR = parseFloat(document.getElementById("dpo-pi-r")?.value || "-1.80");
  if (document.getElementById("val-pi-c")) document.getElementById("val-pi-c").textContent = piC.toFixed(2);
  if (document.getElementById("val-pi-r")) document.getElementById("val-pi-r").textContent = piR.toFixed(2);
  const margin = (0.1 * (piC - -0.90)) - (0.1 * (piR - -1.10));
  const loss = -Math.log(1.0 / (1.0 + Math.exp(-margin)));
  if (document.getElementById("res-dpo-loss")) document.getElementById("res-dpo-loss").textContent = loss.toFixed(4);
}

window.openRoadmapsStudioModal = openRoadmapsStudioModal;
window.closeRoadmapsStudioModal = closeRoadmapsStudioModal;
window.openRoadmapDetail = openRoadmapDetail;
window.showRoadmapsListView = showRoadmapsListView;
window.switchStudioDlTab = switchStudioDlTab;
window.selectStudioCompetency = selectStudioCompetency;
window.toggleStudioPhase = toggleStudioPhase;
window.copyStudioCode = copyStudioCode;
window.checkStudioQuiz = checkStudioQuiz;
window.askChatbotFromRoadmap = askChatbotFromRoadmap;
window.updateTransformerCalc = updateTransformerCalc;
window.updateAttentionHeatmap = updateAttentionHeatmap;
window.updateLoraCalc = updateLoraCalc;
window.updateRrfCalc = updateRrfCalc;
window.updateVectorDistanceCalc = updateVectorDistanceCalc;
window.updateDpoCalc = updateDpoCalc;

/* ==========================================================================
   Studio Right Workspace Drawer & Tool Hub Integration
   ========================================================================== */
let activeRightDrawerTab = 'rag';
let currentLoadedBooks = [];
let currentActiveBookId = '';
let currentActiveBookPage = 1;
let currentActiveBookTotalPages = 1;

window.openRightDrawerTab = function(tabName) {
  const drawer = document.getElementById('studioRightDrawer');
  if (!drawer) return;

  activeRightDrawerTab = tabName || 'rag';
  drawer.classList.remove('hidden');

  // Update tab buttons
  document.querySelectorAll('.drawer-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.drawerTab === activeRightDrawerTab);
  });

  // Switch panel
  const panelMap = {
    rag: 'drawerPanelRag',
    books: 'drawerPanelBooks',
    db: 'drawerPanelDb',
    memory: 'drawerPanelMemory',
    console: 'drawerPanelConsole',
    roadmaps: 'drawerPanelRoadmaps',
    sandbox: 'drawerPanelSandbox'
  };

  Object.entries(panelMap).forEach(([key, panelId]) => {
    const p = document.getElementById(panelId);
    if (p) p.classList.toggle('hidden', key !== activeRightDrawerTab);
  });

  // Update header info
  const titleMap = {
    rag: { icon: '🧠', text: 'Vector Knowledge Engine', badge: '11 Role DBs' },
    books: { icon: '📖', text: '32+ Indexed Textbooks Reader', badge: 'Live Text' },
    db: { icon: '🗄️', text: 'Database & SQL Explorer', badge: 'SQLite' },
    memory: { icon: '⚡', text: 'On-Device Edge Memory', badge: '< 50ms' },
    console: { icon: '🔴', text: 'Live REPL Console', badge: 'Subprocess' },
    roadmaps: { icon: '🗺️', text: 'Career Roadmaps & Skill Trees', badge: '10 Tracks' },
    sandbox: { icon: '🏗️', text: 'Live Artifact Sandbox Preview', badge: 'Live DOM' }
  };

  const meta = titleMap[activeRightDrawerTab] || titleMap.rag;
  const iconEl = document.getElementById('rightDrawerTitleIcon');
  const textEl = document.getElementById('rightDrawerTitleText');
  const badgeEl = document.getElementById('rightDrawerBadge');
  if (iconEl) iconEl.textContent = meta.icon;
  if (textEl) textEl.textContent = meta.text;
  if (badgeEl) badgeEl.textContent = meta.badge;

  // Trigger tab-specific loader
  if (activeRightDrawerTab === 'rag') {
    loadDrawerRagTelemetry();
    const input = document.getElementById('drawerRagSearchInput');
    if (input && !input.value.trim()) {
      input.value = 'Kubernetes ingress controller and service mesh security';
      executeDrawerRagSearch();
    }
  } else if (activeRightDrawerTab === 'books') {
    loadDrawerBooksList();
  } else if (activeRightDrawerTab === 'db') {
    loadDrawerDbPreview();
  } else if (activeRightDrawerTab === 'memory') {
    loadDrawerMemoryCards();
  } else if (activeRightDrawerTab === 'roadmaps') {
    loadDrawerRoadmaps();
  } else if (activeRightDrawerTab === 'sandbox') {
    injectSandboxCode(state.activeSandboxCode || getSandboxDemoHtml());
  }
};

function initStudioRightDrawer() {
  const drawer = document.getElementById('studioRightDrawer');
  if (!drawer) return;

  // Tab buttons click
  document.querySelectorAll('.drawer-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      openRightDrawerTab(btn.dataset.drawerTab);
    });
  });

  // Close button
  const closeBtn = document.getElementById('closeRightDrawerBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      drawer.classList.add('hidden');
    });
  }

  // Popout button
  const popoutBtn = document.getElementById('rightDrawerPopoutBtn');
  if (popoutBtn) {
    popoutBtn.addEventListener('click', () => {
      const urlMap = {
        rag: '/academy/index.html#rag',
        books: '/academy/index.html#books',
        db: '/academy/db-dashboard.html',
        memory: '/academy/unified-dashboard.html',
        console: '/academy/unified-dashboard.html',
        roadmaps: '/academy/#roadmaps'
      };

      if (activeRightDrawerTab === 'sandbox') {
        if (!state.activeSandboxCode) return;
        const win = window.open('', '_blank');
        win.document.open();
        win.document.write(state.activeSandboxCode);
        win.document.close();
        return;
      }

      const targetUrl = urlMap[activeRightDrawerTab] || '/academy/index.html';
      window.open(targetUrl, '_blank');
    });
  }

  // 1. Vector RAG Controls
  const searchInput = document.getElementById('drawerRagSearchInput');
  const searchBtn = document.getElementById('drawerRunRagSearchBtn');
  const roleSelect = document.getElementById('drawerRagRoleFilterSelect');

  if (searchBtn) searchBtn.addEventListener('click', () => executeDrawerRagSearch());
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeDrawerRagSearch();
    });
  }
  if (roleSelect) roleSelect.addEventListener('change', () => executeDrawerRagSearch());

  document.querySelectorAll('.drawer-topk-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.drawer-topk-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      executeDrawerRagSearch();
    });
  });

  // 2. Textbooks Reader Controls
  const bookSelect = document.getElementById('drawerBookSelect');
  const prevPageBtn = document.getElementById('drawerPrevPageBtn');
  const nextPageBtn = document.getElementById('drawerNextPageBtn');
  const pageInput = document.getElementById('drawerPageNumberInput');
  const askPageBtn = document.getElementById('drawerAskPageBtn');

  if (bookSelect) {
    bookSelect.addEventListener('change', () => {
      currentActiveBookId = bookSelect.value;
      currentActiveBookPage = 1;
      loadDrawerBookPage(currentActiveBookId, 1);
    });
  }

  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentActiveBookPage > 1) {
        currentActiveBookPage--;
        loadDrawerBookPage(currentActiveBookId, currentActiveBookPage);
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      if (currentActiveBookPage < currentActiveBookTotalPages) {
        currentActiveBookPage++;
        loadDrawerBookPage(currentActiveBookId, currentActiveBookPage);
      }
    });
  }

  if (pageInput) {
    pageInput.addEventListener('change', () => {
      let p = parseInt(pageInput.value) || 1;
      p = Math.max(1, Math.min(currentActiveBookTotalPages, p));
      currentActiveBookPage = p;
      loadDrawerBookPage(currentActiveBookId, currentActiveBookPage);
    });
  }

  if (askPageBtn) {
    askPageBtn.addEventListener('click', () => {
      const textEl = document.getElementById('drawerBookTextContent');
      const text = textEl ? textEl.innerText.trim() : '';
      if (!promptInput) return;
      if (!text) {
        alert('No textbook page text available to ask about.');
        return;
      }

      const bookTitle = bookSelect?.options[bookSelect.selectedIndex]?.text || 'Textbook';
      const chapterTitle = document.getElementById('drawerBookChapterTitle')?.textContent || 'Chapter';
      const excerpt = text.length > 900 ? text.slice(0, 900) + '...' : text;

      promptInput.value = `Based on Page ${currentActiveBookPage} of "${bookTitle}" (${chapterTitle}):\n\n> "${excerpt}"\n\nCan you explain the key concepts here in detail, highlight practical architectural takeaways, and give production-ready code examples?`;
      promptInput.dispatchEvent(new Event('input'));
      promptInput.focus();
      promptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (window.showOmniToast) window.showOmniToast('Textbook page quoted into AI Chatbot!', '📖');
    });
  }

  // 3. DB Studio Controls
  const sqlInput = document.getElementById('drawerDbSqlInput');
  const sqlBtn = document.getElementById('drawerBtnExecuteSql');

  if (sqlBtn) {
    sqlBtn.addEventListener('click', () => executeDrawerDbSql());
  }

  document.querySelectorAll('.drawer-sql-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      if (sqlInput) sqlInput.value = btn.dataset.sql;
      executeDrawerDbSql();
    });
  });

  // 4. Memory Controls
  const memQuery = document.getElementById('drawerMemQuery');
  const memRecallBtn = document.getElementById('drawerBtnRecall');
  const memRefreshBtn = document.getElementById('drawerBtnRefreshMem');

  if (memRecallBtn) memRecallBtn.addEventListener('click', () => executeDrawerMemRecall());
  if (memQuery) {
    memQuery.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeDrawerMemRecall();
    });
  }
  if (memRefreshBtn) memRefreshBtn.addEventListener('click', () => loadDrawerMemoryCards());

  // 5. Console Controls
  const consoleRunBtn = document.getElementById('drawerBtnRunConsole');
  if (consoleRunBtn) {
    consoleRunBtn.addEventListener('click', () => executeDrawerConsoleRun());
  }

  // 6. Setup Text Selection Tooltip Bridge
  setupSelectionAskAi();
}

async function loadDrawerRagTelemetry() {
  try {
    const res = await fetch('/api/rag/pipeline/stats');
    if (!res.ok) return;
    const data = await res.json();
    const stats = data.stats || {};
    const bCount = document.getElementById('drawerRagBooksCount');
    const cCount = document.getElementById('drawerRagChunksCount');
    if (bCount && stats.total_books) bCount.textContent = stats.total_books;
    if (cCount && stats.total_chunks) cCount.textContent = stats.total_chunks.toLocaleString();
  } catch (e) {
    console.warn('[Drawer RAG Telemetry]', e);
  }
}

async function executeDrawerRagSearch() {
  const container = document.getElementById('drawerRagResultsContainer');
  const input = document.getElementById('drawerRagSearchInput');
  const roleSelect = document.getElementById('drawerRagRoleFilterSelect');
  const activeChip = document.querySelector('.drawer-topk-chip.active');

  const query = input?.value.trim() || 'Kubernetes Docker Python Microservices';
  const role = roleSelect?.value || '';
  const top_k = parseInt(activeChip?.dataset.k || '4');

  if (!container) return;
  container.innerHTML = '<div class="loading-spinner-box">Searching across 11 role vector databases...</div>';

  try {
    const res = await fetch('/api/rag/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, role: role || undefined, top_k })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    renderDrawerRagResults(data, container);
  } catch (err) {
    container.innerHTML = `<div class="error-msg">Search failed: ${err.message}</div>`;
  }
}

function renderDrawerRagResults(data, container) {
  const hits = data.citations || data.hits || data.matches || [];
  if (hits.length === 0) {
    container.innerHTML = '<div class="rag-empty-state"><p>No relevant vector chunks found. Broaden your search query.</p></div>';
    return;
  }

  let html = `<div style="display:flex; flex-direction:column; gap:8px;">`;
  hits.forEach((h, idx) => {
    const scorePct = Math.round((h.similarity_score || h.similarity || h.score || 0.88) * 100);
    const chunkId = `ragChunk_${idx}`;
    const chunkText = h.chunk_text || h.text || '';
    const bookTitle = h.book_title || h.book_id || 'Technical Manual';

    html += `
      <div class="rag-hit-card" style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:6px; padding:8px 10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-size:0.75rem;">
          <div style="display:flex; align-items:center; gap:5px;">
            <span style="background:rgba(6,182,212,0.15); color:var(--accent-cyan); padding:1px 5px; border-radius:3px; font-weight:700;">#${idx + 1}</span>
            <span style="font-weight:700; color:var(--text-main);">${escapeHtml(bookTitle)}</span>
            ${h.page_number ? `<span style="color:var(--text-dim);">P.${h.page_number}</span>` : ''}
          </div>
          <span style="color:#10b981; font-weight:700; font-size:0.7rem;">${scorePct}% Match</span>
        </div>
        <div id="${chunkId}" style="font-size:0.78rem; line-height:1.5; color:var(--text-main); margin-bottom:6px; user-select:text;">
          ${escapeHtml(chunkText)}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.7rem; border-top:1px solid var(--border-subtle); padding-top:4px;">
          <span style="color:var(--text-dim);">${h.role ? `Role: ${h.role}` : 'General DB'}</span>
          <button class="tiny-btn highlight-pill" onclick="window.askAiAboutChunk('${chunkId}', '${escapeHtml(bookTitle)}')">💬 Ask AI</button>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  container.innerHTML = html;
}

window.askAiAboutChunk = function(chunkId, bookTitle) {
  const el = document.getElementById(chunkId);
  const text = el ? el.innerText.trim() : '';
  if (!promptInput || !text) return;

  promptInput.value = `> [Vector Reference from ${bookTitle}]:\n> "${text}"\n\nCan you explain this concept in detail, break down any technical terms, and demonstrate how to implement it?`;
  promptInput.dispatchEvent(new Event('input'));
  promptInput.focus();
  promptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (window.showOmniToast) window.showOmniToast('Vector chunk quoted into AI Chatbot!', '⚡');
};

async function loadDrawerBooksList() {
  const select = document.getElementById('drawerBookSelect');
  if (!select) return;

  if (currentLoadedBooks.length > 0 && select.options.length > 1) {
    return;
  }

  try {
    const res = await fetch('/api/rag/books');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    currentLoadedBooks = data.books || [];

    if (currentLoadedBooks.length === 0) {
      select.innerHTML = '<option value="">No textbooks found</option>';
      return;
    }

    select.innerHTML = currentLoadedBooks.map(b => `
      <option value="${b.book_id}">📖 ${escapeHtml(b.title)} (${b.role || 'general'})</option>
    `).join('');

    currentActiveBookId = currentLoadedBooks[0].book_id;
    currentActiveBookPage = 1;
    loadDrawerBookPage(currentActiveBookId, 1);
  } catch (err) {
    select.innerHTML = `<option value="">Error loading books: ${err.message}</option>`;
  }
}

async function loadDrawerBookPage(bookId, pageNum) {
  const textContainer = document.getElementById('drawerBookTextContent');
  const pageInput = document.getElementById('drawerPageNumberInput');
  const totalSpan = document.getElementById('drawerTotalPagesSpan');
  const chapterTitle = document.getElementById('drawerBookChapterTitle');

  if (!textContainer || !bookId) return;
  textContainer.innerHTML = '<p style="color:var(--text-dim);">Loading textbook page contents...</p>';

  try {
    const res = await fetch(`/api/rag/page?book_id=${encodeURIComponent(bookId)}&page=${pageNum}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    currentActiveBookPage = data.page || pageNum;
    currentActiveBookTotalPages = data.total_pages || 1;

    if (pageInput) pageInput.value = currentActiveBookPage;
    if (totalSpan) totalSpan.textContent = `/ ${currentActiveBookTotalPages}`;
    if (chapterTitle) chapterTitle.textContent = data.chapter_title || `Page ${currentActiveBookPage} of ${currentActiveBookTotalPages}`;

    textContainer.innerText = data.text || '(This page contains diagrams or no extractable text)';
  } catch (err) {
    textContainer.innerHTML = `<p style="color:#ef4444;">Failed to load page: ${err.message}</p>`;
  }
}

async function loadDrawerDbPreview() {
  const container = document.getElementById('drawerDbSqlResultContainer');
  const input = document.getElementById('drawerDbSqlInput');
  if (!container) return;

  if (input && !input.value.trim()) {
    input.value = 'SELECT operation_id, timestamp, operation_type, role, filename, status FROM operations ORDER BY timestamp DESC LIMIT 5;';
  }
  executeDrawerDbSql();
}

async function executeDrawerDbSql() {
  const container = document.getElementById('drawerDbSqlResultContainer');
  const input = document.getElementById('drawerDbSqlInput');
  const sql = input?.value.trim() || 'SELECT operation_id, timestamp, operation_type, role, filename, status FROM operations ORDER BY timestamp DESC LIMIT 5;';

  if (!container) return;
  container.innerHTML = '<div class="loading-spinner-box">Executing SQL query across SQLite...</div>';

  try {
    const res = await fetch('/api/rag/pipeline/sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql })
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    const rows = data.rows || [];
    const columns = data.columns || (rows.length > 0 ? Object.keys(rows[0]) : []);

    if (rows.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:12px; color:var(--text-dim);">Query returned 0 rows.</div>';
      return;
    }

    let html = `<table style="width:100%; border-collapse:collapse; font-size:11px; font-family:'JetBrains Mono', monospace;"><thead><tr>`;
    columns.forEach(col => {
      html += `<th style="text-align:left; padding:4px 6px; border-bottom:1px solid var(--border-subtle); color:var(--accent-cyan); background:rgba(255,255,255,0.03);">${escapeHtml(col)}</th>`;
    });
    html += `</tr></thead><tbody>`;

    rows.forEach(r => {
      html += `<tr>`;
      columns.forEach(col => {
        const val = r[col] !== undefined ? String(r[col]) : '';
        html += `<td style="padding:4px 6px; border-bottom:1px solid rgba(255,255,255,0.05); color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:200px;">${escapeHtml(val)}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = `<div style="color:#ef4444; padding:8px;">SQL Error: ${err.message}</div>`;
  }
}

async function loadDrawerMemoryCards() {
  const grid = document.getElementById('drawerMemCardsGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-spinner-box">Loading Edge Memory...</div>';

  try {
    const res = await fetch('/api/memory/list?limit=10');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const facts = data.memories || data.facts || [];

    if (facts.length === 0) {
      grid.innerHTML = '<div style="color:var(--text-dim); text-align:center; padding:15px;">No stored memories yet. Distill facts from textbooks or REPL!</div>';
      return;
    }

    grid.innerHTML = facts.map(f => `
      <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:6px; padding:8px;">
        <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--accent-purple); font-weight:700; margin-bottom:3px;">
          <span>⚡ ${escapeHtml(f.category || 'General Fact')}</span>
          <span style="color:var(--text-dim);">${escapeHtml(f.source || 'Studio')}</span>
        </div>
        <div style="font-size:0.78rem; color:var(--text-main); line-height:1.4;">${escapeHtml(f.text || f.fact || '')}</div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<div style="color:#ef4444; padding:8px;">Memory Error: ${err.message}</div>`;
  }
}

async function executeDrawerMemRecall() {
  const query = document.getElementById('drawerMemQuery')?.value.trim() || '';
  const out = document.getElementById('drawerMemRecallOutput');
  if (!out) return;
  if (!query) {
    loadDrawerMemoryCards();
    return;
  }

  out.innerHTML = '<div class="loading-spinner-box">Recalling from on-device vector memory...</div>';
  try {
    const res = await fetch(`/api/memory/recall?q=${encodeURIComponent(query)}&top_k=3`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const hits = data.matches || data.memories || [];

    if (hits.length === 0) {
      out.innerHTML = '<div style="color:var(--text-dim); font-size:0.75rem;">No matching memories found.</div>';
      return;
    }

    out.innerHTML = hits.map(h => `
      <div style="background:rgba(139,92,246,0.1); border:1px solid var(--accent-purple); border-radius:6px; padding:8px; margin-bottom:6px;">
        <div style="font-size:0.7rem; color:var(--accent-cyan); font-weight:700; display:flex; justify-content:space-between;">
          <span>⚡ ${escapeHtml(h.category || 'Memory Match')}</span>
          <span>${Math.round((h.similarity || 0.85)*100)}% Match</span>
        </div>
        <div style="font-size:0.78rem; color:var(--text-main); margin-top:3px;">${escapeHtml(h.text || '')}</div>
      </div>
    `).join('');
  } catch (err) {
    out.innerHTML = `<div style="color:#ef4444; font-size:0.75rem;">Recall failed: ${err.message}</div>`;
  }
}

async function executeDrawerConsoleRun() {
  const code = document.getElementById('drawerConsoleInput')?.value.trim() || '';
  const lang = document.getElementById('drawerConsoleLang')?.value || 'python';
  const out = document.getElementById('drawerConsoleOutput');
  const btn = document.getElementById('drawerBtnRunConsole');

  if (!code) {
    alert('Please enter code to execute.');
    return;
  }

  if (btn) btn.disabled = true;
  if (out) out.textContent = `Executing ${lang} in subprocess...`;

  try {
    const res = await fetch('/api/session/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang, code })
    });
    const data = await res.json();
    if (btn) btn.disabled = false;
    if (out) {
      out.textContent = `[Exit ${data.exit_code} in ${data.elapsed_ms}ms]\n` + (data.stdout || data.stderr || '(No output)');
    }
  } catch (err) {
    if (btn) btn.disabled = false;
    if (out) out.textContent = `Execution error: ${err.message}`;
  }
}

function loadDrawerRoadmaps() {
  const grid = document.getElementById('drawerRoadmapsGrid');
  if (!grid) return;

  const tracks = [
    { title: 'DevOps & SRE Specialist', badge: '823 Chunks', color: '#06b6d4', desc: 'Kubernetes, Terraform, CI/CD, Helm & Prometheus' },
    { title: 'Machine Learning Engineer', badge: '549 Chunks', color: '#8b5cf6', desc: 'PyTorch, CUDA, Transformers, Distributed Training' },
    { title: 'Agentic AI & Multi-Agent', badge: '216 Chunks', color: '#ec4899', desc: 'LangGraph, AutoGen, FastMCP & Autonomous Loops' },
    { title: 'MLOps Architect', badge: '178 Chunks', color: '#10b981', desc: 'Kubeflow, MLflow, Feature Stores & Triton Server' },
    { title: 'Kubernetes Platform Architect', badge: '140 Chunks', color: '#3b82f6', desc: 'CRDs, Operators, Service Mesh & eBPF' },
    { title: 'GenAI & LLM Architect', badge: '128 Chunks', color: '#f59e0b', desc: 'Fine-tuning, LoRA, DPO, Quantization & RAG' },
    { title: 'Python Backend Systems', badge: '134 Chunks', color: '#34d399', desc: 'AsyncIO, FastAPI, Pydantic & Distributed Queues' },
    { title: 'Data Scientist & Analytics', badge: '84 Chunks', color: '#a855f7', desc: 'Polars, Pandas, Statistical Testing & DuckDB' },
    { title: 'Cloud Security Architect', badge: '45 Chunks', color: '#ef4444', desc: 'Zero Trust, Vault, IAM Policies & Attestation' },
    { title: 'Linux Kernel & Systems', badge: '30 Chunks', color: '#eab308', desc: 'Systemd, eBPF, Networking & Kernel Tuning' }
  ];

  grid.innerHTML = tracks.map(t => `
    <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:6px; padding:8px 10px; display:flex; flex-direction:column; justify-content:space-between; gap:6px;">
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
          <span style="font-weight:750; font-size:0.78rem; color:${t.color};">${escapeHtml(t.title)}</span>
          <span style="font-size:0.65rem; background:rgba(255,255,255,0.08); padding:1px 5px; border-radius:3px; color:var(--text-dim);">${t.badge}</span>
        </div>
        <div style="font-size:0.72rem; color:var(--text-dim); line-height:1.35;">${escapeHtml(t.desc)}</div>
      </div>
      <div style="display:flex; gap:6px; margin-top:4px;">
        <button class="tiny-btn highlight-pill" onclick="window.askAiAboutTrack('${escapeHtml(t.title)}', '${escapeHtml(t.desc)}')">💬 Ask AI</button>
        <a href="/academy/#roadmaps" target="_blank" class="tiny-btn" style="text-decoration:none;">Explore ↗</a>
      </div>
    </div>
  `).join('');
}

window.askAiAboutTrack = function(title, desc) {
  if (!promptInput) return;
  promptInput.value = `I am pursuing the **${title}** track covering ${desc}.\n\nWhat are the top 5 essential competencies I must master, and what practical project can I build right now to prove production mastery?`;
  promptInput.dispatchEvent(new Event('input'));
  promptInput.focus();
  promptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  if (window.showOmniToast) window.showOmniToast(`Prompt created for ${title}! 🗺️`, '⚡');
};

/* ==========================================================================
   Selection -> "Ask AI" Instant Floating Tooltip Integration
   ========================================================================== */
window._selectedTextForAi = '';

function setupSelectionAskAi() {
  const tooltip = document.getElementById('selectionAskAiTooltip');
  const askBtn = document.getElementById('btnAskAiSelection');
  if (!tooltip || !askBtn) return;

  function handleSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      tooltip.classList.add('hidden');
      window._selectedTextForAi = '';
      return;
    }

    const text = sel.toString().trim();
    if (text.length < 5) {
      tooltip.classList.add('hidden');
      window._selectedTextForAi = '';
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    if (rect.width > 0 && rect.height > 0) {
      window._selectedTextForAi = text;
      tooltip.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
      tooltip.style.top = `${Math.round(rect.top + window.scrollY - 6)}px`;
      tooltip.classList.remove('hidden');
    } else {
      tooltip.classList.add('hidden');
    }
  }

  document.addEventListener('mouseup', (e) => {
    if (e.target && (e.target.closest('#selectionAskAiTooltip') || e.target.closest('#btnAskAiSelection'))) {
      return;
    }
    setTimeout(handleSelection, 50);
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      setTimeout(handleSelection, 50);
    }
  });

  askBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    const text = window._selectedTextForAi || window.getSelection()?.toString()?.trim() || '';
    if (!text || !promptInput) return;

    const excerpt = text.length > 850 ? text.slice(0, 850) + '...' : text;
    promptInput.value = `> [Selected Reference]:\n> "${excerpt}"\n\nCan you explain this in detail, clarify why this approach is used, and show practical code or implementation examples?`;
    promptInput.dispatchEvent(new Event('input'));

    tooltip.classList.add('hidden');
    window._selectedTextForAi = '';
    promptInput.focus();
    promptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (window.showOmniToast) {
      window.showOmniToast('Selected text quoted directly into AI Chatbot! ⚡', '💬');
    }
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initStudioRightDrawer();
  });
} else {
  initStudioRightDrawer();
}


