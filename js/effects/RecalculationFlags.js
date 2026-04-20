/**
 * Recalculation system - Flag-based updates
 */
const RECALC_FLAGS = {
    RACE_CHANGED: 'race',
    CLASS_CHANGED: 'class',
    LEVEL_CHANGED: 'level',
    STAT_CHANGED: 'stat',
    FEATURE_CHANGED: 'feature',
    FEAT_CHANGED: 'feat',
    ALL_CHANGED: 'all'
};

function triggerRecalc(flag) { recalculateAll(flag); }

function recalculateAll(flag) {
    switch (flag) {
        case RECALC_FLAGS.RACE_CHANGED:
            recalcRaceEffects(); recalcFeatures(); recalcVision(); recalcSpeed(); recalcProficiencies(); recalcStats();
            break;
        case RECALC_FLAGS.CLASS_CHANGED:
            recalcClassBase(); recalcFeatures(); recalcProficiencies(); recalcSpellcasting(); recalcMaxHp(); recalcSpellSlots(); recalcCantrips();
            break;
        case RECALC_FLAGS.LEVEL_CHANGED:
            recalcFeatures(); recalcMaxHp(); recalcSpellSlots(); recalcCantrips();
            break;
        case RECALC_FLAGS.STAT_CHANGED:
            recalcStatModifiers(); recalcMaxHp(); recalcSpellStats();
            break;
        case RECALC_FLAGS.FEAT_CHANGED:
            recalcFeats(); recalcFeatures(); recalcStats(); recalcProficiencies(); recalcSpeed(); recalcVision(); recalcMaxHp();
            break;
        case RECALC_FLAGS.ALL_CHANGED:
            recalcAll();
            break;
    }
}

function recalcAll() {
    recalcRaceEffects(); recalcClassBase(); recalcStatModifiers(); recalcVision(); recalcSpeed();
    recalcMaxHp(); recalcProficiencies(); recalcFeatures(); recalcSpellcasting(); recalcSpellSlots(); recalcFeats();
}

// Constants
const STAT_NAMES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

function recalcRaceEffects() {
    // Reset stats to base 8 first (idempotent)
    STAT_NAMES.forEach(stat => { userSelection.stats[stat] = 8; });
    
    // Clear previous race choices if race changed
    if (userSelection.featureChoices && userSelection.featureChoices['human-bonus-stats']) {
        delete userSelection.featureChoices['human-bonus-stats'];
    }
    
    if (!userSelection.race) return;
    const bonuses = getRaceStatBonuses(userSelection.race, userSelection.subrace);
    
    // Handle normal numeric bonuses (non-chosen)
    Object.keys(bonuses).forEach(stat => {
        if (stat !== 'chosen') {
            userSelection.stats[stat] = (userSelection.stats[stat] || 8) + bonuses[stat];
        }
    });
    
    // Handle "chosen" - create pending choices in featureChoices with null slots
    if (bonuses.chosen && bonuses.chosen.isChosen) {
        if (!userSelection.featureChoices) {
            userSelection.featureChoices = {};
        }
        
        // Create pending choice with null slots
        const choiceKey = 'human-bonus-stats';
        if (!userSelection.featureChoices[choiceKey]) {
            userSelection.featureChoices[choiceKey] = {
                type: 'choice',
                options: ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'],
                count: bonuses.chosen.count,
                selected: Array(bonuses.chosen.count).fill(null)
            };
        }
    }
}

function recalcClassBase() {
    if (!userSelection.class) return;
    const cls = window.classesData[userSelection.class];
    if (cls?.primaryStat) characterSheet.spellcastingAbility = cls.primaryStat;
}

function recalcStatModifiers() {
    Object.keys(characterSheet.stats).forEach(stat => {
        characterSheet.statModifiers[stat] = Math.floor((characterSheet.stats[stat] - 10) / 2);
    });
    characterSheet.initiative = characterSheet.statModifiers.dexterity;
    characterSheet.armorClass = 10 + characterSheet.statModifiers.dexterity;
}

function recalcVision() {
    const v = getRaceVision(userSelection.race, userSelection.subrace);
    characterSheet.vision = v || { nightvision: null, dayvision: null };
}

function recalcSpeed() {
    let speed = 30;
    if (userSelection.race) speed = window.racesData[userSelection.race]?.speed || 30;
    characterSheet.speed = speed;
}

function recalcMaxHp() {
    if (!userSelection.class) { characterSheet.maxHp = 10; characterSheet.currentHp = 10; return; }
    const cls = window.classesData[userSelection.class];
    const hitDie = cls?.hitDie || 8;
    characterSheet.maxHp = hitDie + characterSheet.statModifiers.constitution;
    characterSheet.currentHp = characterSheet.maxHp;
}

function recalcProficiencies() {
    characterSheet.proficiencies = { skills: [], weapons: [], armor: [], tools: [], savingThrows: [] };
    if (userSelection.class) {
        const cls = window.classesData[userSelection.class];
        if (cls?.proficiencies) {
            if (cls.proficiencies.armor) characterSheet.proficiencies.armor = [...cls.proficiencies.armor];
            if (cls.proficiencies.weapons) characterSheet.proficiencies.weapons = [...cls.proficiencies.weapons];
            if (cls.proficiencies.savingThrows) characterSheet.proficiencies.savingThrows = [...cls.proficiencies.savingThrows];
        }
    }
    userSelection.selectedSkills.forEach(s => { if (!characterSheet.proficiencies.skills.includes(s)) characterSheet.proficiencies.skills.push(s); });
}

function recalcFeatures() {
    characterSheet.features = [];
    
    // Add race features
    if (userSelection.race) {
        const race = window.racesData[userSelection.race];
        if (race?.raceAbilities) {
            race.raceAbilities.forEach(a => characterSheet.features.push({ name: a, source: 'race', sourceId: race.id }));
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
    
    // Apply pending choices - apply human bonus stats
    const choiceKey = 'human-bonus-stats';
    if (userSelection.featureChoices && userSelection.featureChoices[choiceKey]) {
        const choice = userSelection.featureChoices[choiceKey];
        if (choice.selected && choice.selected.length > 0) {
            choice.selected.forEach(stat => {
                if (stat) {  // Skip null values
                    userSelection.stats[stat] = (userSelection.stats[stat] || 8) + 1;
                }
            });
        }
    }
    
    // Update characterSheet.stats after applying choices
    recalcStats();
}

function recalcSpellcasting() {
    if (!userSelection.class) { characterSheet.spellcastingAbility = null; characterSheet.spellPreparationType = null; return; }
    const cls = window.classesData[userSelection.class];
    characterSheet.spellcastingAbility = cls?.primaryStat || null;
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
    STAT_NAMES.forEach(stat => {
        characterSheet.stats[stat] = (userSelection.stats[stat] || 8) + (featBonuses[stat] || 0);
    });
    recalcStatModifiers();
}

function getProficiencyBonus() { return Math.floor((userSelection.lvl - 1) / 4) + 2; }

window.RECALC_FLAGS = RECALC_FLAGS;
window.triggerRecalc = triggerRecalc;
window.recalculateAll = recalculateAll;