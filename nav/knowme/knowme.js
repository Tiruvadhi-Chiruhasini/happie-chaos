import { GenAIEngine } from '../../src/genai_engine.js';
const engine = new GenAIEngine();

// --- DOM ELEMENTS ---
const syncBtn = document.getElementById('syncBtn');
const personaContent = document.getElementById('personaContent');
const personaPlaceholder = document.getElementById('personaPlaceholder');
const profileBox = document.querySelector('.profile-box');

// --- CORE SYNC LOGIC ---
syncBtn.addEventListener('click', async () => {
    const name = document.getElementById('userName').value.trim();
    const level = document.getElementById('userLevel').value;
    const interest = document.getElementById('userInterest').value.trim();

    if (!name || !interest) {
        alert("Neural link failed: Identity and Obsession fields are mandatory.");
        return;
    }

    // 1. Loading State
    syncBtn.disabled = true;
    syncBtn.innerHTML = `<span class="spinner"></span> Calibrating...`;
    profileBox.classList.add('syncing');

    // 2. Prepare Data for AI Analysis
    // We send a custom settings object to get a persona-focused response
    const tempSettings = {
        user: { name, level, interest },
        isChaos: true, // Chaos mode makes for more creative titles
        isPro: level === 'pro'
    };

    const calibrationPrompt = `
        Analyze this developer profile: Name: ${name}, Level: ${level}, Interests: ${interest}.
        Generate a unique 2-word "Cyber-Title" (e.g., 'Logic Alchemist') and a 1-sentence vibe analysis.
        Provide a relevant tech-themed emoji for an avatar.
        RETURN ONLY JSON: {"title": "...", "vibe": "...", "emoji": "..."}
    `;

    try {
        // 3. Call Groq via our Engine
        const response = await engine.analyze(calibrationPrompt, tempSettings);

        // 4. Create the Profile Object
        const profileId = Date.now().toString(); // Unique ID for this persona
        const newProfile = {
            id: profileId,
            name: name,
            level: level,
            interest: interest,
            title: response.title,
            vibe: response.vibe,
            avatar: response.emoji || "🤖",
            created: new Date().toISOString()
        };

        // 5. Save to LocalStorage
        saveProfile(newProfile);

        // 6. Update UI with AI results
        updatePersonaUI(newProfile);

        // Success Flare
        if (window.confetti) {
            window.confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

    } catch (error) {
        console.error("Calibration Error:", error);
        alert("The Neural Link was interrupted. Check your API key.");
    } finally {
        syncBtn.disabled = false;
        syncBtn.innerText = "Synchronize Persona";
        profileBox.classList.remove('syncing');
    }
});

// --- STORAGE HELPERS ---

function saveProfile(profile) {
    // Get existing list or start new
    let profiles = JSON.parse(localStorage.getItem('happie_profiles')) || [];

    // Check if a profile with this name already exists (optional: update instead of add)
    const existingIndex = profiles.findIndex(p => p.name.toLowerCase() === profile.name.toLowerCase());

    if (existingIndex !== -1) {
        profiles[existingIndex] = profile;
    } else {
        profiles.push(profile);
    }

    localStorage.setItem('happie_profiles', JSON.stringify(profiles));

    // Set this as the ACTIVE profile for the Lab and History pages
    localStorage.setItem('happie_active_profile_id', profile.id);

    // Also update the legacy 'happie_user' key for backward compatibility with your existing Lab code
    localStorage.setItem('happie_user', JSON.stringify(profile));
}

// --- UI UPDATER ---

function updatePersonaUI(profile) {
    document.getElementById('displayTitle').innerText = profile.title;
    document.getElementById('displayRank').innerText = `${profile.level.toUpperCase()} ARCHITECT`;
    document.getElementById('vibeAnalysis').innerText = profile.vibe;
    document.getElementById('avatarEmoji').innerText = profile.avatar;
    document.getElementById('focusBar').style.width = "100%";

    personaPlaceholder.classList.add('hidden');
    personaContent.classList.remove('hidden');
    profileBox.classList.remove('empty');

    // Add a "Go to Lab" button dynamically
    if (!document.getElementById('jumpToLab')) {
        const labBtn = document.createElement('button');
        labBtn.id = 'jumpToLab';
        labBtn.className = 'btn-primary';
        labBtn.style.marginTop = '1.5rem';
        labBtn.style.width = '100%';
        labBtn.innerText = "Enter the Lab →";
        labBtn.onclick = () => window.location.href = "../../index.html";
        personaContent.appendChild(labBtn);
    }
}

// Check if a profile is already active on load to show current status
window.addEventListener('DOMContentLoaded', () => {
    const activeProfile = JSON.parse(localStorage.getItem('happie_user'));
    if (activeProfile && activeProfile.title) {
        updatePersonaUI(activeProfile);
    }
});