function openMulticlass(index) {
    closeCharacterSheet();
    levelingCharacterIndex = index;
    pendingMulticlassClass = null;
    
    const chars = JSON.parse(localStorage.getItem('dnd-characters') || '[]');
    const char = chars[index];
    const totalLevel = getTotalLevel(char);
    
    if (totalLevel >= MAX_LEVEL) {
        alert('Character is already at max level. Cannot add more classes.');
        return;
    }
    
    renderMulticlassOptions(char);
    
    document.getElementById('multiclass-modal').classList.add('active');
}

function renderMulticlassOptions(char) {
    const grid = document.getElementById('multiclass-class-grid');
    
    grid.innerHTML = classes.map(c => {
        const req = c.multiclassRequirement;
        let canMulticlass = true;
        let requirementText = '';
        
        if (req && char.stats[req.stat]) {
            const statValue = char.stats[req.stat];
            if (statValue < req.min) {
                canMulticlass = false;
                requirementText = `Needs ${statLabels[req.stat]} ${req.min}+ (have ${statValue})`;
            } else {
                requirementText = `${statLabels[req.stat]} ${req.min}+ ✓`;
            }
        }
        
        return `
            <div class="card ${canMulticlass ? '' : 'disabled'}" onclick="${canMulticlass ? 'selectMulticlassClass("' + c.id + '")' : ''}" id="multi-class-${c.id}">
                <h3>${c.name}</h3>
                <p>${requirementText}</p>
            </div>
        `;
    }).join('');
}

function selectMulticlassClass(classId) {
    pendingMulticlassClass = classId;
    
    document.querySelectorAll('#multiclass-class-grid .card').forEach(c => c.classList.remove('selected'));
    document.getElementById('multi-class-' + classId).classList.add('selected');
    
    document.getElementById('confirm-multiclass-btn').disabled = false;
    document.getElementById('confirm-multiclass-btn').textContent = 'Add ' + classes.find(c => c.id === classId).name;
}

function confirmMulticlass() {
    if (!pendingMulticlassClass) return;
    
    const chars = JSON.parse(localStorage.getItem('dnd-characters') || '[]');
    const char = chars[levelingCharacterIndex];
    
    if (!char.classes) {
        char.classes = [{ classId: char.classId, level: char.level || 1 }];
    }
    
    char.classes.push({ classId: pendingMulticlassClass, level: 1 });
    char.classId = char.classes[0].classId;
    char.level = getTotalLevel(char);
    
    localStorage.setItem('dnd-characters', JSON.stringify(chars));
    
    closeMulticlassModal();
    renderSavedCharacters();
}

function closeMulticlassModal() {
    document.getElementById('multiclass-modal').classList.remove('active');
    pendingMulticlassClass = null;
    levelingCharacterIndex = null;
}
