let levelingCharacterIndex = null;
let selectedLevelUpClass = null;
let availableFeaturesAtLevel = [];
let rolledHitPoints = 0;
let pendingLevelUp = null;

function openLevelUp(index) {
    levelingCharacterIndex = index;
    const char = DnDState.loadSavedCharacter(index);
    if (!char) return;

    const charClasses = CharacterEntity.getClasses(char);
    const totalLevel = CharacterEntity.getTotalLevel(char);
    
    if (totalLevel >= MAX_LEVEL) {
        alert('Character is already at max level (' + MAX_LEVEL + ')');
        return;
    }
    
    if (charClasses.length === 1) {
        selectedLevelUpClass = charClasses[0];
        showLevelUpForSingleClass(char, charClasses[0], totalLevel);
    } else {
        selectedLevelUpClass = null;
        const grid = document.getElementById('level-up-class-grid');
        const gameData = DnDState.gameData;
        grid.innerHTML = charClasses.map((cc, i) => {
            const cls = gameData.classes.find(c => c.id === cc.classId);
            const clsName = cls ? cls.name : cc.classId;
            return `
                <div class="card" onclick="selectLevelUpClass(${i}, '${cc.classId}')" id="levelup-class-${cc.classId}">
                    <h3>${clsName}</h3>
                    <p>Current Level: ${cc.level}</p>
                </div>
            `;
        }).join('');
        
        document.getElementById('level-up-class-select').style.display = 'block';
        document.getElementById('level-up-current').style.display = 'none';
        document.getElementById('level-up-features').innerHTML = '';
        document.getElementById('level-up-hp').style.display = 'none';
        document.getElementById('confirm-level-up-btn').disabled = true;
        document.getElementById('level-up-modal').classList.add('active');
    }
}

function selectLevelUpClass(index, classId) {
    const char = DnDState.loadSavedCharacter(levelingCharacterIndex);
    const charClasses = CharacterEntity.getClasses(char);
    
    selectedLevelUpClass = charClasses[index];
    
    document.querySelectorAll('#level-up-class-grid .card').forEach(c => c.classList.remove('selected'));
    document.getElementById('levelup-class-' + classId).classList.add('selected');
    
    showLevelUpForSingleClass(char, selectedLevelUpClass, CharacterEntity.getTotalLevel(char));
}

function showLevelUpForSingleClass(char, classInfo, currentTotalLevel) {
    const targetLevel = parseInt(document.getElementById('target-level-input').value) || classInfo.level + 1;
    
    document.getElementById('level-up-class-select').style.display = 'none';
    document.getElementById('level-up-current').style.display = 'block';
    document.getElementById('current-level-display').textContent = currentTotalLevel;
    document.getElementById('target-level-input').max = MAX_LEVEL;
    document.getElementById('target-level-input').value = targetLevel;
    
    const gameData = DnDState.gameData;
    const cls = gameData.classes.find(c => c.id === classInfo.classId);
    const hd = cls?.hitDie || 8;
    document.getElementById('hp-die').textContent = 'd' + hd;
    document.getElementById('hp-die-size').textContent = hd;
    
    showLevelUpFeatures(char);
}

function showLevelUpFeaturesFromButton() {
    const char = DnDState.loadSavedCharacter(levelingCharacterIndex);
    if (!char) return;
    showLevelUpFeatures(char);
}

function showLevelUpFeatures(char) {
    const targetLevel = parseInt(document.getElementById('target-level-input').value);
    const currentTotalLevel = CharacterEntity.getTotalLevel(char);
    
    if (targetLevel <= currentTotalLevel || targetLevel > MAX_LEVEL) {
        alert('Target level must be greater than current level and at most ' + MAX_LEVEL);
        return;
    }
    
    const levelsGained = targetLevel - currentTotalLevel;
    const classId = selectedLevelUpClass.classId;
    const currentClassLevel = selectedLevelUpClass.level;
    
    availableFeaturesAtLevel = [];
    const featuresList = [];
    
    const featuresData = getClassFeaturesForLevel(classId, targetLevel);
    const newFeatures = featuresData.features.filter(f => f.level > currentClassLevel);
    const newOptions = featuresData.options.filter(o => o.level > currentClassLevel);
    
    newFeatures.forEach(f => {
        availableFeaturesAtLevel.push({ feature: f.name, level: f.level, isOption: false });
        featuresList.push(f.name);
    });
    
    newOptions.forEach(o => {
        availableFeaturesAtLevel.push({ 
            feature: o.name, 
            level: o.level, 
            isOption: true,
            optionId: o.id,
            exclusiveGroup: o.exclusiveGroup 
        });
        featuresList.push(o.name);
    });
    
    if (levelsGained >= 4) {
        availableFeaturesAtLevel.push({ feature: 'Ability Score Increase', level: targetLevel, isOption: true });
        featuresList.push('Ability Score Increase');
    }
    
    const featuresHtml = featuresList.length > 0 
        ? featuresList.map((f, i) => {
            const item = availableFeaturesAtLevel.find(af => af.feature === f);
            const isOption = item && item.isOption;
            if (isOption) {
                return `
                    <div class="level-up-feature-item">
                        <label style="flex: 1; display: flex; align-items: center; gap: 10px;">
                            <input type="checkbox" class="feature-select" data-feature="${f}" data-option-id="${item.optionId || ''}" data-group="${item.exclusiveGroup || ''}">
                            <span>${f}</span>
                        </label>
                    </div>
                `;
            } else {
                return `
                    <div class="level-up-feature-item" style="background: var(--card-bg); border: 1px solid var(--border);">
                        <span style="color: var(--text-muted);">✓ ${f}</span>
                        <span style="font-size: 12px; color: var(--text-muted);">(auto)</span>
                    </div>
                `;
            }
        }).join('')
        : '<p style="color: var(--text-muted);">No new features at this level.</p>';
    
    document.getElementById('level-up-features').innerHTML = `
        <h4 style="margin-bottom: 10px;">Available at Level ${targetLevel}:</h4>
        ${featuresHtml}
    `;
    
    document.getElementById('level-up-hp').style.display = 'block';
    rolledHitPoints = 0;
    document.getElementById('hp-roll-result').textContent = '';
    document.getElementById('confirm-level-up-btn').disabled = false;
    document.getElementById('confirm-level-up-btn').textContent = 'Confirm Level Up to ' + targetLevel;
}

function rollHitPoints() {
    const gameData = DnDState.gameData;
    const char = DnDState.loadSavedCharacter(levelingCharacterIndex);
    if (!char) return;

    const classId = selectedLevelUpClass.classId;
    const cls = gameData.classes.find(c => c.id === classId);
    const hd = cls?.hitDie || 8;
    const con = char.stats.constitution || 10;
    const conMod = CharacterEntity.getStatModifier(char, 'constitution');
    
    const roll = Math.floor(Math.random() * hd) + 1;
    rolledHitPoints = roll + conMod;
    
    document.getElementById('hp-roll-result').textContent = 'd' + hd + ' = ' + roll + ' + ' + conMod + ' = ' + rolledHitPoints;
}

function confirmLevelUp() {
    const chars = JSON.parse(localStorage.getItem('dnd-characters') || '[]');
    const char = chars[levelingCharacterIndex];
    const targetLevel = parseInt(document.getElementById('target-level-input').value);
    
    char.level = targetLevel;
    
    availableFeaturesAtLevel.forEach(f => {
        if (f.isOption) {
            const checkbox = document.querySelector(`input[data-feature="${f.feature}"]:checked`);
            if (checkbox) {
                char.abilityIds = char.abilityIds || [];
                if (!char.abilityIds.includes(f.feature)) {
                    char.abilityIds.push(f.feature);
                }
                if (f.optionId && !char.selectedOptions) {
                    char.selectedOptions = [];
                }
                if (f.optionId) {
                    char.selectedOptions = char.selectedOptions || [];
                    if (!char.selectedOptions.find(o => o.optionId === f.optionId)) {
                        char.selectedOptions.push({ optionId: f.optionId, feature: f.feature, level: f.level, classId: selectedLevelUpClass.classId });
                    }
                }
            }
        } else {
            char.abilityIds = char.abilityIds || [];
            if (!char.abilityIds.includes(f.feature)) {
                char.abilityIds.push(f.feature);
            }
        }
    });

    if (rolledHitPoints > 0) {
        if (!char.hitPoints) {
            char.hitPoints = { current: 0, max: 0, temp: 0 };
        }
        const oldMax = char.hitPoints.max;
        char.hitPoints.max = (oldMax || 0) + rolledHitPoints;
        char.hitPoints.current = char.hitPoints.max;
    }
    
    selectedLevelUpClass.level = targetLevel;
    
    localStorage.setItem('dnd-characters', JSON.stringify(chars));
    
    closeLevelUpModal();
    renderSavedCharacters();
}

function closeLevelUpModal() {
    document.getElementById('level-up-modal').classList.remove('active');
    levelingCharacterIndex = null;
    selectedLevelUpClass = null;
    availableFeaturesAtLevel = [];
    rolledHitPoints = 0;
    pendingLevelUp = null;
    DnDState.loadSavedCharacter(-1);
}
