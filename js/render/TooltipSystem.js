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
    
    // Proficiencies - check nested structure
    if (type === 'proficiency') {
        const profs = window.descriptions?.proficiencies;
        if (!profs) return null;
        return profs.skills?.[id] || profs.armor?.[id] || profs.weapons?.[id] || null;
    }
    
    // Saving throws
    if (type === 'saving-throw') {
        return window.descriptions?.proficiencies?.savingThrows?.[id] || null;
    }
    
    // Abilities from class-abilities
    if (type === 'ability') {
        return window.descriptions?.classAbilities?.[key] || null;
    }
    
    // Feats
    if (type === 'feat') {
        return window.descriptions?.feats?.[key] || null;
    }
    
    // Race abilities (for Stage 5 race features)
    if (type === 'race-ability') {
        return window.descriptions?.raceAbilities?.[key] || null;
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
    
    return description || null;
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