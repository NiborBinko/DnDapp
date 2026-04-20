/**
 * Debug dropdown - shows current user selections
 * Always rebuilds content with current state when toggled or refreshed
 */
function renderDebugDropdown() {
    const container = document.getElementById('debug-container');
    if (!container) return;
    
    // If dropdown is closed, don't show
    if (!container.classList.contains('open')) return;
    
    // Always rebuild content with current state
    const state = {
        race: userSelection.race || 'none',
        subrace: userSelection.subrace || 'none',
        class: userSelection.class || 'none',
        subclass: userSelection.subclass || 'none',
        level: userSelection.lvl,
        stats: { ...userSelection.stats },
        pointsRemaining: UIState.pointsRemaining,
        selectedSkills: userSelection.selectedSkills,
        feats: userSelection.feats,
        featureChoices: userSelection.featureChoices,
        selectedLanguages: userSelection.selectedLanguages,
        spellbookSpells: userSelection.spellbookSpells,
        selectedCantrips: userSelection.selectedCantrips,
        selectedSpells: userSelection.selectedSpells,
        preparedSpells: userSelection.preparedSpells
    };
    
    let html = '<div class="debug-dropdown">';
    html += '<div class="debug-header" onclick="toggleDebug()">▼ User Selection State (click to close)</div>';
    html += '<pre class="debug-content">' + JSON.stringify(state, null, 2) + '</pre>';
    html += '</div>';
    
    container.innerHTML = html;
}

function toggleDebug() {
    const container = document.getElementById('debug-container');
    if (!container) return;
    
    if (container.classList.contains('open')) {
        container.classList.remove('open');
    } else {
        container.classList.add('open');
        renderDebugDropdown();
    }
}

// Auto-refresh debug when user selections change - call this from render functions
function refreshDebugIfOpen() {
    renderDebugDropdown();
}

function toggleDebugDropdown() {
    toggleDebug();
}

window.renderDebugDropdown = renderDebugDropdown;
window.toggleDebugDropdown = toggleDebugDropdown;
window.toggleDebug = toggleDebug;
window.refreshDebugIfOpen = refreshDebugIfOpen;