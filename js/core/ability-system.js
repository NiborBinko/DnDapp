const AbilitySystem = {
    descriptions: {
        raceAbilities: {},
        raceEffects: {},
        proficiencies: {}
    },
    
    init(raceAbilityDesc, raceEffects, profDesc) {
        this.descriptions.raceAbilities = raceAbilityDesc || {};
        this.descriptions.raceEffects = raceEffects || {};
        this.descriptions.proficiencies = profDesc || {};
    },
    
    getRaceAbilityDescription(abilityName) {
        return this.descriptions.raceAbilities[abilityName] || null;
    },
    
    getRaceAbilityEffect(abilityName) {
        return this.descriptions.raceEffects.statEffects?.[abilityName] || null;
    },
    
    // Get all race abilities for a character (from race + subrace)
    getRaceAbilities(character, gameData) {
        if (!character?.raceId) return [];
        
        const race = gameData.races.find(r => r.id === character.raceId);
        let abilities = [...(race?.raceAbilities || [])];
        
        if (character.subraceName && gameData.subraces[character.raceId]) {
            const sub = gameData.subraces[character.raceId].find(s => s.name === character.subraceName);
            if (sub?.raceAbilities) {
                abilities = abilities.concat(sub.raceAbilities);
            }
        }
        
        return abilities;
    },
    
// Main function: calculate all derived values for a character
    recalculate(character, gameData) {
        // Safety check
        if (!gameData || !character || !character.raceId) {
            console.log('AbilitySystem.recalculate - early return, no race selected');
            return { raceAbilityIds: [], proficiencyIds: [], abilityIds: [], statBonuses: {}, speedBonus: 0, hpPerLevel: 0, darkvision: 60, toolOptions: [], cantrips: [], innateSpells: {}, weaponProficiencies: [], armorProficiencies: [] };
        }
        
        console.log('AbilitySystem.recalculate - raceId:', character.raceId);
        console.log('AbilitySystem.recalculate - descriptions:', this.descriptions);
        
        const result = {
            raceAbilityIds: [],
            proficiencyIds: [],
            abilityIds: [],
            statBonuses: {},
            speedBonus: 0,
            hpPerLevel: 0,
            darkvision: 60,
            toolOptions: [],
            cantrips: [],
            innateSpells: {},
            weaponProficiencies: [],
            armorProficiencies: []
        };
        
        // 1. Get race abilities
        const raceAbilities = this.getRaceAbilities(character, gameData);
        result.raceAbilityIds = raceAbilities;
        
        // 2. Process each race ability
        raceAbilities.forEach(ability => {
            const effects = this.descriptions.raceEffects;
            
            // Skill proficiency
            if (effects.skillMappings?.[ability]) {
                result.proficiencyIds.push(effects.skillMappings[ability]);
            }
            
            // Armor proficiency
            if (effects.armorProficiencies?.[ability]) {
                result.armorProficiencies.push(...effects.armorProficiencies[ability]);
            }
            
            // Weapon proficiency
            if (effects.weaponProficiencies?.[ability]) {
                result.weaponProficiencies.push(...effects.weaponProficiencies[ability]);
            }
            
            // Tool options (requires selection)
            if (effects.toolProficiencies?.[ability]) {
                result.toolOptions.push({
                    ability: ability,
                    ...effects.toolProficiencies[ability]
                });
            }
            
            // Cantrips
            if (effects.cantrips?.[ability]) {
                result.cantrips.push({
                    ability: ability,
                    ...effects.cantrips[ability]
                });
            }
            
            // Innate spells by level
            if (effects.innateSpells?.[ability]) {
                result.innateSpells[ability] = effects.innateSpells[ability];
            }
            
            // Stat effects
            const statEffect = effects.statEffects?.[ability];
            if (statEffect) {
                if (statEffect.type === 'hpPerLevel') {
                    result.hpPerLevel = (result.hpPerLevel || 0) + statEffect.value;
                } else if (statEffect.type === 'speed') {
                    result.speedBonus = (result.speedBonus || 0) + statEffect.value;
                } else if (statEffect.type === 'darkvision') {
                    result.darkvision = statEffect.value;
                } else if (statEffect.type === 'statBonus') {
                    result.statBonuses[statEffect.stat] = (result.statBonuses[statEffect.stat] || 0) + statEffect.value;
                }
            }
        });
        
        return result;
    },
    
    // Get computed proficiencies for display in Step 4
    getProficiencies(character, gameData, classId) {
        const result = {
            skills: [],
            armor: [],
            weapons: [],
            tools: [],
            toolOptions: [],
            cantrips: [],
            innateSpells: []
        };
        
        // 1. Get race-derived values
        const raceData = this.recalculate(character, gameData);
        
        result.armor = raceData.armorProficiencies || [];
        result.weapons = raceData.weaponProficiencies || [];
        result.toolOptions = raceData.toolOptions || [];
        result.cantrips = raceData.cantrips || [];
        
        // 2. Get class proficiencies
        if (classId) {
            const charClass = gameData.classes.find(c => c.id === classId);
            if (charClass?.proficiencies) {
                const profs = charClass.proficiencies;
                
                // Map abbreviated armor names to full names
                const armorMap = {
                    'light': 'light armor',
                    'medium': 'medium armor', 
                    'heavy': 'heavy armor',
                    'shields': 'shields'
                };
                
                // Skills come from class - but these are handled differently in UI
                // Just add weapon/armor/tool proficiencies from class
                if (profs.armor) {
                    profs.armor.forEach(a => {
                        const fullArmor = armorMap[a] || a;
                        if (!result.armor.includes(fullArmor)) result.armor.push(fullArmor);
                    });
                }
                if (profs.weapons) {
                    profs.weapons.forEach(w => {
                        // Don't add suffix if already has "weapons" in name
                        const weaponType = w.includes(' weapons') ? w : w + ' weapons';
                        if (!result.weapons.includes(weaponType)) {
                            result.weapons.push(weaponType);
                        }
                    });
                }
                if (profs.tools) {
                    profs.tools.forEach(t => {
                        if (!result.tools.includes(t)) result.tools.push(t);
                    });
                }
            }
        }
        
        // 3. Add race skill proficiencies to skills
        const raceSkills = raceData.proficiencyIds || [];
        result.skills = raceSkills;
        
        return result;
    },
    
    // Check if character is a spellcaster
    isSpellcaster(character) {
        if (!character?.abilityIds) return false;
        return character.abilityIds.some(a => 
            a === 'Spellcasting' || 
            a === 'Pact Magic' || 
            a === 'Sorcerous Origin' ||
            a === 'Ritual Casting' ||
            a === 'Innate Spellcasting'
        );
    },
    
    // Get spellcasting ability for a class
    getSpellcastingAbility(classId) {
        const spellcastingMap = {
            'wizard': 'intelligence',
            'sorcerer': 'charisma',
            'warlock': 'charisma',
            'cleric': 'wisdom',
            'druid': 'wisdom',
            'ranger': 'wisdom',
            'bard': 'charisma',
            'paladin': 'charisma'
        };
        return spellcastingMap[classId] || null;
    }
};