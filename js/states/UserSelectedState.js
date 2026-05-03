/**
 * User selection state - tracks user choices and logic for updating state
 */
let userSelection = {
    name: '', lvl: 1, race: null, subrace: null, class: null, subclass: null,
    stats: { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 },
    selectedSkills: [], selectedWeapons: [], selectedArmor: [], selectedTools: [],
    feats: [], featureChoices: {}, ASIHistory: [],
    selectedLanguages: [], spellbookSpells: [], selectedCantrips: [], selectedSpells: [], preparedSpells: []
};

function resetUserSelection() {
    return {
        name: '', lvl: 1, race: null, subrace: null, class: null, subclass: null,
        stats: { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 },
        selectedSkills: [], selectedWeapons: [], selectedArmor: [], selectedTools: [],
        feats: [], featureChoices: {}, selectedFeatureChoices: {}, ASIHistory: [],
        selectedLanguages: [], spellbookSpells: [], selectedCantrips: [], selectedSpells: [], preparedSpells: []
    };
}

// ===== Race/Class Selection =====

function handleRaceSelect(raceId) {
    userSelection.race = raceId;
    userSelection.subrace = null;
    triggerRecalc();
    renderChooseRace();
    refreshDebugIfOpen();
}

function handleSubraceSelect(subraceId) {
    userSelection.subrace = subraceId;
    triggerRecalc();
    renderChooseRace();
    refreshDebugIfOpen();
}

function handleClassSelect(classId) {
    userSelection.class = classId;
    userSelection.subclass = null;
    triggerRecalc();
    renderChooseClass();
    refreshDebugIfOpen();
}

function updateLevel(level) {
    userSelection.lvl = parseInt(level) || 1;
    triggerRecalc();
    renderAbilityScores();
    refreshDebugIfOpen();
}

// ===== Stats =====

function getStatCost(currentValue) {
    return currentValue >= 13 ? 2 : 1;
}

function adjustStat(stat, delta) {
    const currentValue = userSelection.stats[stat] || 8;
    const cost = currentValue >= 13 ? 2 : 1;

    if (delta > 0 && UIState.pointsRemaining >= cost) {
        userSelection.stats[stat] = currentValue + delta;
    } else if (delta < 0 && currentValue > 8) {
        userSelection.stats[stat] = currentValue + delta;
    }
    triggerRecalc();
    renderAbilityScores();
    refreshDebugIfOpen();
}

// ===== Skills =====

function getMaxSkillProficiencies() {
    if (!userSelection.class) return 2;
    return window.classesData[userSelection.class]?.proficiencies?.skills?.count || 2;
}

function toggleSkill(skillName) {
    const idx = userSelection.selectedSkills.indexOf(skillName);
    if (idx > -1) {
        userSelection.selectedSkills.splice(idx, 1);
    } else if (userSelection.selectedSkills.length < getMaxSkillProficiencies()) {
        userSelection.selectedSkills.push(skillName);
    }
    triggerRecalc();
    renderProficienciesStage();
    refreshDebugIfOpen();
}

// ===== Feats =====

function toggleFeat(featName) {
    const idx = userSelection.feats.indexOf(featName);
    if (idx > -1) {
        userSelection.feats.splice(idx, 1);
    } else {
        const maxFeats = Math.floor(userSelection.lvl / 4);
        if (userSelection.feats.length < maxFeats) {
            userSelection.feats.push(featName);
        }
    }
    triggerRecalc();
    renderFeaturesFeats();
    refreshDebugIfOpen();
}

// ===== Class Options =====

function selectClassOption(groupName, optionId) {
    if (!userSelection.selectedFeatureChoices) userSelection.selectedFeatureChoices = {};
    userSelection.selectedFeatureChoices[groupName] = optionId;
    triggerRecalc();
    renderFeaturesFeats();
    refreshDebugIfOpen();
}

// ===== Feature Choices (Generic) =====

function selectFeatureChoice(choiceKey, value) {
    console.log('selectFeatureChoice called:', choiceKey, value);
    if (!userSelection.featureChoices) {
        userSelection.featureChoices = {};
    }
    const choice = userSelection.featureChoices[choiceKey];
    console.log('choice:', choice);
    if (!choice) return;

    const existingIndex = choice.selected.indexOf(value);
    if (existingIndex > -1) {
        choice.selected[existingIndex] = null;
    } else {
        const filledCount = choice.selected.filter(s => s !== null).length;
        if (filledCount < choice.count) {
            const emptyIndex = choice.selected.findIndex(s => s === null);
            if (emptyIndex !== -1) {
                choice.selected[emptyIndex] = value;
            }
        }
    }
    
    // Calculate how many are now selected
    const newFilledCount = choice.selected.filter(s => s !== null).length;
    
    // ALWAYS call triggerRecalc to refresh stats (not just when full)
    triggerRecalc();
    
    // Render only current stage (not all 3 stages)
    if (typeof renderCurrentStage === 'function') {
        renderCurrentStage();
    }
    
    refreshDebugIfOpen();
}

// Expose functions to window
window.handleRaceSelect = handleRaceSelect;
window.handleSubraceSelect = handleSubraceSelect;
window.handleClassSelect = handleClassSelect;
window.updateLevel = updateLevel;
window.adjustStat = adjustStat;
window.toggleSkill = toggleSkill;
window.toggleFeat = toggleFeat;
window.selectClassOption = selectClassOption;
window.selectFeatureChoice = selectFeatureChoice;

window.userSelection = userSelection;
window.resetUserSelection = resetUserSelection;