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
        const profs = AbilitySystem.getProficiencies(character, gameData, character?.classId);
        return (profs.skills || []).map(s => s.name);
    },

    getCombinedArmorProficiencies(character, gameData) {
        const profs = AbilitySystem.getProficiencies(character, gameData, character?.classId);
        return (profs.armor || []).map(a => ({
            name: a.name,
            origin: a.origin
        }));
    },

    getCombinedWeaponProficiencies(character, gameData) {
        const profs = AbilitySystem.getProficiencies(character, gameData, character?.classId);
        return (profs.weapons || []).map(w => ({
            name: w.name,
            origin: w.origin
        }));
    },

    getToolOptions(character, gameData) {
        const profs = AbilitySystem.getProficiencies(character, gameData, character?.classId);
        return profs.toolOptions || [];
    },

    getClassTools(character, gameData) {
        const profs = AbilitySystem.getProficiencies(character, gameData, character?.classId);
        return (profs.tools || []).map(t => ({
            name: t.name,
            origin: t.origin
        }));
    },

    getSavingThrows(character, gameData) {
        const charClass = gameData.classes.find(c => c.id === character.classId);
        return charClass?.proficiencies?.savingThrows || [];
    },

    formatOrigin(origin) {
        if (!origin) return '';
        if (origin.type === 'race' || origin.type === 'subrace') {
            return `\n\n📍 From: ${origin.ability} (${origin.source})`;
        } else if (origin.type === 'class') {
            return `\n\n📍 ${origin.source}`;
        }
        return '';
    }
};

window.ProficiencyUtils = ProficiencyUtils;