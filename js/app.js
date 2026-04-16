function init() {
    const dataFiles = [
        fetch('dnd-classes.json'),
        fetch('dnd-races.json'),
        fetch('dnd-feats.json'),
        fetch('descriptions/race-abilities.json'),
        fetch('descriptions/race-ability-effects.json'),
        fetch('descriptions/proficiencies.json'),
        fetch('dnd-spell-lists.json'),
        fetch('js/domain/spells.json')
    ];
    
    Promise.all(dataFiles)
        .then(([classesResp, racesResp, featsResp, raceDescResp, raceEffectsResp, profDescResp, spellListsResp, spellDataResp]) => {
            return Promise.all([
                classesResp.json(),
                racesResp.json(),
                featsResp.json(),
                raceDescResp.json(),
                raceEffectsResp.json(),
                profDescResp.json(),
                spellListsResp.json(),
                spellDataResp.json()
            ]);
        })
        .then(([classes, races, feats, raceAbilitiesDesc, raceEffects, profDesc, spellLists, spellData]) => {
            // Combine data into DnDState format
            const gameData = {
                classes: classes.classes,
                races: races.races,
                subraces: races.subraces,
                feats: feats.feats,
                statLabels: classes.statLabels
            };
            
            DnDState.init(gameData);
            SpellManager.init(spellData, spellLists);
            
            // Initialize AbilitySystem with description data
            AbilitySystem.init(raceAbilitiesDesc, raceEffects, profDesc);
            
            initializeApp();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            alert('Failed to load game data. Please ensure all required files exist.');
        });
}

function initializeApp() {
    renderClasses();
    renderRaces();
    renderProficiencies();
    renderAbilities();
    renderFeats();
    renderSavedCharacters();
    
    const delModal = document.getElementById('modal-confirm-delete');
    if (delModal) {
        delModal.addEventListener('click', () => {
            const idx = DnDState.ui.deleteCharacterIndex;
            if (idx !== null) {
                deleteCharacterAtIndex(idx);
            }
            closeDeleteModal();
        });
    }
    
    showStep(0);
}

init();
