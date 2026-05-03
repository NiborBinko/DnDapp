/**
 * Main application initialization and startup
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
    navigateToStage(1);
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
        spellSlots: window.EMPTY_SPELL_SLOTS || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
        maxCantripsKnown: 0, maxSpellsKnown: 0, ritualSpells: []
    };
}

// Expose startNewCharacter for HTML
window.startNewCharacter = startNewCharacter;

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initApp);
else initApp();