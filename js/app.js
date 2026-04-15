function init() {
    const dataFiles = [
        fetch('dnd-data.json'),
        fetch('dnd-spell-lists.json'),
        fetch('js/domain/spells.json')
    ];
    
    Promise.all(dataFiles)
        .then(([dataResponse, spellListsResponse, spellDataResponse]) => {
            return Promise.all([dataResponse.json(), spellListsResponse.json(), spellDataResponse.json()]);
        })
        .then(([data, spellLists, spellData]) => {
            DnDState.init(data);
            SpellManager.init(spellData, spellLists);
            
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
