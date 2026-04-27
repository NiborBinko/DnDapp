/**
 * FeatureLookup.js - Effect and feature lookup helpers
 * Extracted from RecalculationFlags.js for reuse
 */

const STAT_NAMES = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

function getFeatureEffect(name, source) {
    const key = name?.toLowerCase();
    if (!key) return null;
    if (source) {
        const effects = window[source + 'EffectsData'];
        return effects?.effects?.[key] || null;
    }
    return window.classEffectsData?.effects?.[key] || window.raceEffectsData?.effects?.[key] || null;
}

function recalcFeaturesByType(targetType, applyFn) {
    if (!characterSheet.features) return;
    characterSheet.features.forEach(feature => {
        const effect = getFeatureEffect(feature.name, feature.source);
        if (effect?.type === targetType) applyFn(effect, feature);
    });
}

function getAllSkills() {
    return Object.keys(window.descriptions?.proficiencies?.skills || {});
}

function getAllFeats() {
    return Object.keys(window.descriptions?.feats || {});
}

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

function getEffectSelections(effect, defaultOptions, choiceKey) {
    if (!effect || !effect.options) return null;

    const key = choiceKey || effect.options[0]?.toLowerCase() || defaultOptions?.[0]?.toLowerCase() || '';

    const choice = userSelection.featureChoices?.[key];
    if (choice && choice.selected) {
        const selections = choice.selected.filter(s => s !== null);
        if (selections.length > 0) return selections;
    }

    if (effect.options.length === effect.count) {
        return effect.options;
    }

    return null;
}

function ensureFeatureChoice(feature, effect, availableOptions, type, extraFields = {}) {
    const baseKey = feature.name.toLowerCase();
    
    // For class features, ALWAYS use suffix to guarantee unique keys per instance
    let key = baseKey;
    
    if (feature.source === 'class' && characterSheet?.features) {
        const allMatches = characterSheet.features.filter(f => 
            f.name.toLowerCase() === baseKey && f.source === 'class'
        );
        
        if (allMatches.length > 0) {
            // ALWAYS use suffix for class features - guarantees unique keys
            const instanceIndex = allMatches.indexOf(feature);
            key = `${baseKey}-${instanceIndex}`;
        }
    }
    
    // ROBUST PRESERVATION: Check if ANY related key already exists with selections
    // This prevents overwriting user's selections during triggerRecalc
    const existingEntry = Object.entries(userSelection.featureChoices || {}).find(([k, v]) => 
        k === key || k.includes(baseKey)
    );
    
    if (existingEntry) {
        // Preserve existing selections - don't overwrite!
        const existingChoice = existingEntry[1];
        return existingChoice.selected?.filter(s => s !== null) || null;
    }
    
    let selections = getEffectSelections(effect, availableOptions, key);
    
    if (availableOptions.length > 0 && !selections) {
        userSelection.featureChoices[key] = {
            count: effect.count,
            selected: Array(effect.count).fill(null),
            options: availableOptions,
            type: type,
            source: feature.source,
            ...extraFields
        };
        selections = getEffectSelections(effect, availableOptions, key);
    }
    
    if (selections && !userSelection.featureChoices[key]) {
        userSelection.featureChoices[key] = {
            count: effect.count,
            selected: selections,
            options: availableOptions,
            type: type,
            source: feature.source,
            ...extraFields
        };
    }
    
    return selections;
}

window.STAT_NAMES = STAT_NAMES;
window.getFeatureEffect = getFeatureEffect;
window.recalcFeaturesByType = recalcFeaturesByType;
window.getAllSkills = getAllSkills;
window.getAllFeats = getAllFeats;
window.getAvailableCantrips = getAvailableCantrips;
window.getEffectSelections = getEffectSelections;
window.ensureFeatureChoice = ensureFeatureChoice;