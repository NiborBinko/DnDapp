function renderClasses() {
    const grid = document.getElementById('class-grid');
    const state = DnDState.character;
    const gameData = DnDState.gameData;
    grid.innerHTML = gameData.classes.map(c => {
        const statAbbr = gameData.statLabels[c.primaryStat] || '';
        const hitDie = c.hitDie || 8;
        const saveThrows = c.proficiencies?.savingThrows?.join(', ') || '';
        return `
        <div class="card" onclick="selectClass('${c.id}')" id="class-${c.id}" data-tooltip="Primary Stat: ${statAbbr}\nHit Die: d${hitDie}\nSaving Throws: ${saveThrows}\n\n${c.desc}">
            <h3>${c.name} <span style="color: var(--accent); font-size: 0.9rem;">(${statAbbr})</span></h3>
            <p>${c.desc}</p>
        </div>
    `}).join('');
}

function renderRaces() {
    const grid = document.getElementById('race-grid');
    const state = DnDState.character;
    const gameData = DnDState.gameData;
    grid.innerHTML = gameData.races.map(r => {
        const bonusParts = [];
        if (r.bonuses) {
            if (r.bonuses.chosen) {
                bonusParts.push(`+1 on ${r.bonuses.chosen} stats`);
            } else {
                for (const [stat, val] of Object.entries(r.bonuses)) {
                    if (stat !== 'chosen') {
                        bonusParts.push(`+${val} ${gameData.statLabels[stat]}`);
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
    const gameData = DnDState.gameData;
    const subs = gameData.subraces[raceId] || [];
    
    console.log('renderSubraces for', raceId, 'found:', subs); // Debug
    
    if (subs.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted);">No subraces available for this race</p>';
        return;
    }
    
    grid.innerHTML = subs.map(s => {
            const bonusParts = [];
            if (s.bonuses) {
                for (const [stat, val] of Object.entries(s.bonuses)) {
                    bonusParts.push(`+${val} ${gameData.statLabels[stat]}`);
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
    const state = DnDState.character;
    const gameData = DnDState.gameData;
    const ui = DnDState.ui;
    const bonuses = getRaceBonuses();
    const selectedClass = gameData.classes.find(c => c.id === state.classId);
    const primaryStat = selectedClass?.primaryStat || null;
    
    ui.pointsRemaining = StatsUtils.getPointsRemaining(state);
    document.getElementById('points-remaining').textContent = ui.pointsRemaining;
    
    const isHuman = state.raceId === 'human';
    let humanHint = '';
    let maxHumanBonus = 0;
    if (isHuman && bonuses.chosen) {
        maxHumanBonus = bonuses.chosen;
        humanHint = `<p style="color: var(--text-muted); margin-bottom: 15px;">Click the star to select bonus stats (select ${maxHumanBonus})</p>`;
    }
    
    const primaryStatHint = primaryStat ? `<p style="color: var(--accent); margin-bottom: 10px;">⭐ Your ${selectedClass.name}'s primary stat is ${gameData.statLabels[primaryStat]} - consider prioritizing this!</p>` : '';
    
    container.innerHTML = humanHint + primaryStatHint + stats.map(stat => {
        const statData = StatsUtils.formatStatRow(state, stat, bonuses, gameData, selectedClass);
        
        return `
            <div class="stat-row ${statData.isPrimary ? 'primary-stat-row' : ''}" data-tooltip="${statData.statDesc}${statData.classPrimaryHint}">
                <div class="stat-name">${statData.statLabel}${statData.isPrimary ? ' ⭐' : ''}</div>
                <div class="stat-controls">
                    <button class="stat-btn" onclick="adjustStat('${stat}', -1)" id="btn-${stat}-minus">-</button>
                    <div class="stat-value">${statData.base}</div>
                    <button class="stat-btn ${statData.costDiff > 1 ? 'cost-2' : ''}" onclick="adjustStat('${stat}', 1)" id="btn-${stat}-plus">+${statData.costDiff > 1 ? ` (${statData.costDiff})` : ''}</button>
                    <div class="stat-bonus" data-tooltip="Race bonus - added after point buy, doesn't cost points">${(statData.humanBonus + statData.raceBonus) > 0 ? '+' + (statData.humanBonus + statData.raceBonus) : ''}</div>
                    <div class="stat-total">${statData.total}</div>
                    <div class="stat-modifier" data-tooltip="Modifier = (Stat - 10) ÷ 2&#10;Added to dice rolls using this stat">${statData.modifier >= 0 ? '+' : ''}${statData.modifier}</div>
                    ${isHuman ? `<button class="stat-btn human-bonus-btn ${statData.isHumanBonusSelected ? 'selected' : ''}" data-tooltip="Click to toggle +1 bonus (Human trait)" onclick="toggleHumanBonusStat('${stat}')">${statData.isHumanBonusSelected ? '⭐' : '☆'}</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML += `<p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 10px;">💡 Hover over a stat to see what it does. The cost to increase a stat increases as it gets higher.</p>`;
    
    if (isHuman) {
        container.innerHTML += `<p style="color: var(--text-muted); margin-top: 10px;">${(state.humanBonusStats || []).length}/${maxHumanBonus} bonus stats selected</p>`;
    }
    
    stats.forEach(stat => {
        const canIncrease = StatsUtils.canIncreaseStat(state, stat, bonuses);
        
        const minusBtn = document.getElementById('btn-' + stat + '-minus');
        const plusBtn = document.getElementById('btn-' + stat + '-plus');
        const base = state.stats[stat] ?? 8;
        
        if (minusBtn) minusBtn.disabled = base <= 8;
        if (plusBtn) {
            const costDiff = StatsUtils.getCostToIncrease(base);
            plusBtn.disabled = ui.pointsRemaining < costDiff || !canIncrease.canIncrease;
        }
    });
    
    const canProceed = StatsUtils.canProceedFromStats(state, bonuses);
    document.getElementById('stats-next').disabled = !canProceed;
}

function renderProficiencies() {
    const grid = document.getElementById('proficiencies-grid');
    const state = DnDState.character;
    const gameData = DnDState.gameData;
    
    if (!state.classId) {
        grid.innerHTML = '<p style="color: var(--text-muted);">Select a class first to see proficiencies.</p>';
        return;
    }
    
    const charClass = gameData.classes.find(c => c.id === state.classId);
    if (!charClass) {
        grid.innerHTML = '<p style="color: var(--text-muted);">Select a class first to see proficiencies.</p>';
        return;
    }
    
    const profs = AbilitySystem.getProficiencies(state, gameData, state.classId);
    const classSkillOptions = charClass?.proficiencies?.skills?.options || [];
    const maxSkills = ProficiencyUtils.getMaxSkills(state, gameData);
    const skillDesc = getSkillDescriptions();
    let html = '';
    
    html += `<h4 class="section-header">Skills (${maxSkills} to select)</h4>`;
    html += `<div class="checkbox-grid">`;
    
    const skillProfs = (profs.skills || []).reduce((acc, s) => { acc[s.name] = s; return acc; }, {});
    html += classSkillOptions.map(skill => {
        const desc = skillDesc[skill.name] || skill.description || '';
        const raceProf = skillProfs[skill.name];
        const isFromRace = !!raceProf;
        const isSelected = (state.proficiencyIds || []).includes(skill.name) || isFromRace;
        
        const originText = ProficiencyUtils.formatOrigin(raceProf?.origin);
        
        return `
        <label class="checkbox-item ${isFromRace ? 'race-ability' : ''}" data-tooltip="${desc}${originText}">
            <input type="checkbox" value="${skill.name}" data-attribute="${skillDesc[skill.name]?.match(/\([A-Z]+\)/)?.[1] || ''}" 
                ${isSelected ? 'checked' : ''} 
                ${isFromRace ? 'disabled' : ''} 
                onchange="toggleProficiency('${skill.name}')">
            ${skill.name} <span style="color: var(--text-muted); font-size: 0.85rem;">(${skillDesc[skill.name]?.match(/\([A-Z]+\)/)?.[1] || ''})</span>
            ${isFromRace ? ' 🔒' : ''}
        </label>
    `}).join('');
    html += `</div>`;
    
    const processedArmor = ProficiencyUtils.getCombinedArmorProficiencies(state, gameData);
    if (processedArmor.length > 0) {
        html += `<h4 class="section-header">Armor Proficiencies</h4>`;
        html += `<div class="checkbox-grid">`;
        html += processedArmor.map(arm => {
            const desc = getProficiencyDescriptions().armor[arm.name] || '';
            const originText = ProficiencyUtils.formatOrigin(arm.origin);
            const tooltip = originText ? `${desc}${originText}` : desc;
            return `
            <label class="checkbox-item race-ability" data-tooltip="${tooltip}">
                <input type="checkbox" checked disabled>
                ${arm.name.charAt(0).toUpperCase() + arm.name.slice(1)} 🔒
            </label>
        `}).join('');
        html += `</div>`;
    }
    
    const processedWeapons = ProficiencyUtils.getCombinedWeaponProficiencies(state, gameData);
    if (processedWeapons.length > 0) {
        html += `<h4 class="section-header">Weapon Proficiencies</h4>`;
        html += `<div class="checkbox-grid">`;
        html += processedWeapons.map(wp => {
            const desc = getProficiencyDescriptions().weapons[wp.name] || '';
            const originText = ProficiencyUtils.formatOrigin(wp.origin);
            const tooltip = originText ? `${desc}${originText}` : desc;
            return `
            <label class="checkbox-item race-ability" data-tooltip="${tooltip}">
                <input type="checkbox" checked disabled>
                ${wp.name.charAt(0).toUpperCase() + wp.name.slice(1)} 🔒
            </label>
        `}).join('');
        html += `</div>`;
    }
    
    const raceToolOptions = ProficiencyUtils.getToolOptions(state, gameData);
    if (raceToolOptions && raceToolOptions.length > 0) {
        raceToolOptions.forEach(toolOption => {
            html += `<h4 class="section-header">${toolOption.ability} (Select ${toolOption.count})</h4>`;
            const originText = ProficiencyUtils.formatOrigin(toolOption.origin);
            html += `<div class="checkbox-grid">`;
            html += toolOption.options.map(tool => {
                const selected = (state.toolSelectionIds || []).includes(tool);
                const desc = getProficiencyDescriptions().tools[tool] || '';
                
                return `
                <label class="checkbox-item" data-tooltip="${desc}${originText}">
                    <input type="checkbox" value="${tool}" 
                        ${selected ? 'checked' : ''} 
                        onchange="toggleToolSelection('${tool}')">
                    ${tool}
                </label>
            `}).join('');
            html += `</div>`;
        });
    }
    
    const processedTools = ProficiencyUtils.getClassTools(state, gameData);
    if (processedTools.length > 0) {
        html += `<h4 class="section-header">Tool Proficiencies</h4>`;
        html += `<div class="checkbox-grid">`;
        html += processedTools.map(tl => {
            const desc = getProficiencyDescriptions().tools[tl.name] || '';
            const originText = ProficiencyUtils.formatOrigin(tl.origin);
            const tooltip = originText ? `${desc}${originText}` : desc;
            return `
            <label class="checkbox-item race-ability" data-tooltip="${tooltip}">
                <input type="checkbox" checked disabled>
                ${tl.name} 🔒
            </label>
        `}).join('');
        html += `</div>`;
    }
    
    const classSaves = ProficiencyUtils.getSavingThrows(state, gameData);
    if (classSaves.length > 0) {
        html += `<h4 class="section-header">Saving Throws</h4>`;
        html += `<div class="checkbox-grid">`;
        html += classSaves.map(save => {
            const stat = save === 'strength' ? 'STR' : save === 'dexterity' ? 'DEX' : save === 'constitution' ? 'CON' : save === 'intelligence' ? 'INT' : save === 'wisdom' ? 'WIS' : 'CHA';
            const desc = getProficiencyDescriptions().savingThrows[save] || '';
            const source = 'Class: ' + charClass.name;
            
            return `
            <label class="checkbox-item race-ability" data-tooltip="${desc}\n\n📍 ${source}">
                <input type="checkbox" checked disabled>
                ${save.charAt(0).toUpperCase() + save.slice(1)} (${stat}) 🔒
            </label>
        `}).join('');
        html += `</div>`;
    }
    
    html += `<h4 class="section-header">Mastery (Coming Soon)</h4>`;
    html += `<p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">Weapon mastery allows you to deal extra damage with specific weapon types. This feature will be available in a future update.</p>`;
    html += `<div class="checkbox-grid">`;
    const masteryTypes = ['strength', 'dexterity', 'versatile'];
    html += masteryTypes.map(type => {
        const desc = getProficiencyDescriptions().mastery[type] || '';
        
        return `
        <label class="checkbox-item coming-soon" data-tooltip="${desc}">
            <input type="checkbox" disabled>
            ${type.charAt(0).toUpperCase() + type.slice(1)} 🔒
        </label>
    `}).join('');
    html += `</div>`;
    
    grid.innerHTML = html;
}

function renderAbilities() {
    const grid = document.getElementById('abilities-grid');
    const state = DnDState.character;
    const gameData = DnDState.gameData;
    const charLevel = state.level || 1;
    const classId = state.classId;
    const race = gameData.races.find(r => r.id === state.raceId);
    const raceName = race ? race.name : '';
    const raceAbilities = getRaceAbilities().filter(a => !a.startsWith('+1 '));
    const classFeaturesData = getClassFeaturesForLevel(classId, charLevel);
    const allAbilitiesList = [...new Set([...raceAbilities, ...classFeaturesData.features.map(f => f.name)])];
    
    let html = '';
    
    if (raceAbilities.length > 0) {
        html += `<h4 class="section-header">Race Abilities</h4>`;
        html += `<div class="checkbox-grid">`;
        raceAbilities.forEach(a => {
            const desc = getRaceAbilityDescriptions()[a] || '';
            const subraceName = state.subraceName;
            const origin = subraceName ? `\n\n📍 From: ${subraceName} subrace` : `\n\n📍 Race: ${raceName}`;
            html += `
                <label class="checkbox-item race-ability" data-tooltip="${desc}${origin}">
                    <input type="checkbox" checked disabled>
                    ${a} 🔒
                </label>
            `;
        });
        html += `</div>`;
    }
    
    const currentClassFeatures = classFeaturesData.features.filter(f => f.level <= charLevel);
    const futureClassFeatures = classFeaturesData.features.filter(f => f.level > charLevel);
    
    if (currentClassFeatures.length > 0) {
        html += `<h4 class="section-header">Class Features (Level ${charLevel})</h4>`;
        html += `<div class="checkbox-grid">`;
        currentClassFeatures.forEach(f => {
            const isSelected = (state.abilityIds || []).includes(f.name);
            const desc = getClassFeatureDescriptions()[f.name] || `Level ${f.level} ${classId} feature`;
            html += `
                <label class="checkbox-item ${isSelected ? 'race-ability' : ''}" data-tooltip="${desc}">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} ${isSelected ? 'disabled' : ''}>
                    ${f.name} ${isSelected ? '✓' : ''}
                </label>
            `;
        });
        html += `</div>`;
    }
    
    if (futureClassFeatures.length > 0) {
        const nextFeature = futureClassFeatures[0];
        html += `<h4 class="section-header" style="color: var(--text-muted);">Future Class Features</h4>`;
        html += `<div class="checkbox-grid">`;
        futureClassFeatures.forEach(f => {
            const desc = getClassFeatureDescriptions()[f.name] || `Available at ${classId} Level ${f.level}`;
            html += `
                <label class="checkbox-item future-item" data-tooltip="${desc}">
                    <input type="checkbox" disabled>
                    ${f.name} (Lvl ${f.level})
                </label>
            `;
        });
        html += `</div>`;
    }
    
    const classOptions = classFeaturesData.options.filter(o => o.level <= charLevel);
    if (classOptions.length > 0) {
        html += `<h4 class="section-header">Class Options (Choose One)</h4>`;
        html += `<div class="checkbox-grid">`;
        
        const exclusiveGroups = {};
        classOptions.forEach(o => {
            if (!exclusiveGroups[o.exclusiveGroup]) exclusiveGroups[o.exclusiveGroup] = [];
            exclusiveGroups[o.exclusiveGroup].push(o);
        });
        
        for (const groupName in exclusiveGroups) {
            const groupOptions = exclusiveGroups[groupName];
            html += `<p style="color: var(--text-muted); margin: 10px 0 5px;">${groupName}:</p>`;
            groupOptions.forEach(o => {
                const isSelected = (state.abilityIds || []).includes(o.name);
                const isDisabled = !isSelected && groupOptions.some(go => go.name !== o.name && (state.abilityIds || []).includes(go.name));
                const desc = getClassOptionDescriptions()[o.name] || getClassFeatureDescriptions()[o.name] || `Level ${o.level} ${classId} option`;
                html += `
                    <label class="checkbox-item ${isSelected ? 'race-ability' : ''} ${isDisabled && !isSelected ? 'option-disabled' : ''}" data-tooltip="${desc}">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} ${isDisabled ? 'disabled' : ''} onchange="toggleAbility('${o.name}')">
                        ${o.name}
                    </label>
                `;
            });
        }
        html += `</div>`;
    }
    
    grid.innerHTML = html;
}

function renderFeats() {
    const grid = document.getElementById('feats-grid');
    const state = DnDState.character;
    const gameData = DnDState.gameData;
    
    const totalMaxFeats = FeatsUtils.getMaxFeats(state);
    const currentFeatCount = (state.featIds || []).length;
    
    const featsNote = document.getElementById('feats-note');
    
    if (totalMaxFeats > 0) {
        featsNote.textContent = `Select up to ${totalMaxFeats} feat${totalMaxFeats > 1 ? 's' : ''} (${currentFeatCount}/${totalMaxFeats} selected)`;
    } else {
        featsNote.textContent = `Feats available at level 4 (${currentFeatCount}/0 selected)`;
    }
    
    const featsData = FeatsUtils.getFeatsForLevel(state, gameData);
    
    grid.innerHTML = featsData.map(f => `
        <label class="checkbox-item ${f.isDisabled ? 'feat-disabled' : ''}" data-tooltip="${f.description}">
            <input type="checkbox" value="${f.name}" ${f.isSelected ? 'checked' : ''} ${f.isDisabled ? 'disabled' : ''} onchange="toggleFeat('${f.name}')">
            ${f.name} ${f.hasWarning ? '⚠️' : ''}
        </label>
    `).join('');
    
    const featsHeading = document.querySelector('#step-abilities h3:last-of-type');
    if (featsHeading) {
        featsHeading.style.color = totalMaxFeats === 0 ? '#888' : '';
    }
}

function renderSavedCharacters() {
    const chars = DnDState.getSavedCharacters();
    const list = document.getElementById('character-list');
    const gameData = DnDState.gameData;
    
    if (chars.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted);">No saved characters yet.</p>';
        return;
    }
    
    list.innerHTML = chars.map((c, i) => {
        const totalLevel = CharacterEntity.getTotalLevel(c);
        const classInfo = CharacterEntity.getClasses(c).map(cc => {
            const cls = gameData.classes.find(cl => cl.id === cc.classId);
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
                    <button class="level-btn" onclick="return false">Level Up</button>
                    <button class="delete-btn" onclick="confirmDeleteCharacter(${i})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderSpells() {
    const grid = document.getElementById('spells-grid');
    const infoDiv = document.getElementById('spell-selection-info');
    const messageEl = document.getElementById('spellcaster-message');
    const state = DnDState.character;
    const gameData = DnDState.gameData;
    
    if (!state.classId) {
        grid.innerHTML = '<p>Please select a class first.</p>';
        document.getElementById('spells-next').disabled = true;
        return;
    }
    
    const isSpellcaster = SpellManager.isSpellcaster(state);
    const classLevel = state.level || 1;
    
    if (!isSpellcaster) {
        const charClass = gameData.classes.find(c => c.id === state.classId);
        messageEl.textContent = `${charClass.name} does not have spellcasting. No spells to select.`;
        messageEl.style.display = 'block';
        infoDiv.style.display = 'none';
        grid.innerHTML = '';
        document.getElementById('spells-next').disabled = false;
        return;
    }
    
    messageEl.style.display = 'none';
    infoDiv.style.display = 'block';
    
    const isArchetypeCaster = SpellManager.isArchetypeSpellcaster(state);
    const isWizard = SpellManager.isWizard(state);
    const isWarlock = SpellManager.isWarlock(state);
    const isPreparedCaster = SpellManager.isPreparedCaster(state);
    
    const spellSlots = SpellManager.calculateSpellSlots(state);
    const highestSlotLevel = SpellManager.getHighestSpellSlotLevel(state);
    
    if (!state.cantripsKnown) state.cantripsKnown = [];
    if (!state.knownSpells) state.knownSpells = [];
    if (!state.preparedSpells) state.preparedSpells = [];
    if (!state.invocations) state.invocations = [];
    if (!state.spellbook) state.spellbook = [];
    
    const currentCantrips = state.cantripsKnown.length;
    const classCantrips = SpellManager.getCantripsKnownForClass(state.classId, classLevel);
    
    let slotsDisplay = '';
    const slotParts = [];
    for (let lvl = 1; lvl <= highestSlotLevel; lvl++) {
        if (spellSlots[lvl] > 0) {
            slotParts.push(`${spellSlots[lvl]}x Lvl${lvl}`);
        }
    }
    slotsDisplay = slotParts.join(', ') || 'None';
    
    let cantripsDisplay = '';
    if (isArchetypeCaster) {
        const ekCantrips = SpellManager.getArchetypeCantripsKnown(state, 'eldritchKnight');
        const atCantrips = SpellManager.getArchetypeCantripsKnown(state, 'arcaneTrickster');
        const maxArchetypeCantrips = Math.max(ekCantrips, atCantrips);
        cantripsDisplay = `${currentCantrips}/${Math.max(classCantrips, maxArchetypeCantrips)}`;
    } else {
        cantripsDisplay = `${currentCantrips}/${classCantrips}`;
    }
    
    let archetypeInfo = '';
    if (isArchetypeCaster) {
        const selectedOptions = state.selectedOptions || [];
        const archetypes = selectedOptions.filter(o => 
            o.optionId === 'eldritchKnight' || o.optionId === 'arcaneTrickster'
        ).map(o => {
            const name = o.optionId === 'eldritchKnight' ? 'Eldritch Knight' : 'Arcane Trickster';
            const spellsKnown = SpellManager.getArchetypeSpellsKnown(state, o.optionId);
            return `${name} (${spellsKnown} spells)`;
        }).join(', ');
        archetypeInfo = `<p><strong>Archetype:</strong> ${archetypes}</p>`;
    }
    
    infoDiv.innerHTML = `
        <p><strong>Spell Slots:</strong> ${slotsDisplay}</p>
        <p><strong>Cantrips:</strong> ${cantripsDisplay} selected</p>
        ${archetypeInfo}
        ${isWizard ? `<p><strong>Spellbook:</strong> ${state.spellbook.length} spells (unlimited, starts with 6)</p>` : ''}
        ${isWarlock ? `<p><strong>Invocations:</strong> ${state.invocations.length}/${SpellManager.getInvocationsAtLevel(classLevel)} available</p>` : ''}
    `;
    
    let html = '';
    
    if (isArchetypeCaster) {
        html += renderArchetypeSpells(state, classLevel, spellSlots);
    } else {
        html += renderClassSpells(state, classLevel, spellSlots, isWizard, isWarlock);
    }
    
    if (isWarlock) {
        html += renderWarlockInvocations(state, classLevel);
    }
    
    if (html === '') {
        html = '<p>No spells available at your level.</p>';
    }
    
    grid.innerHTML = html;
    
    document.getElementById('spells-next').disabled = false;
}

function renderArchetypeSpells(state, classLevel, spellSlots) {
    let html = '';
    
    const selectedOptions = state.selectedOptions || [];
    const archetypeOptions = selectedOptions.filter(o => 
        o.optionId === 'eldritchKnight' || o.optionId === 'arcaneTrickster'
    );
    
    archetypeOptions.forEach(option => {
        const archetypeId = option.optionId;
        const spellList = SpellManager.getClassSpellList(archetypeId);
        if (!spellList) return;
        
        const archetypeName = archetypeId === 'eldritchKnight' ? 'Eldritch Knight' : 'Arcane Trickster';
        const effectiveLevel = option.level - (spellList.effectiveCasterLevelStart - 1);
        
        const cantripsKnown = SpellManager.getArchetypeCantripsKnown(state, archetypeId);
        const spellsKnown = SpellManager.getArchetypeSpellsKnown(state, archetypeId);
        const availableSpells = SpellManager.getArchetypeAvailableSpells(state, archetypeId);
        
        const currentCantrips = state.cantripsKnown.filter(id => {
            const spell = SpellManager.getSpell(id);
            return spell && spell.level === 0;
        }).length;
        
        const currentSpells = state.knownSpells.length;
        
        const cantripsInList = availableSpells.filter(s => s.level === 0);
        if (cantripsInList.length > 0 && cantripsKnown > 0) {
            html += `<h4 class="section-header">${archetypeName} - Cantrips (${currentCantrips}/${cantripsKnown})</h4>`;
            html += `<div class="checkbox-grid">`;
            
            cantripsInList.forEach(spellData => {
                const spell = SpellManager.getSpell(spellData.spellId);
                if (!spell) return;
                
                const isSelected = state.cantripsKnown.includes(spellData.spellId);
                const isDisabled = !isSelected && currentCantrips >= cantripsKnown;
                const desc = SpellManager.getSpellDescription(spellData.spellId);
                
                html += `
                    <label class="checkbox-item ${isDisabled && !isSelected ? 'spell-disabled' : ''}" data-tooltip="${desc.replace(/"/g, '&quot;')}">
                        <input type="checkbox" value="${spellData.spellId}" 
                            ${isSelected ? 'checked' : ''} 
                            ${isDisabled ? 'disabled' : ''} 
                            onchange="toggleCantrip('${spellData.spellId}')">
                        ${spell.name}
                    </label>
                `;
            });
            html += `</div>`;
        }
        
        for (let level = 1; level <= Math.min(effectiveLevel, 4); level++) {
            const spellsAtLevel = availableSpells.filter(s => s.level === level);
            if (spellsAtLevel.length === 0) continue;
            
            const levelName = level === 1 ? '1st' : level === 2 ? '2nd' : level === 3 ? '3rd' : `${level}th`;
            
            const spellsAtThisLevel = (state.knownSpells || []).filter(id => {
                const s = SpellManager.getSpell(id);
                return s && s.level === level;
            }).length;
            
            html += `<h4 class="section-header">${archetypeName} - ${levelName} Level Spells (${spellsAtThisLevel}/${spellSlots[level] || 0})</h4>`;
            html += `<div class="checkbox-grid">`;
            
            spellsAtLevel.forEach(spellData => {
                const spell = SpellManager.getSpell(spellData.spellId);
                if (!spell) return;
                
                const isSelected = state.knownSpells.includes(spellData.spellId);
                const isDisabled = !isSelected && spellsAtThisLevel >= (spellSlots[level] || 0);
                const desc = SpellManager.getSpellDescription(spellData.spellId);
                
                html += `
                    <label class="checkbox-item ${isDisabled && !isSelected ? 'spell-disabled' : ''}" data-tooltip="${desc.replace(/"/g, '&quot;')}">
                        <input type="checkbox" value="${spellData.spellId}" 
                            ${isSelected ? 'checked' : ''} 
                            ${isDisabled ? 'disabled' : ''} 
                            onchange="toggleKnownSpell('${spellData.spellId}')">
                        ${spell.name}
                    </label>
                `;
            });
            html += `</div>`;
        }
    });
    
    return html;
}

function renderClassSpells(state, classLevel, spellSlots, isWizard, isWarlock) {
    const spellList = SpellManager.getClassSpellList(state.classId);
    if (!spellList) return '<p>Spell list not available for this class.</p>';
    
    const cantripsKnown = SpellManager.getCantripsKnownForClass(state.classId, classLevel);
    const innateSpells = SpellManager.getInnateSpellsForClass(state.classId, classLevel);
    const availableSpells = SpellManager.getAvailableSpellsForClass(state.classId);
    
    const currentCantrips = state.cantripsKnown.length;
    
    let html = '';
    
    const cantripsInList = availableSpells.filter(s => s.level === 0);
    if (cantripsInList.length > 0 && cantripsKnown > 0) {
        html += `<h4 class="section-header">Cantrips (${currentCantrips}/${cantripsKnown})</h4>`;
        html += `<div class="checkbox-grid">`;
        
        cantripsInList.forEach(spellData => {
            const spell = SpellManager.getSpell(spellData.spellId);
            if (!spell) return;
            
            const isInnate = innateSpells.some(s => s.spellId === spellData.spellId);
            const isSelected = state.cantripsKnown.includes(spellData.spellId);
            const isDisabled = !isSelected && currentCantrips >= cantripsKnown;
            
            const desc = SpellManager.getSpellDescription(spellData.spellId);
            
            html += `
                <label class="checkbox-item ${isInnate ? 'innate-spell' : ''} ${isDisabled && !isSelected ? 'spell-disabled' : ''}" data-tooltip="${desc.replace(/"/g, '&quot;')}">
                    <input type="checkbox" value="${spellData.spellId}" 
                        ${isSelected ? 'checked' : ''} 
                        ${isDisabled || isInnate ? 'disabled' : ''} 
                        onchange="toggleCantrip('${spellData.spellId}')">
                    ${spell.name}${isInnate ? ' 🔒' : ''}
                </label>
            `;
        });
        html += `</div>`;
    }
    
    if (innateSpells.length > 0) {
        html += `<h4 class="section-header" style="color: var(--accent);">Innate Spells (Auto-Granted)</h4>`;
        html += `<div class="checkbox-grid">`;
        innateSpells.forEach(spellData => {
            const spell = SpellManager.getSpell(spellData.spellId);
            if (!spell) return;
            
            const desc = SpellManager.getSpellDescription(spellData.spellId);
            
            html += `
                <label class="checkbox-item race-ability" data-tooltip="${desc.replace(/"/g, '&quot;')}">
                    <input type="checkbox" checked disabled>
                    ${spell.name} 🔒
                </label>
            `;
        });
        html += `</div>`;
    }
    
    const highestLevel = isWizard ? Math.max(SpellManager.getHighestSpellSlotLevel(state), 1) : SpellManager.getHighestSpellSlotLevel(state);
    
    for (let level = 1; level <= Math.min(highestLevel, 5); level++) {
        const spellsAtLevel = availableSpells.filter(s => s.level === level);
        if (spellsAtLevel.length === 0) continue;
        
        const isWizardAtLevel = isWizard && level <= SpellManager.getHighestSpellSlotLevel(state);
        
        const levelName = level === 1 ? '1st' : level === 2 ? '2nd' : level === 3 ? '3rd' : `${level}th`;
        
        let spellCountNote = '';
        if (isWizardAtLevel) {
            spellCountNote = ' (Spellbook - no limit)';
        } else if (spellSlots[level] !== undefined) {
            const spellCountForLevel = (state.knownSpells || []).filter(id => {
                const s = SpellManager.getSpell(id);
                return s && s.level === level;
            }).length;
            spellCountNote = ` (${spellCountForLevel}/${spellSlots[level] || 0})`;
        }
        
        html += `<h4 class="section-header">${levelName} Level Spells${spellCountNote}</h4>`;
        html += `<div class="checkbox-grid">`;
        
        spellsAtLevel.forEach(spellData => {
            const spell = SpellManager.getSpell(spellData.spellId);
            if (!spell) return;
            
            let isSelected = false;
            let isDisabled = false;
            
            if (isWizard) {
                isSelected = state.spellbook.includes(spellData.spellId);
            } else {
                isSelected = state.knownSpells.includes(spellData.spellId);
                const spellsAtThisLevel = (state.knownSpells || []).filter(id => {
                    const s = SpellManager.getSpell(id);
                    return s && s.level === level;
                }).length;
                isDisabled = !isSelected && spellsAtThisLevel >= (spellSlots[level] || 0);
            }
            
            const desc = SpellManager.getSpellDescription(spellData.spellId);
            const toggleFn = isWizard ? 'toggleSpellbookSpell' : 'toggleKnownSpell';
            
            html += `
                <label class="checkbox-item ${isDisabled && !isSelected ? 'spell-disabled' : ''}" data-tooltip="${desc.replace(/"/g, '&quot;')}">
                    <input type="checkbox" value="${spellData.spellId}" 
                        ${isSelected ? 'checked' : ''} 
                        ${isDisabled ? 'disabled' : ''} 
                        onchange="${toggleFn}('${spellData.spellId}')">
                    ${spell.name}
                </label>
            `;
        });
        html += `</div>`;
    }
    
    return html;
}

function renderWarlockInvocations(state, classLevel) {
    let html = '';
    
    const invocationsAvailable = SpellManager.getInvocationsAvailable(state);
    const invocationsKnown = SpellManager.getInvocationsKnown(state);
    const invocationsAtLevel = SpellManager.getInvocationsAtLevel(classLevel);
    
    if (invocationsAvailable.length > 0 && invocationsAtLevel > 0) {
        html += `<h4 class="section-header" style="color: var(--accent);">Eldritch Invocations (${invocationsKnown.length}/${invocationsAtLevel})</h4>`;
        html += `<div class="checkbox-grid">`;
        
        invocationsAvailable.forEach(invId => {
            const isSelected = invocationsKnown.includes(invId);
            const isDisabled = !isSelected && invocationsKnown.length >= invocationsAtLevel;
            
            const invName = invId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const invDesc = 'An eldritch invocation that grants additional abilities. Check the Player\'s Handbook for details.';
            
            html += `
                <label class="checkbox-item ${isDisabled && !isSelected ? 'spell-disabled' : ''}" data-tooltip="${invDesc.replace(/"/g, '&quot;')}">
                    <input type="checkbox" value="${invId}" 
                        ${isSelected ? 'checked' : ''} 
                        ${isDisabled ? 'disabled' : ''} 
                        onchange="toggleInvocation('${invId}')">
                    ${invName}
                </label>
            `;
        });
        html += `</div>`;
    }
    
    return html;
}

function toggleCantrip(spellId) {
    const state = DnDState.character;
    const classLevel = state.level || 1;
    const cantripsKnown = SpellManager.getCantripsKnownForClass(state.classId, classLevel);
    const currentCantrips = (state.cantripsKnown || []).length;
    
    if (!state.cantripsKnown) state.cantripsKnown = [];
    
    const idx = state.cantripsKnown.indexOf(spellId);
    if (idx > -1) {
        state.cantripsKnown.splice(idx, 1);
    } else {
        if (currentCantrips < cantripsKnown) {
            state.cantripsKnown.push(spellId);
        } else {
            event.target.checked = false;
            return;
        }
    }
    
    renderSpells();
}

function toggleKnownSpell(spellId) {
    const state = DnDState.character;
    const spellSlots = SpellManager.calculateSpellSlots(state);
    const spell = SpellManager.getSpell(spellId);
    if (!spell) return;
    
    const spellsAtThisLevel = (state.knownSpells || []).filter(id => {
        const s = SpellManager.getSpell(id);
        return s && s.level === spell.level;
    }).length;
    
    if (!state.knownSpells) state.knownSpells = [];
    
    const idx = state.knownSpells.indexOf(spellId);
    if (idx > -1) {
        state.knownSpells.splice(idx, 1);
    } else {
        if (spellsAtThisLevel < (spellSlots[spell.level] || 0)) {
            state.knownSpells.push(spellId);
        } else {
            event.target.checked = false;
            return;
        }
    }
    
    renderSpells();
}

function toggleSpellbookSpell(spellId) {
    const state = DnDState.character;
    if (!state.spellbook) state.spellbook = [];
    
    const idx = state.spellbook.indexOf(spellId);
    if (idx > -1) {
        state.spellbook.splice(idx, 1);
    } else {
        state.spellbook.push(spellId);
    }
    
    renderSpells();
}

function toggleInvocation(invId) {
    const state = DnDState.character;
    const classLevel = state.level || 1;
    const invocationsAtLevel = SpellManager.getInvocationsAtLevel(classLevel);
    const currentInvocations = (state.invocations || []).length;
    
    if (!state.invocations) state.invocations = [];
    
    const idx = state.invocations.indexOf(invId);
    if (idx > -1) {
        state.invocations.splice(idx, 1);
    } else {
        if (currentInvocations < invocationsAtLevel) {
            state.invocations.push(invId);
        } else {
            event.target.checked = false;
            return;
        }
    }
    
    renderSpells();
}

function renderSummary() {
    const state = DnDState.character;
    const gameData = DnDState.gameData;
    const cls = gameData.classes.find(c => c.id === state.classId);
    const race = gameData.races.find(r => r.id === state.raceId);
    
    const bonuses = getRaceBonuses();
    const statValues = stats.map(stat => {
        const base = state.stats[stat] || 8;
        const bonus = bonuses[stat] || 0;
        return { name: gameData.statLabels[stat], base, bonus, total: base + bonus };
    });
    
    const isSpellcaster = SpellManager.isSpellcaster(state);
    const isWizard = SpellManager.isWizard(state);
    const isWarlock = SpellManager.isWarlock(state);
    
    let spellInfo = '';
    if (isSpellcaster) {
        const cantrips = (state.cantripsKnown || []).map(id => {
            const spell = SpellManager.getSpell(id);
            return spell ? spell.name : id;
        }).join(', ');
        
        let spellsDisplay = '';
        if (isWizard) {
            const spellbook = (state.spellbook || []).map(id => {
                const spell = SpellManager.getSpell(id);
                return spell ? spell.name : id;
            }).join(', ');
            spellsDisplay = spellbook || 'None';
        } else {
            const knownSpells = (state.knownSpells || []).map(id => {
                const spell = SpellManager.getSpell(id);
                return spell ? spell.name : id;
            }).join(', ');
            spellsDisplay = knownSpells || 'None';
        }
        
        const spellSlots = SpellManager.calculateSpellSlots(state);
        let slotsDisplay = [];
        for (let lvl = 1; lvl <= 9; lvl++) {
            if (spellSlots[lvl] > 0) {
                slotsDisplay.push(`${spellSlots[lvl]}x Lvl${lvl}`);
            }
        }
        
        spellInfo = `
            <div class="summary-row">
                <span><strong>Cantrips</strong></span>
                <span>${cantrips || 'None'}</span>
            </div>
            <div class="summary-row">
                <span><strong>${isWizard ? 'Spellbook' : 'Spells Known'}</strong></span>
                <span>${spellsDisplay}</span>
            </div>
            <div class="summary-row">
                <span><strong>Spell Slots</strong></span>
                <span>${slotsDisplay.join(', ') || 'None'}</span>
            </div>
        `;
        
        if (isWarlock && (state.invocations || []).length > 0) {
            const invocations = (state.invocations || []).map(inv => {
                return inv.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }).join(', ');
            spellInfo += `
                <div class="summary-row">
                    <span><strong>Invocations</strong></span>
                    <span>${invocations}</span>
                </div>
            `;
        }
    }
    
    document.getElementById('summary-content').innerHTML = `
        <div class="summary-row">
            <span>Class</span>
            <span>${cls ? cls.name : '-'}</span>
        </div>
        <div class="summary-row">
            <span>Race</span>
            <span>${race ? race.name : ''} ${state.subraceName || ''}</span>
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
            <span>${state.proficiencyIds.join(', ') || 'None'}</span>
        </div>
        <div class="summary-row">
            <span><strong>Abilities</strong></span>
            <span>${state.abilityIds.join(', ') || 'None'}</span>
        </div>
        <div class="summary-row">
            <span><strong>Feats</strong></span>
            <span>${state.featIds.join(', ') || 'None'}</span>
        </div>
        ${spellInfo}
    `;
}
