const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const MAX_LEVEL = 20;

const getStatAbbr = () => window.gameDescriptions?.statLabels || { strength: "STR", dexterity: "DEX", constitution: "CON", intelligence: "INT", wisdom: "WIS", charisma: "CHA" };

function getSkillDescriptions() { return window.gameDescriptions?.skills || {}; }
function getRaceAbilityDescriptions() { return window.gameDescriptions?.raceAbilities || {}; }
function getFeatDescriptions() { return window.gameDescriptions?.feats || {}; }
function getProficiencyDescriptions() { return window.gameDescriptions?.proficiencies || { armor: {}, weapons: {}, tools: {}, savingThrows: {}, mastery: {} }; }
function getClassFeatureDescriptions() { return window.gameDescriptions?.classAbilities || {}; }
function getStatDescriptions() { return window.gameDescriptions?.stats || {}; }
function getClassOptionDescriptions() { return window.gameDescriptions?.classOptions || {}; }
function getRaceEffects() { return window.gameDescriptions?.raceEffects || {}; }
function getClassEffects() { return window.gameDescriptions?.classEffects || {}; }
function getClassOptionEffects() { return window.gameDescriptions?.classOptionEffects || {}; }
function getFeatEffects() { return window.gameDescriptions?.featEffects || {}; }

function getProficiencyOrigin(profName, profType, character) {
    const effects = getRaceEffects();
    const raceId = character?.raceId || 'unknown';
    const subrace = character?.subraceName;
    
    const mapKey = profType === 'skill' ? 'skillMappings' : profType === 'weapon' ? 'weaponProficiencies' : profType === 'armor' ? 'armorProficiencies' : 'toolProficiencies';
    const mappings = effects?.[mapKey] || {};
    
    for (const [ability, data] of Object.entries(mappings)) {
        const target = data.skill || data.weapons?.[0] || data.armor?.[0] || data.options?.[0];
        if (data.skill === profName || data.weapons?.includes(profName) || data.armor?.includes(profName) || data.options?.includes(profName)) {
            const source = data.inheritFromRace && subrace ? `Subrace: ${subrace}` : `Race: ${raceId}`;
            return `\n\n📍 From: ${ability} (${source})`;
        }
    }
    return '';
}

// Lookup user's choice for an exclusive group
function getUserChoiceExclusiveGroup(groupName, character) {
    const selectedOptions = character?.selectedOptions || [];
    const choice = selectedOptions.find(o => o.feature === groupName || o.exclusiveGroup === groupName);
    return choice?.optionId || choice?.name || null;
}

// Get effects for a chosen class option
function getOptionEffects(optionName) {
    const effects = getClassOptionEffects();
    for (const groupName in effects) {
        const group = effects[groupName];
        if (group[optionName]) {
            return { ...group[optionName], exclusiveGroup: groupName };
        }
    }
    return null;
}
