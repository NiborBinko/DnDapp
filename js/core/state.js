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

    setCharacter(character) {
        this.character = character;
    },

    getCharacter() {
        return this.character;
    },

    updateCharacter(changes) {
        Object.assign(this.character, changes);
    },

    getTotalLevel() {
        if (!this.character.classes || this.character.classes.length === 0) {
            return this.character.level || 1;
        }
        return this.character.classes.reduce((sum, c) => sum + (c.level || 0), 0);
    },

    getCharacterClasses() {
        if (!this.character.classes || this.character.classes.length === 0) {
            return [{ classId: this.character.classId, level: this.character.level || 1 }];
        }
        return this.character.classes;
    },

    getStatModifier(stat) {
        const value = this.character.stats[stat] || 10;
        return Math.floor((value - 10) / 2);
    },

    calculateArmorClass() {
        let ac = 10;
        const dexMod = this.getStatModifier('dexterity');

        const equipped = this.character.equippedItems || [];
        const armor = equipped.find(i => i.type === 'armor');

        if (armor) {
            if (armor.category === 'light') {
                ac = armor.ac + dexMod;
            } else if (armor.category === 'medium') {
                ac = armor.ac + Math.min(2, dexMod);
            } else if (armor.category === 'heavy') {
                ac = armor.ac;
            }
        }

        const shield = equipped.find(i => i.type === 'shield');
        if (shield) {
            ac += shield.ac || 2;
        }

        return ac;
    },

    calculateInitiative() {
        return this.getStatModifier('dexterity');
    },

    calculateSpeed() {
        const race = this.gameData.races.find(r => r.id === this.character.raceId);
        let speed = race?.speed || 30;

        const raceAbilities = this._getRaceAbilities();
        raceAbilities.forEach(ability => {
            const effect = raceAbilityStatEffects[ability];
            if (effect && effect.type === 'speed') {
                speed += effect.value;
            }
        });

        return speed;
    },

    _getRaceAbilities() {
        const race = this.gameData.races.find(r => r.id === this.character.raceId);
        let abilities = [...(race?.raceAbilities || [])];

        if (this.character.subraceName && this.gameData.subraces[this.character.raceId]) {
            const sub = this.gameData.subraces[this.character.raceId].find(s => s.name === this.character.subraceName);
            if (sub && sub.raceAbilities) {
                abilities = abilities.concat(sub.raceAbilities);
            }
        }

        return abilities;
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
