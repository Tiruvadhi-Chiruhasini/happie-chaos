/**
 * HAPPIE-CHAOS: CORE NEURAL CONTROLLER
 * Handles: Multi-Profile logic, AI Orchestration, and UI State Management.
 */

import { GenAIEngine } from './src/genai_engine.js';
const engine = new GenAIEngine();

// Initialize memory
let chatThread = JSON.parse(localStorage.getItem('current_thread')) || [];

async function handleAnalyze() {
  const text = userInput.value.trim();
  const identity = JSON.parse(localStorage.getItem('happie_user'));

  // 1. Add current user message to thread
  chatThread.push({ role: 'user', content: text });

  // 2. Use engine.chat instead of engine.analyze
  // engine.chat takes the WHOLE chatThread array
  const response = await engine.chat(chatThread, identity);

  // 3. Add AI response to thread
  chatThread.push({ role: 'assistant', content: response.analysis });

  // 4. Save thread to keep it continuous
  localStorage.setItem('current_thread', JSON.stringify(chatThread));

  // 5. Render the whole conversation
  renderConversation(chatThread);
}

// --- DOM ELEMENTS ---
const analyzeBtn = document.getElementById('analyzeBtn');
const userInput = document.getElementById('userInput');
const outputArea = document.getElementById('outputArea');
const avatarHub = document.getElementById('avatarHub');
const moodTag = document.getElementById('moodTag');
const rewriteToggle = document.getElementById('rewriteToggle');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');

// --- 1. INITIALIZATION & SESSION BACKTRACKING ---
window.addEventListener('DOMContentLoaded', () => {
  // Render profiles across all pages (Lab, History, etc.)
  renderAvatarHub();

  // Check for "Continue Session" from History page
  const urlParams = new URLSearchParams(window.location.search);
  const chatId = urlParams.get('chatId');

  if (chatId && userInput) {
    resumeArchivedSession(chatId);
  }
});

/**
 * Resumes a previous session by pulling data from local storage
 * and populating the Lab interface.
 */
function resumeArchivedSession(id) {
  const history = JSON.parse(localStorage.getItem('happie_chaos_history')) || [];
  const chat = history.find(item => item.id.toString() === id.toString());

  if (chat) {
    userInput.value = chat.input;
    renderAIResult(chat.result);
    // Clear URL params to allow a fresh start on refresh
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// --- 2. MULTI-PROFILE HUB ---

/**
 * Renders the avatar list in the navigation bar.
 * Links each chat to the currently active profile.
 */
function renderAvatarHub() {
  if (!avatarHub) return;
  const profiles = JSON.parse(localStorage.getItem('happie_profiles')) || [];
  const activeId = localStorage.getItem('happie_active_profile_id');

  avatarHub.innerHTML = profiles.map(p => `
        <div class="nav-avatar ${p.id === activeId ? 'active-profile' : ''}" 
             onclick="switchActiveUser('${p.id}')" 
             title="${p.name} - ${p.title}">
             ${p.avatar || '🤖'}
        </div>
    `).join('') + `<a href="/nav/knowme/knowme.html" class="add-profile-nav" title="New Persona">+</a>`;
}

/**
 * Global switch for the active persona. 
 * Swaps context and reloads the current page view.
 */
window.switchActiveUser = (id) => {
  localStorage.setItem('happie_active_profile_id', id);

  // Sync the active profile object for the AI Engine
  const profiles = JSON.parse(localStorage.getItem('happie_profiles')) || [];
  const activeObj = profiles.find(p => p.id === id);
  localStorage.setItem('happie_user', JSON.stringify(activeObj));

  window.location.reload();
};

// --- 3. AI ANALYSIS WORKFLOW ---

analyzeBtn?.addEventListener('click', async () => {
  const code = userInput.value.trim();
  if (!code) return;

  // Toggle Loading State
  toggleLabLoading(true);

  // Get active context
  const userContext = JSON.parse(localStorage.getItem('happie_user')) || { name: "Explorer", level: "beginner" };

  const settings = {
    isRewrite: rewriteToggle?.checked || false,
    user: userContext,
    isChaos: document.getElementById('chaosToggle')?.checked || true
  };

  try {
    const result = await engine.analyze(code, settings);

    // Save to History (Filtered by Profile ID)
    persistChatToHistory(code, result);

    // Update UI
    renderAIResult(result);

    // Pitch-ready success effect
    if (window.confetti) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#06b6d4', '#f43f5e']
      });
    }
  } catch (err) {
    console.error("Neural Sync Error:", err);
  } finally {
    toggleLabLoading(false);
  }
});

function toggleLabLoading(isLoading) {
  analyzeBtn.disabled = isLoading;
  analyzeBtn.innerHTML = isLoading ? '<span class="spinner"></span> Analyzing...' : 'Analyze Logic';
  if (moodTag) {
    moodTag.classList.remove('hidden');
    moodTag.textContent = isLoading ? "Processing Neural Paths..." : moodTag.textContent;
  }
}

// --- 4. DATA PERSISTENCE ---

function persistChatToHistory(input, result) {
  let history = JSON.parse(localStorage.getItem('happie_chaos_history')) || [];
  const activeProfileId = localStorage.getItem('happie_active_profile_id');

  const chatLog = {
    id: Date.now(),
    profileId: activeProfileId, // Critical for horizontal history filtering
    timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    title: result.title,
    mood: result.moodTag,
    input: input,
    result: result
  };

  history.unshift(chatLog);
  // Keep a maximum of 30 sessions per browser
  if (history.length > 30) history.pop();
  localStorage.setItem('happie_chaos_history', JSON.stringify(history));
}

// --- 5. UI RENDERING & CLIPBOARD ---

function renderAIResult(data) {
  if (!outputArea) return;

  outputArea.innerHTML = `
        <div class="glass-panel output-card" style="animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                <h2 class="text-gradient" style="font-family:'Outfit'; font-size:1.8rem;">${data.title}</h2>
                <span class="mood-tag">${data.moodTag}</span>
            </div>
            
            <p style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 1.1rem;">${data.analysis}</p>
            
            <div class="code-container">
                <span style="font-size:0.7rem; color:var(--accent-secondary); font-weight:700; text-transform:uppercase;">Proposed Logic</span>
                <div class="code-block">
                    <button class="copy-btn" onclick="copySnippet(this)">Copy Snippet</button>
                    <pre><code>${data.suggestion}</code></pre>
                </div>
            </div>

            ${data.rewrittenCode ? `
                <div class="code-container" style="margin-top:2rem;">
                    <span style="font-size:0.7rem; color:var(--accent-tertiary); font-weight:700; text-transform:uppercase;">Chaos Refactor</span>
                    <div class="code-block" style="border-left-color: var(--accent-tertiary);">
                        <button class="copy-btn" onclick="copySnippet(this)">Copy Snippet</button>
                        <pre><code>${data.rewrittenCode}</code></pre>
                    </div>
                </div>
            ` : ''}
        </div>
    `;

  outputArea.classList.remove('hidden');
  outputArea.scrollIntoView({ behavior: 'smooth' });
}

// Global clipboard handler for the generated code
window.copySnippet = (btn) => {
  const code = btn.nextElementSibling.innerText;
  navigator.clipboard.writeText(code).then(() => {
    const originalText = btn.innerText;
    btn.innerText = "Copied! 🌌";
    btn.style.background = "var(--accent-primary)";
    setTimeout(() => {
      btn.innerText = originalText;
      btn.style.background = "rgba(255, 255, 255, 0.1)";
    }, 2000);
  });
};

// --- 6. SETTINGS PANEL INTERACTION ---
settingsBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsPanel?.classList.toggle('hidden-panel');
});

document.addEventListener('click', () => {
  settingsPanel?.classList.add('hidden-panel');
});

settingsPanel?.addEventListener('click', (e) => e.stopPropagation());