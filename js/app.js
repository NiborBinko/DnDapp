function init() {
    // Load all class files
    const classIds = ['fighter', 'wizard', 'rogue', 'cleric', 'ranger', 'barbarian', 'paladin', 'bard', 'druid', 'monk', 'sorcerer', 'warlock'];
    const classFiles = classIds.map(id => fetch(`classes/${id}.json`));
    
    // Load all race files
    const raceIds = ['human', 'elf', 'dwarf', 'halfling', 'dragonborn', 'gnome', 'halfelf', 'halforc', 'tiefling'];
    const raceFiles = raceIds.map(id => fetch(`races/${id}.json`));
    
    const classCount = classIds.length;
    const raceCount = raceIds.length;
    
    const otherFiles = [
        fetch('statLabels.json'),
        fetch('descriptions/stats.json'),
        fetch('descriptions/feats.json'),
        fetch('descriptions/race-abilities.json'),
        fetch('descriptions/class-abilities.json'),
        fetch('descriptions/class-options.json'),
        fetch('effects/race-effects.json'),
        fetch('effects/class-effects.json'),
        fetch('effects/class-option-effects.json'),
        fetch('effects/feat-effects.json'),
        fetch('descriptions/proficiencies.json'),
        fetch('dnd-spell-lists.json'),
        fetch('js/domain/spells.json')
    ];
    
    Promise.all([...classFiles, ...raceFiles, ...otherFiles])
        .then((responses) => {
            const classResponses = responses.slice(0, classCount);
            const raceResponses = responses.slice(classCount, classCount + raceCount);
            const otherResponses = responses.slice(classCount + raceCount);
            
            return Promise.all([
                ...classResponses.map(r => r.json()),
                ...raceResponses.map(r => r.json()),
                otherResponses[0].json(), // statLabels
                otherResponses[1].json(), // stats
                otherResponses[2].json(), // feats
                otherResponses[3].json(), // race abilities
                otherResponses[4].json(), // class abilities
                otherResponses[5].json(), // class options
                otherResponses[6].json(), // race effects
                otherResponses[7].json(), // class effects
                otherResponses[8].json(), // class option effects
                otherResponses[9].json(), // proficiencies
                otherResponses[10].json(), // spell lists
                otherResponses[11].json()  // spell data
            ]);
        })
        .then((results) => {
            const classes = results.slice(0, classCount);
            const races = results.slice(classCount, classCount + raceCount);
            const statLabels = results[classCount + raceCount];
            const stats = results[classCount + raceCount + 1];
            const feats = results[classCount + raceCount + 2];
            const raceAbilitiesDesc = results[classCount + raceCount + 3];
            const classAbilities = results[classCount + raceCount + 4];
            const classOptions = results[classCount + raceCount + 5];
            const raceEffects = results[classCount + raceCount + 6];
            const classEffects = results[classCount + raceCount + 7];
            const classOptionEffects = results[classCount + raceCount + 8];
            const featEffects = results[classCount + raceCount + 9];
            const profDesc = results[classCount + raceCount + 10];
            const spellLists = results[classCount + raceCount + 11];
            const spellData = results[classCount + raceCount + 12];
            
            // Extract subraces from race files for backward compatibility
            const subraces = {};
            races.forEach(race => {
                if (race.subraces) {
                    subraces[race.id] = Object.keys(race.subraces).map(name => ({name, ...race.subraces[name]}));
                }
            });
            
            // Combine data into DnDState format
            const gameData = {
                classes: classes,
                races: races,
                subraces: subraces,
                feats: Object.keys(feats),
                statLabels: statLabels
            };
            
            // Make descriptions available globally
            window.gameDescriptions = {
                stats: stats,
                feats: feats,
                raceAbilities: raceAbilitiesDesc,
                classAbilities: classAbilities,
                classOptions: classOptions,
                raceEffects: raceEffects,
                classEffects: classEffects,
                classOptionEffects: classOptionEffects,
                featEffects: featEffects,
                proficiencies: profDesc,
                skills: profDesc.skills || {},
                armor: profDesc.armor || {},
                weapons: profDesc.weapons || {},
                tools: profDesc.tools || {},
                savingThrows: profDesc.savingThrows || {},
                mastery: profDesc.mastery || {}
            };
            
            // Update legacy config variables for backward compatibility
            _skillDescriptions = window.gameDescriptions.skills;
            _raceAbilityDescriptions = window.gameDescriptions.raceAbilities;
            _featDescriptions = window.gameDescriptions.feats;
            _proficiencyDescriptions = {
                armor: window.gameDescriptions.armor,
                weapons: window.gameDescriptions.weapons,
                tools: window.gameDescriptions.tools,
                savingThrows: window.gameDescriptions.savingThrows,
                mastery: window.gameDescriptions.mastery
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
