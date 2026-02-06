const avatarGrid = document.getElementById('avatarGrid');

// 1. Define Default Mood Identities
const defaultPersonas = [
    { id: 'happy', name: 'Happy', mood: 'Joyful', avatar: '😊', title: 'The Optimist', type: 'default' },
    { id: 'frustrated', name: 'Frustrated', mood: 'Aggressive', avatar: '😤', title: 'The Fixer', type: 'default' },
    { id: 'funny', name: 'Funny', mood: 'Sarcastic', avatar: '🤡', title: 'The Joker', type: 'default' },
    { id: 'excited', name: 'Excited', mood: 'High-Energy', avatar: '🤩', title: 'The Hype-Man', type: 'default' }
];

function renderAvatars() {
    // 2. Load Custom Personas from 'Know Me'
    const customPersonas = JSON.parse(localStorage.getItem('happie_profiles')) || [];
    const activeId = localStorage.getItem('happie_active_profile_id');

    // Combine both lists
    const allPersonas = [...defaultPersonas, ...customPersonas];

    avatarGrid.innerHTML = allPersonas.map(p => `
        <div class="persona-card glass-panel ${p.id === activeId ? 'active-persona' : ''}" 
             onclick="selectIdentity('${p.id}')">
            <div class="persona-icon">${p.avatar}</div>
            <h3>${p.name}</h3>
            <p class="persona-title">${p.title}</p>
            <span class="badge-sm">${p.type === 'default' ? 'Neural Mood' : 'Synced Bio'}</span>
        </div>
    `).join('') + `
        <div class="persona-card glass-panel add-card" onclick="window.location.href='../knowme/knowme.html'">
            <div class="persona-icon">+</div>
            <h3>Create New</h3>
            <p>Add to your Neural Library</p>
        </div>
    `;
}

window.selectIdentity = (id) => {
    // Save selection
    localStorage.setItem('happie_active_profile_id', id);

    // Find the full object and sync to 'happie_user' for the AI Engine
    const custom = JSON.parse(localStorage.getItem('happie_profiles')) || [];
    const all = [...defaultPersonas, ...custom];
    const selected = all.find(p => p.id === id);

    localStorage.setItem('happie_user', JSON.stringify(selected));

    // Visual feedback and redirect
    renderAvatars();
    setTimeout(() => window.location.href = '../../index.html', 500);
};

renderAvatars();