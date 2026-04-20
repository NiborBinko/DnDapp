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
        
        if (!userSelection.featureChoices[keyName]) {
            userSelection.featureChoices[keyName] = {
                type: effect.type,
                options: effect.options || [],
                count: effect.count || 1,
                selected: []
            };
        }
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
            if (choice && choice.selected && choice.selected.length < choice.count) {
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