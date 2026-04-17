const ProficiencyUtils = {
    getMaxSkills(character, gameData) {
        const charClass = gameData.classes.find(c => c.id === character.classId);
        const extraSkills = this.getExtraSkillCount();
        return (charClass?.proficiencies?.skills?.count || 2) + extraSkills;
    },

    getExtraSkillCount() {
        const raceAbs = getRaceAbilities();
        return raceAbs.filter(a => a === '+1 Proficiency').length;
    },

    getRaceSkillProficiencies(character, gameData) {
        const raceAbilities = getRaceAbilities();
        const raceEffects = window.gameDescriptions?.raceEffects || {};
        const raceSkills = [];
        
        raceAbilities.forEach(ability => {
            const skillData = raceEffects.skillMappings?.[ability];
            if (skillData) {
                const skill = typeof skillData === 'string' ? skillData : (skillData.skill || skillData);
                raceSkills.push(skill);
            }
        });
        return raceSkills;
    },

    getCombinedArmorProficiencies(character, gameData) {
        const charClass = gameData.classes.find(c => c.id === character.classId);
        const classArmor = charClass?.proficiencies?.armor || [];
        const raceProfs = AbilitySystem.getProficiencies(character, gameData, character.classId) || {};
        
        const processedArmor = [];
        const armorTypes = ['light armor', 'medium armor', 'heavy armor', 'shields'];
        
        armorTypes.forEach(armor => {
            const hasClassProf = classArmor.includes(armor) || classArmor.includes(armor.replace(' armor', ''));
            if (hasClassProf) {
                processedArmor.push({ name: armor, source: 'Class: ' + charClass.name });
            }
        });
        
        if (raceProfs.armor) {
            raceProfs.armor.forEach(armor => {
                if (!processedArmor.find(a => a.name === armor)) {
                    processedArmor.push({ name: armor, source: 'Race: ' + character.raceId });
                }
            });
        }
        
        return processedArmor;
    },

    getCombinedWeaponProficiencies(character, gameData) {
        const charClass = gameData.classes.find(c => c.id === character.classId);
        const classWeapons = charClass?.proficiencies?.weapons || [];
        const raceProfs = AbilitySystem.getProficiencies(character, gameData, character.classId) || {};
        
        const processedWeapons = [];
        const weaponTypes = ['simple weapons', 'martial weapons'];
        
        weaponTypes.forEach(weapon => {
            const hasClassProf = classWeapons.includes(weapon) || classWeapons.includes(weapon.replace(' weapons', ''));
            if (hasClassProf) {
                processedWeapons.push({ name: weapon, source: 'Class: ' + charClass.name });
            }
        });
        
        classWeapons.forEach(weapon => {
            if (!weapon.includes(' ') && !processedWeapons.find(w => w.name === weapon)) {
                processedWeapons.push({ name: weapon, source: 'Class: ' + charClass.name });
            }
        });
        
        if (raceProfs.weapons) {
            raceProfs.weapons.forEach(weapon => {
                const existing = processedWeapons.find(w => w.name === weapon);
                const origin = getProficiencyOrigin(weapon, 'weapon', character);
                
                if (existing) {
                    if (origin && existing.source !== origin && !existing.source.includes(origin.split(' (')[0])) {
                        existing.source = origin;
                        existing.isFromRace = true;
                    }
                } else {
                    processedWeapons.push({ name: weapon, source: origin || 'Race: ' + character.raceId, isFromRace: true });
                }
            });
        }
        
        return processedWeapons;
    },

    getToolOptions(character, gameData) {
        const raceProfs = AbilitySystem.getProficiencies(character, gameData, character.classId) || {};
        return raceProfs.toolOptions || [];
    },

    getClassTools(character, gameData) {
        const charClass = gameData.classes.find(c => c.id === character.classId);
        const classTools = charClass?.proficiencies?.tools || [];
        return classTools.map(tool => ({ name: tool, source: 'Class: ' + charClass.name }));
    },

    getSavingThrows(character, gameData) {
        const charClass = gameData.classes.find(c => c.id === character.classId);
        return charClass?.proficiencies?.savingThrows || [];
    }
};

window.ProficiencyUtils = ProficiencyUtils;