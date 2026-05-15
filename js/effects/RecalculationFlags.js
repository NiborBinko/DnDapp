/**
 * Recalculation system - Always recalculate everything on any change
 */

function triggerRecalc() { recalcAll(); }

function recalculateAll() { recalcAll(); }

function recalcAll() {
    // PRESERVE user selections BEFORE rebuilding (stats AND proficiency choices)
    const savedStatSelections = {};
    Object.entries(userSelection.featureChoices || {}).forEach(([k, v]) => {
        if (v.type === 'stat' && v.selected?.some(s => s !== null)) {
            savedStatSelections[k] = [...v.selected];
        }
    });
    
    // Reset race skill limit bonus
    window.raceSkillLimitBonus = 0;
    
    recalcRaceEffects(); recalcClassBase(); recalcFeatures();
    clearRemovedFeatureSelections();
    recalcProficiencies(); recalcKnownCantrips();
    recalcStats();
    recalcStatModifiers();
    recalcMaxHp();  recalcVision(); recalcSpeed();
    recalcSpellcasting(); recalcSpellSlots(); recalcInnateSpells(); recalcFeats();
    recalcSavingThrows(); recalcResistances();
    
    // RESTORE selections AFTER rebuild
    Object.entries(savedStatSelections).forEach(([key, saved]) => {
        if (userSelection.featureChoices[key]) {
            userSelection.featureChoices[key].selected = saved;
        }
    });
    
    // Force re-render of Stage 3 to show newly created featureChoices like ASI
    if (typeof renderAbilityScores === 'function') {
        renderAbilityScores();
    }
}

/**
 * Gets all damage types available for resistances
 * @returns {Array} - List of damage type strings
 */
function getAllDamageTypes() {
    return ['acid', 'bludgeoning', 'cold', 'fire', 'force', 'lightning', 'necrotic', 'piercing', 'poison', 'psychic', 'radiant', 'slashing', 'thunder', 'nonmagical bps'];
}

function getAllSaveTypes() {
    return ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
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
 * Clears selections for features that no longer exist in characterSheet.features
 */
function clearRemovedFeatureSelections() {
    const currentFeatureNames = characterSheet.features ? characterSheet.features.map(f => f.name.toLowerCase()) : [];
    Object.keys(userSelection.featureChoices).forEach(key => {
        // Always delete "+1 proficiency" - handled by increasing skill limit instead
        if (key.toLowerCase() === '+1 proficiency') {
            delete userSelection.featureChoices[key];
            return;
        }
        const featureStillExists = currentFeatureNames.some(name => key === name || key.startsWith(name + '-'));
        if (!featureStillExists) {
            delete userSelection.featureChoices[key];
        }
    });
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
    const sourceMap = {
        race: window.raceEffectsData,
        class: window.classEffectsData,
        feat: window.featEffectsData,
        subclass: window.subclassEffectsData
    };
    const effects = sourceMap[source] || window[source + 'EffectsData'];
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
    const baseKey = feature.name.toLowerCase();
    
    // For class features, ALWAYS use level + instanceIndex to guarantee unique keys
    let key = baseKey;
    
    if (feature.source === 'class' && characterSheet?.features) {
        const level = feature.level || 0;
        const sameLevelAndName = characterSheet.features.filter(f => 
            f.name.toLowerCase() === baseKey && 
            f.source === 'class' && 
            (f.level || 0) === level
        );
        
        if (sameLevelAndName.length > 0) {
            const instanceIndex = sameLevelAndName.indexOf(feature);
            key = `${baseKey}-${level}-${instanceIndex}`;
        }
    }
    
    // ROBUST PRESERVATION: Check if this EXACT key already exists with selections
    // Only match exact key - don't match partial keys like "ability score improvement-4-0" vs "ability score improvement-4-1"
    const existingEntry = Object.entries(userSelection.featureChoices || {}).find(([k, v]) => 
        k === key
    );
    
    if (existingEntry) {
        // Preserve existing selections - don't overwrite!
        const existingChoice = existingEntry[1];
        if (!existingChoice.featureName) {
            existingChoice.featureName = feature.name;
        }
        return existingChoice.selected?.filter(s => s !== null) || null;
    }
    
    let selections = getEffectSelections(effect, availableOptions, key);
    
    // Create choice if options exist and user hasn't selected yet
    if (availableOptions.length > 0 && !selections) {
        userSelection.featureChoices[key] = {
            count: effect.count,
            selected: Array(effect.count).fill(null),
            options: availableOptions,
            type: type,
            source: feature.source,
            featureName: feature.name,
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
            source: feature.source,
            featureName: feature.name,
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
    window.raceSkillLimitBonus = 0;  // Reset first, then calculate
    window.raceFeatLimitBonus = 0;
    
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
                
                // Special case: +1 Proficiency (based on feature name) → just increase limit, don't create featureChoice
                if (profType === 'skill' && feature.name.toLowerCase() === '+1 proficiency') {
                    window.raceSkillLimitBonus = (window.raceSkillLimitBonus || 0) + effect.count;
                    return;  // Skip ensureFeatureChoice for this case
                }
                
                const selections = ensureFeatureChoice(feature, effect, availableOptions, 'proficiency', { proficiencyType: profType });

                // Auto-add if selections.length === count (no choice needed)
                if (selections && selections.length === effect.count) {
                    selections.forEach(item => {
                        if (profType === 'skill') {
                            if (!characterSheet.proficiencies.skills.includes(item)) {
                                characterSheet.proficiencies.skills.push(item);
                            }
                            // Auto-grant: add to userSelection.selectedSkills + track source
                            if (!userSelection.selectedSkills.includes(item)) {
                                userSelection.selectedSkills.push(item);
                            }
                            // Track source for tooltip
                            const raceName = window.racesData?.[userSelection.race]?.name || userSelection.race;
                            userSelection.raceAutoGrantSources[item] = `Race: ${raceName} - ${feature.name}`;
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
    
    // Safety: cap selectedSkills to max allowed (check AFTER calculating raceSkillLimitBonus)
    const classMax = window.classesData[userSelection.class]?.proficiencies?.skills?.count || 2;
    const maxAllowed = classMax + (window.raceSkillLimitBonus || 0);
    if (userSelection.selectedSkills.length > maxAllowed) {
        // Remove skills beyond max (keep only first maxAllowed that are user-picked)
        const raceAutoSkills = [];
        Object.entries(userSelection.featureChoices || {}).forEach(([key, choice]) => {
            if (choice?.type === 'proficiency' && choice?.proficiencyType === 'skill') {
                const selected = choice.selected?.filter(s => s !== null) || [];
                if (selected.length === choice.count && selected.length > 0) {
                    selected.forEach(skill => raceAutoSkills.push(skill));
                }
            }
        });
        const userPicked = userSelection.selectedSkills.filter(s => !raceAutoSkills.includes(s));
        if (userPicked.length > maxAllowed) {
            // Remove excess user picks from the end
            const excess = userPicked.length - maxAllowed;
            for (let i = 0; i < excess; i++) {
                const lastUserPick = userPicked[userPicked.length - 1 - i];
                const idx = userSelection.selectedSkills.indexOf(lastUserPick);
                if (idx > -1) userSelection.selectedSkills.splice(idx, 1);
            }
        }
    }
    
    // Process race/class features for feats (type: "feat")
    if (characterSheet.features) {
        characterSheet.features.forEach(feature => {
            const effect = window.EffectHandler.getEffectByName(feature.name, feature.source);
            if (effect?.type === 'feat') {
                // +1 Feat style bonus: no options means increase feat capacity only
                if (!effect.options || effect.options.length === 0) {
                    window.raceFeatLimitBonus = (window.raceFeatLimitBonus || 0) + (effect.count || 0);
                    return;
                }

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

        // Add selected class-option derived features (progressive by level)
        const optionDefs = window.classOptionEffectsData?.options || {};
        const selected = userSelection.selectedFeatureChoices || {};
        Object.values(selected).forEach(optionId => {
            const def = optionDefs[optionId];
            if (!def?.features) return;

            Object.entries(def.features).forEach(([lvlStr, featureIds]) => {
                const lvl = parseInt(lvlStr, 10);
                if (Number.isNaN(lvl) || userSelection.lvl < lvl) return;
                (featureIds || []).forEach(fid => {
                    characterSheet.features.push({
                        name: fid,
                        source: 'subclass',
                        sourceId: optionId,
                        level: lvl
                    });
                });
            });
        });
    }
    
    // Process features using EffectHandler
    if (typeof EffectHandler !== 'undefined') {
        EffectHandler.processAllFeatures(characterSheet.features, userSelection);
    }
    
    // Apply pending choices using EffectHandler - applies stat bonuses from choices
    if (typeof EffectHandler !== 'undefined') {
        EffectHandler.applyChoiceBonuses(userSelection, characterSheet);
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
        // Skip if already handled by applyChoiceBonuses (prevents double bonus)
        // Use prefix matching since featureChoices keys now include suffixes like "-4-0"
        const baseKey = feature.name.toLowerCase();
        const alreadyHandled = Object.entries(userSelection.featureChoices || {}).some(([k, v]) => 
            (k === baseKey || k.startsWith(baseKey + '-')) && v.selected?.some(s => s !== null)
        );
        if (alreadyHandled) return;
        
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
window.STAT_NAMES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
