// ===== Glossary UI Layer =====
// Self-contained overlay — no interference with app

let glossaryHistory = [];
let glossaryRenderFn = null;

function initGlossary() {
    const existing = document.getElementById('glossary-overlay');
    if (existing) return;
    const div = document.createElement('div');
    div.id = 'glossary-overlay';
    div.className = 'glossary-overlay';
    div.innerHTML = `<div class="glossary-container">
        <div class="glossary-header">
            <h2>Glossary</h2>
            <button class="glossary-close-btn" onclick="closeGlossary()">Close</button>
        </div>
        <div class="glossary-body">
            <div class="glossary-left" id="glossary-left-panel"></div>
            <div class="glossary-right" id="glossary-right-panel"></div>
        </div>
    </div>`;
    document.body.appendChild(div);
    document.getElementById('glossary-close-btn')?.addEventListener('click', closeGlossary);
}

function openGlossary() {
    initGlossary();
    const overlay = document.getElementById('glossary-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    renderLeftPanel();
    renderLandingPage();
    document.body.style.overflow = 'hidden';
}

function closeGlossary() {
    const overlay = document.getElementById('glossary-overlay');
    if (overlay) overlay.style.display = 'none';
    glossaryHistory = [];
    document.body.style.overflow = '';
}

function renderLandingPage() {
    glossaryHistory = [];
    const html = `<div class="glossary-welcome">
        <h3>Welcome to the Glossary</h3>
        <p>Select a category from the left panel to browse races, classes, features, feats, proficiencies, and spells.</p>
        <ul>
            <li><strong>Races</strong> — Browse playable races and their subraces</li>
            <li><strong>Classes</strong> — Browse classes and their features by level</li>
            <li><strong>Race Features</strong> — Alphabetical list of all racial traits</li>
            <li><strong>Class Features</strong> — Alphabetical list of all class and subclass abilities</li>
            <li><strong>Feats</strong> — All available feats with descriptions</li>
            <li><strong>Proficiencies</strong> — Armor, weapons, tools, skills, and saving throws</li>
            <li><strong>Spells</strong> — All spells organized by level</li>
            <li><strong>Subclasses</strong> — All subclass options grouped by type</li>
        </ul>
    </div>`;
    setRightPanel(html);
}

function setRightPanel(html) {
    const panel = document.getElementById('glossary-right-panel');
    if (!panel) return;
    const backBtn = glossaryHistory.length > 0
        ? '<button class="glossary-back-btn" onclick="glossaryBack()">← Back</button>'
        : '';
    panel.innerHTML = backBtn + html;
}

function renderLeftPanel() {
    const panel = document.getElementById('glossary-left-panel');
    if (!panel) return;
    const categories = [
        { id: 'tree-races', label: 'Races', type: 'folder' },
        { id: 'tree-classes', label: 'Classes', type: 'folder' },
        { id: 'tree-race-features', label: 'Racial Abilities', type: 'leaf', action: 'showRaceFeatures' },
        { id: 'tree-class-features', label: 'Class Features', type: 'leaf', action: 'showClassFeatures' },
        { id: 'tree-feats', label: 'Feats', type: 'leaf', action: 'showFeats' },
        { id: 'tree-proficiencies', label: 'Proficiencies', type: 'folder' },
        { id: 'tree-spells', label: 'Spells', type: 'folder' },
        { id: 'tree-subclasses', label: 'Subclasses', type: 'folder' }
    ];
    panel.innerHTML = categories.map(c => {
        if (c.type === 'leaf') {
            return `<div class="glossary-tree-item" data-action="${c.action}" onclick="glossaryTreeAction('${c.action}')">${c.label}</div>`;
        }
        return `<div class="glossary-tree-folder">
            <div class="glossary-tree-folder-header" onclick="glossaryToggleFolder('${c.id}')">
                <span class="glossary-folder-icon">▸</span> ${c.label}
            </div>
            <div class="glossary-tree-children" id="${c.id}" style="display:none"></div>
        </div>`;
    }).join('');
}

function glossaryToggleFolder(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const isOpen = el.style.display !== 'none';
    el.style.display = isOpen ? 'none' : 'block';
    const icon = el.parentElement?.querySelector('.glossary-folder-icon');
    if (icon) icon.textContent = isOpen ? '▸' : '▾';
    if (!isOpen) populateFolder(id);
}

function populateFolder(id) {
    const el = document.getElementById(id);
    if (!el || el.dataset.populated) return;
    el.dataset.populated = '1';
    if (id === 'tree-races') populateRaces(el);
    else if (id === 'tree-classes') populateClasses(el);
    else if (id === 'tree-proficiencies') populateProficiencies(el);
    else if (id === 'tree-spells') populateSpells(el);
    else if (id === 'tree-subclasses') populateSubclasses(el);
}

function populateRaces(el) {
    const races = getRaceTree();
    races.forEach(r => {
        if (r.children.length > 0) {
            const folder = document.createElement('div');
            folder.className = 'glossary-tree-folder';
            folder.innerHTML = `<div class="glossary-tree-folder-header" onclick="glossaryToggleFolder('tree-race-${r.id}')">
                <span class="glossary-folder-icon">▸</span> ${r.name}
            </div><div class="glossary-tree-children" id="tree-race-${r.id}" style="display:none"></div>`;
            el.appendChild(folder);
            const childEl = folder.querySelector('.glossary-tree-children');
            r.children.forEach(sr => {
                const leaf = document.createElement('div');
                leaf.className = 'glossary-tree-item';
                leaf.textContent = sr.name;
                leaf.onclick = () => openTreePage(() => showSubracePage(sr.parentRaceId, sr.id));
                childEl.appendChild(leaf);
            });
            const header = folder.querySelector('.glossary-tree-folder-header');
            header.onclick = (e) => {
                e.stopPropagation();
                openTreePage(() => showRacePage(r.id));
                glossaryToggleFolder(`tree-race-${r.id}`);
            };
        } else {
            const leaf = document.createElement('div');
            leaf.className = 'glossary-tree-item';
            leaf.textContent = r.name;
            leaf.onclick = () => openTreePage(() => showRacePage(r.id));
            el.appendChild(leaf);
        }
    });
}

function populateClasses(el) {
    const classes = getClassTree();
    classes.forEach(c => {
        const leaf = document.createElement('div');
        leaf.className = 'glossary-tree-item';
        leaf.textContent = c.name;
        leaf.onclick = () => openTreePage(() => showClassPage(c.id));
        el.appendChild(leaf);
    });
}

function populateProficiencies(el) {
    const groups = getProficiencyGroups();
    groups.forEach(g => {
        const folder = document.createElement('div');
        folder.className = 'glossary-tree-folder';
        folder.innerHTML = `<div class="glossary-tree-folder-header" onclick="glossaryToggleFolder('tree-prof-${g.group}')">
            <span class="glossary-folder-icon">▸</span> ${g.label}
        </div><div class="glossary-tree-children" id="tree-prof-${g.group}" style="display:none"></div>`;
        el.appendChild(folder);
        const childEl = folder.querySelector('.glossary-tree-children');
        g.items.forEach(item => {
            const leaf = document.createElement('div');
            leaf.className = 'glossary-tree-item';
            leaf.textContent = item.name;
            leaf.onclick = () => openTreePage(() => showSimplePage(item.name, item.desc, 'Proficiency'));
            childEl.appendChild(leaf);
        });
    });
}

function populateSpells(el) {
    const byLevel = getSpellsByLevel();
    Object.keys(byLevel).sort((a, b) => parseInt(a) - parseInt(b)).forEach(lvl => {
        const lvlLabel = lvl === '0' ? 'Cantrips' : `Level ${lvl}`;
        const folder = document.createElement('div');
        folder.className = 'glossary-tree-folder';
        folder.innerHTML = `<div class="glossary-tree-folder-header" onclick="glossaryToggleFolder('tree-spell-lvl-${lvl}')">
            <span class="glossary-folder-icon">▸</span> ${lvlLabel}
        </div><div class="glossary-tree-children" id="tree-spell-lvl-${lvl}" style="display:none"></div>`;
        el.appendChild(folder);
        const childEl = folder.querySelector('.glossary-tree-children');
        byLevel[lvl].forEach(spell => {
            const leaf = document.createElement('div');
            leaf.className = 'glossary-tree-item';
            leaf.textContent = spell.name;
            leaf.onclick = () => openTreePage(() => showSpellPage(spell.name));
            childEl.appendChild(leaf);
        });
    });
}

function populateSubclasses(el) {
    const groups = getSubclassTree();
    groups.forEach(g => {
        const folder = document.createElement('div');
        folder.className = 'glossary-tree-folder';
        folder.innerHTML = `<div class="glossary-tree-folder-header" onclick="glossaryToggleFolder('tree-sub-${g.group.replace(/\s+/g, '-')}')">
            <span class="glossary-folder-icon">▸</span> ${g.groupLabel || g.group}
        </div><div class="glossary-tree-children" id="tree-sub-${g.group.replace(/\s+/g, '-')}" style="display:none"></div>`;
        el.appendChild(folder);
        const childEl = folder.querySelector('.glossary-tree-children');
        g.options.forEach(opt => {
            const leaf = document.createElement('div');
            leaf.className = 'glossary-tree-item';
            leaf.textContent = opt.name;
            leaf.onclick = () => openTreePage(() => showOptionPage(opt.optionId, opt.classId));
            childEl.appendChild(leaf);
        });
    });
}

function glossaryTreeAction(action) {
    if (action === 'showRaceFeatures') openTreePage(() => showRaceFeaturesPage());
    else if (action === 'showClassFeatures') openTreePage(() => showClassFeaturesPage());
    else if (action === 'showFeats') openTreePage(() => showFeatsPage());
}

// ===== LIFO Navigation =====

function pushPage(renderFn) {
    glossaryHistory.push(renderFn);
}

function formatGroupLabel(key) {
    return key
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\d+$/, '')
        .replace(/^./, c => c.toUpperCase())
        .trim();
}

function openTreePage(renderFn) {
    glossaryHistory = [renderFn];
    renderFn();
}

function glossaryBack() {
    if (glossaryHistory.length === 0) return;
    if (glossaryHistory.length === 1) { renderLandingPage(); return; }
    glossaryHistory.pop();
    glossaryHistory[glossaryHistory.length - 1]();
}

// ===== Page Renderers =====

function showRacePage(raceId) {
    const race = getRaceDetail(raceId);
    if (!race) return;
    const abilityLinks = race.abilities.map(a =>
        `<span class="glossary-link" onclick="glossaryPushFeature('race', '${a.name.replace(/'/g, "\\'")}')">${a.name}</span>`
    ).join(', ');
    const subraceLinks = race.subraces.map(sr =>
        `<span class="glossary-link" onclick="glossaryPushSubrace('${raceId}', '${sr.name.replace(/'/g, "\\'")}')">${sr.name}</span>`
    ).join(', ');
    const html = `
        <h3>${race.name}</h3>
        <p><em>${race.desc}</em></p>
        <div class="glossary-detail-grid">
            <div><strong>Size:</strong> ${race.size}</div>
            <div><strong>Speed:</strong> ${race.speed} ft</div>
            <div><strong>Languages:</strong> ${race.languages.join(', ') || 'None'}</div>
            <div><strong>Stat Bonuses:</strong> ${race.bonuses}</div>
        </div>
        <h4>Racial Abilities</h4>
        <p>${abilityLinks}</p>
        ${race.subraces.length > 0 ? `<h4>Subraces</h4><p>${subraceLinks}</p>` : ''}`;
    setRightPanel(html);
}

function showSubracePage(raceId, srName) {
    const sr = getSubraceDetail(raceId, srName);
    if (!sr) return;
    const abilityLinks = sr.abilities.map(a =>
        `<span class="glossary-link" onclick="glossaryPushFeature('race', '${a.name.replace(/'/g, "\\'")}')">${a.name}</span>`
    ).join(', ');
    const html = `
        <h3>${sr.name} <span style="font-weight:normal;color:#888">(${sr.raceName})</span></h3>
        <div class="glossary-detail-grid">
            <div><strong>Stat Bonuses:</strong> ${sr.bonuses || 'None'}</div>
            ${sr.languages.length > 0 ? `<div><strong>Languages:</strong> ${sr.languages.join(', ')}</div>` : ''}
        </div>
        <h4>Racial Abilities</h4>
        <p>${abilityLinks}</p>`;
    setRightPanel(html);
}

function showClassPage(clsId) {
    const cls = getClassDetail(clsId);
    if (!cls) return;
    let html = `<h3>${cls.name}</h3><p><em>${cls.desc}</em></p>
        <div class="glossary-detail-grid">
            <div><strong>Hit Die:</strong> d${cls.hitDie}</div>
            <div><strong>Primary Stat:</strong> ${cls.primaryStat}</div>
            ${cls.spellcastingAbility ? `<div><strong>Spellcasting:</strong> ${cls.spellcastingAbility}</div>` : ''}
            <div><strong>Armor:</strong> ${(cls.proficiencies?.armor || []).join(', ') || 'None'}</div>
            <div><strong>Weapons:</strong> ${(cls.proficiencies?.weapons || []).join(', ') || 'None'}</div>
            <div><strong>Saving Throws:</strong> ${(cls.proficiencies?.savingThrows || []).join(', ') || 'None'}</div>
            ${cls.proficiencies?.tools ? `<div><strong>Tools:</strong> ${cls.proficiencies.tools.join(', ')}</div>` : ''}
        </div>`;
    cls.featuresByLevel.forEach(lvlData => {
        html += `<h4>Level ${lvlData.level}</h4><ul>`;
        lvlData.features.forEach(f => {
            if (f.isSubclass) {
                const groupLabel = formatGroupLabel(f.exclusiveGroup);
                html += `<li><span class="glossary-link" onclick="glossaryPushOption('${f.optionId}')">${f.name}</span> <span style="color:#888">(${groupLabel})</span></li>`;
            } else {
                html += `<li><span class="glossary-link" onclick="glossaryPushFeature('class', '${f.name.replace(/'/g, "\\'")}')">${f.name}</span></li>`;
            }
        });
        html += `</ul>`;
    });
    setRightPanel(html);
}

function showOptionPage(optionId, clsId) {
    const opt = getOptionDetail(optionId);
    if (!opt) return;
    let html = `<h3>${opt.name}</h3>
        <p>${opt.desc}</p>`;
    if (opt.features && opt.features.length > 0) {
        html += `<h4>Features by Level</h4><ul>`;
        opt.features.forEach(f => {
            html += `<li><strong>L${f.level}:</strong> <span class="glossary-link" onclick="glossaryPushFeature('subclass', '${f.name.replace(/'/g, "\\'").split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}')">${f.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span></li>`;
        });
        html += `</ul>`;
    }
    setRightPanel(html);
}

function showFeaturePage(type, name) {
    let desc = 'No description available.';
    let source = '';
    if (type === 'race') {
        desc = window.descriptions?.raceAbilities?.[name] || 'No description available.';
        source = 'Race Feature';
    } else if (type === 'class') {
        desc = window.descriptions?.classAbilities?.[name] || 'No description available.';
        source = 'Class Feature';
    } else if (type === 'subclass') {
        desc = window.descriptions?.subclassAbilities?.[name] || 'No description available.';
        source = 'Subclass Ability';
    }
    const html = `
        <h3>${name}</h3>
        <p><strong>Source:</strong> ${source}</p>
        <p>${desc}</p>`;
    setRightPanel(html);
}

function glossaryPushFeature(type, name) {
    pushPage(() => showFeaturePage(type, name));
    showFeaturePage(type, name);
}

function glossaryPushSubrace(raceId, srName) {
    pushPage(() => showSubracePage(raceId, srName));
    showSubracePage(raceId, srName);
}

function glossaryPushOption(optionId) {
    pushPage(() => showOptionPage(optionId));
    showOptionPage(optionId);
}

function showSpellPage(spellName) {
    const spell = getSpellDetail(spellName);
    if (!spell) return;
    const lvlLabel = spell.level === 0 || spell.level === '0' ? 'Cantrip' : `Level ${spell.level}`;
    const srcHtml = spell.sources.length > 0 ? `<h4>Available To</h4><ul>
        ${spell.sources.map(s => `<li>${s.class} (Level ${s.level})</li>`).join('')}</ul>` : '';
    const html = `
        <h3>${spell.name}</h3>
        <p><strong>${lvlLabel} ${spell.school}</strong></p>
        <div class="glossary-detail-grid">
            <div><strong>Casting Time:</strong> ${spell.casttime}</div>
            <div><strong>Range:</strong> ${spell.range}</div>
            <div><strong>Components:</strong> ${spell.components}</div>
            <div><strong>Duration:</strong> ${spell.duration}</div>
            ${spell.ritual ? '<div><strong>Ritual:</strong> Yes</div>' : ''}
        </div>
        <p>${spell.description}</p>
        ${srcHtml}`;
    setRightPanel(html);
}

function showSimplePage(title, description, source) {
    const html = `
        <h3>${title}</h3>
        ${source ? `<p><strong>Source:</strong> ${source}</p>` : ''}
        <p>${description}</p>`;
    setRightPanel(html);
}

function showRaceFeaturesPage() {
    const features = getAllRaceFeatures();
    let html = `<h3>Race Features</h3><div class="glossary-alpha-list">`;
    features.forEach(f => {
        html += `<div class="glossary-alpha-item">
            <span class="glossary-link" onclick="glossaryPushFeature('race', '${f.name.replace(/'/g, "\\'")}')">${f.name}</span>
        </div>`;
    });
    html += `</div>`;
    setRightPanel(html);
}

function showClassFeaturesPage() {
    const features = getAllClassFeatures();
    let html = `<h3>Class Features</h3><div class="glossary-alpha-list">`;
    features.forEach(f => {
        html += `<div class="glossary-alpha-item">
            <span class="glossary-link" onclick="glossaryPushFeature('${f.source === 'Subclass Ability' ? 'subclass' : 'class'}', '${f.name.replace(/'/g, "\\'")}')">${f.name}</span>
            <span style="color:#888;font-size:0.85em"> — ${f.source}</span>
        </div>`;
    });
    html += `</div>`;
    setRightPanel(html);
}

function showFeatsPage() {
    const feats = getGlossaryFeats();
    let html = `<h3>Feats</h3><div class="glossary-alpha-list">`;
    feats.forEach(f => {
        html += `<div class="glossary-alpha-item">
            <span class="glossary-link" onclick="glossaryPushFeat('${f.name.replace(/'/g, "\\'")}')">${f.name}</span>
            ${f.effectText ? `<span style="color:#888;font-size:0.85em"> — ${f.effectText}</span>` : ''}
        </div>`;
    });
    html += `</div>`;
    setRightPanel(html);
}

function glossaryPushFeat(featName) {
    pushPage(() => showDetailFeatPage(featName));
    showDetailFeatPage(featName);
}

function showDetailFeatPage(featName) {
    const feat = getFeatDetail(featName);
    if (!feat) return;
    const html = `
        <h3>${feat.name}</h3>
        <p>${feat.desc}</p>
        ${feat.effectText ? `<p><strong>Effect:</strong> ${feat.effectText}</p>` : ''}`;
    setRightPanel(html);
}
