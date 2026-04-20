/**
 * Main application initialization
 */
async function initApp() {
    try {
        await loadAllGameData();
        await loadAllDescriptions();
        initTooltips();
        initializeUI();
    } catch (error) {
        console.error('Error:', error);
    }
}

function initializeUI() {
    navigateToStage(0);
    setupEventListeners();
    renderSavedCharactersList();
}

function setupEventListeners() {
    const deleteBtn = document.getElementById('modal-confirm-delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            if (UIState.deleteCharacterIndex !== null) {
                deleteCharacter(UIState.deleteCharacterIndex);
                closeDeleteModal();
                renderSavedCharactersList();
            }
        });
    }
    
    const newCharBtn = document.getElementById('btn-new-char');
    if (newCharBtn) {
        newCharBtn.addEventListener('click', startNewCharacter);
    }
}

function startNewCharacter() {
    resetUIState();
    userSelection = resetUserSelection();
    characterSheet = getDefaultSheet();
    navigateToStage(1);  // Go to Choose Race step
}

function getDefaultSheet() {
    return {
        name: '', lvl: 1, race: '', subrace: '', class: '', subclass: '',
        stats: { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 },
        statModifiers: { strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 },
        maxHp: 10, currentHp: 10, speed: 30, armorClass: 10, initiative: 0,
        vision: { nightvision: null, dayvision: null },
        proficiencies: { skills: [], weapons: [], armor: [], tools: [], savingThrows: [] },
        expertises: [], languages: [], features: [], feats: [],
        spellcastingAbility: null, spellSaveDC: 0, spellAttackMod: 0, spellPreparationType: null,
        spellbookSpells: [], knownCantrips: [], knownSpells: [], preparedSpells: [],
        spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
        maxCantripsKnown: 0, maxSpellsKnown: 0, ritualSpells: []
    };
}

// Event handlers
function handleRaceSelect(raceId) { userSelection.race = raceId; userSelection.subrace = null; triggerRecalc(RECALC_FLAGS.RACE_CHANGED); renderChooseRace(); refreshDebugIfOpen(); }
function handleSubraceSelect(subraceId) { userSelection.subrace = subraceId; triggerRecalc(RECALC_FLAGS.SUBCLASS_CHANGED); renderChooseRace(); refreshDebugIfOpen(); }
function handleClassSelect(classId) { userSelection.class = classId; userSelection.subclass = null; triggerRecalc(RECALC_FLAGS.CLASS_CHANGED); renderChooseClass(); refreshDebugIfOpen(); }
function updateLevel(level) { userSelection.lvl = parseInt(level) || 1; triggerRecalc(RECALC_FLAGS.LEVEL_CHANGED); renderAbilityScores(); refreshDebugIfOpen(); }
function adjustStat(stat, delta) {
    const currentValue = userSelection.stats[stat] || 8;
    const cost = getStatCost(currentValue);
    if (delta > 0 && UIState.pointsRemaining >= cost) { userSelection.stats[stat] = currentValue + delta; UIState.pointsRemaining -= cost; }
    else if (delta < 0 && currentValue > 8) { userSelection.stats[stat] = currentValue + delta; UIState.pointsRemaining += getStatCost(currentValue - 1); }
    triggerRecalc(RECALC_FLAGS.STAT_CHANGED);
    renderAbilityScores();
    refreshDebugIfOpen();
}
function getStatCost(currentValue) { return currentValue >= 13 ? 2 : 1; }
function toggleSkill(skillName) {
    const idx = userSelection.selectedSkills.indexOf(skillName);
    if (idx > -1) userSelection.selectedSkills.splice(idx, 1);
    else if (userSelection.selectedSkills.length < getMaxSkillProficiencies()) userSelection.selectedSkills.push(skillName);
    renderProficienciesStage();
    refreshDebugIfOpen();
}
function selectClassOption(groupName, optionId) { userSelection.selectedFeatureChoices[groupName] = optionId; triggerRecalc(RECALC_FLAGS.FEATURE_CHANGED); renderFeaturesFeats(); refreshDebugIfOpen(); }
function selectHumanBonusStat(stat) {
    const choiceKey = 'human-bonus-stats';
    if (!userSelection.featureChoices) userSelection.featureChoices = {};
    if (!userSelection.featureChoices[choiceKey]) {
        userSelection.featureChoices[choiceKey] = { type: 'choice', options: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'], count: 2, selected: [] };
    }
    const choice = userSelection.featureChoices[choiceKey];
    if (choice.selected.length < choice.count && !choice.selected.includes(stat)) {
        choice.selected.push(stat);
        triggerRecalc(RECALC_FLAGS.RACE_CHANGED);
        renderAbilityScores();
        refreshDebugIfOpen();
    }
}
function toggleFeat(featName) {
    const idx = userSelection.feats.indexOf(featName);
    if (idx > -1) userSelection.feats.splice(idx, 1);
    else if (userSelection.feats.length < Math.floor(userSelection.lvl / 4)) userSelection.feats.push(featName);
    triggerRecalc(RECALC_FLAGS.FEAT_CHANGED);
    renderFeaturesFeats();
    refreshDebugIfOpen();
}
function viewCharacter(index) { const char = loadCharacter(index); if (char) { navigateToStage(7); renderOverview(); } }
function confirmDelete(index) { UIState.deleteCharacterIndex = index; document.getElementById('delete-char-name').textContent = (getSavedCharacter(index) || {}).name || ''; document.getElementById('delete-confirm-modal').style.display = 'flex'; }
function closeDeleteModal() { document.getElementById('delete-confirm-modal').style.display = 'none'; UIState.deleteCharacterIndex = null; }

window.handleRaceSelect = handleRaceSelect;
window.handleSubraceSelect = handleSubraceSelect;
window.handleClassSelect = handleClassSelect;
window.updateLevel = updateLevel;
window.adjustStat = adjustStat;
window.toggleSkill = toggleSkill;
window.selectClassOption = selectClassOption;
window.selectHumanBonusStat = selectHumanBonusStat;
window.toggleFeat = toggleFeat;
window.viewCharacter = viewCharacter;
window.confirmDelete = confirmDelete;
window.closeDeleteModal = closeDeleteModal;
window.startNewCharacter = startNewCharacter;

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
else initApp();