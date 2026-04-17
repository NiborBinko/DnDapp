const DataUtils = {
    canSelectFeat: function(featName, character) {
        const prereqs = getFeatEffects()[featName];
        if (!prereqs) return { canSelect: true, reason: null };

        if (prereqs.canCastSpells) {
            const hasSpellcasting = character.abilityIds && character.abilityIds.some(a => 
                a === 'Spellcasting' || a === 'Pact Magic' || a === 'Sorcerous Origin'
            );
            if (!hasSpellcasting) {
                return { canSelect: false, reason: "Requires ability to cast spells (Spellcasting, Pact Magic, or Sorcerous Origin feature)" };
            }
        }

        if (prereqs.armorProficiency) {
            const gameData = DnDState ? DnDState.gameData : { classes: [], races: [], subraces: {} };
            const classData = gameData.classes.find(c => c.id === character.classId);
            const proficiencies = classData?.proficiencies?.armor || [];
            const hasRequired = proficiencies.includes(prereqs.armorProficiency) || 
                               (prereqs.armorProficiency === 'none' && proficiencies.length === 0);
            if (!hasRequired) {
                return { canSelect: false, reason: `Requires ${prereqs.armorProficiency} armor proficiency` };
            }
        }

        if (prereqs.abilityScore) {
            const stat = character.stats[prereqs.abilityScore.stat] || 10;
            if (stat < prereqs.abilityScore.min) {
                return { canSelect: false, reason: `Requires ${prereqs.abilityScore.stat.toUpperCase()} ${prereqs.abilityScore.min}+` };
            }
        }

        if (prereqs.hasAbilityScoreIncrease) {
            const level = character.level || 1;
            if (level < 4) {
                return { canSelect: false, reason: "Requires level 4 or higher (Ability Score Improvement)" };
            }
        }

        if (prereqs.fightingStyle) {
            const hasStyle = character.abilityIds && character.abilityIds.some(a => 
                a === prereqs.fightingStyle
            );
            if (!hasStyle) {
                return { canSelect: false, reason: `Requires ${prereqs.fightingStyle} fighting style` };
            }
        }

        if (prereqs.weaponProficiency) {
            return { canSelect: true, reason: null };
        }

        return { canSelect: true, reason: null };
    }
};

window.DataUtils = DataUtils;