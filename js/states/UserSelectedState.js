/**
 * User selection state - tracks user choices and logic for updating state
 */
let userSelection = {
    name: '', lvl: 1, race: null, subrace: null, class: null, subclass: null,
    stats: { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 },
    selectedSkills: [], selectedWeapons: [], selectedArmor: [], selectedTools: [],
    feats: [], featureChoices: {}, ASIHistory: [],
    selectedLanguages: [], spellbookSpells: [], selectedCantrips: [], selectedSpells: [], preparedSpells: [],
    raceAutoGrantSources: {}  // { "Perception": "Race: Human - Keen Senses", ... }
};

function resetUserSelection() {
    return {
        name: '', lvl: 1, race: null, subrace: null, class: null, subclass: null,
        stats: { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 },
        selectedSkills: [], selectedWeapons: [], selectedArmor: [], selectedTools: [],
        feats: [], featureChoices: {}, selectedFeatureChoices: {}, ASIHistory: [],
        selectedLanguages: [], spellbookSpells: [], selectedCantrips: [], selectedSpells: [], preparedSpells: [],
        raceAutoGrantSources: {}
    };
}

// ===== Race/Class Selection =====

function handleRaceSelect(raceId) {
    userSelection.race = raceId;
    userSelection.subrace = null;
    // Clear race-related selections when changing race
    userSelection.selectedSkills = [];
    userSelection.raceAutoGrantSources = {};
    userSelection.featureChoices = {};  // Clear race feature choices
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
    // Clear class-related selections when changing class (skills are class-dependent)
    userSelection.selectedSkills = [];
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
    const classMax = userSelection.class ? (window.classesData[userSelection.class]?.proficiencies?.skills?.count || 2) : 2;
    const raceBonus = window.raceSkillLimitBonus || 0;
    return classMax + raceBonus;
}

function getFeatCapacityBonus() {
    const fromChoices = Object.values(userSelection.featureChoices || {}).reduce((sum, choice) => {
        if (choice?.type !== 'feat') return sum;
        const optionsLen = choice.options?.length || 0;
        const count = choice.count || 0;
        if (optionsLen === 0 && count > 0) return sum + count;
        return sum;
    }, 0);
    return fromChoices + (window.raceFeatLimitBonus || 0);
}

function getMaxFeatsAllowed() {
    return Math.floor((userSelection.lvl || 1) / 4) + getFeatCapacityBonus();
}

function toggleSkill(skillName) {
    const idx = userSelection.selectedSkills.indexOf(skillName);
    const maxAllowed = getMaxSkillProficiencies();
    
    // Get race auto-granted skills to exclude from user picks count
    const raceAutoGrantedSkills = [];
    Object.entries(userSelection.featureChoices || {}).forEach(([key, choice]) => {
        if (choice?.type === 'proficiency' && choice?.proficiencyType === 'skill') {
            const selected = choice.selected?.filter(s => s !== null) || [];
            if (selected.length === choice.count && selected.length > 0) {
                selected.forEach(skill => raceAutoGrantedSkills.push(skill));
            }
        }
    });
    
    const userPickedSkills = userSelection.selectedSkills.filter(s => !raceAutoGrantedSkills.includes(s));
    
    if (idx > -1) {
        // Always allow removal
        userSelection.selectedSkills.splice(idx, 1);
    } else if (userPickedSkills.length < maxAllowed) {
        // Only add if under max (user picks, not auto-granted)
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
        const maxFeats = getMaxFeatsAllowed();
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
    if (!userSelection.featureChoices) {
        userSelection.featureChoices = {};
    }
    const choice = userSelection.featureChoices[choiceKey];
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
window.getFeatCapacityBonus = getFeatCapacityBonus;
window.getMaxFeatsAllowed = getMaxFeatsAllowed;

window.userSelection = userSelection;
window.resetUserSelection = resetUserSelection;
