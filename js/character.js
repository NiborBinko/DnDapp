function selectClass(id) {
    character.classId = id;
    document.querySelectorAll('#class-grid .card').forEach(c => c.classList.remove('selected'));
    document.getElementById('class-' + id).classList.add('selected');
    document.getElementById('class-next').disabled = false;
    
    const startingLevel = character.level || 1;
    const featuresData = getClassFeaturesForLevel(id, startingLevel);
    character.abilityIds = featuresData.features.map(f => f.name);
}

function renderRaceTraits() {
    const traitsSection = document.getElementById('race-traits-section');
    const traitsList = document.getElementById('race-traits-list');
    
    if (!character.raceId) {
        traitsSection.style.display = 'none';
        return;
    }
    
    const race = races.find(r => r.id === character.raceId);
    let allAbilities = [...(race?.raceAbilities || [])];
    let bonusesText = [];
    
    if (race?.bonuses) {
        if (race.bonuses.chosen) {
            bonusesText.push(`+1 to ${race.bonuses.chosen} stats of your choice`);
        } else {
            for (const [stat, val] of Object.entries(race.bonuses)) {
                bonusesText.push(`+${val} ${statLabels[stat]}`);
            }
        }
    }
    
    if (character.subraceName && subraces[character.raceId]) {
        const sub = subraces[character.raceId].find(s => s.name === character.subraceName);
        if (sub) {
            allAbilities = [...allAbilities, ...(sub.raceAbilities || [])];
            if (sub.bonuses) {
                for (const [stat, val] of Object.entries(sub.bonuses)) {
                    bonusesText.push(`+${val} ${statLabels[stat]}`);
                }
            }
        }
    }
    
    let html = '';
    
    if (bonusesText.length > 0) {
        html += `<h4 style="color: #4ade80; margin-bottom: 8px;">Ability Score Increases</h4>`;
        html += `<p style="margin-bottom: 12px;">${bonusesText.join(', ')}</p>`;
    }
    
    if (allAbilities.length > 0) {
        html += `<h4 style="color: var(--accent); margin-bottom: 8px;">Racial Traits</h4>`;
        html += `<ul style="margin: 0; padding-left: 20px; color: var(--text-muted);">`;
        allAbilities.forEach(ability => {
            if (!ability.startsWith('+1 ')) {
                html += `<li style="margin-bottom: 5px;">${ability}</li>`;
            }
        });
        html += `</ul>`;
    }
    
    if (html) {
        traitsList.innerHTML = html;
        traitsSection.style.display = 'block';
    } else {
        traitsSection.style.display = 'none';
    }
}

function selectRace(id) {
    character.raceId = id;
    character.subraceName = null;
    character.stats = {};
    character.humanBonusStats = [];
    character.proficiencyIds = [];
    character.featIds = [];
    pointsRemaining = 27;
    
    document.querySelectorAll('#race-grid .card').forEach(c => c.classList.remove('selected'));
    document.getElementById('race-' + id).classList.add('selected');
    
    if (character.classId) {
        const startingLevel = character.level || 1;
        const featuresData = getClassFeaturesForLevel(character.classId, startingLevel);
        character.abilityIds = featuresData.features.map(f => f.name);
    }
    
    renderRaceTraits();
    
    const subraceSection = document.getElementById('subrace-section');
    if (subraces[id]) {
        subraceSection.style.display = 'block';
        renderSubraces(id);
    } else {
        subraceSection.style.display = 'none';
    }
    
    document.getElementById('race-next').disabled = false;
}

function selectSubrace(name) {
    character.subraceName = name;
    
    document.querySelectorAll('#subrace-grid .card').forEach(c => c.classList.remove('selected'));
    document.getElementById('subrace-' + name).classList.add('selected');
    
    renderRaceTraits();
    renderStats();
}

function toggleHumanBonusStat(stat) {
    if (character.raceId !== 'human') return;
    
    const humanBonusStats = character.humanBonusStats || [];
    const idx = humanBonusStats.indexOf(stat);
    
    if (idx > -1) {
        humanBonusStats.splice(idx, 1);
    } else if (humanBonusStats.length < 2) {
        humanBonusStats.push(stat);
    }
    
    character.humanBonusStats = humanBonusStats;
    renderStats();
}

function toggleProficiency(id) {
    const checkbox = event.target;
    const idx = character.proficiencyIds.indexOf(id);
    const isHuman = character.raceId === 'human';
    const charClass = classes.find(c => c.id === character.classId);
    const classSkillCount = charClass?.proficiencies?.skills?.count || 2;
    const extraSkills = getExtraSkillCount();
    const maxSkills = classSkillCount + extraSkills;
    
    if (idx > -1) {
        character.proficiencyIds.splice(idx, 1);
    } else if (character.proficiencyIds.length < maxSkills) {
        character.proficiencyIds.push(id);
    } else {
        checkbox.checked = false;
        return;
    }
    
    document.getElementById('prof-count').textContent = character.proficiencyIds.length + ' selected';
}

function toggleAbility(id) {
    if (!character.abilityIds) character.abilityIds = [];
    
    const classFeaturesData = getClassFeaturesForLevel(character.classId, character.level || 1);
    const classOptions = classFeaturesData.options || [];
    
    const clickedOption = classOptions.find(o => o.name === id);
    if (clickedOption) {
        const isSelected = character.abilityIds.includes(id);
        
        if (isSelected) {
            const idx = character.abilityIds.indexOf(id);
            character.abilityIds.splice(idx, 1);
        } else {
            const exclusiveGroup = clickedOption.exclusiveGroup;
            const groupOptions = classOptions.filter(o => o.exclusiveGroup === exclusiveGroup);
            groupOptions.forEach(o => {
                const idx = character.abilityIds.indexOf(o.name);
                if (idx > -1) character.abilityIds.splice(idx, 1);
            });
            character.abilityIds.push(id);
        }
        
        renderAbilities();
    }
}

function toggleFeat(id) {
    const charLevel = character.level || 1;
    const extraFeats = getExtraFeatCount();
    const maxFeatsFromLevel = Math.floor(charLevel / 4);
    const totalMaxFeats = maxFeatsFromLevel + extraFeats;
    const currentFeatCount = (character.featIds || []).length;
    
    const idx = (character.featIds || []).indexOf(id);
    
    if (idx > -1) {
        character.featIds.splice(idx, 1);
    } else {
        if (currentFeatCount < totalMaxFeats) {
            if (!character.featIds) character.featIds = [];
            character.featIds.push(id);
        } else {
            return;
        }
    }
    
    renderFeats();
}

function saveCharacter() {
    const name = document.getElementById('char-name').value;
    const cls = classes.find(c => c.id === character.classId);
    const race = races.find(r => r.id === character.raceId);
    
    const startingLevel = character.level || 1;
    const raceAbilities = getRaceAbilities();
    const extraSkills = getExtraSkillCount();
    const extraFeats = getExtraFeatCount();
    
    const actualAbilities = (character.abilityIds || []).filter(a => !a.startsWith('+1 '));
    const allAbilityIds = [...new Set([...raceAbilities.filter(a => !a.startsWith('+1 ')), ...actualAbilities])];
    
    const classId = character.classId;
    const featuresData = getClassFeaturesForLevel(classId, startingLevel);
    const classAbilities = featuresData.features.map(f => f.name);
    const classSelectedOptions = featuresData.options.map(o => ({ optionId: o.id, feature: o.name, level: o.level, classId: classId }));
    
    const allAbilityIdsWithClass = [...new Set([...allAbilityIds, ...classAbilities])];
    
    const newChar = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: name,
        level: startingLevel,
        classes: [{ classId: character.classId, level: startingLevel }],
        className: cls ? cls.name : '',
        raceId: character.raceId,
        raceName: race ? race.name : '',
        subraceName: character.subraceName,
        stats: { ...character.stats },
        humanBonusStats: character.humanBonusStats || [],
        extraSkillCount: extraSkills,
        extraFeatCount: extraFeats,
        proficiencyIds: [...character.proficiencyIds],
        abilityIds: allAbilityIdsWithClass,
        featIds: [...(character.featIds || [])],
        selectedOptions: classSelectedOptions
    };
    
    const chars = JSON.parse(localStorage.getItem('dnd-characters') || '[]');
    chars.push(newChar);
    localStorage.setItem('dnd-characters', JSON.stringify(chars));
    
    renderSavedCharacters();
    showStep(6);
}

function startNew() {
    character = {
        classId: null,
        raceId: null,
        subraceName: null,
        stats: {},
        proficiencyIds: [],
        abilityIds: [],
        featIds: [],
        humanBonusStats: [],
        selectedOptions: [],
        level: 1
    };
    pointsRemaining = 27;
    
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    document.getElementById('char-name').value = '';
    document.getElementById('starting-level').value = 1;
    
    showStep(0);
}

function updateStartingLevel(level) {
    character.level = Math.max(1, Math.min(20, parseInt(level) || 1));
    document.getElementById('starting-level').value = character.level;
    
    if (character.classId) {
        const startingLevel = character.level || 1;
        const featuresData = getClassFeaturesForLevel(character.classId, startingLevel);
        character.abilityIds = featuresData.features.map(f => f.name);
    }
}

function confirmDeleteCharacter(index) {
    const chars = JSON.parse(localStorage.getItem('dnd-characters') || '[]');
    const char = chars[index];
    deleteCharacterIndex = index;
    document.getElementById('delete-char-name').textContent = char.name || 'Unnamed';
    document.getElementById('delete-confirm-modal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('delete-confirm-modal').classList.remove('active');
    deleteCharacterIndex = null;
}

function deleteCharacterAtIndex(index) {
    const chars = JSON.parse(localStorage.getItem('dnd-characters') || '[]');
    chars.splice(index, 1);
    localStorage.setItem('dnd-characters', JSON.stringify(chars));
    renderSavedCharacters();
}

function viewCharacter(index) {
    const chars = JSON.parse(localStorage.getItem('dnd-characters') || '[]');
    const char = chars[index];
    viewingCharacterIndex = index;
    
    const totalLevel = getTotalLevel(char);
    const charClasses = getCharacterClasses(char);
    
    let classesHtml = charClasses.map(cc => {
        const cls = classes.find(c => c.id === cc.classId);
        const clsName = cls ? cls.name : cc.classId;
        return `
            <div class="sheet-class">
                <div class="sheet-class-header">
                    <span class="sheet-class-name">${clsName}</span>
                    <span style="color: var(--text-muted);">Level ${cc.level}</span>
                </div>
            </div>
        `;
    }).join('');
    
    const raceName = char.subraceName ? `${char.raceName} (${char.subraceName})` : char.raceName;
    
    const statsHtml = stats.map(stat => {
        const base = char.stats[stat] || 10;
        const mod = Math.floor((base - 10) / 2);
        const race = races.find(r => r.id === char.raceId);
        let bonus = 0;
        if (char.raceId === 'human') {
            bonus = 1;
        } else if (race && race.bonus_stat === stat) {
            bonus = race.bonus;
        }
        const total = base + bonus;
        return `
            <div class="sheet-stat">
                <div class="sheet-stat-name">${statLabels[stat]}</div>
                <div class="sheet-stat-value">${total}</div>
                <div class="sheet-stat-bonus">${bonus > 0 ? '+' + bonus : ''} (${mod >= 0 ? '+' + mod : mod})</div>
            </div>
        `;
    }).join('');
    
    const profs = char.proficiencyIds && char.proficiencyIds.length > 0 
        ? char.proficiencyIds.join(', ') 
        : 'None';
    const abilities = char.abilityIds && char.abilityIds.length > 0 
        ? char.abilityIds.join(', ') 
        : 'None';
    const feats = char.featIds && char.featIds.length > 0 
        ? char.featIds.join(', ') 
        : 'None';
    
    document.getElementById('sheet-name').textContent = char.name || 'Unnamed';
    document.getElementById('sheet-content').innerHTML = `
        <div class="sheet-section">
            <h3>Class & Level</h3>
            <p>Level ${totalLevel}</p>
            ${classesHtml}
            <button class="btn-secondary" onclick="openMulticlass(${index})" style="margin-top: 10px;">Add Multiclass</button>
        </div>
        <div class="sheet-section">
            <h3>Race</h3>
            <p>${raceName}</p>
        </div>
        <div class="sheet-section">
            <h3>Ability Scores</h3>
            <div class="sheet-stats">${statsHtml}</div>
        </div>
        <div class="sheet-section">
            <h3>Proficiencies</h3>
            <p>${profs}</p>
        </div>
        <div class="sheet-section">
            <h3>Abilities</h3>
            <p>${abilities}</p>
        </div>
        <div class="sheet-section">
            <h3>Feats</h3>
            <p>${feats}</p>
        </div>
    `;
    
    document.getElementById('character-sheet-modal').classList.add('active');
}

function closeCharacterSheet() {
    document.getElementById('character-sheet-modal').classList.remove('active');
    viewingCharacterIndex = null;
}
