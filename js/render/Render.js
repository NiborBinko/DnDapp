/**
 * Main render module - renders each stage
 */
function renderWelcome() { renderSavedCharactersList(); }

function renderChooseRace() {
    const grid = document.getElementById('race-grid');
    if (!grid) return;
    grid.innerHTML = Object.values(window.racesData).map(race => {
        const bonuses = race.bonuses ? Object.entries(race.bonuses).map(([s, v]) => `+${v} ${s.slice(0, 3).toUpperCase()}`).join(', ') : race.desc;
        const desc = race.desc || '';
        return `<div class="card ${userSelection.race === race.id ? 'selected' : ''}" 
            onclick="handleRaceSelect('${race.id}')"
            data-tooltip-id="${race.id}"
            data-tooltip-type="race-ability"
            data-tooltip="${desc}"
            ><h3>${race.name}</h3><p>${bonuses}</p></div>`;
    }).join('');
    
    const subraceSection = document.getElementById('subrace-section');
    if (userSelection.race && window.racesData[userSelection.race]?.subraces) {
        renderSubraces(window.racesData[userSelection.race].subraces);
        if (subraceSection) subraceSection.style.display = 'block';
    } else if (subraceSection) { subraceSection.style.display = 'none'; }
    
    updateNextButton();
}

function renderSubraces(subraces) {
    const grid = document.getElementById('subrace-grid');
    if (!grid) return;
    grid.innerHTML = Object.keys(subraces).map(name => {
        const bonuses = subraces[name].bonuses ? Object.entries(subraces[name].bonuses).map(([s, v]) => `+${v} ${s.slice(0, 3)}`).join(', ') : '';
        return `<div class="card ${userSelection.subrace === name ? 'selected' : ''}" onclick="handleSubraceSelect('${name}')"><h3>${name}</h3><p>${bonuses}</p></div>`;
    }).join('');
}

function renderChooseClass() {
    const grid = document.getElementById('class-grid');
    if (!grid) return;
    grid.innerHTML = Object.values(window.classesData).map(cls => {
        const statDesc = window.descriptions?.stats?.[cls.primaryStat] || '';
        return `<div class="card ${userSelection.class === cls.id ? 'selected' : ''}" 
            onclick="handleClassSelect('${cls.id}')"
            data-tooltip-id="${cls.id}"
            data-tooltip-type="class-ability"
            data-tooltip="${cls.desc} ${statDesc}"
            ><h3>${cls.name} <span>(${cls.primaryStat?.slice(0, 3).toUpperCase()})</span></h3><p>d${cls.hitDie}</p></div>`;
    }).join('');
    updateNextButton();
}

function renderAbilityScores() {
    const container = document.getElementById('stats-container');
    if (!container) return;
    const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const raceBonuses = window.raceStatBonuses || {};
    const primaryStat = getClassPrimaryStat();

    // Calculate points spent using user's allocated stats
    let pointsSpent = 0;
    stats.forEach(stat => {
        const base = userSelection.stats[stat] || 8;
        if (base > 8) {
            if (base <= 13) pointsSpent += (base - 8);
            else pointsSpent += 5 + (base - 13) * 2;
        }
    });
    UIState.pointsRemaining = 27 - pointsSpent;

    let html = `<div class="points-remaining">Points: <span id="points-remaining">${UIState.pointsRemaining}</span></div>`;

    html += stats.map(stat => {
        const base = userSelection.stats[stat] || 8;
        const total = base + (raceBonuses[stat] || 0);
        const mod = Math.floor((total - 10) / 2);
        const cost = base >= 13 ? 2 : 1;
        const canDec = base > 8;
        const raceBonus = raceBonuses[stat] || 0;
        const canInc = UIState.pointsRemaining >= cost && base < (15 + raceBonus) && (base + 1 + raceBonus) <= 16;
        return `<div class="stat-row ${primaryStat === stat ? 'primary-stat-row' : ''}"
            data-tooltip-id="${stat}" 
            data-tooltip-type="stat">
            <div class="stat-name">${stat.toUpperCase().slice(0, 3)} ${primaryStat === stat ? '⭐' : ''}</div>
            <div class="stat-controls">
                <button class="stat-btn" onclick="adjustStat('${stat}', -1)" ${!canDec ? 'disabled' : ''}>-</button>
                <div class="stat-value">${base}</div>
                <button class="stat-btn" 
                    onclick="adjustStat('${stat}', 1)" 
                    ${!canInc ? 'disabled' : ''}
                    >+${cost > 1 ? cost : ''}</button>
                <div class="stat-bonus">${(raceBonuses[stat] && raceBonuses[stat] > 0) ? '+' + raceBonuses[stat] : ''}</div>
                <div class="stat-total">${total}</div>
                <div class="stat-modifier">${mod >= 0 ? '+' : ''}${mod}</div>
            </div>
        </div>`;
    }).join('');
    
    // Render stat choice features (e.g., Human bonus stat, ASI)
    Object.entries(userSelection.featureChoices).forEach(([key, choice]) => {
        if (choice && choice.type === 'stat' && choice.options && choice.options.length > 0) {
            const selectedItems = choice.selected?.filter(s => s !== null) || [];
            const canSelect = selectedItems.length < choice.count;
            const title = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            
            html += `<div class="section-header">${title}</div><div class="checkbox-grid">`;
            choice.options.forEach(opt => {
                const isSelected = selectedItems.includes(opt);
                const disabled = !canSelect && !isSelected ? 'disabled' : '';
                html += `<label class="checkbox-item ${isSelected ? 'selected' : ''}" 
                    data-tooltip-id="${opt}" 
                    data-tooltip-type="stat" 
                    data-origin="${title}"
                    ><input type="checkbox" ${isSelected ? 'checked' : ''} ${disabled} onchange="selectFeatureChoice('${key}', '${opt}')">${opt}</label>`;
            });
            html += '</div>';
        }
    });
    
    container.innerHTML = html;
    updateNextButton();
}

function getClassPrimaryStat() {
    if (!userSelection.class) return null;
    return window.classesData[userSelection.class]?.primaryStat || null;
}

function renderProficienciesStage() {
    const grid = document.getElementById('proficiencies-grid');
    if (!grid) return;
    const classData = window.classesData[userSelection.class];
    if (!classData) { grid.innerHTML = '<p>Select a class first.</p>'; return; }
    
    let html = '';
    
    // Skills
    const skillOptions = classData.proficiencies?.skills?.options || [];
    const maxSkills = classData.proficiencies?.skills?.count || 2;
    const currentSkills = userSelection.selectedSkills.length;
    html += `<div class="section-header">Skills (${currentSkills}/${maxSkills})</div><div class="checkbox-grid">`;
    html += skillOptions.map(skill => {
        const isSel = userSelection.selectedSkills.includes(skill.name);
        const isDis = !isSel && currentSkills >= maxSkills;
        const skillDesc = window.descriptions?.proficiencies?.skills?.[skill.name] || '';
        return `<label class="checkbox-item ${isDis ? 'disabled' : ''} ${isSel ? 'selected' : ''}" 
            data-tooltip-id="${skill.name}" 
            data-tooltip-type="proficiency" 
            data-tooltip="${skillDesc}"
            ><input type="checkbox" ${isSel ? 'checked' : ''} ${isDis ? 'disabled' : ''} onchange="toggleSkill('${skill.name}')">${skill.name}</label>`;
    }).join('');
    html += '</div>';
    
    // Class default proficiencies (pre-selected/locked)
    const profs = classData.proficiencies || {};
    if (profs.armor?.length) {
        html += `<div class="section-header">Armor</div><div class="checkbox-grid">`;
        html += profs.armor.map(a => `<label class="checkbox-item locked" data-tooltip-id="${a}" data-tooltip-type="proficiency" data-tooltip="${a}"><input type="checkbox" checked disabled>${a} 🔒</label>`).join('');
        html += '</div>';
    }
    if (profs.weapons?.length) {
        html += `<div class="section-header">Weapons</div><div class="checkbox-grid">`;
        html += profs.weapons.map(w => `<label class="checkbox-item locked" data-tooltip-id="${w}" data-tooltip-type="proficiency" data-tooltip="${w}"><input type="checkbox" checked disabled>${w} 🔒</label>`).join('');
        html += '</div>';
    }
    if (profs.savingThrows?.length) {
        html += `<div class="section-header">Saves</div><div class="checkbox-grid">`;
        html += profs.savingThrows.map(s => `<label class="checkbox-item locked" data-tooltip-id="${s}" data-tooltip-type="proficiency" data-tooltip="${s.toUpperCase().slice(0, 3)}"><input type="checkbox" checked disabled>${s.toUpperCase().slice(0, 3)} 🔒</label>`).join('');
        html += '</div>';
    }
    
    // Proficiency choices from featureChoices (race features, ASI, etc.)
    Object.entries(userSelection.featureChoices).forEach(([key, choice]) => {
        if (choice && choice.type === 'proficiency' && choice.options && choice.options.length > 0) {
            const selectedItems = choice.selected?.filter(s => s !== null) || [];
            const canSelect = selectedItems.length < choice.count;
            
            let title = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            title = `+1 ${choice.proficiencyType || 'proficiency'} - ${title}`;
            
            html += `<div class="section-header">${title}</div><div class="checkbox-grid">`;
            choice.options.forEach(opt => {
                const isSelected = selectedItems.includes(opt);
                const disabled = !canSelect && !isSelected ? 'disabled' : '';
                const isLocked = selectedItems.length === choice.count && isSelected;
                const optDesc = window.descriptions?.proficiencies?.[choice.proficiencyType]?.[opt] || '';
                html += `<label class="checkbox-item ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}" 
                    data-tooltip-id="${opt}" 
                    data-tooltip-type="proficiency" 
                    data-origin="${title}"
                    data-tooltip="${optDesc}"
                    ><input type="checkbox" ${isSelected ? 'checked' : ''} ${disabled} onchange="selectFeatureChoice('${key}', '${opt}')">${opt}</label>`;
            });
            html += '</div>';
        }
    });
    
    grid.innerHTML = html;
}

function renderFeaturesFeats() {
    const abilitiesGrid = document.getElementById('abilities-grid');
    const featsGrid = document.getElementById('feats-grid');

    if (abilitiesGrid) {
        let html = '';
        if (userSelection.race) {
            const race = window.racesData[userSelection.race];
            if (race?.raceAbilities) {
                html += `<div class="section-header">Race Abilities</div><div class="checkbox-grid">`;
                html += race.raceAbilities.map(a => {
                    const desc = window.descriptions?.raceAbilities?.[a] || '';
                    return `<label class="checkbox-item locked" data-tooltip-id="${a}" data-tooltip-type="race-ability" data-origin="Race: ${race.name}" data-tooltip="${desc}"><input type="checkbox" checked disabled>${a} 🔒</label>`;
                }).join('');
                html += '</div>';
            }
        }
        if (userSelection.class) {
            const cls = window.classesData[userSelection.class];
            const feats = cls?.features?.[userSelection.lvl];
            if (feats?.features?.length) {
                html += `<div class="section-header">Class Features (L${userSelection.lvl})</div><div class="checkbox-grid">`;
                html += feats.features.map(f => {
                    const desc = window.descriptions?.classAbilities?.[f] || '';
                    return `<label class="checkbox-item locked" data-tooltip-id="${f}" data-tooltip-type="class-ability" data-origin="Class: ${cls.name}" data-tooltip="${desc}"><input type="checkbox" checked disabled>${f} 🔒</label>`;
                }).join('');
                html += '</div>';
            }
            if (feats?.options?.length) {
                html += `<div class="section-header">Choose One</div><div class="checkbox-grid">`;
                html += feats.options.map(opt => {
                    const isSel = userSelection.selectedFeatureChoices[opt.exclusiveGroup] === opt.id;
                    const optDesc = window.descriptions?.classOptions?.[opt.name] || window.descriptions?.exclusiveGroups?.[opt.exclusiveGroup] || '';
                    return `<label class="checkbox-item ${isSel ? 'selected' : ''}" data-tooltip-id="${opt.name}" data-tooltip-type="class-option" data-origin="Class: ${cls.name}" data-tooltip="${optDesc}"><input type="checkbox" ${isSel ? 'checked' : ''} onchange="selectClassOption('${opt.exclusiveGroup}', '${opt.id}')">${opt.name}</label>`;
                }).join('');
                html += '</div>';
            }
        }
        
        // Generic choices (from featureChoices)
        if (userSelection.featureChoices) {
            Object.entries(userSelection.featureChoices).forEach(([key, choice]) => {
                if (!choice || !choice.options || choice.options.length === 0) return;
                
                const selectedItems = choice.selected?.filter(s => s !== null) || [];
                const canSelect = selectedItems.length < choice.count;
                
                let title = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                if (choice.type === 'proficiency') title = `+1 ${choice.proficiencyType} (Choose ${choice.count})`;
                else if (choice.type === 'stat') title = `+1 ${choice.count} Stat(s)`;
                else if (choice.type === 'feat') title = `+1 Feat`;
                else if (choice.type === 'cantrips') title = `Choose ${choice.count} Cantrip(s)`;
                
                html += `<div class="section-header">${title}</div><div class="checkbox-grid">`;
                choice.options.forEach(opt => {
                    const isSelected = selectedItems.includes(opt);
                    const disabled = !canSelect && !isSelected ? 'disabled' : '';
                    const displayName = typeof opt === 'string' ? opt : opt.name || opt;
                    const optDesc = window.descriptions?.feats?.[displayName] || window.descriptions?.classOptions?.[displayName] || '';
                    html += `<label class="checkbox-item ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}" 
                        data-tooltip-id="${displayName}" 
                        data-tooltip-type="${choice.type === 'feat' ? 'feat' : (choice.type === 'stat' ? 'stat' : 'proficiency')}" 
                        data-origin="${title}"
                        data-tooltip="${optDesc}"
                        ><input type="checkbox" ${isSelected ? 'checked' : ''} ${disabled} onchange="selectFeatureChoice('${key}', '${displayName}')">${displayName}</label>`;
                });
                html += '</div>';
            });
        }
        
        abilitiesGrid.innerHTML = html;
    }

    if (featsGrid) {
        const feats = Object.keys(window.descriptions?.feats || {});
        const maxFeats = Math.floor(userSelection.lvl / 4);
        const note = document.getElementById('feats-note');
        if (note) note.textContent = maxFeats > 0 ? `Select ${maxFeats - userSelection.feats.length} feat(s)` : 'Feats at lvl 4, 8, 12, 16, 19';

        let html = '<div class="checkbox-grid">';
        html += feats.map(feat => {
            const isSel = userSelection.feats.includes(feat);
            const isDis = !isSel && userSelection.feats.length >= maxFeats;
            const featDesc = window.descriptions?.feats?.[feat] || '';
            return `<label class="checkbox-item ${isSel ? 'selected' : ''} ${isDis ? 'disabled' : ''}" 
                data-tooltip-id="${feat}" 
                data-tooltip-type="feat" 
                data-origin="Feat"
                data-tooltip="${featDesc}"
                ><input type="checkbox" ${isSel ? 'checked' : ''} ${isDis ? 'disabled' : ''} onchange="toggleFeat('${feat}')">${feat}</label>`;
        }).join('');
        html += '</div>';
        featsGrid.innerHTML = html;
    }
}

function renderSpellsStage() {
    const grid = document.getElementById('spells-grid');
    const msg = document.getElementById('spellcaster-message');
    const info = document.getElementById('spell-selection-info');
    if (!grid) return;
    if (!characterSheet.spellcastingAbility) {
        if (msg) { msg.textContent = 'Your class has no spellcasting.'; msg.style.display = 'block'; }
        if (info) info.style.display = 'none';
        grid.innerHTML = '';
        return;
    }
    if (msg) msg.style.display = 'none';
    if (info) { info.style.display = 'block'; info.innerHTML = `<p><strong>Spellcasting:</strong> ${characterSheet.spellcastingAbility}</p>`; }
    grid.innerHTML = '<p>Spell selection coming soon...</p>';
    
}

function renderOverview() {
    const content = document.getElementById('summary-content');
    if (!content) return;
    const race = window.racesData[userSelection.race];
    const cls = window.classesData[userSelection.class];
    let html = `<div class="summary-row"><span>Race:</span><span>${race?.name || '-'}</span></div>`;
    html += `<div class="summary-row"><span>Subrace:</span><span>${userSelection.subrace || '-'}</span></div>`;
    html += `<div class="summary-row"><span>Class:</span><span>${cls?.name || '-'}</span></div>`;
    html += `<div class="summary-row"><span>Level:</span><span>${userSelection.lvl}</span></div>`;
    html += `<div class="summary-row"><strong>Stats</strong></div>`;
    Object.entries(characterSheet.stats).forEach(([s, v]) => { html += `<div class="summary-row"><span>${s.toUpperCase().slice(0, 3)}</span><span>${v} (${characterSheet.statModifiers[s] >= 0 ? '+' : ''}${characterSheet.statModifiers[s]})</span></div>`; });
    html += `<div class="summary-row"><strong>HP</strong></div><div class="summary-row"><span>HP:</span><span>${characterSheet.maxHp}</span></div>`;
    html += `<div class="summary-row"><span>AC:</span><span>${characterSheet.armorClass}</span></div>`;
    content.innerHTML = html;
}

function renderSavedCharactersList() {
    const list = document.getElementById('character-list');
    if (!list) return;
    const saved = getAllSaved();
    if (saved.length === 0) { list.innerHTML = '<p>No saved characters yet.</p>'; return; }
    list.innerHTML = saved.map((c, i) => `
        <div class="character-item" data-index="${i}">
            <div><strong>${c.name || 'Unnamed'}</strong> <span>- Lvl ${c.lvl} ${c.race}</span> <span>[${c.class}]</span></div>
            <div style="display:flex;gap:8px;">
                <button class="view-btn" onclick="viewCharacter(${i})">View</button>
                <button class="delete-btn" onclick="confirmDelete(${i})">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateNextButton() {
    const stage = UIState.currentStage;
    let btnId = '';
    
    // Map stage to correct button ID (stage 0 = welcome, 1 = race, 2 = class, 3 = abilities, etc)
    if (stage === 1) btnId = 'btn-choose-race-next';
    else if (stage === 2) btnId = 'btn-choose-class-next';
    else if (stage === 3) btnId = 'btn-ability-scores-next';
    else return;
    
    const btn = document.getElementById(btnId);
    if (btn) btn.disabled = !canProceed();
}

window.renderWelcome = renderWelcome;
window.renderChooseRace = renderChooseRace;
window.renderSubraces = renderSubraces;
window.renderChooseClass = renderChooseClass;
window.renderAbilityScores = renderAbilityScores;
window.renderProficienciesStage = renderProficienciesStage;
window.renderFeaturesFeats = renderFeaturesFeats;
window.renderSpellsStage = renderSpellsStage;
window.renderOverview = renderOverview;
window.renderSavedCharactersList = renderSavedCharactersList;
window.updateNextButton = updateNextButton;