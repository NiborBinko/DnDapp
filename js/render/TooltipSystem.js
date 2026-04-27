/**
 * Tooltip system with auto-lookup from descriptions
 */

const TOOLTIP_SOURCES = {
    'race-ability': () => window.descriptions?.raceAbilities,
    'feat': () => window.descriptions?.feats,
    'class-ability': () => window.descriptions?.classAbilities,
    'stat': () => window.descriptions?.stats,
    'proficiency': () => window.descriptions?.proficiencies,
    'class-option': () => window.descriptions?.classOptions,
    'exclusive-group': () => window.descriptions?.exclusiveGroups,
    'language': () => window.descriptions?.languages
};

function getTooltipDescription(id, type) {
    if (!id) return null;
    
    const key = id.toLowerCase();
    const sourceGetter = TOOLTIP_SOURCES[type];
    if (!sourceGetter) return null;
    
    const source = sourceGetter();
    return source?.[key] || null;
}

function getTooltipContent(target) {
    const id = target.getAttribute('data-tooltip-id');
    const type = target.getAttribute('data-tooltip-type');
    const origin = target.getAttribute('data-origin');
    
    // Get description
    let content = getTooltipDescription(id, type);
    if (!content) {
        content = target.getAttribute('data-tooltip');
    }
    
    // Show description first, then origin if present
    if (content && origin) {
        return `${content}\n\n📍 ${origin}`;
    }
    
    return content || origin;
}

function initTooltips() {
    document.addEventListener('mouseover', function(e) {
        const target = e.target.closest('[data-tooltip-id], [data-tooltip]');
        if (!target) return;
        
        const content = getTooltipContent(target);
        if (content) {
            showTooltip(target, content);
        }
    });
    document.addEventListener('mouseout', function(e) {
        const target = e.target.closest('[data-tooltip-id], [data-tooltip]');
        if (!target) hideTooltip();
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
    
    t.style.maxWidth = '400px';
    t.style.whiteSpace = 'normal';
    t.style.zIndex = '1000';
    
    const rect = target.getBoundingClientRect();
    t.style.left = rect.left + 'px';
    t.style.top = (rect.bottom + 5) + 'px';
    
    const scrollY = window.scrollY;
    t.style.top = (rect.bottom + scrollY + 5) + 'px';
}

function hideTooltip() {
    const t = document.getElementById('tooltip');
    if (t) t.style.display = 'none';
}

window.initTooltips = initTooltips;
window.getTooltipDescription = getTooltipDescription;
window.getTooltipContent = getTooltipContent;