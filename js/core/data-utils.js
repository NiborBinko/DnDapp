const DataUtils = {
    getFeatureDescription: function(classId, featureName) {
        return classFeatureDescriptions[featureName] || null;
    },

    getOptionDescription: function(optionName) {
        return classFeatureDescriptions[optionName] || null;
    },

    getFeatDescription: function(featName) {
        return featDescriptions[featName] || null;
    },

    getFeatPrerequisites: function(featName) {
        return featPrerequisites[featName] || null;
    },

    canSelectFeat: function(featName, character) {
        const prereqs = featPrerequisites[featName];
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
    },

    getRaceAbilitySkill: function(abilityName) {
        return raceAbilitySkillMap[abilityName] || null;
    },

    getRaceAbilityStatEffect: function(abilityName) {
        return raceAbilityStatEffects[abilityName] || null;
    },

    getAutoGrantedProficiencies: function(character) {
        if (!character || !character.raceId) {
            return {
                skills: [], armor: [], weapons: [], tools: [],
                languages: [], toolOptions: [], cantrips: [], innateSpells: []
            };
        }
        
        const result = {
            skills: [],
            armor: [],
            weapons: [],
            tools: [],
            languages: [],
            toolOptions: [],
            cantrips: [],
            innateSpells: []
        };

        const raceAbilities = getRaceAbilities();
        raceAbilities.forEach(ability => {
            const skill = raceAbilitySkillMap[ability];
            if (skill) {
                result.skills.push(skill);
            }
            const armorProfs = raceAbilityArmorProficiencies[ability];
            if (armorProfs) {
                result.armor.push(...armorProfs);
            }
            const weaponProfs = raceAbilityWeaponProficiencies[ability];
            if (weaponProfs) {
                result.weapons.push(...weaponProfs);
            }
            const toolProfs = raceAbilityToolProficiencies[ability];
            if (toolProfs) {
                result.toolOptions.push({
                    ability: ability,
                    options: toolProfs.options,
                    count: toolProfs.count
                });
            }
            const cantrip = raceAbilityCantrips[ability];
            if (cantrip) {
                result.cantrips.push({ ability: ability, ...cantrip });
            }
            const innate = raceAbilityInnateSpells[ability];
            if (innate) {
                result.innateSpells.push({ ability: ability, spells: innate });
            }
        });

        return result;
    },

    getRaceStatEffects: function(character) {
        if (!character || !character.raceId) {
            return { hpPerLevel: 0, additionalHP: 0, speed: 0, carryingCapacity: 0, darkvision: 0 };
        }
        
        const result = {
            hpPerLevel: 0,
            additionalHP: 0,
            speed: 0,
            carryingCapacity: 0,
            darkvision: 0
        };

        const raceAbilities = getRaceAbilities();
        raceAbilities.forEach(ability => {
            const effect = raceAbilityStatEffects[ability];
            if (effect) {
                if (effect.type === "hpPerLevel") {
                    result.hpPerLevel += effect.value;
                } else if (effect.type === "additionalHP") {
                    result.additionalHP += effect.value;
                } else if (effect.type === "speed") {
                    result.speed += effect.value;
                } else if (effect.type === "carryingCapacity") {
                    result.carryingCapacity += effect.value;
                } else if (effect.type === "darkvision") {
                    result.darkvision = effect.value;
                }
            }
        });

        return result;
    },

    getSkillDescription: function(skillName) {
        return skillDescriptions[skillName] || null;
    },

    getRaceAbilityDescription: function(abilityName) {
        return raceAbilityDescriptions[abilityName] || null;
    },

    getStatDescription: function(statName) {
        return statDescriptions[statName] || null;
    }
};
