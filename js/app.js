function init() {
    fetch('dnd-data.json')
        .then(response => response.json())
        .then(data => {
            classes = data.classes;
            races = data.races || [];
            subraces = data.subraces || {};
            feats = data.feats || [];
            statLabels = data.statLabels || {};
            
            initializeApp();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            alert('Failed to load game data. Please ensure dnd-data.json exists.');
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
            const idx = deleteCharacterIndex;
            if (idx !== null) {
                deleteCharacterAtIndex(idx);
            }
            closeDeleteModal();
        });
    }
    
    showStep(6);
}

init();
