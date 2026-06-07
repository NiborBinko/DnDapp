/**
 * Data loaders - Loads JSON files from server
 */
let racesData = {};
let classesData = {};

async function loadAllGameData() {
    const raceIds = ['human', 'elf', 'dwarf', 'halfling', 'dragonborn', 'gnome', 'halfelf', 'halforc', 'tiefling'];
    const classIds = ['fighter', 'wizard', 'rogue', 'cleric', 'ranger', 'barbarian', 'paladin', 'bard', 'druid', 'monk', 'sorcerer', 'warlock'];
    
    const racePromises = raceIds.map(id => loadJson('data/races/' + id));
    const classPromises = classIds.map(id => loadJson('data/classes/' + id));
    const spellSchools = ['abjuration', 'conjuration', 'divination', 'enchantment', 'evocation', 'illusion', 'necromancy', 'transmutation'];
    const spellPromises = spellSchools.map(s => loadJson('data/spells/' + s));
    const otherPromises = [
        loadJson('data/effects/race-effects'), loadJson('data/effects/class-effects'), loadJson('data/effects/feat-effects'),
        loadJson('data/effects/class-option-effects'), loadJson('data/effects/subclass-effects'),
        loadJson('data/descriptions/stats'), loadJson('data/descriptions/feats'), loadJson('data/descriptions/race-abilities'), loadJson('data/descriptions/proficiencies'),
        loadJson('data/descriptions/class-abilities'), loadJson('data/descriptions/class-options'), loadJson('data/descriptions/exclusive-groups'),
        loadJson('data/descriptions/subclass-abilities')
    ];
    
    const results = await Promise.all([...racePromises, ...classPromises, ...spellPromises, ...otherPromises]);
    
    const rCount = raceIds.length, cCount = classIds.length, sCount = spellSchools.length;
    for (let i = 0; i < rCount; i++) { if (results[i]?.id) racesData[results[i].id] = results[i]; }
    for (let i = 0; i < cCount; i++) { const idx = rCount + i; if (results[idx]?.id) classesData[results[idx].id] = results[idx]; }
    
    // Build window.allSpells from spell school files and class spellLists
    window.allSpells = {};
    window.spellLevelByClass = {};
    
    // First pass: load spells from school files (base data)
    for (let i = 0; i < sCount; i++) {
        const schoolData = results[rCount + cCount + i] || {};
        const schoolKey = Object.keys(schoolData)[0];
        if (schoolKey && schoolData[schoolKey]) {
            schoolData[schoolKey].forEach(spell => {
                window.allSpells[spell.name] = { ...spell, school: schoolKey };
            });
        }
    }
    
    // Second pass: build spell level lookup from class spellLists
    Object.entries(classesData).forEach(([classId, cls]) => {
        if (!cls.spellList) return;
        window.spellLevelByClass[classId] = {};
        Object.entries(cls.spellList).forEach(([level, spells]) => {
            spells.forEach(spellName => {
                window.spellLevelByClass[classId][spellName] = parseInt(level, 10);
            });
        });
    });
    
    window.raceEffectsData = results[rCount + cCount + sCount] || {};
    window.classEffectsData = results[rCount + cCount + sCount + 1] || {};
    window.featEffectsData = results[rCount + cCount + sCount + 2] || {};
    window.classOptionEffectsData = results[rCount + cCount + sCount + 3] || {};
    window.subclassEffectsData = results[rCount + cCount + sCount + 4] || {};
    window.descriptions = {
        stats: results[rCount + cCount + sCount + 5] || {},
        feats: results[rCount + cCount + sCount + 6] || {},
        raceAbilities: results[rCount + cCount + sCount + 7] || {},
        proficiencies: results[rCount + cCount + sCount + 8] || {},
        classAbilities: results[rCount + cCount + sCount + 9] || {},
        classOptions: results[rCount + cCount + sCount + 10] || {},
        exclusiveGroups: results[rCount + cCount + sCount + 11] || {},
        subclassAbilities: results[rCount + cCount + sCount + 12] || {}
    };
    
    window.racesData = racesData;
    window.classesData = classesData;
}

async function loadJson(path) {
    try {
        const res = await fetch(path + '.json');
        if (!res.ok) return {};
        return await res.json();
    } catch { return {}; }
}

async function loadAllDescriptions() {
    // Deprecated no-op: window.descriptions is populated by loadAllGameData.
    // Kept for backward compatibility with existing app.js calls.
}

function getRaceData(id) { return racesData[id] || null; }
function getClassData(id) { return classesData[id] || null; }
function getStatDescription(stat) { return window.descriptions?.stats?.[stat] || ''; }
function getFeatDescription(feat) { return window.descriptions?.feats?.[feat] || ''; }
function getRaceAbilityDescription(ability) { return window.descriptions?.raceAbilities?.[ability] || ''; }
function getRaceStatBonuses(raceId, subraceId) {
    const race = getRaceData(raceId);
    if (!race) return {};
    const bonuses = { ...race.bonuses };
    
    // Handle "chosen" - this means user selects stats for +1 bonus each
    if (bonuses.chosen !== undefined) {
        bonuses.chosen = { count: bonuses.chosen, isChosen: true };
    }
    
    if (subraceId && race.subraces?.[subraceId]) {
        Object.entries(race.subraces[subraceId].bonuses || {}).forEach(([s, v]) => {
            if (s === 'chosen') {
                bonuses.chosen = { count: v, isChosen: true };
            } else {
                bonuses[s] = (bonuses[s] || 0) + v;
            }
        });
    }
    return bonuses;
}

function getRaceVision(raceId, subraceId) {
    const race = getRaceData(raceId);
    if (!race) return { nightvision: null, dayvision: null };
    const abilities = race.raceAbilities || [];
    const subAbilities = subraceId ? race.subraces?.[subraceId]?.raceAbilities || [] : [];
    const allAbilities = [...abilities, ...subAbilities];
    let night = null;
    allAbilities.forEach(a => {
        const effect = window.raceEffectsData?.effects?.[a.toLowerCase()];
        if (effect?.type === 'vision' && effect.value?.nightvision) night = Math.max(night || 0, effect.value.nightvision);
    });
    return { nightvision: night, dayvision: null };
}

function getFeatStatBonuses() {
    const bonuses = {};
    userSelection?.feats?.forEach(feat => {
        const effect = window.featEffectsData?.effects?.[feat.toLowerCase()];
        if (effect?.type !== 'stat' || !effect.stat) return;
        const stat = resolveFeatStatChoice(feat, effect);
        if (stat) bonuses[stat] = (bonuses[stat] || 0) + (effect.amount || 1);
        if (effect.secondaryStat) {
            const s2 = resolveFeatStatChoice(feat, effect.secondaryStat, '__secondary');
            if (s2) bonuses[s2] = (bonuses[s2] || 0) + (effect.secondaryStat.amount || 1);
        }
    });
    return bonuses;
}

function resolveFeatStatChoice(featName, effect, choiceSlot) {
    const key = `${featName.toLowerCase()}${choiceSlot ? '-' + choiceSlot : ''}`;
    const chosen = userSelection?.featChoices?.[key]?.stat;
    if (chosen) return chosen;
    if (effect.stat && effect.stat !== 'any') return effect.stat;
    if (Array.isArray(effect.options) && effect.options.length) return effect.options[0];
    return null;
}

function getFeatMaxHpBonus() {
    let perLevel = 0;
    userSelection?.feats?.forEach(feat => {
        const effect = window.featEffectsData?.effects?.[feat.toLowerCase()];
        if (effect?.type === 'maxHP') perLevel += (effect.perLevel || 0);
    });
    return perLevel;
}

function getFeatProficiencies() {
    const profs = { armor: [], weapons: [], skills: [], tools: [] };
    userSelection?.feats?.forEach(feat => {
        const effect = window.featEffectsData?.effects?.[feat.toLowerCase()];
        if (effect?.type !== 'proficiency') return;
        if (effect.armor) profs.armor.push(effect.armor);
        if (Array.isArray(effect.weapons)) profs.weapons.push(...effect.weapons);
    });
    return profs;
}

function getFeatSavingThrowProfs() {
    const profs = [];
    userSelection?.feats?.forEach(feat => {
        const effect = window.featEffectsData?.effects?.[feat.toLowerCase()];
        if (!effect) return;
        if (effect.type === 'savingThrow' && effect.ability) {
            const ab = resolveFeatStatChoice(feat, effect, '__save');
            if (ab) profs.push(ab);
        }
        if (effect.secondary?.type === 'savingThrow' && effect.secondary.ability) {
            const ab = resolveFeatStatChoice(feat, effect.secondary, '__secondary-save');
            if (ab) profs.push(ab);
        }
    });
    return profs;
}

function getMaxSkillProficiencies() {
    if (!userSelection?.class) return 2;
    const classMax = window.classesData[userSelection.class]?.proficiencies?.skills?.count || 2;
    const raceBonus = window.raceSkillLimitBonus || 0;
    return classMax + raceBonus;
}

function getRaceSpeedBonus(raceId) {
    const race = getRaceData(raceId);
    return race?.speed || 30;
}

function getSpellData(name) {
    return window.allSpells?.[name] || null;
}

function getSpellLevelForClass(spellName, classId) {
    return window.spellLevelByClass?.[classId]?.[spellName] ?? -1;
}

function getClassSpellList(classId, level) {
    const cls = window.classesData?.[classId];
    if (!cls?.spellList) return [];
    return cls.spellList[String(level)] || [];
}

function getInnateSpellNames() {
    const innate = new Set();
    characterSheet?.innateSpells?.forEach(s => innate.add(s.name));
    characterSheet?.knownCantrips?.forEach(s => innate.add(s.name));
    return innate;
}

window.getSpellData = getSpellData;
window.getSpellLevelForClass = getSpellLevelForClass;
window.getClassSpellList = getClassSpellList;
window.getInnateSpellNames = getInnateSpellNames;
window.loadAllGameData = loadAllGameData;
window.getRaceData = getRaceData;
window.getClassData = getClassData;
window.getStatDescription = getStatDescription;
window.getFeatDescription = getFeatDescription;
window.getRaceAbilityDescription = getRaceAbilityDescription;
window.getFeatMaxHpBonus = getFeatMaxHpBonus;
window.getFeatProficiencies = getFeatProficiencies;
window.getFeatSavingThrowProfs = getFeatSavingThrowProfs;
window.resolveFeatStatChoice = resolveFeatStatChoice;
window.getRaceStatBonuses = getRaceStatBonuses;
window.getRaceVision = getRaceVision;
window.getFeatStatBonuses = getFeatStatBonuses;
window.getMaxSkillProficiencies = getMaxSkillProficiencies;
window.getRaceSpeedBonus = getRaceSpeedBonus;
