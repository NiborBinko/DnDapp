/**
 * EffectHandler.js - Central feature effect processor
 * Processes features based on their type and triggers appropriate recalculations
 */
const EffectHandler = {
    effectsData: {},
    
    async loadEffects() {
        try {
            this.effectsData.race = await loadJson('data/effects/race-effects');
            this.effectsData.class = await loadJson('data/effects/class-effects');
            this.effectsData.feat = await loadJson('data/effects/feat-effects');
        } catch (e) {
            console.error('Error loading effects:', e);
        }
    },
    
    getEffectByName(name, source) {
        if (!name) return null;
        const effects = window[source + 'EffectsData'] || this.effectsData[source] || null;
        if (!effects?.effects) return null;
        return effects.effects[name.toLowerCase()] || null;
    },
    
    processFeature(feature) {
        const effect = this.getEffectByName(feature.name, feature.source);
        if (!effect) return;
        const type = effect.type || 'none';
        const handler = EFFECT_DISPATCH[type];
        if (handler) handler();
    },
    
    handleChoice(effect, userSelection, feature) {
        const keyName = feature.name.replace(/\s+/g, '-').toLowerCase();
        
        if (!userSelection.featureChoices) {
            userSelection.featureChoices = {};
        }
        
        if (effect.effectType === 'stat') {
            if (!userSelection.featureChoices[keyName]) {
                userSelection.featureChoices[keyName] = {
                    type: effect.type,
                    effectType: effect.effectType,
                    value: effect.value || 1,
                    options: effect.options || [],
                    count: effect.count || 1,
                    selected: Array(effect.count || 1).fill(null)
                };
            }
        } else {
            if (!userSelection.featureChoices[keyName]) {
                userSelection.featureChoices[keyName] = {
                    type: effect.type,
                    options: effect.options || [],
                    count: effect.count || 1,
                    selected: Array(effect.count || 1).fill(null)
                };
            }
        }
    },
    
    toggleChoice(choiceKey, value) {
        if (!userSelection.featureChoices) userSelection.featureChoices = {};
        
        const choice = userSelection.featureChoices[choiceKey];
        if (!choice) return;
        
        const existingIndex = choice.selected.indexOf(value);
        if (existingIndex !== -1) {
            choice.selected[existingIndex] = null;
        } else if (choice.selected.filter(s => s !== null).length < choice.count) {
            const emptyIndex = choice.selected.findIndex(s => s === null);
            if (emptyIndex !== -1) {
                choice.selected[emptyIndex] = value;
            }
        }
        
        const filled = choice.selected.filter(s => s !== null);
        choice.selected = [...filled];
        while (choice.selected.length < choice.count) {
            choice.selected.push(null);
        }
    },
    
    makeChoiceHandler(choiceKey) {
        return (value) => {
            this.toggleChoice(choiceKey, value);
            triggerRecalc();
            renderAbilityScores();
            refreshDebugIfOpen();
        };
    },
    
    applyChoiceBonuses(userSelection) {
        if (!userSelection.featureChoices) return;
        
        Object.entries(userSelection.featureChoices).forEach(([key, choice]) => {
            if (!choice || choice.type !== 'choice' || choice.effectType !== 'stat') return;
            
            choice.selected.forEach(stat => {
                if (stat && userSelection.stats) {
                    userSelection.stats[stat] = (userSelection.stats[stat] || 8) + (choice.value || 1);
                }
            });
        });
    },
    
    processAllFeatures(features, userSelection) {
        if (!features || !Array.isArray(features)) return;
        
        features.forEach(feature => {
            this.processFeature(feature, userSelection);
        });
    },
    
    getPendingChoices(userSelection) {
        const pending = {};
        
        if (!userSelection.featureChoices) return pending;
        
        Object.entries(userSelection.featureChoices).forEach(([key, choice]) => {
            if (choice && choice.selected && choice.selected.filter(s => s !== null).length < choice.count) {
                pending[key] = choice;
            }
        });
        
        return pending;
    }
};

const EFFECT_DISPATCH = {
    vision: recalcVision,
    speed: recalcSpeed,
    stat: () => { recalcStats(); recalcStatModifiers(); },
    proficiency: recalcProficiencies,
    cantrips: () => {},
    mainspell: () => { recalcSpellcasting(); recalcSpellSlots(); recalcCantrips(); },
    innate: recalcInnateSpells,
    resistance: recalcResistances,
    immunity: recalcResistances,
    vulnerability: recalcResistances,
    savingThrow: recalcSavingThrows,
    feat: recalcFeats,
    maxHP: recalcMaxHp,
    lookup: () => {},
    none: () => {}
};

async function loadJson(path) {
    try {
        const res = await fetch(path + '.json');
        if (!res.ok) return {};
        return await res.json();
    } catch {
        return {};
    }
}

window.EffectHandler = EffectHandler;
window.loadJson = loadJson;
window.toggleChoice = (choiceKey, value) => EffectHandler.toggleChoice(choiceKey, value);
window.makeChoiceHandler = (choiceKey) => EffectHandler.makeChoiceHandler(choiceKey);