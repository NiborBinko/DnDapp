const DnDState = {
    gameData: {
        classes: [],
        races: [],
        subraces: {},
        feats: [],
        statLabels: {},
        spells: {}
    },

    character: {
        id: null,
        name: '',
        classes: [],
        raceId: null,
        subraceName: null,
        humanBonusStats: [],
        stats: {},
        baseStats: {},
        hitPoints: { current: 0, max: 0, temp: 0 },
        spellSlots: {},
        proficiencyIds: [],
        abilityIds: [],
        featIds: [],
        selectedOptions: [],
        spells: [],
        inventory: [],
        equippedItems: [],
        attacks: [],
        currency: { copper: 0, silver: 0, gold: 0, platinum: 0 },
        conditions: [],
        deathSaves: { successes: 0, failures: 0 }
    },

    savedCharacters: [],

    ui: {
        currentStep: 0,
        viewingCharacterIndex: null,
        levelingCharacterIndex: null,
        deleteCharacterIndex: null,
        selectedLevelUpClass: null,
        availableFeaturesAtLevel: [],
        rolledHitPoints: 0,
        pendingLevelUp: null,
        pendingMulticlassClass: null,
        pointsRemaining: 27
    },

    init(gameData) {
        this.gameData = gameData;
        this.savedCharacters = JSON.parse(localStorage.getItem('dnd-characters') || '[]');
    },

    createNewCharacter() {
        return {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: '',
            classes: [],
            raceId: null,
            subraceName: null,
            humanBonusStats: [],
            stats: {},
            baseStats: {},
            hitPoints: { current: 0, max: 0, temp: 0 },
            spellSlots: {},
            proficiencyIds: [],
            abilityIds: [],
            featIds: [],
            selectedOptions: [],
            spells: [],
            inventory: [],
            equippedItems: [],
            attacks: [],
            currency: { copper: 0, silver: 0, gold: 0, platinum: 0 },
            conditions: [],
            deathSaves: { successes: 0, failures: 0 }
        };
    },

    saveCharacter() {
        const chars = JSON.parse(localStorage.getItem('dnd-characters') || '[]');
        const existingIndex = this.character.id 
            ? chars.findIndex(c => c.id === this.character.id)
            : -1;

        if (existingIndex >= 0) {
            chars[existingIndex] = this.character;
        } else {
            chars.push(this.character);
        }

        localStorage.setItem('dnd-characters', JSON.stringify(chars));
        this.savedCharacters = chars;
    },

    loadSavedCharacter(index) {
        const chars = JSON.parse(localStorage.getItem('dnd-characters') || '[]');
        if (index >= 0 && index < chars.length) {
            this.character = chars[index];
            return this.character;
        }
        return null;
    },

    deleteSavedCharacter(index) {
        const chars = JSON.parse(localStorage.getItem('dnd-characters') || '[]');
        if (index >= 0 && index < chars.length) {
            chars.splice(index, 1);
            localStorage.setItem('dnd-characters', JSON.stringify(chars));
            this.savedCharacters = chars;
        }
    },

    getSavedCharacters() {
        return this.savedCharacters;
    }
};

window.DnDState = DnDState;
