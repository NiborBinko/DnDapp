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
        const effects = this.effectsData[source];
        if (!effects || !effects.effects) return null;
        
        const key = name.toLowerCase().replace(/\s+/g, '-');
        return effects.effects[key] || null;
    },
    
    processFeature(feature, userSelection) {
        const effect = this.getEffectByName(feature.name, feature.source);
        
        if (!effect) return;
        
        const type = effect.type || 'none';
        
        switch (type) {
            case 'vision':
                recalcVision();
                break;
            case 'speed':
                recalcSpeed();
                break;
            case 'stat':
                recalcStats();
                recalcStatModifiers();
                break;
            case 'choice':
                this.handleChoice(effect, userSelection, feature);
                break;
            case 'proficiency':
                recalcProficiencies();
                break;
            case 'skill':
                recalcProficiencies();
                break;
            case 'cantrip':
                recalcCantrips();
                break;
            case 'spell':
                recalcSpellSlots();
                recalcSpellcasting();
                break;
            case 'innateSpell':
                recalcSpellSlots();
                break;
            case 'resistance':
                recalcStats();
                break;
            case 'none':
            default:
                break;
        }
    },
    
    handleChoice(effect, userSelection, feature) {
        const keyName = feature.name.replace(/\s+/g, '-').toLowerCase();
        
        if (!userSelection.featureChoices) {
            userSelection.featureChoices = {};
        }
        
        // Handle stat-increase type choices - initialize with null slots
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
            // Regular choice (non-stat)
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
    
    // Generic toggle function for any choice (stat or proficiency)
    toggleChoice(choiceKey, value) {
        if (!userSelection.featureChoices) userSelection.featureChoices = {};
        
        const choice = userSelection.featureChoices[choiceKey];
        if (!choice) return;
        
        // If already selected, deselect it (toggle)
        const existingIndex = choice.selected.indexOf(value);
        if (existingIndex !== -1) {
            choice.selected[existingIndex] = null;
        } else if (choice.selected.filter(s => s !== null).length < choice.count) {
            // Find first empty slot
            const emptyIndex = choice.selected.findIndex(s => s === null);
            if (emptyIndex !== -1) {
                choice.selected[emptyIndex] = value;
            }
        }
        
        // Clean up - remove nulls and fill with nulls to maintain count
        const filled = choice.selected.filter(s => s !== null);
        choice.selected = [...filled];
        while (choice.selected.length < choice.count) {
            choice.selected.push(null);
        }
    },
    
    // Apply selected choices to calculate stat bonuses
    applyChoiceBonuses(userSelection) {
        if (!userSelection.featureChoices) return;
        
        Object.entries(userSelection.featureChoices).forEach(([key, choice]) => {
            if (!choice || choice.type !== 'choice' || choice.effectType !== 'stat') return;
            
            // Apply bonus for each selected stat
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