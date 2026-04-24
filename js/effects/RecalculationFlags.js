/**
 * Recalculation system - Always recalculate everything on any change
 */

function triggerRecalc() { recalcAll(); }

function recalculateAll() { recalcAll(); }

function recalcAll() {
    recalcRaceEffects(); recalcClassBase(); recalcFeatures(); recalcStatModifiers();
    recalcProficiencies();
    recalcMaxHp();  recalcVision(); recalcSpeed();
    recalcSpellcasting(); recalcSpellSlots(); recalcFeats();
}

// Constants
const STAT_NAMES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

// Helper: Get selections for a feature choice
// Returns: user's selections OR auto-apply if options.length === count
function getEffectSelections(effect, defaultOptions) {
    if (!effect || !effect.options) return null;

    const key = effect.options[0]?.includes(' ') ?
        effect.options[0].toLowerCase() :
        defaultOptions?.[0]?.toLowerCase() || '';

    const choice = userSelection.featureChoices?.[key];
    if (choice && choice.selected) {
        const selections = choice.selected.filter(s => s !== null);
        if (selections.length > 0) return selections;
    }

    // Auto-apply if options.length === count
    if (effect.options.length === effect.count) {
        return effect.options;
    }

    return null;
}

function recalcRaceEffects() {
    // Reset stats to base 8 first (idempotent)
    STAT_NAMES.forEach(stat => { userSelection.stats[stat] = 8; });

    if (!userSelection.race) return;
    const bonuses = getRaceStatBonuses(userSelection.race, userSelection.subrace);

    // Handle normal numeric bonuses
    Object.keys(bonuses).forEach(stat => {
        userSelection.stats[stat] = (userSelection.stats[stat] || 8) + bonuses[stat];
    });
}

function recalcClassBase() {
    if (!userSelection.class) return;
    const cls = window.classesData[userSelection.class];
    if (cls?.spellcastingAbility) characterSheet.spellcastingAbility = cls.spellcastingAbility;
}

function recalcStatModifiers() {
    Object.keys(characterSheet.stats).forEach(stat => {
        characterSheet.statModifiers[stat] = Math.floor((characterSheet.stats[stat] - 10) / 2);
    });
    characterSheet.initiative = characterSheet.statModifiers.dexterity;
    characterSheet.armorClass = 10 + characterSheet.statModifiers.dexterity;
}

function recalcVision() {
    let vision = { nightvision: null, dayvision: 120 };

    // Process features for vision bonuses (type: "vision")
    if (characterSheet.features) {
        characterSheet.features.forEach(feature => {
            const effect = window.EffectHandler.getEffectByName(feature.name, feature.source);
            if (effect?.type === 'vision' && effect.value) {
                if (typeof effect.value === 'object') {
                    vision.nightvision = effect.value.nightvision || vision.nightvision;
                    vision.dayvision = effect.value.dayvision || vision.dayvision;
                }
            }
        });
    }

    characterSheet.vision = vision;
}

function recalcSpeed() {
    let speed = 30;
    if (userSelection.race) speed = window.racesData[userSelection.race]?.speed || 30;

    // Process race features for speed bonuses (type: "speed")
    if (characterSheet.features) {
        characterSheet.features.forEach(feature => {
            const effect = window.EffectHandler.getEffectByName(feature.name, feature.source);
            if (effect?.type === 'speed' && effect.value) {
                speed += effect.value;
            }
        });
    }

    characterSheet.speed = speed;
}

function recalcMaxHp() {
    let baseHp;

    if (!userSelection.class) {
        baseHp = 10;
    } else {
        const cls = window.classesData[userSelection.class];
        const hitDie = cls?.hitDie || 8;
        baseHp = hitDie + characterSheet.statModifiers.constitution;
    }

    // Add maxHP bonuses from features (type: "maxHP") - WORKS FOR BOTH CASES NOW!
    if (characterSheet.features) {
        characterSheet.features.forEach(feature => {
            const effect = window.EffectHandler.getEffectByName(feature.name, feature.source);
            if (effect?.type === 'maxHP') {
                if (effect.value === 'lvl') {
                    baseHp += userSelection.lvl;
                } else {
                    baseHp += effect.value;
                }
            }
        });
    }

    characterSheet.maxHp = baseHp;
    characterSheet.currentHp = characterSheet.maxHp;
}

function recalcProficiencies() {
    characterSheet.proficiencies = { skills: [], weapons: [], armor: [], tools: [], savingThrows: [] };

    // Clear all featureChoices when recalculating (will be re-added based on current selections)
    if (userSelection.featureChoices) {
        userSelection.featureChoices = {};
    }

    if (userSelection.class) {
        const cls = window.classesData[userSelection.class];
        if (cls?.proficiencies) {
            if (cls.proficiencies.armor) characterSheet.proficiencies.armor = [...cls.proficiencies.armor];
            if (cls.proficiencies.weapons) characterSheet.proficiencies.weapons = [...cls.proficiencies.weapons];
            if (cls.proficiencies.savingThrows) characterSheet.proficiencies.savingThrows = [...cls.proficiencies.savingThrows];
        }
    }
    userSelection.selectedSkills.forEach(s => { if (!characterSheet.proficiencies.skills.includes(s)) characterSheet.proficiencies.skills.push(s); });

    // Process race features for proficiencies (type: "proficiency")
    if (characterSheet.features) {
        characterSheet.features.forEach(feature => {
            const effect = window.EffectHandler.getEffectByName(feature.name, feature.source);
            if (effect?.type === 'proficiency') {
                const profType = effect.proficiencyType;
                const selections = getEffectSelections(effect);

                // Store pending choice if options exist but selections don't match count
                if (effect.options && effect.options.length !== effect.count && !selections) {
                    const key = feature.name.toLowerCase();
                    userSelection.featureChoices[key] = {
                        count: effect.count,
                        selected: Array(effect.count).fill(null),
                        options: effect.options,
                        type: 'proficiency',
                        proficiencyType: profType
                    };
                }

                // Auto-add if selections.length === count (no choice needed)
                if (selections && selections.length === effect.count) {
                    selections.forEach(item => {
                        if (profType === 'skill' && !characterSheet.proficiencies.skills.includes(item)) {
                            characterSheet.proficiencies.skills.push(item);
                        } else if (profType === 'tool' && !characterSheet.proficiencies.tools.includes(item)) {
                            characterSheet.proficiencies.tools.push(item);
                        } else if (profType === 'weapon' && !characterSheet.proficiencies.weapons.includes(item)) {
                            characterSheet.proficiencies.weapons.push(item);
                        } else if (profType === 'armor' && !characterSheet.proficiencies.armor.includes(item)) {
                            characterSheet.proficiencies.armor.push(item);
                        }
                    });
                }
            }
        });
    }
}

function recalcFeatures() {
    characterSheet.features = [];

    // Add race features
    if (userSelection.race) {
        const race = window.racesData[userSelection.race];
        if (race?.raceAbilities) {
            race.raceAbilities.forEach(a => characterSheet.features.push({ name: a, source: 'race', sourceId: race.id }));
        }
        // Add subrace features if subrace selected
        if (userSelection.subrace && race.subraces?.[userSelection.subrace]?.raceAbilities) {
            race.subraces[userSelection.subrace].raceAbilities.forEach(a => {
                characterSheet.features.push({ name: a, source: 'race', sourceId: race.id, subraceId: userSelection.subrace });
            });
        }
    }

    // Add class features (all levels up to current)
    if (userSelection.class) {
        const cls = window.classesData[userSelection.class];
        for (let lvl = 1; lvl <= userSelection.lvl; lvl++) {
            const feats = cls?.features?.[lvl];
            if (feats?.features) {
                feats.features.forEach(f => characterSheet.features.push({ 
                    name: f, 
                    source: 'class', 
                    sourceId: cls.id, 
                    level: lvl 
                }));
            }
        }
    }
    
    // Process features using EffectHandler
    if (typeof EffectHandler !== 'undefined') {
        EffectHandler.processAllFeatures(characterSheet.features, userSelection);
    }
    
    // Apply pending choices using EffectHandler - applies stat bonuses from choices
    if (typeof EffectHandler !== 'undefined') {
        EffectHandler.applyChoiceBonuses(userSelection);
    }
    
    // Update characterSheet.stats after applying choices
    recalcStats();
}

function recalcSpellcasting() {
    if (!userSelection.class) { characterSheet.spellcastingAbility = null; characterSheet.spellPreparationType = null; return; }
    const cls = window.classesData[userSelection.class];
    characterSheet.spellcastingAbility = cls?.spellcastingAbility || null;
    if (cls?.['spells prepared']) characterSheet.spellPreparationType = 'prepare';
    else if (cls?.['spells known'] === 'Spellbook') characterSheet.spellPreparationType = 'spellbook';
    else if (cls?.['spells known']) characterSheet.spellPreparationType = 'known';
    else { characterSheet.spellPreparationType = null; }
    recalcSpellStats();
}

function recalcSpellSlots() {
    characterSheet.spellSlots = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    if (!userSelection.class) return;
    const cls = window.classesData[userSelection.class];
    const slots = cls?.spellSlotTable?.[userSelection.lvl];
    if (slots) Object.keys(slots).forEach(lvl => characterSheet.spellSlots[lvl] = slots[lvl]);
}

function recalcCantrips() {
    if (!userSelection.class) { characterSheet.maxCantripsKnown = 0; return; }
    const cls = window.classesData[userSelection.class];
    const cantrips = cls?.['cantrips known'];
    if (!cantrips) { characterSheet.maxCantripsKnown = 0; return; }
    if (typeof cantrips === 'object') {
        characterSheet.maxCantripsKnown = cantrips[userSelection.lvl] || 0;
    } else { characterSheet.maxCantripsKnown = cantrips || 0; }
}

function recalcSpellStats() {
    if (!characterSheet.spellcastingAbility) return;
    const mod = characterSheet.statModifiers[characterSheet.spellcastingAbility];
    const prof = getProficiencyBonus();
    characterSheet.spellSaveDC = 8 + prof + mod;
    characterSheet.spellAttackMod = prof + mod;
}

function recalcFeats() {
    characterSheet.feats = [];
    userSelection.feats.forEach(featName => {
        characterSheet.feats.push({ name: featName });
    });
}

function recalcStats() {
    // Reset characterSheet.stats to base (from userSelection.stats which already has race bonuses applied)
    // This function combines base stats + race bonuses + feat bonuses
    const featBonuses = getFeatStatBonuses();

    // Start with base stats + race bonuses
    STAT_NAMES.forEach(stat => {
        characterSheet.stats[stat] = (userSelection.stats[stat] || 8) + (featBonuses[stat] || 0);
    });

    // Apply stat bonuses from features (type: "stat")
    if (characterSheet.features) {
        characterSheet.features.forEach(feature => {
            const effect = window.EffectHandler.getEffectByName(feature.name, feature.source);
            if (effect?.type === 'stat') {
                const selections = getEffectSelections(effect, effect.options);
                if (selections) {
                    selections.forEach(stat => {
                        if (STAT_NAMES.includes(stat.toLowerCase())) {
                            characterSheet.stats[stat.toLowerCase()] = (characterSheet.stats[stat.toLowerCase()] || 8) + (effect.value || 1);
                        }
                    });
                }
            }
        });
    }

    recalcStatModifiers();
}

function getProficiencyBonus() { return Math.floor((userSelection.lvl - 1) / 4) + 2; }

window.triggerRecalc = triggerRecalc;
window.recalculateAll = recalculateAll;