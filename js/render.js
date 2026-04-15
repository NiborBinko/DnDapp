function renderClasses() {
    const grid = document.getElementById('class-grid');
    grid.innerHTML = classes.map(c => `
        <div class="card" onclick="selectClass('${c.id}')" id="class-${c.id}">
            <h3>${c.name}</h3>
            <p>${c.desc}</p>
        </div>
    `).join('');
}

function renderRaces() {
    const grid = document.getElementById('race-grid');
    grid.innerHTML = races.map(r => {
        const bonusParts = [];
        if (r.bonuses) {
            if (r.bonuses.chosen) {
                const raceAbs = r.raceAbilities || [];
                const hasFeat = raceAbs.includes('+1 Feat');
                const hasSkill = raceAbs.includes('+1 Proficiency');
                let parts = [];
                parts.push(`+1 on ${r.bonuses.chosen} stats`);
                if (hasSkill) parts.push('+1 Skill');
                if (hasFeat) parts.push('+1 Feat');
                bonusParts.push(parts.join(', '));
            } else {
                for (const [stat, val] of Object.entries(r.bonuses)) {
                    if (stat !== 'chosen') {
                        bonusParts.push(`+${val} ${statLabels[stat]}`);
                    }
                }
            }
        }
        const bonusText = bonusParts.length > 0 ? bonusParts.join(', ') : r.desc;
        return `
            <div class="card" onclick="selectRace('${r.id}')" id="race-${r.id}">
                <h3>${r.name}</h3>
                <p>${r.desc}</p>
                <p class="bonus-preview">${bonusText}</p>
            </div>
        `;
    }).join('');
}

function renderSubraces(raceId) {
    const grid = document.getElementById('subrace-grid');
    const subs = subraces[raceId] || [];
    grid.innerHTML = subs.length === 0 ? '<p>No subraces available</p>' : 
        subs.map(s => {
            const bonusParts = [];
            if (s.bonuses) {
                for (const [stat, val] of Object.entries(s.bonuses)) {
                    bonusParts.push(`+${val} ${statLabels[stat]}`);
                }
            }
            const bonusText = bonusParts.length > 0 ? bonusParts.join(', ') : '';
            return `
                <div class="card" onclick="selectSubrace('${s.name}')" id="subrace-${s.name}">
                    <h3>${s.name}</h3>
                    <p class="bonus-preview">${bonusText}</p>
                </div>
            `;
        }).join('');
}

function renderStats() {
    const container = document.getElementById('stats-container');
    const bonuses = getRaceBonuses();
    const isHuman = character.raceId === 'human';
    const humanBonusStats = character.humanBonusStats || [];
    
    let usedPoints = 0;
    stats.forEach(stat => {
        const base = character.stats[stat] ?? 8;
        usedPoints += getStatCost(base);
    });
    pointsRemaining = 27 - usedPoints;
    document.getElementById('points-remaining').textContent = pointsRemaining;
    
    let humanHint = '';
    let maxHumanBonus = 0;
    if (isHuman && bonuses.chosen) {
        maxHumanBonus = bonuses.chosen;
        humanHint = `<p style="color: var(--text-muted); margin-bottom: 15px;">Click the star to select bonus stats (select ${maxHumanBonus})</p>`;
    }
    
    container.innerHTML = humanHint + stats.map(stat => {
        const base = character.stats[stat] ?? 8;
        const humanBonus = isHuman && humanBonusStats.includes(stat) ? 1 : 0;
        const raceBonus = bonuses[stat] || 0;
        const total = base + humanBonus + raceBonus;
        const modifier = Math.floor((total - 10) / 2);
        const isHumanBonusSelected = isHuman && humanBonusStats.includes(stat);
        const maxBase = (humanBonus + raceBonus) > 0 ? 16 : 15;
        
        const currentCost = getStatCost(base);
        const nextCost = getStatCost(base + 1);
        const costDiff = nextCost - currentCost;
        
        return `
            <div class="stat-row" title="${statDescriptions[stat]}">
                <div class="stat-name">${statLabels[stat]}</div>
                <div class="stat-controls">
                    <button class="stat-btn" onclick="adjustStat('${stat}', -1)" id="btn-${stat}-minus">-</button>
                    <div class="stat-value">${base}</div>
                    <button class="stat-btn ${costDiff > 1 ? 'cost-2' : ''}" onclick="adjustStat('${stat}', 1)" id="btn-${stat}-plus" ${base >= maxBase ? 'disabled' : ''}>+${costDiff > 1 ? ` (${costDiff})` : ''}</button>
                    <div class="stat-bonus">${(humanBonus + raceBonus) > 0 ? '+' + (humanBonus + raceBonus) : ''}</div>
                    <div class="stat-total">${total}</div>
                    <div class="stat-modifier">${modifier >= 0 ? '+' : ''}${modifier}</div>
                    ${isHuman ? `<button class="stat-btn human-bonus-btn ${isHumanBonusSelected ? 'selected' : ''}" onclick="toggleHumanBonusStat('${stat}')" title="Click to toggle +1 bonus">${isHumanBonusSelected ? '⭐' : '☆'}</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML += `<p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 10px;">💡 Hover over a stat to see what it does. The cost to increase a stat increases as it gets higher.</p>`;
    
    if (isHuman) {
        container.innerHTML += `<p style="color: var(--text-muted); margin-top: 10px;">${humanBonusStats.length}/${maxHumanBonus} bonus stats selected</p>`;
    }
    
    stats.forEach(stat => {
        const base = character.stats[stat] ?? 8;
        const humanBonus = isHuman && humanBonusStats.includes(stat) ? 1 : 0;
        const raceBonus = bonuses[stat] || 0;
        const total = base + humanBonus + raceBonus;
        
        const maxBase = (humanBonus + raceBonus) > 0 ? 16 : 15;
        const currentCost = getStatCost(base);
        const nextCost = getStatCost(base + 1);
        const costDiff = nextCost - currentCost;
        
        const minusBtn = document.getElementById('btn-' + stat + '-minus');
        const plusBtn = document.getElementById('btn-' + stat + '-plus');
        
        if (minusBtn) minusBtn.disabled = base <= 8;
        if (plusBtn) {
            plusBtn.disabled = pointsRemaining < costDiff || (base >= maxBase) || (total >= 16);
        }
    });
    
    const canProceed = pointsRemaining > 0 ? false : (!isHuman || humanBonusStats.length === maxHumanBonus);
    document.getElementById('stats-next').disabled = !canProceed;
}

function renderProficiencies() {
    const grid = document.getElementById('proficiencies-grid');
    const charClass = classes.find(c => c.id === character.classId);
    const classSkillOptions = charClass?.proficiencies?.skills?.options || [];
    const extraSkills = getExtraSkillCount();
    const maxSkills = (charClass?.proficiencies?.skills?.count || 2) + extraSkills;
    
    document.getElementById('proficiency-instruction').textContent = `Select up to ${maxSkills} skills`;
    
    grid.innerHTML = classSkillOptions.map(skill => `
        <label class="checkbox-item">
            <input type="checkbox" value="${skill.name}" data-attribute="${skill.attribute}" onchange="toggleProficiency('${skill.name}')">
            ${skill.name} <span style="color: var(--text-muted); font-size: 0.85rem;">(${skill.attribute.substring(0, 3).toUpperCase()})</span>
        </label>
    `).join('');
}

function renderAbilities() {
    const grid = document.getElementById('abilities-grid');
    const charLevel = character.level || 1;
    const classId = character.classId;
    const race = races.find(r => r.id === character.raceId);
    const raceName = race ? race.name : '';
    const raceAbilities = getRaceAbilities().filter(a => !a.startsWith('+1 '));
    const classFeaturesData = getClassFeaturesForLevel(classId, charLevel);
    const allAbilitiesList = [...new Set([...raceAbilities, ...classFeaturesData.features.map(f => f.name)])];
    
    let html = '';
    
    if (raceAbilities.length > 0) {
        html += `<h4 style="margin: 15px 0 10px; color: var(--accent);">Race Abilities</h4>`;
        raceAbilities.forEach(a => {
            const tooltip = `Locked: ${a} is a ${raceName} race ability (available at creation)`;
            html += `
                <label class="checkbox-item race-ability">
                    <input type="checkbox" checked disabled>
                    ${a} 🔒
                    <span title="${tooltip}" style="cursor: help; margin-left: 5px; color: #888;">ⓘ</span>
                </label>
            `;
        });
    }
    
    const currentClassFeatures = classFeaturesData.features.filter(f => f.level <= charLevel);
    const pastClassFeatures = classFeaturesData.features.filter(f => f.level <= charLevel).map(f => f.name);
    const futureClassFeatures = classFeaturesData.features.filter(f => f.level > charLevel);
    
    if (currentClassFeatures.length > 0) {
        html += `<h4 style="margin: 15px 0 10px; color: var(--accent);">Class Features (Level ${charLevel})</h4>`;
        currentClassFeatures.forEach(f => {
            const isSelected = (character.abilityIds || []).includes(f.name);
            const tooltip = isSelected 
                ? `Active: ${f.name} (${classId} - Level ${f.level})`
                : `Available: ${f.name} (${classId} - Level ${f.level})`;
            html += `
                <label class="checkbox-item ${isSelected ? 'race-ability' : ''}">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} ${isSelected ? 'disabled' : ''}>
                    ${f.name} ${isSelected ? '✓' : ''}
                    <span title="${tooltip}" style="cursor: help; margin-left: 5px; color: #888;">ⓘ</span>
                </label>
            `;
        });
    }
    
    if (futureClassFeatures.length > 0) {
        const nextFeature = futureClassFeatures[0];
        html += `<h4 style="margin: 15px 0 10px; color: var(--text-muted);">Future Class Features</h4>`;
        futureClassFeatures.forEach(f => {
            const tooltip = `Locked: ${f.name} available at ${classId} Level ${f.level}`;
            html += `
                <label class="checkbox-item disabled" style="opacity: 0.5;">
                    <input type="checkbox" disabled>
                    ${f.name} (Lvl ${f.level})
                    <span title="${tooltip}" style="cursor: help; margin-left: 5px; color: #888;">ⓘ</span>
                </label>
            `;
        });
    }
    
    const classOptions = classFeaturesData.options.filter(o => o.level <= charLevel);
    if (classOptions.length > 0) {
        html += `<h4 style="margin: 15px 0 10px; color: var(--accent);">Class Options (Choose One)</h4>`;
        
        const exclusiveGroups = {};
        classOptions.forEach(o => {
            if (!exclusiveGroups[o.exclusiveGroup]) exclusiveGroups[o.exclusiveGroup] = [];
            exclusiveGroups[o.exclusiveGroup].push(o);
        });
        
        for (const groupName in exclusiveGroups) {
            const groupOptions = exclusiveGroups[groupName];
            html += `<p style="color: var(--text-muted); margin: 10px 0 5px;">${groupName}:</p>`;
            groupOptions.forEach(o => {
                const isSelected = (character.abilityIds || []).includes(o.name);
                const tooltip = isSelected
                    ? `Selected: ${o.name} (${classId} - Level ${o.level})`
                    : `Available: ${o.name} (${classId} - Level ${o.level})`;
                const isDisabled = !isSelected && groupOptions.some(go => go.name !== o.name && (character.abilityIds || []).includes(go.name));
                html += `
                    <label class="checkbox-item ${isSelected ? 'race-ability' : ''}" style="${isDisabled && !isSelected ? 'opacity: 0.5;' : ''}">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} ${isDisabled ? 'disabled' : ''} onchange="toggleAbility('${o.name}')">
                        ${o.name}
                        <span title="${tooltip}" style="cursor: help; margin-left: 5px; color: #888;">ⓘ</span>
                    </label>
                `;
            });
        }
    }
    
    grid.innerHTML = html;
}

function renderFeats() {
    const grid = document.getElementById('feats-grid');
    const charLevel = character.level || 1;
    const extraFeats = getExtraFeatCount();
    const maxFeatsFromLevel = Math.floor(charLevel / 4);
    const totalMaxFeats = maxFeatsFromLevel + extraFeats;
    const currentFeatCount = (character.featIds || []).length;
    
    const featsNote = document.getElementById('feats-note');
    
    if (totalMaxFeats > 0) {
        featsNote.textContent = `Select up to ${totalMaxFeats} feat${totalMaxFeats > 1 ? 's' : ''} (${currentFeatCount}/${totalMaxFeats} selected)`;
    } else {
        featsNote.textContent = `Feats available at level 4 (${currentFeatCount}/0 selected)`;
    }
    
    grid.innerHTML = feats.map(f => {
        const isSelected = (character.featIds || []).includes(f);
        const isDisabled = !isSelected && currentFeatCount >= totalMaxFeats;
        return `
            <label class="checkbox-item ${isDisabled ? 'disabled' : ''}" style="${isDisabled && !isSelected ? 'opacity: 0.5;' : ''}">
                <input type="checkbox" value="${f}" ${isSelected ? 'checked' : ''} ${isDisabled ? 'disabled' : ''} onchange="toggleFeat('${f}')">
                ${f}
            </label>
        `;
    }).join('');
    
    const featsHeading = document.querySelector('#step-abilities h3:last-of-type');
    if (featsHeading) {
        featsHeading.style.color = totalMaxFeats === 0 ? '#888' : '';
    }
}

function renderSavedCharacters() {
    const chars = JSON.parse(localStorage.getItem('dnd-characters') || '[]');
    const list = document.getElementById('character-list');
    
    if (chars.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted);">No saved characters yet.</p>';
        return;
    }
    
    list.innerHTML = chars.map((c, i) => {
        const totalLevel = getTotalLevel(c);
        const classInfo = getCharacterClasses(c).map(cc => {
            const cls = classes.find(cl => cl.id === cc.classId);
            return cls ? `${cls.name} ${cc.level}` : cc.classId;
        }).join(' / ');
        
        return `
            <div class="character-item" data-index="${i}">
                <div>
                    <strong>${c.name || 'Unnamed'}</strong>
                    <span style="color: var(--text-muted);"> - Level ${totalLevel} ${c.raceName}</span>
                    <span style="color: var(--accent);"> [${classInfo}]</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="view-btn" onclick="viewCharacter(${i})">View</button>
                    <button class="level-btn" onclick="openLevelUp(${i})">Level Up</button>
                    <button class="delete-btn" onclick="confirmDeleteCharacter(${i})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderSummary() {
    const cls = classes.find(c => c.id === character.classId);
    const race = races.find(r => r.id === character.raceId);
    
    const bonuses = getRaceBonuses();
    const statValues = stats.map(stat => {
        const base = character.stats[stat] || 8;
        const bonus = bonuses[stat] || 0;
        return { name: statLabels[stat], base, bonus, total: base + bonus };
    });
    
    document.getElementById('summary-content').innerHTML = `
        <div class="summary-row">
            <span>Class</span>
            <span>${cls ? cls.name : '-'}</span>
        </div>
        <div class="summary-row">
            <span>Race</span>
            <span>${race ? race.name : ''} ${character.subraceName || ''}</span>
        </div>
        <div class="summary-row">
            <span><strong>Stats</strong></span>
        </div>
        ${statValues.map(s => `
            <div class="summary-row">
                <span>${s.name}</span>
                <span>${s.base} + ${s.bonus} = <strong>${s.total}</strong></span>
            </div>
        `).join('')}
        <div class="summary-row">
            <span><strong>Proficiencies</strong></span>
            <span>${character.proficiencyIds.join(', ') || 'None'}</span>
        </div>
        <div class="summary-row">
            <span><strong>Abilities</strong></span>
            <span>${character.abilityIds.join(', ') || 'None'}</span>
        </div>
        <div class="summary-row">
            <span><strong>Feats</strong></span>
            <span>${character.featIds.join(', ') || 'None'}</span>
        </div>
    `;
}
