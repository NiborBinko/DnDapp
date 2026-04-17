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
        const raceId = character.raceId;
        const subraceName = character.subraceName;
        
        const raceAbilities = (race?.raceAbilities || []).map(a => ({ name: a, source: 'race', sourceName: raceId }));
        
        if (subraceName && gameData.subraces[raceId]) {
            const sub = gameData.subraces[raceId].find(s => s.name === subraceName);
            if (sub?.raceAbilities) {
                return [...raceAbilities, ...sub.raceAbilities.map(a => ({ name: a, source: 'subrace', sourceName: subraceName }))];
            }
        }
        
        return raceAbilities;
    },
    
// Main function: calculate all derived values for a character
    recalculate(character, gameData) {
        if (!gameData || !character || !character.raceId) {
            return { 
                raceAbilityIds: [], proficiencyIds: [], 
                skillProficiencies: [], armorProficiencies: [], weaponProficiencies: [], 
                toolOptions: [], cantrips: [], innateSpells: {}, 
                statBonuses: {}, speedBonus: 0, hpPerLevel: 0, darkvision: 60 
            };
        }
        
        const raceId = character.raceId;
        const subraceName = character.subraceName;
        
        const result = {
            raceAbilityIds: [],
            proficiencyIds: [],
            skillProficiencies: [],
            armorProficiencies: [],
            weaponProficiencies: [],
            toolOptions: [],
            cantrips: [],
            innateSpells: {},
            statBonuses: {},
            speedBonus: 0,
            hpPerLevel: 0,
            darkvision: 60
        };
        
        const raceAbilities = this.getRaceAbilities(character, gameData);
        result.raceAbilityIds = raceAbilities.map(a => a.name);
        
        raceAbilities.forEach(abilityObj => {
            const effects = this.descriptions.raceEffects;
            const createOrigin = (srcAbility) => ({ 
                type: abilityObj.source, 
                source: `${abilityObj.source === 'subrace' ? 'Subrace' : 'Race'}: ${abilityObj.sourceName}`, 
                ability: srcAbility 
            });
            
            if (effects.skillMappings?.[ability]) {
                const skillData = effects.skillMappings[ability];
                const skill = typeof skillData === 'string' ? skillData : (skillData.skill || skillData);
                result.proficiencyIds.push(skill);
                result.skillProficiencies.push({ name: skill, origin: createOrigin() });
            }
            
            if (effects.armorProficiencies?.[ability]) {
                const armorData = effects.armorProficiencies[ability];
                const armor = Array.isArray(armorData) ? armorData : (armorData.armor || []);
                armor.forEach(a => {
                    result.armorProficiencies.push({ name: a, origin: createOrigin() });
                });
            }
            
            if (effects.weaponProficiencies?.[ability]) {
                const weaponData = effects.weaponProficiencies[ability];
                const weapons = Array.isArray(weaponData) ? weaponData : (weaponData.weapons || []);
                weapons.forEach(w => {
                    result.weaponProficiencies.push({ name: w, origin: createOrigin() });
                });
            }
            
            if (effects.toolProficiencies?.[ability]) {
                const toolData = effects.toolProficiencies[ability];
                result.toolOptions.push({
                    ability: ability,
                    origin: createOrigin(),
                    options: toolData.options || [],
                    count: toolData.count || 1
                });
            }
            
            if (effects.cantrips?.[ability]) {
                result.cantrips.push({
                    ability: ability,
                    origin: createOrigin(),
                    ...effects.cantrips[ability]
                });
            }
            
            if (effects.innateSpells?.[ability]) {
                result.innateSpells[ability] = effects.innateSpells[ability];
            }
            
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
        const classOrigin = classId ? `Class: ${classId}` : null;
        
        const result = {
            skills: [],
            armor: [],
            weapons: [],
            tools: [],
            toolOptions: [],
            cantrips: [],
            innateSpells: []
        };
        
        const raceData = this.recalculate(character, gameData);
        
        // 1. Get race-derived values (already have origin)
        result.armor = raceData.armorProficiencies || [];
        result.weapons = raceData.weaponProficiencies || [];
        result.toolOptions = raceData.toolOptions || [];
        result.cantrips = raceData.cantrips || [];
        
        // 2. Get class proficiencies with origin
        if (classId) {
            const charClass = gameData.classes.find(c => c.id === classId);
            if (charClass?.proficiencies) {
                const profs = charClass.proficiencies;
                const classOriginObj = { type: 'class', source: classOrigin, ability: null };
                const abilityOriginObj = { type: 'class', source: classOrigin, ability: charClass.name };
                
                const armorMap = {
                    'light': 'light armor',
                    'medium': 'medium armor', 
                    'heavy': 'heavy armor',
                    'shields': 'shields'
                };
                
                if (profs.armor) {
                    profs.armor.forEach(a => {
                        const fullArmor = armorMap[a] || a;
                        if (!result.armor.find(x => x.name === fullArmor)) {
                            result.armor.push({ name: fullArmor, origin: classOriginObj });
                        }
                    });
                }
                if (profs.weapons) {
                    profs.weapons.forEach(w => {
                        if (!result.weapons.find(x => x.name === w)) {
                            result.weapons.push({ name: w, origin: classOriginObj });
                        }
                    });
                }
                if (profs.tools) {
                    profs.tools.forEach(t => {
                        if (!result.tools.find(x => x.name === t)) {
                            result.tools.push({ name: t, origin: abilityOriginObj });
                        }
                    });
                }
            }
        }
        
        // 3. Add race skill proficiencies with origin
        result.skills = (raceData.skillProficiencies || []).map(s => ({
            name: s.name,
            origin: s.origin
        }));
        
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