const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const MAX_LEVEL = 20;

const statAbbreviations = {
    strength: "STR",
    dexterity: "DEX",
    constitution: "CON",
    intelligence: "INT",
    wisdom: "WIS",
    charisma: "CHA"
};

// Functions to get descriptions - populated by app.js after data loads
function getSkillDescriptions() {
    return (window.gameDescriptions?.skills) || {};
}
function getRaceAbilityDescriptions() {
    return (window.gameDescriptions?.raceAbilities) || {};
}
function getFeatDescriptions() {
    return (window.gameDescriptions?.feats) || {};
}
function getProficiencyDescriptions() {
    return {
        armor: (window.gameDescriptions?.armor) || {},
        weapons: (window.gameDescriptions?.weapons) || {},
        tools: (window.gameDescriptions?.tools) || {},
        savingThrows: (window.gameDescriptions?.savingThrows) || {},
        mastery: (window.gameDescriptions?.mastery) || {}
    };
}
function getClassFeatureDescriptions() {
    return (window.gameDescriptions?.classAbilities) || {};
}
function getStatDescriptions() {
    return (window.gameDescriptions?.stats) || {};
}
function getClassOptionDescriptions() {
    return (window.gameDescriptions?.classOptions) || {};
}
function getRaceEffects() {
    return (window.gameDescriptions?.raceEffects) || {};
}
function getClassEffects() {
    return (window.gameDescriptions?.classEffects) || {};
}
function getClassOptionEffects() {
    return (window.gameDescriptions?.classOptionEffects) || {};
}

// Find which race ability provides a specific proficiency
function getProficiencySource(profName, profType, character) {
    const effects = getRaceEffects();
    const raceId = character?.raceId || 'unknown';
    const subraceName = character?.subraceName || null;
    
    // Check skill mappings
    if (profType === 'skill' && effects?.skillMappings) {
        for (const [ability, data] of Object.entries(effects.skillMappings)) {
            const targetSkill = data.skill || data;
            if (targetSkill === profName) {
                // Check inheritance
                if (data.inheritFromRace && subraceName) {
                    return { ability: ability, source: `Subrace: ${subraceName}`, race: raceId };
                }
                return { ability: ability, source: `Race: ${raceId}`, race: raceId };
            }
        }
    }
    
    // Check weapon proficiencies
    if (profType === 'weapon' && effects?.weaponProficiencies) {
        for (const [ability, data] of Object.entries(effects.weaponProficiencies)) {
            const weapons = data.weapons || [];
            if (weapons.includes(profName)) {
                if (data.inheritFromRace && subraceName) {
                    return { ability: ability, source: `Subrace: ${subraceName}`, race: raceId };
                }
                return { ability: ability, source: `Race: ${raceId}`, race: raceId };
            }
        }
    }
    
    // Check armor proficiencies
    if (profType === 'armor' && effects?.armorProficiencies) {
        for (const [ability, data] of Object.entries(effects.armorProficiencies)) {
            const armorList = data.armor || [];
            if (armorList.includes(profName)) {
                if (data.inheritFromRace && subraceName) {
                    return { ability: ability, source: `Subrace: ${subraceName}`, race: raceId };
                }
                return { ability: ability, source: `Race: ${raceId}`, race: raceId };
            }
        }
    }
    
    // Check tool proficiencies
    if (profType === 'tool' && effects?.toolProficiencies) {
        for (const [ability, data] of Object.entries(effects.toolProficiencies)) {
            const toolData = data;
            if (toolData?.options?.includes(profName)) {
                if (toolData.inheritFromRace && subraceName) {
                    return { ability: ability, source: `Subrace: ${subraceName}`, race: raceId };
                }
                return { ability: ability, source: `Race: ${raceId}`, race: raceId };
            }
        }
    }
    
    return null;
}

// Get formatted origin string for tooltip
function getProficiencyOrigin(profName, profType, character) {
    const source = getProficiencySource(profName, profType, character);
    if (source) {
        return `\n\n📍 From: ${source.ability} (${source.source})`;
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
    // Search through all exclusive groups
    for (const groupName in effects) {
        const group = effects[groupName];
        if (group[optionName]) {
            return { ...group[optionName], exclusiveGroup: groupName };
        }
    }
    return null;
}

// Legacy variables - set by app.js after init
var _skillDescriptions = {};
var _raceAbilityDescriptions = {};
var _featDescriptions = {};
var _proficiencyDescriptions = { armor: {}, weapons: {}, tools: {}, savingThrows: {}, mastery: {} };

// Race ability descriptions are loaded from JSON via getRaceAbilityDescriptions()

// Feat descriptions are loaded from JSON via getFeatDescriptions()

// Class feature descriptions are loaded from JSON via getClassFeatureDescriptions()

const featPrerequisites = {
    "Heavy Armor Master": { armorProficiency: "heavy" },
    "Medium Armor Master": { armorProficiency: "medium" },
    "Lightly Armored": { armorProficiency: "none" },
    "Heavily Armored": { armorProficiency: "medium" },
    "Defensive Duelist": { abilityScore: { stat: "dexterity", min: 13 } },
    "Grappler": { abilityScore: { stat: "strength", min: 13 } },
    "Great Weapon Master": { abilityScore: { stat: "strength", min: 13 } },
    "Charger": { abilityScore: { stat: "strength", min: 13 } },
    "War Caster": { canCastSpells: true },
    "Ritual Caster": { canCastSpells: true },
    "Spell Sniper": { canCastSpells: true },
    "Magic Initiate": { canCastSpells: true },
    "Skulker": { abilityScore: { stat: "dexterity", min: 13 } },
    "Observant": { abilityScore: { stat: "intelligence", min: 13 } },
    "Durable": { abilityScore: { stat: "constitution", min: 13 } },
    "Inspiring Leader": { abilityScore: { stat: "charisma", min: 13 } },
    "Resilient": { hasAbilityScoreIncrease: true },
    "Dual Wielder": { fightingStyle: "twoWeapon" },
    "Crossbow Expert": { weaponProficiency: "crossbow" }
};

const raceAbilitySkillMap = {
    "Keen Senses": "Perception",
    "Menacing": "Intimidation",
    "Naturally Stealthy": "Stealth"
};

const raceAbilityArmorProficiencies = {
    "Dwarven Armor Training": ["light armor", "medium armor", "shields"]
};

const raceAbilityWeaponProficiencies = {
    "Elf Weapon Training": ["longsword", "shortsword", "shortbow", "longbow"],
    "Drow Weapon Training": ["rapier", "shortsword", "hand crossbow"]
};

const raceAbilityToolProficiencies = {
    "Dwarven Tool Proficiency": {
        options: ["smith's tools", "brewer's supplies", "mason's tools"],
        count: 1
    }
};

const raceAbilityCantrips = {
    "High Elf Cantrip": { class: "wizard", spellList: "all" },
    "Drow Magic": { cantrips: ["dancing-lights"] }
};

const raceAbilityInnateSpells = {
    "Drow Magic": {
        "3": ["faerie-fire"],
        "5": ["darkness"]
    }
};

const raceAbilityStatEffects = {
    "Dwarven Toughness": { type: "hpPerLevel", value: 1 },
    "Fleet Footed": { type: "speed", value: 5 },
    "Superior Darkvision": { type: "darkvision", value: 120 }
};
