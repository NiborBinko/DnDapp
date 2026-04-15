function showStep(n) {
    const stepNames = ['class', 'race', 'stats', 'proficiencies', 'abilities', 'spells', 'summary', 'saved'];
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const stepId = stepNames[n];
    const targetStep = document.getElementById('step-' + stepId);
    if (targetStep) {
        targetStep.classList.add('active');
        DnDState.ui.currentStep = n;
    }
    
    if (n === 2) {
        renderStats();
    }
    if (n === 3) {
        DnDState.character.proficiencyIds = [];
        renderProficiencies();
    }
    if (n === 4) {
        if (!DnDState.character.featIds) DnDState.character.featIds = [];
        if (DnDState.character.classId && (!DnDState.character.abilityIds || DnDState.character.abilityIds.length === 0)) {
            const startingLevel = DnDState.character.level || 1;
            const featuresData = getClassFeaturesForLevel(DnDState.character.classId, startingLevel);
            DnDState.character.abilityIds = featuresData.features.map(f => f.name);
        }
        renderAbilities();
        renderFeats();
    }
    if (n === 5) {
        renderSpells();
    }
    if (n === 6) {
        if (!DnDState.character.abilityIds) DnDState.character.abilityIds = [];
        if (!DnDState.character.featIds) DnDState.character.featIds = [];
        renderSummary();
    }
}

function nextStep() {
    showStep(DnDState.ui.currentStep + 1);
}

function prevStep() {
    showStep(DnDState.ui.currentStep - 1);
}
