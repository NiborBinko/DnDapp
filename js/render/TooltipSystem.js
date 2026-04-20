/**
 * Tooltip system
 */
function initTooltips() {
    document.addEventListener('mouseover', function(e) {
        const target = e.target.closest('[data-tooltip]');
        if (!target) return;
        showTooltip(target, target.getAttribute('data-tooltip'));
    });
    document.addEventListener('mouseout', function(e) {
        const target = e.target.closest('[data-tooltip]');
        if (!target) hideTooltip();
    });
}

function showTooltip(target, content) {
    let t = document.getElementById('tooltip');
    if (!t) { t = document.createElement('div'); t.id = 'tooltip'; t.className = 'tooltip'; document.body.appendChild(t); }
    t.textContent = content;
    t.style.display = 'block';
    const rect = target.getBoundingClientRect();
    t.style.left = rect.left + 'px';
    t.style.top = (rect.bottom + 5) + 'px';
}

function hideTooltip() {
    const t = document.getElementById('tooltip');
    if (t) t.style.display = 'none';
}

window.initTooltips = initTooltips;