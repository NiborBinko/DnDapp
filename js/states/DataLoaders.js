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
    const otherPromises = [
        loadJson('data/effects/race-effects'), loadJson('data/effects/class-effects'), loadJson('data/effects/feat-effects'),
        loadJson('data/descriptions/stats'), loadJson('data/descriptions/feats'), loadJson('data/descriptions/race-abilities'), loadJson('data/descriptions/proficiencies'),
        loadJson('data/descriptions/class-abilities'), loadJson('data/descriptions/class-options'), loadJson('data/descriptions/exclusive-groups')
    ];
    
    const results = await Promise.all([...racePromises, ...classPromises, ...otherPromises]);
    
    const rCount = raceIds.length, cCount = classIds.length;
    for (let i = 0; i < rCount; i++) { if (results[i]?.id) racesData[results[i].id] = results[i]; }
    for (let i = 0; i < cCount; i++) { const idx = rCount + i; if (results[idx]?.id) classesData[results[idx].id] = results[idx]; }
    
    window.raceEffectsData = results[rCount + cCount] || {};
    window.classEffectsData = results[rCount + cCount + 1] || {};
    window.featEffectsData = results[rCount + cCount + 2] || {};
    window.descriptions = {
        stats: results[rCount + cCount + 3] || {},
        feats: results[rCount + cCount + 4] || {},
        raceAbilities: results[rCount + cCount + 5] || {},
        proficiencies: results[rCount + cCount + 6] || {},
        classAbilities: results[rCount + cCount + 7] || {},
        classOptions: results[rCount + cCount + 8] || {},
        exclusiveGroups: results[rCount + cCount + 9] || {}
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
    window.descriptions = window.descriptions || {};
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
        if (effect?.type === 'stat' && effect.value) bonuses[effect.value.stat] = (bonuses[effect.value.stat] || 0) + effect.value.amount;
    });
    return bonuses;
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

window.loadAllGameData = loadAllGameData;
window.getRaceData = getRaceData;
window.getClassData = getClassData;
window.getStatDescription = getStatDescription;
window.getFeatDescription = getFeatDescription;
window.getRaceAbilityDescription = getRaceAbilityDescription;
window.getRaceStatBonuses = getRaceStatBonuses;
window.getRaceVision = getRaceVision;
window.getFeatStatBonuses = getFeatStatBonuses;
window.getMaxSkillProficiencies = getMaxSkillProficiencies;
window.getRaceSpeedBonus = getRaceSpeedBonus;