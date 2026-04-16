function selectClass(id) {
    DnDState.character.classId = id;
    document.querySelectorAll('#class-grid .card').forEach(c => c.classList.remove('selected'));
    document.getElementById('class-' + id).classList.add('selected');
    document.getElementById('class-next').disabled = false;
    
    const startingLevel = DnDState.character.level || 1;
    const featuresData = getClassFeaturesForLevel(id, startingLevel);
    DnDState.character.abilityIds = featuresData.features.map(f => f.name);
}

function renderRaceTraits() {
    console.log('renderRaceTraits called', DnDState.character.raceId);
    const traitsSection = document.getElementById('race-traits-section');
    const traitsList = document.getElementById('race-traits-list');
    const state = DnDState.character;
    const gameData = DnDState.gameData;
    
    if (!state.raceId) {
        traitsSection.style.display = 'none';
        return;
    }
    
    const race = gameData.races.find(r => r.id === state.raceId);
    console.log('race found:', race);
    let allAbilities = [...(race?.raceAbilities || [])];
    let bonusesText = [];
    let subrace = null;
    
    if (race?.bonuses) {
        if (race.bonuses.chosen) {
            bonusesText.push(`+1 to ${race.bonuses.chosen} stats of your choice`);
        } else {
            for (const [stat, val] of Object.entries(race.bonuses)) {
                bonusesText.push(`+${val} ${gameData.statLabels[stat]}`);
            }
        }
    }
    
    if (state.subraceName && gameData.subraces[state.raceId]) {
        subrace = gameData.subraces[state.raceId].find(s => s.name === state.subraceName);
        if (subrace) {
            allAbilities = [...allAbilities, ...(subrace.raceAbilities || [])];
            if (subrace.bonuses) {
                for (const [stat, val] of Object.entries(subrace.bonuses)) {
                    bonusesText.push(`+${val} ${gameData.statLabels[stat]}`);
                }
            }
        }
    }
    
    let html = '';
    
    // Size
    if (race?.size) {
        html += `<p style="margin-bottom: 5px;"><strong>Size:</strong> ${race.size}</p>`;
    }
    
    // Speed (check subrace first for overrides)
    const speed = subrace?.speed || race?.speed;
    if (speed) {
        html += `<p style="margin-bottom: 5px;"><strong>Speed:</strong> ${speed} ft</p>`;
    }
    
    // Languages
    if (race?.languages && race.languages.length > 0) {
        html += `<p style="margin-bottom: 8px;"><strong>Languages:</strong> ${race.languages.join(', ')}</p>`;
    }
    
    if (bonusesText.length > 0) {
        html += `<h4 style="color: #4ade80; margin-bottom: 8px;">Ability Score Increases</h4>`;
        html += `<p style="margin-bottom: 12px;">${bonusesText.join(', ')}</p>`;
    }
    
    if (allAbilities.length > 0) {
        html += `<h4 style="color: var(--accent); margin-bottom: 8px;">Racial Traits</h4>`;
        html += `<ul style="margin: 0; padding-left: 20px; color: var(--text-muted);">`;
        allAbilities.forEach(ability => {
            html += `<li style="margin-bottom: 5px;">${ability}</li>`;
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
    DnDState.character.raceId = id;
    DnDState.character.subraceName = null;
    DnDState.character.stats = {};
    DnDState.character.humanBonusStats = [];
    DnDState.character.proficiencyIds = [];
    DnDState.character.featIds = [];
    DnDState.character.toolSelectionIds = [];
    DnDState.character.raceCantrips = [];
    DnDState.character.raceInnateSpells = [];
    DnDState.ui.pointsRemaining = 27;
    
    const gameData = DnDState.gameData;
    
    // Use AbilitySystem to calculate race effects
    const raceEffects = AbilitySystem.recalculate(DnDState.character, gameData);
    DnDState.character.raceAbilityIds = raceEffects.raceAbilityIds;
    DnDState.character.raceCantrips = raceEffects.cantrips;
    DnDState.character.raceInnateSpells = raceEffects.innateSpells;
    
    document.querySelectorAll('#race-grid .card').forEach(c => c.classList.remove('selected'));
    document.getElementById('race-' + id).classList.add('selected');
    
    if (DnDState.character.classId) {
        const startingLevel = DnDState.character.level || 1;
        const featuresData = getClassFeaturesForLevel(DnDState.character.classId, startingLevel);
        DnDState.character.abilityIds = featuresData.features.map(f => f.name);
    }
    
    renderRaceTraits();
    
    const subraceSection = document.getElementById('subrace-section');
    if (gameData.subraces[id]) {
        subraceSection.style.display = 'block';
        renderSubraces(id);
    } else {
        subraceSection.style.display = 'none';
    }
    
    document.getElementById('race-next').disabled = false;
}

function selectSubrace(name) {
    const state = DnDState.character;
    const gameData = DnDState.gameData;
    
    state.subraceName = name;
    
    state.subraceName = name;
    
    // Use AbilitySystem to recalculate with subrace
    const raceEffects = AbilitySystem.recalculate(state, gameData);
    state.raceAbilityIds = raceEffects.raceAbilityIds;
    state.raceCantrips = raceEffects.cantrips || [];
    state.raceInnateSpells = raceEffects.innateSpells || {};
    
    document.querySelectorAll('#subrace-grid .card').forEach(c => c.classList.remove('selected'));
    document.getElementById('subrace-' + name).classList.add('selected');
    
    renderRaceTraits();
    renderStats();
}

function toggleHumanBonusStat(stat) {
    const state = DnDState.character;
    if (state.raceId !== 'human') return;
    
    const humanBonusStats = state.humanBonusStats || [];
    const idx = humanBonusStats.indexOf(stat);
    
    if (idx > -1) {
        humanBonusStats.splice(idx, 1);
    } else if (humanBonusStats.length < 2) {
        humanBonusStats.push(stat);
    }
    
    state.humanBonusStats = humanBonusStats;
    renderStats();
}

function toggleProficiency(id) {
    const state = DnDState.character;
    const gameData = DnDState.gameData;
    const checkbox = event.target;
    const raceAbilities = getRaceAbilities();
    const raceSkills = [];
    raceAbilities.forEach(ability => {
        const skill = raceAbilitySkillMap[ability];
        if (skill) {
            raceSkills.push(skill);
        }
    });
    
    if (raceSkills.includes(id) && checkbox.checked === false) {
        checkbox.checked = true;
        return;
    }
    
    const idx = state.proficiencyIds.indexOf(id);
    const isHuman = state.raceId === 'human';
    const charClass = gameData.classes.find(c => c.id === state.classId);
    const classSkillCount = charClass?.proficiencies?.skills?.count || 2;
    const extraSkills = getExtraSkillCount();
    const maxSkills = classSkillCount + extraSkills;
    
    if (idx > -1) {
        state.proficiencyIds.splice(idx, 1);
    } else if (state.proficiencyIds.length < maxSkills) {
        state.proficiencyIds.push(id);
    } else {
        checkbox.checked = false;
        return;
    }
    
    document.getElementById('prof-count').textContent = state.proficiencyIds.length + ' selected';
}

function toggleToolSelection(toolId) {
    const state = DnDState.character;
    if (!state.toolSelectionIds) state.toolSelectionIds = [];
    const checkbox = event.target;
    
    const idx = state.toolSelectionIds.indexOf(toolId);
    if (idx > -1) {
        state.toolSelectionIds.splice(idx, 1);
    } else {
        state.toolSelectionIds.push(toolId);
    }
}

function toggleAbility(id) {
    const state = DnDState.character;
    if (!state.abilityIds) state.abilityIds = [];
    
    const classFeaturesData = getClassFeaturesForLevel(state.classId, state.level || 1);
    const classOptions = classFeaturesData.options || [];
    
    const clickedOption = classOptions.find(o => o.name === id);
    if (clickedOption) {
        const isSelected = state.abilityIds.includes(id);
        
        if (isSelected) {
            const idx = state.abilityIds.indexOf(id);
            state.abilityIds.splice(idx, 1);
        } else {
            const exclusiveGroup = clickedOption.exclusiveGroup;
            const groupOptions = classOptions.filter(o => o.exclusiveGroup === exclusiveGroup);
            groupOptions.forEach(o => {
                const idx = state.abilityIds.indexOf(o.name);
                if (idx > -1) state.abilityIds.splice(idx, 1);
            });
            state.abilityIds.push(id);
        }
        
        renderAbilities();
    }
}

function toggleFeat(id) {
    const state = DnDState.character;
    const charLevel = state.level || 1;
    const extraFeats = getExtraFeatCount();
    const maxFeatsFromLevel = Math.floor(charLevel / 4);
    const totalMaxFeats = maxFeatsFromLevel + extraFeats;
    const currentFeatCount = (state.featIds || []).length;
    
    const prereqCheck = DataUtils.canSelectFeat(id, state);
    if (!prereqCheck.canSelect) {
        event.target.checked = false;
        return;
    }
    
    const idx = (state.featIds || []).indexOf(id);
    
    if (idx > -1) {
        state.featIds.splice(idx, 1);
    } else {
        if (currentFeatCount < totalMaxFeats) {
            if (!state.featIds) state.featIds = [];
            state.featIds.push(id);
        } else {
            return;
        }
    }
    
    renderFeats();
}

function saveCharacter() {
    const state = DnDState.character;
    const gameData = DnDState.gameData;
    const name = document.getElementById('char-name').value;
    const cls = gameData.classes.find(c => c.id === state.classId);
    const race = gameData.races.find(r => r.id === state.raceId);
    
    const startingLevel = state.level || 1;
    const raceAbilities = getRaceAbilities();
    const extraSkills = getExtraSkillCount();
    const extraFeats = getExtraFeatCount();
    
    const actualAbilities = (state.abilityIds || []).filter(a => !a.startsWith('+1 '));
    const allAbilityIds = [...new Set([...raceAbilities.filter(a => !a.startsWith('+1 ')), ...actualAbilities])];
    
    const classId = state.classId;
    const featuresData = getClassFeaturesForLevel(classId, startingLevel);
    const classAbilities = featuresData.features.map(f => f.name);
    const classSelectedOptions = featuresData.options.map(o => ({ optionId: o.id, feature: o.name, level: o.level, classId: classId }));
    
    const allAbilityIdsWithClass = [...new Set([...allAbilityIds, ...classAbilities])];
    
    const newChar = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        name: name,
        level: startingLevel,
        classes: [{ classId: state.classId, level: startingLevel }],
        className: cls ? cls.name : '',
        raceId: state.raceId,
        raceName: race ? race.name : '',
        subraceName: state.subraceName,
        stats: { ...state.stats },
        humanBonusStats: state.humanBonusStats || [],
        extraSkillCount: extraSkills,
        extraFeatCount: extraFeats,
        proficiencyIds: [...state.proficiencyIds],
        abilityIds: allAbilityIdsWithClass,
        featIds: [...(state.featIds || [])],
        selectedOptions: classSelectedOptions,
        cantripsKnown: [...(state.cantripsKnown || [])],
        knownSpells: [...(state.knownSpells || [])],
        preparedSpells: [...(state.preparedSpells || [])],
        spellbook: [...(state.spellbook || [])],
        invocations: [...(state.invocations || [])],
        hitPoints: { current: 0, max: 0, temp: 0 },
        spellSlots: {},
        spells: [],
        inventory: [],
        equippedItems: [],
        attacks: [],
        currency: { copper: 0, silver: 0, gold: 0, platinum: 0 },
        conditions: [],
        deathSaves: { successes: 0, failures: 0 }
    };
    
    const raceBonuses = getRaceBonuses();
    const conMod = Math.floor((state.stats.constitution || 10 - 10) / 2);
    const hitDie = cls?.hitDie || 8;
    newChar.hitPoints.max = hitDie + conMod;
    newChar.hitPoints.current = newChar.hitPoints.max;
    
    const chars = JSON.parse(localStorage.getItem('dnd-characters') || '[]');
    chars.push(newChar);
    localStorage.setItem('dnd-characters', JSON.stringify(chars));
    
    DnDState.savedCharacters = chars;
    renderSavedCharacters();
    showStep(7);
}

function startNew() {
    DnDState.character = DnDState.createNewCharacter();
    DnDState.ui.pointsRemaining = 27;
    
    document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    document.getElementById('char-name').value = '';
    document.getElementById('starting-level').value = 1;
    
    showStep(0);
}

function updateStartingLevel(level) {
    DnDState.character.level = Math.max(1, Math.min(20, parseInt(level) || 1));
    document.getElementById('starting-level').value = DnDState.character.level;
    
    if (DnDState.character.classId) {
        const startingLevel = DnDState.character.level || 1;
        const featuresData = getClassFeaturesForLevel(DnDState.character.classId, startingLevel);
        DnDState.character.abilityIds = featuresData.features.map(f => f.name);
    }
}
