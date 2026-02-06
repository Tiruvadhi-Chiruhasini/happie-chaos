window.addEventListener('DOMContentLoaded', () => {
    const historyList = document.getElementById('fullHistoryList');
    const clearBtn = document.getElementById('clearHistory');

    /**
     * Renders the history from localStorage
     */
    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('happie_chaos_history')) || [];

        if (history.length === 0) {
            historyList.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding: 5rem; opacity: 0.5;">
                    <p style="font-size: 1.2rem;">Your neural archive is empty.</p>
                    <p style="font-size: 0.9rem;">Go to the Lab to start your journey.</p>
                    <a href="../../index.html" style="color:var(--accent-primary); text-decoration:none; margin-top:1rem; display:inline-block;">Back to Lab →</a>
                </div>`;
            return;
        }

        historyList.innerHTML = history.map(item => `
            <div class="history-card glass-panel" id="item-${item.id}">
                <div class="card-clickable-area" onclick="viewChat('${item.id}')">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                        <small style="color:var(--accent-secondary); font-weight:600;">${item.timestamp}</small>
                        <span class="mood-tag" style="font-size:0.6rem;">${item.mood}</span>
                    </div>
                    <h3 style="font-size:1.1rem; margin-bottom:0.8rem; font-family:'Outfit'; color: #fff;">
                        ${item.title} 
                    </h3>
                    <p style="font-size:0.85rem; color:var(--text-secondary); font-family:'Fira Code'; background:rgba(0,0,0,0.2); padding:10px; border-radius:8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${item.snippet}
                    </p>
                </div>
                <div class="card-actions" style="margin-top: 1rem; text-align: right;">
                    <button class="delete-btn" onclick="deleteChat('${item.id}')" title="Delete Log">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Global function to backtrack to index.html with specific chat ID
     */
    window.viewChat = (id) => {
        // Redirecting back to main Lab with the ID in the URL
        window.location.href = `../../index.html?chatId=${id}`;
    };

    /**
     * Global function to delete a specific chat entry
     */
    window.deleteChat = (id) => {
        // Find the element for an immediate fade-out effect
        const el = document.getElementById(`item-${id}`);

        if (confirm("Erase this log from memory?")) {
            el.style.opacity = '0';
            el.style.transform = 'scale(0.9)';

            setTimeout(() => {
                let history = JSON.parse(localStorage.getItem('happie_chaos_history')) || [];
                // id is usually a number from Date.now(), convert to string to be safe
                history = history.filter(item => item.id.toString() !== id.toString());
                localStorage.setItem('happie_chaos_history', JSON.stringify(history));
                renderHistory(); // Re-render the list
            }, 300);
        }
    };

    /**
     * Clear all history button logic
     */
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm("Permanently delete your entire learning journey? This cannot be undone.")) {
                localStorage.removeItem('happie_chaos_history');
                renderHistory();
            }
        });
    }

    // Initial render call
    renderHistory();
});

function renderHistory() {
    const allHistory = JSON.parse(localStorage.getItem('happie_chaos_history')) || [];
    const activeId = localStorage.getItem('happie_active_profile_id');

    // Filter history for the active user
    const sessionHistory = allHistory.filter(item => item.profileId === activeId);

    if (sessionHistory.length === 0) {
        historyList.innerHTML = `<div class="empty-state">No neural logs found for this persona.</div>`;
        return;
    }

    // Map to a horizontal layout
    historyList.innerHTML = sessionHistory.map(item => `
        <div class="history-card-horizontal glass-panel" id="item-${item.id}">
            <div class="card-header">
                <span class="mood-tag-sm">${item.mood}</span>
                <button class="mini-delete" onclick="deleteChat('${item.id}')">×</button>
            </div>
            
            <div class="card-body" onclick="viewChat('${item.id}')">
                <h3>${item.title}</h3>
                <p class="code-preview">${item.input.substring(0, 100)}...</p>
            </div>

            <div class="card-footer">
                <small>${item.timestamp}</small>
                <button class="continue-link" onclick="viewChat('${item.id}')">Continue →</button>
            </div>
        </div>
    `).join('');
}

const scrollContainer = document.getElementById('fullHistoryList');

scrollContainer.addEventListener('wheel', (evt) => {
    evt.preventDefault();
    scrollContainer.scrollLeft += evt.deltaY;
});