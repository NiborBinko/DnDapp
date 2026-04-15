function showStep(n) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const stepId = ['class', 'race', 'stats', 'proficiencies', 'abilities', 'summary', 'saved'][n];
    const targetStep = document.getElementById('step-' + stepId);
    if (targetStep) {
        targetStep.classList.add('active');
        currentStep = n;
    }
    
    if (n === 2) {
        renderStats();
    }
    if (n === 3) {
        character.proficiencyIds = [];
        renderProficiencies();
    }
    if (n === 4) {
        if (!character.featIds) character.featIds = [];
        if (character.classId && (!character.abilityIds || character.abilityIds.length === 0)) {
            const startingLevel = character.level || 1;
            const featuresData = getClassFeaturesForLevel(character.classId, startingLevel);
            character.abilityIds = featuresData.features.map(f => f.name);
        }
        renderAbilities();
        renderFeats();
    }
    if (n === 5) {
        if (!character.abilityIds) character.abilityIds = [];
        if (!character.featIds) character.featIds = [];
        renderSummary();
    }
}

function nextStep() {
    showStep(currentStep + 1);
}

function prevStep() {
    showStep(currentStep - 1);
}
