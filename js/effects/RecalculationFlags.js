/**
 * Recalculation system - Always recalculate everything on any change
 */

function triggerRecalc() { recalcAll(); }

function recalculateAll() { recalcAll(); }

function recalcAll() {
    recalcRaceEffects(); recalcClassBase(); recalcFeatures();
    recalcProficiencies(); recalcKnownCantrips();
    recalcStats();
    recalcStatModifiers();
    recalcMaxHp();  recalcVision(); recalcSpeed();
    recalcSpellcasting(); recalcSpellSlots(); recalcInnateSpells(); recalcFeats();
    recalcSavingThrows(); recalcResistances();
}

/**
 * Gets all damage types available for resistances
 * @returns {Array} - List of damage type strings
 */
function getAllDamageTypes() {
    return ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder', 'nonmagical bps'];
}

/**
 * Recalculates resistances, immunities, and vulnerabilities based on race/class/feat features
 * @requires characterSheet.features
 * @modifies characterSheet.resistances, characterSheet.immunities, characterSheet.vulnerabilities
 */
function recalcResistances() {
    characterSheet.resistances = [];
    characterSheet.immunities = [];
    characterSheet.vulnerabilities = [];

    recalcFeaturesByType('resistance', (effect, feature) => {
        characterSheet.resistances.push({ type: effect.damageType, source: feature.source, sourceId: feature.sourceId });
    });
    recalcFeaturesByType('immunity', (effect, feature) => {
        characterSheet.immunities.push({ type: effect.damageType, source: feature.source, sourceId: feature.sourceId });
    });
    recalcFeaturesByType('vulnerability', (effect, feature) => {
        characterSheet.vulnerabilities.push({ type: effect.damageType, source: feature.source, sourceId: feature.sourceId });
    });
}

/**
 * Gets all save types for saving throws
 * @returns {Array} - List of save type strings
 */
function getAllSaveTypes() {
    return ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
}

/**
 * Recalculates saving throw advantages based on race/class/feat features
 * @requires characterSheet.features
 * @modifies characterSheet.savingThrowAdvantages
 */
function recalcSavingThrows() {
    characterSheet.savingThrowAdvantages = [];

    recalcFeaturesByType('savingThrow', (effect, feature) => {
        if (effect.effect === 'advantage') {
            characterSheet.savingThrowAdvantages.push({
                saveType: effect.saveType,
                effect: effect.effect,
                source: feature.source,
                sourceId: feature.sourceId
            });
        }
    });
}

function getFeatureEffect(name, source) {
    const key = name?.toLowerCase();
    if (!key) return null;
    const effects = window[source + 'EffectsData'];
    return effects?.effects?.[key] || null;
}

function recalcFeaturesByType(targetType, applyFn) {
    if (!characterSheet.features) return;
    characterSheet.features.forEach(feature => {
        const effect = getFeatureEffect(feature.name, feature.source);
        if (effect?.type === targetType) applyFn(effect, feature);
    });
}

// Helper: Get all available skills
function getAllSkills() {
    return Object.keys(window.descriptions?.proficiencies?.skills || {});
}

// Helper: Get all available feats
function getAllFeats() {
    return Object.keys(window.descriptions?.feats || {});
}

// Helper: Get cantrips based on class and spellList
function getAvailableCantrips(effect) {
    const cls = effect.class || 'wizard';
    const spellListType = effect.spellList;
    const classData = window.classesData?.[cls];
    
    if (!classData?.spellList) return [];
    
    if (spellListType === 'all') {
        return classData?.spellList?.['0'] || [];
    }
    if (spellListType) {
        return classData?.spellList?.[spellListType] || [];
    }
    
    return [];
}

// Helper: Get selections for a feature choice
// Returns: user's existing selections OR auto-apply if options.length === count
function getEffectSelections(effect, defaultOptions, choiceKey) {
    if (!effect || !effect.options) return null;

    // Use provided key, or fall back to old behavior for backwards compatibility
    const key = choiceKey || effect.options[0]?.toLowerCase() || defaultOptions?.[0]?.toLowerCase() || '';

    const choice = userSelection.featureChoices?.[key];
    if (choice && choice.selected) {
        const selections = choice.selected.filter(s => s !== null);
        if (selections.length > 0) return selections;
    }

    // Auto-apply if options.length === count (single choice = automatic)
    if (effect.options.length === effect.count) {
        return effect.options;
    }

    return null;
}

function getFeatureEffect(name) {
    const key = name?.toLowerCase();
    if (!key) return null;
    return window.classEffectsData?.effects?.[key] || window.raceEffectsData?.effects?.[key] || null;
}

function getClassEffect(featureName) { return getFeatureEffect(featureName); }
function getRaceEffect(featureName) { return getFeatureEffect(featureName); }

/**
 * Ensures featureChoice exists for a feature, returns selections
 * @param {Object} feature - The feature {name, source}
 * @param {Object} effect - Effect from JSON (has type, options, count, etc.)
 * @param {Array} availableOptions - Populated options array
 * @param {String} type - 'proficiency', 'feat', 'cantrips', 'stat'
 * @param {Object} extraFields - Additional fields (proficiencyType, ability, class, value)
 * @returns {Array|null} - Selected items or null
 */
function ensureFeatureChoice(feature, effect, availableOptions, type, extraFields = {}) {
    const key = feature.name.toLowerCase();
    let selections = getEffectSelections(effect, availableOptions);
    
    // Create choice if options exist and user hasn't selected yet
    if (availableOptions.length > 0 && !selections) {
        userSelection.featureChoices[key] = {
            count: effect.count,
            selected: Array(effect.count).fill(null),
            options: availableOptions,
            type: type,
            ...extraFields
        };
        selections = getEffectSelections(effect, availableOptions, key);
    }
    
    // If selections exist (including auto-applied), ensure featureChoices has them for downstream functions
    if (selections && !userSelection.featureChoices[key]) {
        userSelection.featureChoices[key] = {
            count: effect.count,
            selected: selections,
            options: availableOptions,
            type: type,
            ...extraFields
        };
    }
    
    return selections;
}

/**
 * Recalculates race stat bonuses (stored separately, not applied to userSelection.stats)
 * @requires window.racesData, window.getRaceStatBonuses (from DataLoaders)
 * @requires userSelection.race
 * @modifies window.raceStatBonuses (stored for display/output)
 */
function recalcRaceEffects() {
    // Store race bonuses separately - DON'T modify userSelection.stats
    window.raceStatBonuses = getRaceStatBonuses(userSelection.race, userSelection.subrace) || {};
}
window.recalcRaceEffects = recalcRaceEffects;

/**
 * Sets base class spellcasting ability on characterSheet
 * @requires window.classesData
 * @requires userSelection.class
 * @modifies characterSheet.spellcastingAbility
 */
function recalcClassBase() {
    if (!userSelection.class) return;
    const cls = window.classesData[userSelection.class];
    if (cls?.spellcastingAbility) characterSheet.spellcastingAbility = cls.spellcastingAbility;
}

/**
 * Calculates stat modifiers from characterSheet.stats
 * @requires characterSheet.stats
 * @modifies characterSheet.statModifiers, initiative, armorClass
 */
function recalcStatModifiers() {
    Object.keys(characterSheet.stats).forEach(stat => {
        characterSheet.statModifiers[stat] = Math.floor((characterSheet.stats[stat] - 10) / 2);
    });
    characterSheet.initiative = characterSheet.statModifiers.dexterity;
    characterSheet.armorClass = 10 + characterSheet.statModifiers.dexterity;
}

/**
 * Recalculates vision based on race features
 * @requires window.racesData, characterSheet.features
 * @modifies characterSheet.vision
 */
function recalcVision() {
    let vision = { nightvision: null, dayvision: 120 };

    recalcFeaturesByType('vision', (effect) => {
        if (effect.value && typeof effect.value === 'object') {
            vision.nightvision = effect.value.nightvision || vision.nightvision;
            vision.dayvision = effect.value.dayvision || vision.dayvision;
        }
    });

    characterSheet.vision = vision;
}

/**
 * Recalculates speed based on race and features
 * @requires window.racesData, characterSheet.features
 * @modifies characterSheet.speed
 */
function recalcSpeed() {
    let speed = 30;
    if (userSelection.race) speed = window.racesData[userSelection.race]?.speed || 30;

    recalcFeaturesByType('speed', (effect) => {
        if (effect.value) speed += effect.value;
    });

    characterSheet.speed = speed;
}

/**
 * Recalculates max HP based on class hit die and features
 * @requires window.classesData, characterSheet.statModifiers
 * @modifies characterSheet.maxHp, currentHp
 */
function recalcMaxHp() {
    let baseHp;

    if (!userSelection.class) {
        baseHp = 10;
    } else {
        const cls = window.classesData[userSelection.class];
        const hitDie = cls?.hitDie || 8;
        const lvl = userSelection.lvl;
        const conMod = characterSheet.statModifiers.constitution || 0;
        
        baseHp = lvl * (hitDie + conMod);
    }

    recalcFeaturesByType('maxHP', (effect) => {
        if (effect.value === 'lvl') {
            baseHp += userSelection.lvl;
        } else {
            baseHp += effect.value || 0;
        }
    });

    characterSheet.maxHp = baseHp;
    characterSheet.currentHp = characterSheet.maxHp;
}

/**
 * Recalculates all proficiencies and creates featureChoices for race/class features
 * @requires window.classesData, characterSheet.features, window.descriptions
 * @modifies characterSheet.proficiencies, userSelection.featureChoices
 */
function recalcProficiencies() {
    characterSheet.proficiencies = { skills: [], weapons: [], armor: [], tools: [], savingThrows: [] };

    // Clear ALL featureChoices - rebuild from scratch each time
    userSelection.featureChoices = {};

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
                
                // If options is empty, populate with all available options
                const availableOptions = (effect.options && effect.options.length > 0) 
                    ? effect.options 
                    : (profType === 'skill' ? getAllSkills() : []);
                
                const selections = ensureFeatureChoice(feature, effect, availableOptions, 'proficiency', { proficiencyType: profType });

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
    
    // Process race/class features for feats (type: "feat")
    if (characterSheet.features) {
        characterSheet.features.forEach(feature => {
            const effect = window.EffectHandler.getEffectByName(feature.name, feature.source);
            if (effect?.type === 'feat') {
                // If options is empty, populate with all available feats
                const availableOptions = (effect.options && effect.options.length > 0) 
                    ? effect.options 
                    : getAllFeats();
                
                ensureFeatureChoice(feature, effect, availableOptions, 'feat');
            }
        });
    }
    
    // Process race/class features for cantrips (type: "cantrips")
    if (characterSheet.features) {
        characterSheet.features.forEach(feature => {
            const effect = window.EffectHandler.getEffectByName(feature.name, feature.source);
            if (effect?.type === 'cantrips') {
                const availableOptions = (effect.options && effect.options.length > 0)
                    ? effect.options
                    : getAvailableCantrips(effect);
                
                ensureFeatureChoice(feature, effect, availableOptions, 'cantrips', { class: effect.class, ability: effect.ability });
            }
        });
    }
}

/**
 * Builds characterSheet.features from race abilities and class features
 * @requires window.racesData, window.classesData
 * @modifies characterSheet.features
 */
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

/**
 * Sets spellcasting ability and preparation type if character has Spellcasting/Pact Magic
 * @requires window.classesData, characterSheet.features
 * @modifies characterSheet.spellcastingAbility, spellPreparationType
 */
function recalcSpellcasting() {
    if (!userSelection.class) { characterSheet.spellcastingAbility = null; characterSheet.spellPreparationType = null; return; }

    // Check if character has Spellcasting or Pact Magic feature
    const hasSpellcasting = characterSheet.features?.some(f => f.name === 'Spellcasting');
    const hasPactMagic = characterSheet.features?.some(f => f.name === 'Pact Magic');

    if (!hasSpellcasting && !hasPactMagic) {
        characterSheet.spellcastingAbility = null;
        characterSheet.spellPreparationType = null;
        recalcSpellStats();
        return;
    }

    const cls = window.classesData[userSelection.class];
    characterSheet.spellcastingAbility = cls?.spellcastingAbility || null;
    if (cls?.['spells prepared']) characterSheet.spellPreparationType = 'prepare';
    else if (cls?.['spells known'] === 'Spellbook') characterSheet.spellPreparationType = 'spellbook';
    else if (cls?.['spells known']) characterSheet.spellPreparationType = 'known';
    else { characterSheet.spellPreparationType = null; }
    recalcSpellStats();
}

/**
 * Recalculates racial innate spells (e.g., Tiefling Infernal Legacy)
 * Each spell stored as { name, ability }
 * @requires characterSheet.features
 * @modifies characterSheet.innateSpells
 */
function recalcInnateSpells() {
    characterSheet.innateSpells = [];

    characterSheet.features?.forEach(feature => {
        const effect = getFeatureEffect(feature.name);
        if (effect?.type === 'innate') {
            const ability = effect.ability || null;
            Object.keys(effect.spellLevels || {}).forEach(lvl => {
                if (userSelection.lvl >= parseInt(lvl)) {
                    effect.spellLevels[lvl].forEach(spell => {
                        characterSheet.innateSpells.push({ name: spell, ability: ability });
                    });
                }
            });
        }
    });
}

/**
 * Sets spell slots based on class level
 * @requires window.classesData, userSelection.lvl
 * @modifies characterSheet.spellSlots
 */
function recalcSpellSlots() {
    characterSheet.spellSlots = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    if (!userSelection.class) return;
    const cls = window.classesData[userSelection.class];
    const slots = cls?.spellSlotTable?.[userSelection.lvl];
    if (slots) Object.keys(slots).forEach(lvl => characterSheet.spellSlots[lvl] = slots[lvl]);
}

/**
 * Sets max cantrips known based on class and level
 * @requires window.classesData, userSelection.lvl
 * @modifies characterSheet.maxCantripsKnown
 */
function recalcCantrips() {
    if (!userSelection.class) { characterSheet.maxCantripsKnown = 0; return; }
    const cls = window.classesData[userSelection.class];
    const cantrips = cls?.['cantrips known'];
    if (!cantrips) { characterSheet.maxCantripsKnown = 0; return; }
    if (typeof cantrips === 'object') {
        characterSheet.maxCantripsKnown = cantrips[userSelection.lvl] || 0;
    } else { characterSheet.maxCantripsKnown = cantrips || 0; }
}

/**
 * Recalculates known cantrips from featureChoices (racial cantrips like High Elf)
 * Each cantrip stored as { name, ability }
 * @requires userSelection.featureChoices, characterSheet.features
 * @modifies characterSheet.knownCantrips
 */
function recalcKnownCantrips() {
    characterSheet.knownCantrips = [];
    
    if (!userSelection.featureChoices) return;
    
    Object.entries(userSelection.featureChoices).forEach(([key, choice]) => {
        if (choice?.type === 'cantrips') {
            const selected = choice.selected?.filter(s => s !== null) || [];
            const ability = choice.ability || null;
            selected.forEach(cantrip => {
                characterSheet.knownCantrips.push({ name: cantrip, ability: ability });
            });
        }
    });
}

/**
 * Calculates spell save DC and attack modifier
 * @requires characterSheet.spellcastingAbility, statModifiers
 * @modifies characterSheet.spellSaveDC, spellAttackMod
 */
function recalcSpellStats() {
    if (!characterSheet.spellcastingAbility) return;
    const mod = characterSheet.statModifiers[characterSheet.spellcastingAbility];
    const prof = getProficiencyBonus();
    characterSheet.spellSaveDC = 8 + prof + mod;
    characterSheet.spellAttackMod = prof + mod;
}

/**
 * Copies userSelection.feats to characterSheet.feats
 * @requires userSelection.feats
 * @modifies characterSheet.feats
 */
function recalcFeats() {
    characterSheet.feats = [];
    userSelection.feats.forEach(featName => {
        characterSheet.feats.push({ name: featName });
    });
}

/**
 * Applies stat bonuses from race features and feat choices
 * @requires characterSheet.features, window.descriptions
 * @modifies characterSheet.stats
 */
function recalcStats() {
    const featBonuses = getFeatStatBonuses();
    const raceBonuses = window.raceStatBonuses || {};
    const choiceBonuses = window.featureChoiceBonuses || {};

    window.STAT_NAMES.forEach(stat => {
        characterSheet.stats[stat] = (userSelection.stats[stat] || 8) + (raceBonuses[stat] || 0) + (choiceBonuses[stat] || 0) + (featBonuses[stat] || 0);
    });

    recalcFeaturesByType('stat', (effect, feature) => {
        const selections = ensureFeatureChoice(feature, effect, effect.options, 'stat', { value: effect.value });
        if (selections) {
            selections.forEach(stat => {
                if (window.STAT_NAMES.includes(stat.toLowerCase())) {
                    characterSheet.stats[stat.toLowerCase()] = (characterSheet.stats[stat.toLowerCase()] || 8) + (effect.value || 1);
                }
            });
        }
    });

    recalcStatModifiers();
}

function getProficiencyBonus() { return Math.floor((userSelection.lvl - 1) / 4) + 2; }

window.getAllDamageTypes = getAllDamageTypes;
window.getAllSaveTypes = getAllSaveTypes;
window.recalcResistances = recalcResistances;
window.recalcSavingThrows = recalcSavingThrows;
window.triggerRecalc = triggerRecalc;
window.recalculateAll = recalculateAll;