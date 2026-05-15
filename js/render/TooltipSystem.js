/**
 * Simple tooltip system - look up descriptions from JSON
 */

// Simple lookup sources - use correct data locations
function getTooltipDescription(id, type) {
    if (!id) return null;
    
    const key = id.toLowerCase();
    
    // Race descriptions from racesData
    if (type === 'race') {
        return window.racesData?.[id]?.desc || null;
    }
    
    // Class descriptions from classesData
    if (type === 'class') {
        return window.classesData?.[id]?.desc || null;
    }
    
    // Stats from descriptions
    if (type === 'stat') {
        return window.descriptions?.stats?.[key] || null;
    }
    
    function fromMap(map, rawId) {
        if (!map || !rawId) return null;
        if (map[rawId]) return map[rawId];
        const lowerId = String(rawId).toLowerCase();
        if (map[lowerId]) return map[lowerId];
        const foundKey = Object.keys(map).find(k => k.toLowerCase() === lowerId);
        return foundKey ? map[foundKey] : null;
    }

    // Proficiencies - check nested structure (case-insensitive)
    if (type === 'proficiency') {
        const profs = window.descriptions?.proficiencies;
        if (!profs) return null;
        return (
            fromMap(profs.skills, id) ||
            fromMap(profs.armor, id) ||
            fromMap(profs.weapons, id) ||
            null
        );
    }
    
    // Saving throws
    if (type === 'saving-throw') {
        return fromMap(window.descriptions?.proficiencies?.savingThrows, id);
    }
    
    // Abilities from class-abilities
    if (type === 'ability') {
        return fromMap(window.descriptions?.classAbilities, id);
    }

    // Class options (subclass/fighting style/etc.)
    if (type === 'class-option') {
        return fromMap(window.descriptions?.classOptions, id);
    }
    
    // Feats
    if (type === 'feat') {
        return fromMap(window.descriptions?.feats, id);
    }
    
    // Race abilities (for Stage 5 race features)
    if (type === 'race-ability') {
        return fromMap(window.descriptions?.raceAbilities, id);
    }

    // Subclass abilities/features unlocked from class options
    if (type === 'subclass-ability') {
        return fromMap(window.descriptions?.subclassAbilities, id);
    }
    
    return null;
}

function getTooltipContent(target) {
    const id = target.getAttribute('data-tooltip-id');
    const type = target.getAttribute('data-tooltip-type');
    const origin = target.getAttribute('data-origin');
    
    // Get description from lookup
    const description = getTooltipDescription(id, type);
    
    // Build tooltip: description first, then origin if present
    if (description && origin) {
        return `${description}\n\n📍 ${origin}`;
    }
    
    if (description) return description;
    if (origin) return `📍 ${origin}`;
    return null;
}

function initTooltips() {
    document.addEventListener('mouseover', function(e) {
        const target = e.target.closest('[data-tooltip-id]');
        if (!target) return;
        
        const content = getTooltipContent(target);
        if (content) {
            showTooltip(target, content);
        }
    });
    document.addEventListener('mouseout', function(e) {
        const target = e.target.closest('[data-tooltip-id]');
        if (!target) return;
        hideTooltip();
    });
}

function showTooltip(target, content) {
    let t = document.getElementById('tooltip');
    if (!t) { 
        t = document.createElement('div'); 
        t.id = 'tooltip'; 
        t.className = 'tooltip'; 
        document.body.appendChild(t); 
    }
    t.textContent = content;
    t.style.display = 'block';
    
    const rect = target.getBoundingClientRect();
    
    // First, let browser calculate tooltip height
    const tooltipHeight = t.offsetHeight || 50;
    const gap = 8;
    
    // Position tooltip ABOVE the element with gap
    // Account for scroll position with pageYOffset
    t.style.top = (rect.top + window.pageYOffset - tooltipHeight - gap) + 'px';
    t.style.left = rect.left + 'px';
}

function hideTooltip() {
    const t = document.getElementById('tooltip');
    if (t) t.style.display = 'none';
}

window.initTooltips = initTooltips;
window.getTooltipDescription = getTooltipDescription;
window.getTooltipContent = getTooltipContent;
