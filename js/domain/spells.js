const SpellManager = {
    spellData: {},
    spellLists: {},

    init(spellData, spellLists) {
        this.spellData = spellData;
        this.spellLists = spellLists?.spellcasting || spellLists || {};
    },

    getSpell(spellId) {
        if (this.spellData.cantrips && this.spellData.cantrips[spellId]) {
            return { ...this.spellData.cantrips[spellId], level: 0 };
        }
        for (let level = 1; level <= 9; level++) {
            if (this.spellData['level' + level] && this.spellData['level' + level][spellId]) {
                return { ...this.spellData['level' + level][spellId], level };
            }
        }
        return null;
    },

    getAllSpells() {
        const spells = [];
        if (this.spellData.cantrips) {
            Object.keys(this.spellData.cantrips).forEach(id => {
                spells.push({ ...this.spellData.cantrips[id], id, level: 0 });
            });
        }
        for (let level = 1; level <= 9; level++) {
            if (this.spellData['level' + level]) {
                Object.keys(this.spellData['level' + level]).forEach(id => {
                    spells.push({ ...this.spellData['level' + level][id], id, level });
                });
            }
        }
        return spells;
    },

    getSpellsByLevel(level) {
        if (level === 0) return this.spellData.cantrips || {};
        return this.spellData['level' + level] || {};
    },

    getSpellDescription(spellId) {
        const spell = this.getSpell(spellId);
        if (!spell) return '';
        
        let desc = spell.description || '';
        if (spell.damage) {
            desc += `\nDamage: ${spell.damage} ${spell.damageType || ''}`;
        }
        if (spell.healing) {
            desc += `\nHealing: ${spell.healing}`;
        }
        
        const dc = this.getSpellSaveDCForSpell(spell);
        const atk = this.getSpellAttackBonusForSpell(spell);
        
        if (dc) desc += `\nSave DC: ${dc}`;
        if (atk) desc += `\nAttack: ${atk >= 0 ? '+' : ''}${atk}`;
        
        return desc;
    },

    getSpellSaveDCForSpell(spell, character = null) {
        if (!spell || !character) return null;
        
        const charClasses = CharacterEntity.getClasses(character);
        const gameData = DnDState ? DnDState.gameData : { classes: [] };
        
        for (const cls of charClasses) {
            const classData = gameData.classes.find(c => c.id === cls.classId);
            if (classData && classData.spellSlotTable) {
                const ability = classData.primaryStat || 'intelligence';
                const mod = CharacterEntity.getStatModifier(character, ability);
                const profBonus = CharacterEntity.calculateProficiencyBonus(character);
                return 8 + profBonus + mod;
            }
        }
        
        return null;
    },

    getSpellAttackBonusForSpell(spell, character = null) {
        if (!spell || !character) return null;
        
        const charClasses = CharacterEntity.getClasses(character);
        const gameData = DnDState ? DnDState.gameData : { classes: [] };
        
        for (const cls of charClasses) {
            const classData = gameData.classes.find(c => c.id === cls.classId);
            if (classData && classData.spellSlotTable) {
                const ability = classData.primaryStat || 'intelligence';
                const mod = CharacterEntity.getStatModifier(character, ability);
                const profBonus = CharacterEntity.calculateProficiencyBonus(character);
                return profBonus + mod;
            }
        }
        
        return null;
    },

    getClassSpellList(classId) {
        return this.spellLists[classId] || null;
    },

    isSpellcaster(character) {
        const abilityIds = character.abilityIds || [];
        const hasSpellcasting = abilityIds.includes('Spellcasting');
        const hasPactMagic = abilityIds.includes('Pact Magic');
        const hasArchetypeCasting = this.isArchetypeSpellcaster(character);
        return hasSpellcasting || hasPactMagic || hasArchetypeCasting;
    },

    hasFeature(character, featureName) {
        const abilityIds = character.abilityIds || [];
        return abilityIds.includes(featureName);
    },

    getSpellSlotsForClass(classId, level) {
        const spellList = this.spellLists[classId];
        if (!spellList || !spellList.spellsKnownAtLevel) return 0;
        
        return spellList.spellsKnownAtLevel[level] || 0;
    },

    getCantripsKnownForClass(classId, level) {
        const spellList = this.spellLists[classId];
        if (!spellList || !spellList.cantripsAtLevel) return 0;
        
        return spellList.cantripsAtLevel[level] || 0;
    },

    getAvailableSpellsForClass(classId) {
        const spellList = this.spellLists[classId];
        if (!spellList || !spellList.spellList) return [];
        
        const spells = [];
        Object.keys(spellList.spellList).forEach(level => {
            spellList.spellList[level].forEach(spellId => {
                spells.push({ spellId, level: parseInt(level) });
            });
        });
        
        return spells;
    },

    getInnateSpellsForClass(classId, characterLevel) {
        const spellList = this.spellLists[classId];
        if (!spellList || !spellList.innateSpells) return [];
        
        const innate = [];
        Object.keys(spellList.innateSpells).forEach(reqLevel => {
            if (characterLevel >= parseInt(reqLevel)) {
                spellList.innateSpells[reqLevel].forEach(spellId => {
                    innate.push({ spellId, level: 0 });
                });
            }
        });
        
        return innate;
    },

    getArchetypeSpellList(character) {
        const selectedOptions = character.selectedOptions || [];
        const spellLists = [];
        
        for (const option of selectedOptions) {
            if (option.optionId === 'eldritchKnight' || option.optionId === 'arcaneTrickster') {
                const spellList = this.spellLists[option.optionId];
                if (spellList) {
                    const effectiveLevel = option.level - (spellList.effectiveCasterLevelStart - 1);
                    if (effectiveLevel >= 1) {
                        spellLists.push({
                            spellList: spellList,
                            effectiveLevel: effectiveLevel,
                            archetypeId: option.optionId
                        });
                    }
                }
            }
        }
        
        return spellLists;
    },

    calculateSpellSlots(character) {
        const slots = {};
        const charClasses = CharacterEntity.getClasses(character);
        const gameData = DnDState ? DnDState.gameData : { classes: [] };
        
        charClasses.forEach(cls => {
            const classData = gameData.classes.find(c => c.id === cls.classId);
            if (!classData || !classData.spellSlotTable) return;
            
            const effectiveLevel = cls.level;
            const classSlots = classData.spellSlotTable[effectiveLevel];
            if (classSlots) {
                Object.keys(classSlots).forEach(slotLevel => {
                    const count = classSlots[slotLevel];
                    slots[slotLevel] = (slots[slotLevel] || 0) + count;
                });
            }
        });
        
        const archetypeLists = this.getArchetypeSpellList(character);
        archetypeLists.forEach(arch => {
            const archSlots = arch.spellList.spellSlotTable?.[arch.effectiveLevel];
            if (archSlots) {
                Object.keys(archSlots).forEach(slotLevel => {
                    const count = archSlots[slotLevel];
                    slots[slotLevel] = (slots[slotLevel] || 0) + count;
                });
            }
        });
        
        return slots;
    },

    getArchetypeCantripsKnown(character, archetypeId) {
        const spellList = this.spellLists[archetypeId];
        if (!spellList || !spellList.cantripsAtLevel) return 0;
        
        const selectedOptions = character.selectedOptions || [];
        const option = selectedOptions.find(o => o.optionId === archetypeId);
        
        if (!option) return 0;
        
        const effectiveLevel = option.level - (spellList.effectiveCasterLevelStart - 1);
        return spellList.cantripsAtLevel[effectiveLevel] || 0;
    },

    getArchetypeSpellsKnown(character, archetypeId) {
        const spellList = this.spellLists[archetypeId];
        if (!spellList || !spellList.spellsKnownAtLevel) return 0;
        
        const selectedOptions = character.selectedOptions || [];
        const option = selectedOptions.find(o => o.optionId === archetypeId);
        
        if (!option) return 0;
        
        const effectiveLevel = option.level - (spellList.effectiveCasterLevelStart - 1);
        return spellList.spellsKnownAtLevel[effectiveLevel] || 0;
    },

    getArchetypeAvailableSpells(character, archetypeId) {
        const spellList = this.spellLists[archetypeId];
        if (!spellList || !spellList.spellList) return [];
        
        const selectedOptions = character.selectedOptions || [];
        const option = selectedOptions.find(o => o.optionId === archetypeId);
        
        if (!option) return [];
        
        const effectiveLevel = option.level - (spellList.effectiveCasterLevelStart - 1);
        
        const spells = [];
        for (let lvl = 1; lvl <= effectiveLevel && lvl <= 4; lvl++) {
            if (spellList.spellList[lvl]) {
                spellList.spellList[lvl].forEach(spellId => {
                    spells.push({ spellId, level: lvl });
                });
            }
        }
        
        return spells;
    },

    isArchetypeSpellcaster(character) {
        const selectedOptions = character.selectedOptions || [];
        return selectedOptions.some(o => 
            o.optionId === 'eldritchKnight' || o.optionId === 'arcaneTrickster'
        );
    },

    getHighestSpellSlotLevel(character) {
        const slots = this.calculateSpellSlots(character);
        let highest = 0;
        Object.keys(slots).forEach(level => {
            if (slots[level] > 0 && parseInt(level) > highest) {
                highest = parseInt(level);
            }
        });
        return highest;
    },

    getInvocationsAvailable(character) {
        const charClasses = CharacterEntity.getClasses(character);
        const warlockClass = charClasses.find(c => c.classId === 'warlock');
        
        if (!warlockClass) return [];
        
        const spellList = this.spellLists['warlock'];
        if (!spellList || !spellList.invocationsAtLevel) return [];
        
        const invocationsCount = spellList.invocationsAtLevel[warlockClass.level] || 0;
        if (invocationsCount === 0) return [];
        
        const availableInvocations = [];
        Object.keys(spellList.invocations).forEach(reqLevel => {
            if (warlockClass.level >= parseInt(reqLevel)) {
                spellList.invocations[reqLevel].forEach(inv => {
                    if (!availableInvocations.includes(inv)) {
                        availableInvocations.push(inv);
                    }
                });
            }
        });
        
        return availableInvocations;
    },

    getInvocationsKnown(character) {
        return character.invocations || [];
    },

    getInvocationsAtLevel(classLevel) {
        const spellList = this.spellLists['warlock'];
        if (!spellList || !spellList.invocationsAtLevel) return 0;
        return spellList.invocationsAtLevel[classLevel] || 0;
    },

    getSpellSaveDC(character, spellcastingAbility = 'intelligence') {
        const mod = CharacterEntity.getStatModifier(character, spellcastingAbility);
        const profBonus = CharacterEntity.calculateProficiencyBonus(character);
        return 8 + profBonus + mod;
    },

    getSpellAttackBonus(character, spellcastingAbility = 'intelligence') {
        const mod = CharacterEntity.getStatModifier(character, spellcastingAbility);
        const profBonus = CharacterEntity.calculateProficiencyBonus(character);
        return profBonus + mod;
    },

    isWizard(character) {
        const charClasses = CharacterEntity.getClasses(character);
        return charClasses.some(c => c.classId === 'wizard');
    },

    isWarlock(character) {
        const charClasses = CharacterEntity.getClasses(character);
        return charClasses.some(c => c.classId === 'warlock');
    },

    isPreparedCaster(character) {
        const charClasses = CharacterEntity.getClasses(character);
        const preparedClasses = ['cleric', 'druid', 'paladin'];
        return charClasses.some(c => preparedClasses.includes(c.classId));
    }
};

window.SpellManager = SpellManager;