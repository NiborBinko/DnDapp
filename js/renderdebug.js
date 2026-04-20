/**
 * Debug render functions - auto-refresh debug dropdown on selection changes
 */

// Auto-refresh debug when user selections change - call this from render functions
function refreshDebugIfOpen() {
    const container = document.getElementById('debug-container');
    if (!container) return;
    if (!container.classList.contains('open')) return;
    
    // Get characterSheet stats if exists
    let characterStats = {};
    if (typeof characterSheet !== 'undefined' && characterSheet.stats) {
        characterStats = { ...characterSheet.stats };
    }
    
    // Get characterSheet features if exists
    let characterFeatures = [];
    if (typeof characterSheet !== 'undefined' && characterSheet.features) {
        characterFeatures = [...characterSheet.features];
    }
    
    // Get characterSheet proficiencies if exists
    let characterProficiencies = {};
    if (typeof characterSheet !== 'undefined' && characterSheet.proficiencies) {
        characterProficiencies = { ...characterSheet.proficiencies };
    }
    
    // Always rebuild content with current state
    const state = {
        // User Selection State (current selections)
        userSelection: {
            race: userSelection.race || 'none',
            subrace: userSelection.subrace || 'none',
            class: userSelection.class || 'none',
            subclass: userSelection.subclass || 'none',
            level: userSelection.lvl,
            stats: { ...userSelection.stats },
            pointsRemaining: UIState.pointsRemaining,
            selectedSkills: [...userSelection.selectedSkills],
            feats: [...userSelection.feats],
            featureChoices: { ...userSelection.featureChoices },
            selectedLanguages: [...userSelection.selectedLanguages]
        },
        // Character Sheet Stats (final calculated values)
        characterSheet: {
            stats: characterStats,
            features: characterFeatures,
            proficiencies: characterProficiencies,
            maxHp: characterSheet?.maxHp || 0,
            armorClass: characterSheet?.armorClass || 0,
            speed: characterSheet?.speed || 0,
            spellcastingAbility: characterSheet?.spellcastingAbility || null
        }
    };
    
    let html = '<div class="debug-dropdown">';
    html += '<div class="debug-header" onclick="toggleDebug()">▼ Debug: User Selection & Character Stats</div>';
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
        refreshDebugIfOpen();
    }
}

function renderDebugDropdown() {
    refreshDebugIfOpen();
}

function toggleDebugDropdown() {
    toggleDebug();
}

window.refreshDebugIfOpen = refreshDebugIfOpen;
window.toggleDebug = toggleDebug;
window.renderDebugDropdown = renderDebugDropdown;
window.toggleDebugDropdown = toggleDebugDropdown;