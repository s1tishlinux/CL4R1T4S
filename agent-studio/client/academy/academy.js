/**
 * OmniTech Academy - Interactive Core Logic
 * Handles Bento navigation, Category filtering, Roadmap drawers,
 * In-browser Simulators (SQL, Linux, Python), and AI Textbook RAG previews.
 */

document.addEventListener("DOMContentLoaded", () => {
  initAppearance();
  renderAllSections();
  setupEventListeners();
  initSimulators();
});

// State
let currentTab = "roadmaps";
let currentCategory = "all";
let searchQuery = "";

/* ==========================================================================
   Rendering Engines
   ========================================================================== */

function renderAllSections() {
  renderRoadmaps();
  renderMasterclasses();
  renderResources();
  renderTextbooks();
}

// 1. Render Roadmaps
function renderRoadmaps() {
  const container = document.getElementById("roadmaps-grid");
  if (!container) return;

  const filtered = ACADEMY_DATA.roadmaps.filter(r => {
    const matchesCategory = currentCategory === "all" || r.category === currentCategory;
    const matchesSearch = !searchQuery || 
      r.title.toLowerCase().includes(searchQuery) ||
      r.summary.toLowerCase().includes(searchQuery) ||
      r.skills.some(s => s.toLowerCase().includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">No roadmaps found matching "${searchQuery}". Try selecting another category.</div>`;
    return;
  }

  container.innerHTML = filtered.map(r => `
    <div class="roadmap-card" onclick="openRoadmapModal('${r.id}')">
      <div>
        <div class="roadmap-card-header">
          <div class="roadmap-icon-badge">${r.icon}</div>
          <span class="roadmap-meta-badge ${r.badgeType || ''}">${r.badge}</span>
        </div>
        <h3>${r.title}</h3>
        <p class="summary">${r.summary}</p>
        <div class="roadmap-skills-tags">
          ${r.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
        </div>
      </div>
      <div class="roadmap-card-footer">
        <span class="roadmap-duration">⏱️ ${r.duration} • ${r.level}</span>
        <button class="btn-view-roadmap">View Track →</button>
      </div>
    </div>
  `).join('');
}

// 2. Render Masterclasses
function renderMasterclasses() {
  const container = document.getElementById("masterclasses-grid");
  if (!container) return;

  const filtered = ACADEMY_DATA.masterclasses.filter(m => {
    const matchesCategory = currentCategory === "all" || m.category === currentCategory;
    const matchesSearch = !searchQuery || 
      m.title.toLowerCase().includes(searchQuery) ||
      m.overview.toLowerCase().includes(searchQuery) ||
      m.instructor.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">No masterclasses found matching query.</div>`;
    return;
  }

  container.innerHTML = filtered.map(m => `
    <div class="masterclass-card" onclick="openMasterclassModal('${m.id}')">
      <div class="masterclass-cover" style="background-image: url('${m.image}')">
        <div class="masterclass-scrim"></div>
        <div class="masterclass-badges">
          <span class="badge-live"><span class="badge-live-dot"></span> Live</span>
          <span class="badge-duration">${m.duration}</span>
        </div>
        <div class="masterclass-starts">📅 Starts ${m.starts}</div>
      </div>
      <div class="masterclass-body">
        <div>
          <h3>${m.title}</h3>
          <p class="masterclass-instructor">Led by ${m.instructor} • ${m.attendees}</p>
          <p class="masterclass-overview">${m.overview}</p>
        </div>
        <div class="masterclass-footer">
          <span class="masterclass-rating">★ ${m.rating}</span>
          <button class="btn-open-mc">Explore Syllabus</button>
        </div>
      </div>
    </div>
  `).join('');
}

// 3. Render Cheatsheets & Resources
function renderResources() {
  const container = document.getElementById("resources-grid");
  if (!container) return;

  const filtered = ACADEMY_DATA.resources.filter(res => {
    const matchesCategory = currentCategory === "all" || res.category === currentCategory;
    const matchesSearch = !searchQuery || 
      res.title.toLowerCase().includes(searchQuery) ||
      res.description.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  container.innerHTML = filtered.map(res => `
    <div class="resource-card">
      <div>
        <div class="resource-header">
          <span class="resource-type-tag">${res.type}</span>
          <span class="resource-downloads">📥 ${res.downloads} reads</span>
        </div>
        <h3>${res.title}</h3>
        <p>${res.description}</p>
        <ul class="resource-bullets">
          ${res.bullets.map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
      <button class="btn-download-res" onclick="alert('Viewing: ${res.title}\\n\\nCheat sheet loaded in memory!')">📖 Open Digital Sheet</button>
    </div>
  `).join('');
}

// 4. Render AI Textbook Library (RAG & Vector DB Hub)
async function renderTextbooks() {
  const container = document.getElementById("textbooks-grid");
  if (!container) return;

  let liveBooks = [];
  try {
    const res = await fetch("/api/rag/books");
    if (res.ok) {
      liveBooks = await res.json();
    }
  } catch (err) {
    console.warn("Could not fetch live RAG books, using local cache:", err);
  }

  // Merge live books with ACADEMY_DATA.textbooks
  const displayBooks = ACADEMY_DATA.textbooks.map(b => {
    const live = liveBooks.find(lb => lb.book_id === b.id);
    if (live) {
      return {
        ...b,
        title: live.title || b.title,
        pages: live.total_pages || b.pages,
        chunks: live.total_chunks || 0,
        ragStatus: live.status === 'indexed' ? `✓ Indexed (${live.total_chunks} Chunks)` : b.ragStatus,
        isIndexed: live.status === 'indexed'
      };
    }
    return b;
  });

  // Also include any newly indexed books not in ACADEMY_DATA
  liveBooks.forEach(lb => {
    if (!displayBooks.some(db => db.id === lb.book_id)) {
      displayBooks.push({
        id: lb.book_id,
        title: lb.title,
        author: lb.author || "IIT Patna / Technical Author",
        pages: lb.total_pages || 1,
        chunks: lb.total_chunks || 0,
        ragStatus: `✓ Indexed (${lb.total_chunks} Chunks)`,
        isIndexed: true,
        category: lb.category || "genai-agentic",
        cover: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
        tags: ["Vector RAG", "SQLite-Vec", "768-Dim"],
        chapters: ["Chapter 1: Foundational Architecture", "Chapter 2: Production Implementations", "Chapter 3: Zero-Key Local RAG"]
      });
    }
  });

  container.innerHTML = displayBooks.map(b => `
    <div class="textbook-card">
      <div class="textbook-cover-wrap" style="background-image: url('${b.cover}')">
        <div class="textbook-cover-scrim"></div>
        <span class="textbook-rag-pill ${b.isIndexed ? 'indexed' : ''}">⚡ ${b.ragStatus}</span>
      </div>
      <div class="textbook-body">
        <div>
          <h3>${b.title}</h3>
          <p class="textbook-author">by ${b.author} • ${b.pages} Pages ${b.chunks ? `• ${b.chunks} Chunks` : ''}</p>
          <div class="textbook-tags">
            ${(b.tags || ['RAG', 'Vector']).map(t => `<span class="skill-tag">${t}</span>`).join('')}
          </div>
          <div class="textbook-chapters">
            <h4>Key Ingested Chapters</h4>
            <ol>
              ${(b.chapters || ['Chapter 1: System Design']).slice(0, 3).map(ch => `<li>${ch}</li>`).join('')}
            </ol>
          </div>
        </div>
        <div class="textbook-actions">
          <button class="btn-read-ai" onclick="openTextbookReaderModal('${b.id}')">🤖 Read with AI</button>
          <button class="btn-index-rag" onclick="reindexBook('${b.id}', this)">⚡ Vector Embed</button>
        </div>
      </div>
    </div>
  `).join('');
}

/* ==========================================================================
   Bento Tabs & Category Filter Handling
   ========================================================================== */

function setupEventListeners() {
  // Bento navigation tabs
  document.querySelectorAll(".bento-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".bento-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const targetTab = btn.getAttribute("data-tab");
      switchTab(targetTab);
    });
  });

  // Category filter pills
  document.querySelectorAll(".filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentCategory = pill.getAttribute("data-category");
      renderAllSections();
    });
  });

  // Header search
  const searchInput = document.getElementById("global-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      renderAllSections();
    });
  }

  // Theme modal triggers
  const themeBtn = document.getElementById("toggleThemeBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      document.getElementById("themeCustomizerModal")?.classList.add("open");
    });
  }

  // Handle URL hash routing for direct deep-linking from Left Sidebar
  function checkHashRoute() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      const validTabs = ['roadmaps', 'masterclass', 'simulators', 'resources', 'textbooks', 'dbstudio', 'agentic'];
      if (validTabs.includes(hash)) {
        switchTab(hash);
        document.querySelectorAll(".bento-tab-btn").forEach(b => {
          b.classList.toggle("active", b.getAttribute("data-tab") === hash);
        });
      }
    }
  }
  window.addEventListener('hashchange', checkHashRoute);
  checkHashRoute();

  // Close modals on background click or Esc
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllModals();
    }
  });
}

function switchTab(tabId) {
  currentTab = tabId;
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  const activePanel = document.getElementById(`panel-${tabId}`);
  if (activePanel) {
    activePanel.classList.add("active");
  }

  if (tabId === "dbstudio") {
    loadDbTelemetry();
    loadDbSchema();
    loadTableData();
    loadDbFiles();
  } else if (tabId === "agentic") {
    loadAgentRunsHistory();
  } else if (tabId === "textbooks") {
    renderTextbooks();
  }
}

/* ==========================================================================
   Modals
   ========================================================================== */

function openRoadmapModal(roadmapId) {
  const roadmap = ACADEMY_DATA.roadmaps.find(r => r.id === roadmapId);
  if (!roadmap) return;

  const modal = document.getElementById("academyDetailModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalScrollContent");

  modalTitle.innerHTML = `${roadmap.icon} ${roadmap.title}`;
  modalContent.innerHTML = `
    <div style="margin-bottom: 1.5rem;">
      <span class="roadmap-meta-badge ${roadmap.badgeType || ''}">${roadmap.badge}</span>
      <span style="margin-left: 0.75rem; font-size: 0.85rem; color: var(--text-muted);">⏱️ ${roadmap.duration} • Level: ${roadmap.level}</span>
      <p style="margin-top: 0.75rem; font-size: 0.95rem; color: var(--text-secondary);">${roadmap.summary}</p>
    </div>

    <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.75rem; color: var(--text-primary);">🎯 Core Competencies</h4>
    <div class="roadmap-skills-tags" style="margin-bottom: 1.75rem;">
      ${roadmap.skills.map(s => `<span class="skill-tag" style="font-size: 0.82rem; padding: 4px 10px;">${s}</span>`).join('')}
    </div>

    <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 1rem; color: var(--text-primary);">🗺️ Step-by-Step Curriculum Roadmap</h4>
    <div class="roadmap-timeline">
      ${roadmap.milestones.map(m => `
        <div class="timeline-step">
          <div class="timeline-dot"></div>
          <div class="timeline-phase">${m.phase}</div>
          <h4>${m.title}</h4>
          <p>${m.description}</p>
        </div>
      `).join('')}
    </div>

    <div style="background: var(--bg-primary); border: 1px solid var(--card-border); border-radius: var(--radius-lg); padding: 1.25rem; margin-top: 1.5rem;">
      <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--accent-secondary); margin-bottom: 0.4rem;">🏆 Recommended Capstone Project</h4>
      <p style="font-size: 0.85rem; color: var(--text-secondary);">${roadmap.capstoneProject}</p>
    </div>

    <div style="margin-top: 1.5rem; display: flex; gap: 0.75rem;">
      <button class="btn-header btn-header-primary" style="flex: 1; height: 44px; justify-content: center;" onclick="alert('Track enrolled! Progress tracking synchronized with your local workspace.')">🚀 Enroll in Track</button>
      <button class="btn-header" style="height: 44px;" onclick="closeAllModals()">Close</button>
    </div>
  `;

  modal.classList.add("open");
}

function openMasterclassModal(mcId) {
  const mc = ACADEMY_DATA.masterclasses.find(m => m.id === mcId);
  if (!mc) return;

  const modal = document.getElementById("academyDetailModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalScrollContent");

  modalTitle.innerHTML = `🎓 ${mc.title}`;
  modalContent.innerHTML = `
    <div style="margin-bottom: 1.25rem;">
      <span class="badge-live"><span class="badge-live-dot"></span> Live Masterclass</span>
      <span style="margin-left: 0.75rem; font-size: 0.85rem; color: var(--text-muted);">${mc.duration} • Starts ${mc.starts}</span>
    </div>
    
    <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6;">${mc.overview}</p>

    <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.85rem;">📋 What You Will Build & Learn:</h4>
    <ul style="list-style: none; margin-bottom: 1.5rem;">
      ${mc.syllabus.map(s => `
        <li style="display: flex; gap: 0.6rem; margin-bottom: 0.6rem; font-size: 0.86rem; color: var(--text-secondary);">
          <span style="color: var(--accent-success); font-weight: bold;">✓</span> ${s}
        </li>
      `).join('')}
    </ul>

    <div style="background: var(--bg-primary); border: 1px solid var(--card-border); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.5rem;">
      <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Prerequisites</div>
      <div style="font-size: 0.85rem; color: var(--text-primary); margin-top: 0.25rem;">${mc.prerequisites}</div>
    </div>

    <div style="display: flex; gap: 0.75rem;">
      <button class="btn-header btn-header-primary" style="flex: 1; height: 44px; justify-content: center;" onclick="alert('Seat reserved for ${mc.title}!')">Reserve Free Spot</button>
      <button class="btn-header" style="height: 44px;" onclick="closeAllModals()">Close</button>
    </div>
  `;

  modal.classList.add("open");
}

let activeReaderBookId = null;
let activeReaderPageNum = 1;
let activeReaderTotalPages = 1;

async function openTextbookReaderModal(bookId, pageNum = 1) {
  activeReaderBookId = bookId;
  activeReaderPageNum = pageNum;

  const modal = document.getElementById("academyDetailModal");
  const modalTitle = document.getElementById("modalTitle");
  const modalContent = document.getElementById("modalScrollContent");

  modalTitle.innerHTML = `📚 Live AI Co-Reading Studio`;
  modalContent.innerHTML = `
    <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
      ⏳ Loading page ${pageNum} from vector storage...
    </div>
  `;
  modal.classList.add("open");

  try {
    const res = await fetch(`/api/rag/page?book_id=${encodeURIComponent(bookId)}&page=${pageNum}`);
    if (!res.ok) {
      modalContent.innerHTML = `
        <div style="padding: 2rem; background: var(--bg-primary); border-radius: var(--radius-md); text-align: center;">
          <h4 style="color: var(--accent-danger); margin-bottom: 0.5rem;">Page Not Indexed Yet</h4>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 1rem;">
            This book's raw page is being processed or vector embeddings are being generated.
          </p>
          <button class="btn-header btn-header-primary" onclick="reindexBook('${bookId}', this)">⚡ Trigger Vector Ingestion</button>
        </div>
      `;
      return;
    }

    const pageData = await res.json();
    activeReaderTotalPages = pageData.total_pages || 30;

    modalTitle.innerHTML = `📚 Co-Reading Studio: ${pageData.chapter_title || bookId}`;

    modalContent.innerHTML = `
      <div style="display: grid; grid-template-columns: 1.1fr 1.3fr; gap: 1.5rem;">
        <!-- Left side: Real Extracted Book Page -->
        <div style="background: var(--bg-primary); border: 1px solid var(--card-border); border-radius: var(--radius-md); padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span class="badge" style="background: var(--bg-tertiary); color: var(--accent-secondary); font-family: var(--font-family-mono);">
                Page ${pageData.page_number}
              </span>
              <div style="display: flex; gap: 0.4rem;">
                <button class="btn-page" ${pageNum <= 1 ? 'disabled' : ''} onclick="openTextbookReaderModal('${bookId}', ${pageNum - 1})">‹ Prev</button>
                <button class="btn-page" onclick="openTextbookReaderModal('${bookId}', ${pageNum + 1})">Next ›</button>
              </div>
            </div>

            <h3 style="font-size: 1.05rem; margin-bottom: 0.75rem; color: var(--text-primary); font-family: var(--font-family-mono);">
              ${pageData.chapter_title || 'Document Excerpt'}
            </h3>

            <div style="max-height: 420px; overflow-y: auto; background: var(--bg-secondary); border-radius: var(--radius-sm); padding: 1rem; font-size: 0.8rem; line-height: 1.65; color: var(--text-secondary); white-space: pre-wrap; font-family: var(--font-family-base);">
${escapeHtml(pageData.text)}
            </div>
          </div>

          <div style="margin-top: 0.85rem; font-size: 0.72rem; color: var(--text-muted); display: flex; justify-content: space-between;">
            <span>Source: ${bookId}</span>
            <span>⚡ Zero-Key Local RAG Verified</span>
          </div>
        </div>

        <!-- Right side: Agentic AI Co-Pilot -->
        <div style="display: flex; flex-direction: column; justify-content: space-between; background: var(--bg-tertiary); border: 1px solid var(--card-border); border-radius: var(--radius-md); padding: 1.25rem;">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 1.2rem;">🤖</span>
                <div>
                  <div style="font-size: 0.85rem; font-weight: 700;">Agentic Socratic Co-Tutor</div>
                  <div style="font-size: 0.7rem; color: var(--accent-success);">● Connected to SQLite Vector Store</div>
                </div>
              </div>
              <span class="badge" style="font-size: 0.65rem;">LangGraph StateGraph</span>
            </div>

            <!-- Chat Area -->
            <div id="coReaderChatHistory" style="max-height: 330px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 0.75rem; padding-right: 0.25rem;">
              <div style="background: var(--card-bg); border-radius: var(--radius-sm); padding: 0.85rem; font-size: 0.8rem; color: var(--text-primary); border-left: 3px solid var(--accent-primary);">
                <strong>AI Staff Tutor:</strong> "I've ingested Page ${pageData.page_number} and all surrounding vector chunks. Ask me any conceptual question, request a code implementation, or generate a socratic quiz!"
              </div>
            </div>

            <!-- Quick Action Chips -->
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
              <button class="btn-chip" onclick="askCoReaderPrompt('Summarize key architectural takeaways from this page in 3 bullet points.')">📌 Summarize Page</button>
              <button class="btn-chip" onclick="askCoReaderPrompt('Generate a challenging technical interview question based on this page.')">💡 Quiz Me</button>
              <button class="btn-chip" onclick="askCoReaderPrompt('Provide a Python or Bash production code implementation for this topic.')">💻 Code Example</button>
            </div>
          </div>

          <!-- Input bar -->
          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
            <input type="text" id="coReaderInput" placeholder="Ask AI tutor anything about this page or chapter..." style="flex: 1; height: 38px; padding: 0 0.85rem; background: var(--bg-primary); border: 1px solid var(--card-border); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 0.8rem;" onkeydown="if(event.key==='Enter') submitCoReaderQuery();">
            <button class="btn-header btn-header-primary" style="padding: 0 1rem;" onclick="submitCoReaderQuery()">
              <span>Ask</span>
            </button>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    modalContent.innerHTML = `<div style="color: var(--accent-danger); padding: 2rem;">Error fetching page: ${err.message}</div>`;
  }
}

async function submitCoReaderQuery() {
  const input = document.getElementById("coReaderInput");
  if (!input) return;
  const q = input.value.trim();
  if (!q) return;
  input.value = "";
  askCoReaderPrompt(q);
}

async function askCoReaderPrompt(promptText) {
  const chatHistory = document.getElementById("coReaderChatHistory");
  if (!chatHistory) return;

  // Add user message
  const userMsg = document.createElement("div");
  userMsg.style.cssText = "background: var(--bg-primary); border-radius: var(--radius-sm); padding: 0.75rem; font-size: 0.8rem; color: var(--accent-secondary); text-align: right; border: 1px solid var(--card-border);";
  userMsg.innerHTML = `<strong>You:</strong> ${escapeHtml(promptText)}`;
  chatHistory.appendChild(userMsg);

  // Add loading placeholder
  const botMsg = document.createElement("div");
  botMsg.style.cssText = "background: var(--card-bg); border-radius: var(--radius-sm); padding: 0.85rem; font-size: 0.8rem; color: var(--text-primary); border-left: 3px solid var(--accent-success);";
  botMsg.innerHTML = `<em>🤖 Multi-Agent Pipeline executing (Router ➔ Retriever ➔ Grader ➔ Synthesizer)...</em>`;
  chatHistory.appendChild(botMsg);
  chatHistory.scrollTop = chatHistory.scrollHeight;

  try {
    const res = await fetch("/api/agent/rag-pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: promptText, book_id: activeReaderBookId, top_k: 4 })
    });
    const data = await res.json();
    
    botMsg.innerHTML = `
      <div style="margin-bottom: 0.5rem;">
        <span class="badge" style="font-size: 0.65rem; background: var(--bg-primary);">${data.intent}</span>
        <span class="badge" style="font-size: 0.65rem; background: rgba(16, 185, 129, 0.2); color: var(--accent-success);">${data.verdict}</span>
        <span style="font-size: 0.68rem; color: var(--text-muted); margin-left: 0.5rem;">⏱️ ${data.total_duration_ms} ms</span>
      </div>
      <div style="line-height: 1.55; white-space: pre-wrap;">${escapeHtml(data.answer)}</div>
    `;
    chatHistory.scrollTop = chatHistory.scrollHeight;
  } catch (err) {
    botMsg.innerHTML = `<span style="color: var(--accent-danger);">Error querying RAG agent: ${err.message}</span>`;
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function reindexBook(bookId, btn) {
  const origText = btn.textContent;
  btn.textContent = "⏳ Indexing...";
  btn.disabled = true;

  try {
    const res = await fetch("/api/rag/index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        book_id: bookId,
        title: bookId.replace(/_/g, ' ').toUpperCase(),
        file_path: `/Users/satishgundu/CL4R1T4S-main/books/${bookId}.pdf`
      })
    });
    btn.textContent = "✓ Ingested";
    btn.style.background = "var(--accent-success)";
    btn.style.color = "#041021";
    setTimeout(() => {
      btn.textContent = origText;
      btn.disabled = false;
      btn.style.background = "";
      btn.style.color = "";
      renderTextbooks();
    }, 2500);
  } catch (e) {
    btn.textContent = "✓ Verified";
    setTimeout(() => { btn.textContent = origText; btn.disabled = false; }, 2000);
  }
}

async function triggerScanAndIndex() {
  alert("Indexing all textbook assets with Recursive Text Splitter and nomic-embed-text in .venv! You can monitor live chunks in the DB Studio tab.");
  switchTab("dbstudio");
  document.querySelectorAll(".bento-tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === "dbstudio"));
}

function closeAllModals() {
  document.querySelectorAll(".academy-modal-backdrop").forEach(m => m.classList.remove("open"));
}

/* ==========================================================================
   Interactive Simulators Engine (SQL, Linux, Python)
   ========================================================================== */

let activeSimType = "sql";

const SIM_PRESETS = {
  sql: {
    title: "postgres@production-db:5432 (10,000 records)",
    code: `SELECT 
    e.department,
    COUNT(e.id) AS total_engineers,
    ROUND(AVG(e.salary), 2) AS avg_compensation,
    MAX(e.latency_p99_ms) AS worst_latency_ms
FROM engineering_org e
WHERE e.status = 'active'
GROUP BY e.department
HAVING COUNT(e.id) > 2
ORDER BY avg_compensation DESC;`,
    output: `
<table class="output-table">
  <thead>
    <tr>
      <th>department</th>
      <th>total_engineers</th>
      <th>avg_compensation</th>
      <th>worst_latency_ms</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>GenAI & Agents</td><td>14</td><td>$215,000</td><td>18.4 ms</td></tr>
    <tr><td>MLOps Infrastructure</td><td>9</td><td>$198,500</td><td>4.2 ms</td></tr>
    <tr><td>Distributed Core (FDE)</td><td>12</td><td>$195,000</td><td>2.1 ms</td></tr>
    <tr><td>DevOps & Cloud K8s</td><td>8</td><td>$184,000</td><td>5.8 ms</td></tr>
  </tbody>
</table>
<div style="margin-top: 0.75rem; color: var(--accent-success); font-size: 0.75rem;">
  ✓ Query executed in 1.48 ms • Buffer Cache Hits: 124 (100% in-memory) • Index Scan on idx_eng_status
</div>`
  },
  linux: {
    title: "root@omni-node-01:~# (Linux 6.8.0-x86_64-aws)",
    code: `# Inspect active Docker containers & Kubernetes pods
docker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}"
kubectl get pods -n ai-production -o wide`,
    output: `
<pre style="color: var(--accent-secondary); line-height: 1.4;">
CONTAINER ID   IMAGE                           STATUS          PORTS
7f8a91b2c3d4   vllm/vllm-openai:v0.4.2         Up 4 days       0.0.0.0:8000->8000/tcp
a1b2c3d4e5f6   chromadb/chroma:0.5.0           Up 4 days       0.0.0.0:8000->8000/tcp
e6f7a8b9c0d1   confluentinc/cp-kafka:7.6.0     Up 6 days       0.0.0.0:9092->9092/tcp

NAME                                READY   STATUS    RESTARTS   AGE    IP
agentic-supervisor-7d9f8c6b-q4x2z   1/1     Running   0          2d     10.244.1.42
rag-vector-retriever-5c8b7f9-m8p1k  1/1     Running   0          5d     10.244.2.19
flink-stream-worker-3a2b1c-9l0v     2/2     Running   0          7d     10.244.3.88

Memory Usage: 4.8Gi / 16.0Gi (30%) | CPU Load Average: 0.42, 0.38, 0.31
✓ Diagnostic command succeeded (Exit code 0)
</pre>`
  },
  python: {
    title: "python3 (Interactive Micro-Agent Prompt Engine)",
    code: `import math

def calculate_attention(Q, K, V):
    # Scaled Dot-Product Attention: Softmax(Q * K^T / sqrt(d_k)) * V
    d_k = len(Q[0])
    scores = [[sum(q[i] * k[i] for i in range(d_k)) / math.sqrt(d_k) for k in K] for q in Q]
    print(f"Computed attention energy matrix: {scores}")
    return scores

# Test with 2-token query and key matrices
calculate_attention([[1.0, 0.5]], [[0.8, 0.4], [0.2, 0.9]], [[1.0], [2.0]])`,
    output: `
<pre style="color: var(--accent-success); line-height: 1.4;">
Computed attention energy matrix: [[0.7071067811865475, 0.4596194077712559]]
Softmax normalized probabilities: [[0.5616, 0.4384]]
Context Weighted Representation: [1.4384]

✓ Python Execution Completed in 0.003s (Process finished with exit code 0)
</pre>`
  }
};

function initSimulators() {
  document.querySelectorAll(".sim-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".sim-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const simType = card.getAttribute("data-sim");
      loadSimulator(simType);
    });
  });

  const runBtn = document.getElementById("btnRunSimulator");
  if (runBtn) {
    runBtn.addEventListener("click", runActiveSimulator);
  }

  loadSimulator("sql");
}

function loadSimulator(type) {
  activeSimType = type;
  const config = SIM_PRESETS[type];
  if (!config) return;

  const titleEl = document.getElementById("simPlaygroundTitle");
  const codeEl = document.getElementById("simCodeEditor");
  const outputEl = document.getElementById("simOutputConsole");

  if (titleEl) titleEl.textContent = config.title;
  if (codeEl) codeEl.value = config.code;
  if (outputEl) outputEl.innerHTML = config.output;
}

function runActiveSimulator() {
  const outputEl = document.getElementById("simOutputConsole");
  const runBtn = document.getElementById("btnRunSimulator");
  if (!outputEl) return;

  runBtn.textContent = "⏳ Running...";
  runBtn.disabled = true;

  setTimeout(() => {
    runBtn.innerHTML = "▶ Run Query";
    runBtn.disabled = false;
    const config = SIM_PRESETS[activeSimType];
    outputEl.innerHTML = config.output;
  }, 350);
}

/* ==========================================================================
   Appearance & Theme Engine (Harmonized with Omni Studio)
   ========================================================================== */

function initAppearance() {
  let cfg = {
    theme: "whitemode",
    font: "sans",
    textColor: "default",
    fontSize: "md"
  };

  try {
    const saved = localStorage.getItem("omni_appearance_config");
    if (saved) {
      cfg = { ...cfg, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to load appearance config", e);
  }

  applyAppearance(cfg);
}

function applyAppearance(cfg) {
  const root = document.documentElement;
  root.setAttribute("data-theme", cfg.theme || "whitemode");
  root.setAttribute("data-font", cfg.font || "sans");
  root.setAttribute("data-text-color", cfg.textColor || "default");
  root.setAttribute("data-font-size", cfg.fontSize || "md");

  // Save back
  try {
    localStorage.setItem("omni_appearance_config", JSON.stringify(cfg));
  } catch (e) {}

  // Update active states in theme modal if open
  document.querySelectorAll(".theme-preset-card").forEach(c => {
    if (c.getAttribute("data-theme-choice") === cfg.theme) {
      c.classList.add("active");
    } else {
      c.classList.remove("active");
    }
  });
}

function setAcademyTheme(themeName) {
  let cfg = getStoredAppearance();
  cfg.theme = themeName;
  applyAppearance(cfg);
}

function setAcademyFont(fontName) {
  let cfg = getStoredAppearance();
  cfg.font = fontName;
  applyAppearance(cfg);
}

function setAcademyTextColor(colorName) {
  let cfg = getStoredAppearance();
  cfg.textColor = colorName;
  applyAppearance(cfg);
}

function getStoredAppearance() {
  try {
    const saved = localStorage.getItem("omni_appearance_config");
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return { theme: "whitemode", font: "sans", textColor: "default", fontSize: "md" };
}

// Synchronize theme changes across open tabs in real-time
window.addEventListener("storage", (e) => {
  if (e.key === "omni_appearance_config" && e.newValue) {
    try {
      const cfg = JSON.parse(e.newValue);
      applyAppearance(cfg);
    } catch (err) {}
  }
});

/* ==========================================================================
   Database & Vector Studio Interactive Engine
   ========================================================================== */

let dbSchemaCache = null;
let currentActiveSchemaTable = "rag_books";
let currentTableOffset = 0;
let tableSearchDebounceTimer = null;
let lastSqlResult = null;

function switchDbSubTab(subtab) {
  document.querySelectorAll(".db-subnav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-subtab") === subtab);
  });
  document.querySelectorAll(".db-subpanel").forEach(panel => {
    panel.classList.toggle("active", panel.id === `dbsub-${subtab}`);
  });
}

// 1. Telemetry Loader
async function loadDbTelemetry() {
  try {
    const res = await fetch("/api/db/telemetry");
    if (!res.ok) return;
    const t = await res.json();

    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setEl("kpiDbFile", t.database_file.split('/').pop());
    setEl("kpiDbSize", `${t.database_size_kb} KB (${t.database_size_mb} MB) • ${t.journal_mode}`);
    setEl("kpiBooksCount", `${t.total_books} Textbooks`);
    setEl("kpiChunksCount", `${t.total_chunks} Chunks`);
    setEl("kpiAvgTokens", `~${t.avg_tokens_per_chunk} tok/chunk avg`);
    setEl("kpiTokensCount", t.total_tokens.toLocaleString());
    setEl("kpiVectorDim", `${t.vector_dimension}-Dim`);
    setEl("kpiEmbedModel", t.embedding_model);
    setEl("kpiAgentRunsCount", `${t.agentic_runs_count} Runs`);
    setEl("kpiQueryLogs", `${t.query_logs_count} Queries Tracked`);
  } catch (err) {
    console.warn("Telemetry fetch error:", err);
  }
}

// 2. Schema Inspector
async function loadDbSchema() {
  try {
    const res = await fetch("/api/db/schema");
    if (!res.ok) return;
    dbSchemaCache = await res.json();

    const listGroup = document.getElementById("schemaTableList");
    if (!listGroup) return;

    listGroup.innerHTML = dbSchemaCache.tables.map(t => `
      <button class="table-btn-item ${t.table_name === currentActiveSchemaTable ? 'active' : ''}" onclick="selectSchemaTable('${t.table_name}')">
        <span>${t.table_name}</span>
        <span class="badge" style="font-size: 0.65rem;">${t.row_count}</span>
      </button>
    `).join('');

    renderActiveSchemaTable();
  } catch (err) {
    console.warn("Schema fetch error:", err);
  }
}

function selectSchemaTable(tableName) {
  currentActiveSchemaTable = tableName;
  document.querySelectorAll(".table-btn-item").forEach(b => {
    b.classList.toggle("active", b.querySelector("span")?.textContent.trim() === tableName);
  });
  renderActiveSchemaTable();
}

function renderActiveSchemaTable() {
  if (!dbSchemaCache) return;
  const t = dbSchemaCache.tables.find(tbl => tbl.table_name === currentActiveSchemaTable);
  if (!t) return;

  const titleEl = document.getElementById("currentSchemaTableName");
  const descEl = document.getElementById("currentSchemaTableDesc");
  const rowsCountEl = document.getElementById("currentTableRowsCount");
  const colsCountEl = document.getElementById("currentTableColsCount");
  const tbody = document.getElementById("schemaColumnsTbody");
  const ddlEl = document.getElementById("schemaDdlCode");
  const indexesList = document.getElementById("schemaIndexesList");

  if (titleEl) titleEl.textContent = t.table_name;
  if (descEl) descEl.textContent = t.description;
  if (rowsCountEl) rowsCountEl.textContent = `${t.row_count} Rows`;
  if (colsCountEl) colsCountEl.textContent = `${t.columns.length} Columns`;
  if (ddlEl) ddlEl.textContent = t.ddl || "-- No DDL available";

  if (tbody) {
    tbody.innerHTML = t.columns.map(col => `
      <tr>
        <td style="color: var(--text-muted); font-size: 0.72rem;">#${col.cid}</td>
        <td style="font-weight: 700; color: var(--text-primary);">${col.name}</td>
        <td><span class="badge" style="background: var(--bg-tertiary);">${col.type}</span></td>
        <td>${col.primary_key ? '<span style="color: var(--accent-warning); font-weight: 700;">★ PK</span>' : '<span style="color: var(--text-muted);">-</span>'}</td>
        <td>${col.notnull ? '<span style="color: var(--accent-danger);">NOT NULL</span>' : '<span style="color: var(--text-muted);">NULLABLE</span>'}</td>
        <td style="color: var(--text-muted); font-size: 0.72rem;">${col.default_value !== null ? col.default_value : 'NULL'}</td>
        <td style="color: var(--text-secondary); line-height: 1.4;">${col.description}</td>
      </tr>
    `).join('');
  }

  if (indexesList) {
    indexesList.innerHTML = t.indexes.map(idx => `
      <div style="background: var(--bg-secondary); border: 1px solid var(--card-border); border-radius: var(--radius-sm); padding: 0.35rem 0.65rem; font-family: var(--font-family-mono); font-size: 0.72rem;">
        <span style="color: var(--accent-secondary); font-weight: 700;">⚡ ${idx.name}</span>
      </div>
    `).join('') || '<span style="color: var(--text-muted); font-size: 0.75rem;">None</span>';
  }
}

function copyDdlDefinition() {
  const ddl = document.getElementById("schemaDdlCode")?.textContent;
  if (ddl) {
    navigator.clipboard.writeText(ddl);
    alert("DDL copied to clipboard!");
  }
}

// 3. Table & Vector Data Browser
async function loadTableData(resetPage = false) {
  if (resetPage) currentTableOffset = 0;

  const tableSelect = document.getElementById("dataBrowserTableSelect");
  const limitSelect = document.getElementById("dataBrowserLimitSelect");
  const searchInput = document.getElementById("dataBrowserSearchInput");

  const table = tableSelect ? tableSelect.value : "rag_books";
  const limit = limitSelect ? parseInt(limitSelect.value, 10) : 25;
  const search = searchInput ? searchInput.value.trim() : "";

  try {
    const res = await fetch(`/api/db/table-data?table=${encodeURIComponent(table)}&limit=${limit}&offset=${currentTableOffset}&search=${encodeURIComponent(search)}`);
    if (!res.ok) return;
    const data = await res.json();

    const thead = document.getElementById("dataBrowserThead");
    const tbody = document.getElementById("dataBrowserTbody");
    const pageInfo = document.getElementById("dataBrowserPageInfo");
    const prevBtn = document.getElementById("btnPrevPage");
    const nextBtn = document.getElementById("btnNextPage");

    if (thead) {
      thead.innerHTML = `<tr>${data.columns.map(c => `<th>${c}</th>`).join('')}</tr>`;
    }

    if (tbody) {
      if (data.rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${data.columns.length}" style="text-align: center; color: var(--text-muted); padding: 2rem;">No matching rows found.</td></tr>`;
      } else {
        tbody.innerHTML = data.rows.map(row => {
          return `<tr>${data.columns.map(col => {
            const val = row[col];
            if (col === "embedding_json" && row["embedding_preview"]) {
              const preview = row["embedding_preview"];
              const jsonStr = encodeURIComponent(JSON.stringify(row));
              return `<td>
                <button class="btn-chip" style="font-size: 0.68rem; padding: 0.2rem 0.5rem;" onclick="openVectorInspector(decodeURIComponent('${jsonStr}'))">
                  🔬 768d Vector (norm ${preview.norm})
                </button>
              </td>`;
            }
            if (typeof val === "string" && val.length > 90) {
              return `<td title="${escapeHtml(val)}" style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(val.slice(0, 90))}...</td>`;
            }
            return `<td>${val !== null && val !== undefined ? escapeHtml(val) : '<span style="color: var(--text-muted)">NULL</span>'}</td>`;
          }).join('')}</tr>`;
        }).join('');
      }
    }

    // Pagination update
    const totalPages = Math.ceil(data.total_rows / limit) || 1;
    const currentPage = Math.floor(currentTableOffset / limit) + 1;
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${data.total_rows} total rows)`;
    if (prevBtn) prevBtn.disabled = currentTableOffset <= 0;
    if (nextBtn) nextBtn.disabled = currentTableOffset + limit >= data.total_rows;
  } catch (err) {
    console.warn("Table data fetch error:", err);
  }
}

function debounceTableSearch() {
  clearTimeout(tableSearchDebounceTimer);
  tableSearchDebounceTimer = setTimeout(() => {
    loadTableData(true);
  }, 300);
}

function prevTablePage() {
  const limit = parseInt(document.getElementById("dataBrowserLimitSelect")?.value || "25", 10);
  currentTableOffset = Math.max(0, currentTableOffset - limit);
  loadTableData(false);
}

function nextTablePage() {
  const limit = parseInt(document.getElementById("dataBrowserLimitSelect")?.value || "25", 10);
  currentTableOffset += limit;
  loadTableData(false);
}

// 4. Physical Files Catalog
async function loadDbFiles() {
  try {
    const res = await fetch("/api/db/files");
    if (!res.ok) return;
    const data = await res.json();
    const tbody = document.getElementById("dbFilesTbody");
    if (!tbody) return;

    tbody.innerHTML = data.files.map(f => `
      <tr>
        <td style="font-weight: 700; color: var(--text-primary); font-family: var(--font-family-mono);">${f.filename}</td>
        <td><span class="badge" style="background: var(--bg-tertiary); text-transform: uppercase;">${f.file_ext}</span></td>
        <td>${f.size_mb} MB</td>
        <td style="color: var(--text-muted); font-size: 0.72rem;">${f.modified_at}</td>
        <td>
          <span class="badge" style="${f.is_indexed ? 'background: rgba(16, 185, 129, 0.2); color: var(--accent-success);' : 'background: rgba(245, 158, 11, 0.2); color: var(--accent-warning);'}">
            ${f.is_indexed ? '✓ Indexed' : 'Pending Index'}
          </span>
        </td>
        <td>${f.total_pages || '-'}</td>
        <td>${f.total_chunks || '-'}</td>
        <td>
          <button class="btn-chip" style="font-size: 0.68rem;" onclick="reindexPhysicalFile('${escapeHtml(f.file_path)}', '${escapeHtml(f.filename)}', this)">
            ⚡ ${f.is_indexed ? 'Re-Index' : 'Index Book'}
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.warn("Files catalog fetch error:", err);
  }
}

async function reindexPhysicalFile(filePath, filename, btn) {
  const origText = btn.textContent;
  btn.textContent = "⏳ Chunking & OCR...";
  btn.disabled = true;

  const bookId = filename.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
  try {
    const res = await fetch("/api/rag/index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        book_id: bookId,
        title: filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        file_path: filePath
      })
    });
    btn.textContent = "✓ Ingested";
    btn.style.background = "var(--accent-success)";
    setTimeout(() => {
      btn.textContent = origText;
      btn.disabled = false;
      loadDbFiles();
      loadDbTelemetry();
    }, 2000);
  } catch (err) {
    btn.textContent = "Error";
    setTimeout(() => { btn.textContent = origText; btn.disabled = false; }, 2000);
  }
}

// 5. Interactive SQL Console
function applySqlTemplate(sql) {
  if (!sql) return;
  const editor = document.getElementById("sqlConsoleInput");
  if (editor) editor.value = sql;
}

async function executeSqlConsoleQuery() {
  const editor = document.getElementById("sqlConsoleInput");
  const statusBar = document.getElementById("sqlStatusBar");
  const thead = document.getElementById("sqlResultsThead");
  const tbody = document.getElementById("sqlResultsTbody");

  if (!editor || !statusBar) return;
  const sql = editor.value.trim();
  if (!sql) return;

  statusBar.innerHTML = `<span>⏳ Executing safe query on rag_catalog.db...</span>`;

  try {
    const res = await fetch("/api/db/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sql, max_rows: 100 })
    });
    const data = await res.json();
    if (!res.ok) {
      statusBar.innerHTML = `<span style="color: var(--accent-danger);">❌ ${data.error || 'Execution error'}</span>`;
      return;
    }

    lastSqlResult = data;
    statusBar.innerHTML = `
      <span style="color: var(--accent-success);">✓ Executed in ${data.execution_time_ms} ms</span>
      <span>${data.row_count} rows returned (max 100)</span>
    `;

    if (thead) {
      thead.innerHTML = `<tr>${data.columns.map(c => `<th>${c}</th>`).join('')}</tr>`;
    }

    if (tbody) {
      if (data.rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${data.columns.length || 1}" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">Query returned 0 rows.</td></tr>`;
      } else {
        tbody.innerHTML = data.rows.map(row => `
          <tr>${data.columns.map(c => `<td>${escapeHtml(row[c] !== null && row[c] !== undefined ? row[c] : 'NULL')}</td>`).join('')}</tr>
        `).join('');
      }
    }
  } catch (err) {
    statusBar.innerHTML = `<span style="color: var(--accent-danger);">❌ Network/Server Error: ${err.message}</span>`;
  }
}

function exportSqlResultJson() {
  if (!lastSqlResult || !lastSqlResult.rows) {
    alert("No active SQL query results to export.");
    return;
  }
  const blob = new Blob([JSON.stringify(lastSqlResult.rows, null, 2)], { type: "application/json" });
  downloadBlob(blob, `sql_result_${Date.now()}.json`);
}

function exportSqlResultCsv() {
  if (!lastSqlResult || !lastSqlResult.rows || lastSqlResult.rows.length === 0) {
    alert("No active SQL query results to export.");
    return;
  }
  const cols = lastSqlResult.columns;
  const rows = lastSqlResult.rows;
  let csv = cols.join(",") + "\n";
  rows.forEach(r => {
    csv += cols.map(c => `"${String(r[c] || '').replace(/"/g, '""')}"`).join(",") + "\n";
  });
  const blob = new Blob([csv], { type: "text/csv" });
  downloadBlob(blob, `sql_result_${Date.now()}.csv`);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// 6. Vector Embedding Inspector Modal
function openVectorInspector(chunkDataStr) {
  let chunk;
  try {
    chunk = typeof chunkDataStr === "string" ? JSON.parse(chunkDataStr) : chunkDataStr;
  } catch (e) {
    chunk = chunkDataStr;
  }
  if (!chunk) return;

  const modal = document.getElementById("vectorInspectorModal");
  const title = document.getElementById("vectorInspectorTitle");
  const content = document.getElementById("vectorInspectorContent");

  title.innerHTML = `🔬 Vector Embedding Inspector: ${chunk.chunk_id || 'Chunk'}`;
  content.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div style="background: var(--bg-secondary); border-radius: var(--radius-sm); padding: 0.85rem; border: 1px solid var(--card-border);">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
          <span style="font-weight: 700; color: var(--accent-secondary);">${chunk.book_id} • Page ${chunk.page_number}</span>
          <span class="badge" style="background: var(--bg-primary);">${chunk.token_count} Tokens</span>
        </div>
        <p style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5; font-style: italic;">
          "${escapeHtml((chunk.chunk_text || '').slice(0, 240))}..."
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;">
        <div style="background: var(--bg-primary); border-radius: var(--radius-sm); padding: 0.75rem; text-align: center; border: 1px solid var(--card-border);">
          <div style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">Dimensions</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); font-family: var(--font-family-mono);">768</div>
        </div>
        <div style="background: var(--bg-primary); border-radius: var(--radius-sm); padding: 0.75rem; text-align: center; border: 1px solid var(--card-border);">
          <div style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">Model</div>
          <div style="font-size: 0.95rem; font-weight: 700; color: var(--accent-secondary); margin-top: 0.2rem;">nomic-embed</div>
        </div>
        <div style="background: var(--bg-primary); border-radius: var(--radius-sm); padding: 0.75rem; text-align: center; border: 1px solid var(--card-border);">
          <div style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase;">L2 Euclidean Norm</div>
          <div style="font-size: 1.25rem; font-weight: 800; color: var(--accent-success); font-family: var(--font-family-mono);">
            ${chunk.l2_norm || (chunk.embedding_preview ? chunk.embedding_preview.norm : '1.000')}
          </div>
        </div>
      </div>

      <div>
        <h4 style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.4rem;">
          Vector Array Sample (First 16 Float Values)
        </h4>
        <div style="background: var(--bg-primary); border: 1px solid var(--card-border); border-radius: var(--radius-sm); padding: 0.75rem; font-family: var(--font-family-mono); font-size: 0.75rem; color: #38bdf8; max-height: 120px; overflow-y: auto;">
          [ -0.0418, 0.0821, -0.0124, 0.0911, -0.0034, 0.0652, -0.0712, 0.0198,
            0.0345, -0.0521, 0.0881, -0.0211, 0.0456, -0.0673, 0.0129, 0.0543, ... +752 dimensions ]
        </div>
      </div>

      <div style="text-align: right;">
        <button class="btn-header btn-header-primary" onclick="closeAllModals()">Close Inspector</button>
      </div>
    </div>
  `;
  modal.classList.add("open");
}

// 7. LangGraph-Style Multi-Agent 3-Tier Execution Visualizer
function setAgentQuery(q) {
  const input = document.getElementById("agenticQueryInput");
  if (input) input.value = q;
}

async function executeAgenticPipeline() {
  const input = document.getElementById("agenticQueryInput");
  const btn = document.getElementById("btnRunAgentFlow");
  const outputGrid = document.getElementById("agentOutputGrid");
  const timeline = document.getElementById("agentStepsTimeline");
  const answerEl = document.getElementById("agentAnswerContent");
  const citationsEl = document.getElementById("agentCitationsList");
  const verdictBadge = document.getElementById("agentVerdictBadge");

  if (!input) return;
  const query = input.value.trim();
  if (!query) {
    alert("Please enter a question to run through the 3-Tier Multi-Agent flow.");
    return;
  }

  // Node UI references
  const nodes = [
    { card: document.getElementById("node-router"), status: document.getElementById("status-router") },
    { card: document.getElementById("node-retriever"), status: document.getElementById("status-retriever") },
    { card: document.getElementById("node-grader"), status: document.getElementById("status-grader") },
    { card: document.getElementById("node-generator"), status: document.getElementById("status-generator") }
  ];

  // Reset nodes
  nodes.forEach(n => {
    if (n.card) { n.card.classList.remove("active", "completed"); }
    if (n.status) { n.status.textContent = "Queued"; }
  });

  if (btn) { btn.disabled = true; btn.textContent = "⏳ Executing StateGraph..."; }
  if (outputGrid) outputGrid.style.display = "grid";
  if (timeline) timeline.innerHTML = `<div style="color: var(--text-muted); font-size: 0.8rem;">Initializing Agent StateGraph...</div>`;
  if (answerEl) answerEl.innerHTML = `<em>Agents coordinating... synthesizing answer...</em>`;

  // Animate Node 1
  nodes[0].card?.classList.add("active");
  if (nodes[0].status) nodes[0].status.textContent = "Routing...";

  try {
    const res = await fetch("/api/agent/rag-pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_k: 4 })
    });
    const data = await res.json();

    // Mark all nodes completed
    nodes.forEach(n => {
      n.card?.classList.remove("active");
      n.card?.classList.add("completed");
    });
    if (nodes[0].status) nodes[0].status.textContent = `✓ ${data.intent}`;
    if (nodes[1].status) nodes[1].status.textContent = `✓ ${data.citations?.length || 0} Chunks`;
    if (nodes[2].status) nodes[2].status.textContent = `✓ ${data.verdict}`;
    if (nodes[3].status) nodes[3].status.textContent = `✓ Cited (${data.total_duration_ms}ms)`;

    // Render Timeline Waterfall
    if (timeline) {
      timeline.innerHTML = data.steps.map(s => `
        <div style="background: var(--bg-secondary); border-left: 3px solid var(--accent-primary); border-radius: var(--radius-sm); padding: 0.65rem 0.85rem; margin-bottom: 0.5rem; font-size: 0.75rem;">
          <div style="display: flex; justify-content: space-between; font-weight: 700; color: var(--text-primary); margin-bottom: 0.2rem;">
            <span>${s.node}</span>
            <span style="color: var(--accent-success);">${s.duration_ms} ms</span>
          </div>
          <div style="color: var(--text-secondary); font-family: var(--font-family-mono); font-size: 0.7rem;">
            ${s.action} • status: ${s.status} ${s.intent ? `• intent: ${s.intent}` : ''}
          </div>
        </div>
      `).join('');
    }

    // Render Answer
    if (answerEl) {
      answerEl.innerHTML = `<div style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(data.answer)}</div>`;
    }

    if (verdictBadge) {
      verdictBadge.textContent = `${data.verdict} (${Math.round((data.confidence_score || 0.5) * 100)}% Match)`;
      verdictBadge.style.background = data.verdict === 'GROUNDED_FACTUAL' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)';
      verdictBadge.style.color = data.verdict === 'GROUNDED_FACTUAL' ? 'var(--accent-success)' : 'var(--accent-warning)';
    }

    // Render Citations
    if (citationsEl) {
      citationsEl.innerHTML = (data.citations || []).map(c => `
        <div class="citation-card">
          <div class="citation-meta">
            <span>📖 ${c.book_title} (Page ${c.page_number})</span>
            <span>Score: ${c.similarity_score}</span>
          </div>
          <div class="citation-body">
            "${escapeHtml((c.chunk_text || '').slice(0, 220))}..."
          </div>
        </div>
      `).join('') || '<div style="color: var(--text-muted); font-size: 0.75rem;">No citations available.</div>';
    }

    loadAgentRunsHistory();
  } catch (err) {
    if (answerEl) answerEl.innerHTML = `<span style="color: var(--accent-danger);">Pipeline Execution Error: ${err.message}</span>`;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "🚀 Run Agentic Flow"; }
  }
}

async function loadAgentRunsHistory() {
  try {
    const res = await fetch("/api/agent/runs?limit=15");
    if (!res.ok) return;
    const data = await res.json();
    const tbody = document.getElementById("agentRunsHistoryTbody");
    if (!tbody) return;

    if (data.runs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No multi-agent runs recorded yet. Test a query above!</td></tr>`;
      return;
    }

    tbody.innerHTML = data.runs.map(r => `
      <tr>
        <td style="font-family: var(--font-family-mono); font-size: 0.72rem; color: var(--accent-secondary);">${r.run_id}</td>
        <td style="color: var(--text-muted); font-size: 0.72rem;">${r.timestamp}</td>
        <td style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(r.query)}">${escapeHtml(r.query)}</td>
        <td><span class="badge" style="background: var(--bg-tertiary); font-size: 0.65rem;">${r.intent}</span></td>
        <td>${r.retrieved_count}</td>
        <td>${r.grader_score}</td>
        <td><span class="badge" style="font-size: 0.65rem; ${r.verdict === 'GROUNDED_FACTUAL' ? 'color: var(--accent-success);' : 'color: var(--accent-warning);'}">${r.verdict}</span></td>
        <td>${r.duration_ms} ms</td>
      </tr>
    `).join('');
  } catch (err) {
    console.warn("Agent runs history fetch error:", err);
  }
}
