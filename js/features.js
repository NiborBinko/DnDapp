function getClassFeaturesForLevel(classId, level) {
    const charClass = classes.find(c => c.id === classId);
    const featuresData = charClass?.features || {};
    const allFeatures = [];
    const allOptions = [];
    
    for (let lvl = 1; lvl <= level; lvl++) {
        if (featuresData[lvl]) {
            const cf = featuresData[lvl];
            if (cf.features) {
                cf.features.forEach(f => {
                    allFeatures.push({ name: f, level: lvl, source: 'class', classId: classId });
                });
            }
            if (cf.options) {
                cf.options.forEach(o => {
                    allOptions.push({ ...o, level: lvl, source: 'class', classId: classId });
                });
            }
        }
    }
    
    return { features: allFeatures, options: allOptions };
}

function getRaceAbilities() {
    if (!character.raceId) return [];
    
    const race = races.find(r => r.id === character.raceId);
    let raceAbilities = [...(race.raceAbilities || [])];
    
    if (character.subraceName && subraces[character.raceId]) {
        const sub = subraces[character.raceId].find(s => s.name === character.subraceName);
        if (sub && sub.raceAbilities) {
            raceAbilities = raceAbilities.concat(sub.raceAbilities);
        }
    }
    
    return raceAbilities;
}

function getRaceBonuses() {
    if (!character.raceId) return {};
    
    const race = races.find(r => r.id === character.raceId);
    let bonuses = { ...race.bonuses };
    
    if (character.subraceName && subraces[character.raceId]) {
        const sub = subraces[character.raceId].find(s => s.name === character.subraceName);
        if (sub && sub.bonuses) {
            for (const [stat, value] of Object.entries(sub.bonuses)) {
                bonuses[stat] = (bonuses[stat] || 0) + value;
            }
        }
    }
    
    return bonuses;
}

function hasRaceAbility(abilityName) {
    const raceAbs = getRaceAbilities();
    return raceAbs.includes(abilityName);
}

function getExtraSkillCount() {
    const raceAbs = getRaceAbilities();
    return raceAbs.filter(a => a === '+1 Proficiency').length;
}

function getExtraFeatCount() {
    const raceAbs = getRaceAbilities();
    return raceAbs.filter(a => a === '+1 Feat').length;
}

function getStatCost(value) {
    if (value <= 8) return 0;
    if (value === 9) return 1;
    if (value === 10) return 2;
    if (value === 11) return 3;
    if (value === 12) return 4;
    if (value === 13) return 5;
    if (value === 14) return 7;
    if (value === 15) return 9;
    return 0;
}

function adjustStat(stat, delta) {
    const currentBase = character.stats[stat] ?? 8;
    const newBase = currentBase + delta;
    
    if (newBase < 8) return;
    if (newBase > 15) return;
    
    const bonuses = getRaceBonuses();
    const bonus = bonuses[stat] || 0;
    
    if (newBase + bonus > 16) return;
    
    const currentCost = getStatCost(currentBase);
    const newCost = getStatCost(newBase);
    const costDiff = newCost - currentCost;
    
    if (delta > 0 && pointsRemaining < costDiff) return;
    if (delta < 0 && currentBase === 8) return;
    
    pointsRemaining -= costDiff;
    character.stats[stat] = newBase;
    
    renderStats();
}

function getCharacterLevel(char) {
    if (char.classes) {
        return char.classes.reduce((sum, c) => sum + c.level, 0);
    }
    return char.level || 1;
}

function getTotalLevel(chars) {
    if (chars.classes) {
        return chars.classes.reduce((sum, c) => sum + c.level, 0);
    }
    return chars.level || 1;
}

function getCharacterClasses(char) {
    if (char.classes) {
        return char.classes;
    }
    return [{ classId: char.classId, level: char.level || 1 }];
}
