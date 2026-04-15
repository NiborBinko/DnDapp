let viewingCharacterIndex = null;
let deleteCharacterIndex = null;

function viewCharacter(index) {
    const char = DnDState.loadSavedCharacter(index);
    if (!char) return;
    
    DnDState.ui.viewingCharacterIndex = index;
    
    const totalLevel = CharacterEntity.getTotalLevel(char);
    const charClasses = CharacterEntity.getClasses(char);
    const gameData = DnDState.gameData;
    
    let classesHtml = charClasses.map(cc => {
        const cls = gameData.classes.find(c => c.id === cc.classId);
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
        const race = gameData.races.find(r => r.id === char.raceId);
        let bonus = 0;
        if (char.raceId === 'human') {
            bonus = 1;
        } else if (race && race.bonus_stat === stat) {
            bonus = race.bonus;
        }
        const total = base + bonus;
        return `
            <div class="sheet-stat">
                <div class="sheet-stat-name">${gameData.statLabels[stat]}</div>
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
    DnDState.ui.viewingCharacterIndex = null;
}

function confirmDeleteCharacter(index) {
    const chars = DnDState.getSavedCharacters();
    const char = chars[index];
    DnDState.ui.deleteCharacterIndex = index;
    document.getElementById('delete-char-name').textContent = char.name || 'Unnamed';
    document.getElementById('delete-confirm-modal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('delete-confirm-modal').classList.remove('active');
    DnDState.ui.deleteCharacterIndex = null;
}

function deleteCharacterAtIndex(index) {
    DnDState.deleteSavedCharacter(index);
    renderSavedCharacters();
}
