const CharacterEntity = {
    create(data = {}) {
        return {
            id: data.id || Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: data.name || '',
            classes: data.classes || [],
            classId: data.classId || null,
            level: data.level || 1,
            raceId: data.raceId || null,
            subraceName: data.subraceName || null,
            humanBonusStats: data.humanBonusStats || [],
            stats: data.stats || {},
            baseStats: data.baseStats || {},
            hitPoints: data.hitPoints || { current: 0, max: 0, temp: 0 },
            spellSlots: data.spellSlots || {},
            proficiencyIds: data.proficiencyIds || [],
            abilityIds: data.abilityIds || [],
            featIds: data.featIds || [],
            selectedOptions: data.selectedOptions || [],
            spells: data.spells || [],
            inventory: data.inventory || [],
            equippedItems: data.equippedItems || [],
            attacks: data.attacks || [],
            currency: data.currency || { copper: 0, silver: 0, gold: 0, platinum: 0 },
            conditions: data.conditions || [],
            deathSaves: data.deathSaves || { successes: 0, failures: 0 },
            speed: data.speed || 30,
            proficiencyBonus: data.proficiencyBonus || 2,
            savingThrows: data.savingThrows || []
        };
    },

    getTotalLevel(character) {
        if (!character.classes || character.classes.length === 0) {
            return character.level || 1;
        }
        return character.classes.reduce((sum, c) => sum + (c.level || 0), 0);
    },

    getClasses(character) {
        if (!character.classes || character.classes.length === 0) {
            return [{ classId: character.classId, level: character.level || 1 }];
        }
        return character.classes;
    },

    getStatModifier(character, stat) {
        const value = character.stats[stat] || 10;
        return Math.floor((value - 10) / 2);
    },

    calculateMaxHP(character) {
        let maxHP = 0;
        const charClasses = this.getClasses(character);
        const gameData = DnDState ? DnDState.gameData : { classes: [], races: [], subraces: {} };

        charClasses.forEach(cls => {
            const classData = gameData.classes.find(c => c.id === cls.classId);
            const hitDie = classData?.hitDie || 8;
            maxHP += hitDie + this.getStatModifier(character, 'constitution');
        });

        const raceAbilities = this._getRaceAbilities(character);
        raceAbilities.forEach(ability => {
            const effect = raceAbilityStatEffects[ability];
            if (effect && effect.type === 'hpPerLevel') {
                maxHP += effect.value * this.getTotalLevel(character);
            }
            if (effect && effect.type === 'additionalHP') {
                maxHP += effect.value;
            }
        });

        return Math.max(1, maxHP);
    },

    calculateArmorClass(character) {
        let ac = 10;
        const dexMod = this.getStatModifier(character, 'dexterity');

        const equipped = character.equippedItems || [];
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

    calculateInitiative(character) {
        return this.getStatModifier(character, 'dexterity');
    },

    calculateSpeed(character) {
        const gameData = DnDState ? DnDState.gameData : { races, subraces };
        const race = gameData.races.find(r => r.id === character.raceId);
        let speed = race?.speed || 30;

        const raceAbilities = this._getRaceAbilities(character);
        raceAbilities.forEach(ability => {
            const effect = raceAbilityStatEffects[ability];
            if (effect && effect.type === 'speed') {
                speed += effect.value;
            }
        });

        return speed;
    },

    calculateProficiencyBonus(character) {
        const level = this.getTotalLevel(character);
        return Math.ceil(level / 4) + 1;
    },

    _getRaceAbilities(character) {
        const gameData = DnDState ? DnDState.gameData : { races, subraces };
        const race = gameData.races.find(r => r.id === character.raceId);
        let abilities = [...(race?.raceAbilities || [])];

        if (character.subraceName && gameData.subraces[character.raceId]) {
            const sub = gameData.subraces[character.raceId].find(s => s.name === character.subraceName);
            if (sub && sub.raceAbilities) {
                abilities = abilities.concat(sub.raceAbilities);
            }
        }

        return abilities;
    },

    addSpell(character, spell) {
        if (!character.spells) character.spells = [];
        if (!character.spells.includes(spell)) {
            character.spells.push(spell);
        }
    },

    removeSpell(character, spell) {
        if (!character.spells) return;
        const idx = character.spells.indexOf(spell);
        if (idx > -1) {
            character.spells.splice(idx, 1);
        }
    },

    addItem(character, item) {
        if (!character.inventory) character.inventory = [];
        character.inventory.push(item);
    },

    removeItem(character, itemId) {
        if (!character.inventory) return;
        const idx = character.inventory.findIndex(i => i.id === itemId);
        if (idx > -1) {
            character.inventory.splice(idx, 1);
        }
    },

    equipItem(character, item) {
        this.removeItem(character, item.id);
        if (!character.equippedItems) character.equippedItems = [];
        character.equippedItems.push(item);
    },

    unequipItem(character, itemId) {
        if (!character.equippedItems) return;
        const idx = character.equippedItems.findIndex(i => i.id === itemId);
        if (idx > -1) {
            const item = character.equippedItems.splice(idx, 1)[0];
            this.addItem(character, item);
        }
    },

    addAttack(character, attack) {
        if (!character.attacks) character.attacks = [];
        character.attacks.push(attack);
    },

    updateCurrency(character, type, amount) {
        if (!character.currency) {
            character.currency = { copper: 0, silver: 0, gold: 0, platinum: 0 };
        }
        character.currency[type] = (character.currency[type] || 0) + amount;
    },

    addCondition(character, condition) {
        if (!character.conditions) character.conditions = [];
        if (!character.conditions.includes(condition)) {
            character.conditions.push(condition);
        }
    },

    removeCondition(character, condition) {
        if (!character.conditions) return;
        const idx = character.conditions.indexOf(condition);
        if (idx > -1) {
            character.conditions.splice(idx, 1);
        }
    },

    makeDeathSave(character, success) {
        if (!character.deathSaves) {
            character.deathSaves = { successes: 0, failures: 0 };
        }
        if (success) {
            character.deathSaves.successes++;
        } else {
            character.deathSaves.failures++;
        }
    },

    resetDeathSaves(character) {
        if (character.deathSaves) {
            character.deathSaves.successes = 0;
            character.deathSaves.failures = 0;
        }
    }
};

window.CharacterEntity = CharacterEntity;
