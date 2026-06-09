// ===== Glossary Data Layer =====
// Pure data retrieval — no DOM

function buildSpellLevelMap() {
    const map = {};
    Object.entries(window.classesData || {}).forEach(([clsId, cls]) => {
        Object.entries(cls.spellList || {}).forEach(([lvlStr, spells]) => {
            spells.forEach(s => {
                if (!map[s]) map[s] = { minLevel: 99, sources: [] };
                const lvl = parseInt(lvlStr);
                if (lvl < map[s].minLevel) map[s].minLevel = lvl;
                map[s].sources.push({ class: cls.name, level: lvl });
            });
        });
    });
    Object.entries(window.raceEffectsData?.effects || {}).forEach(([k, ef]) => {
        if (ef.type === 'innate' && ef.spellLevels) {
            Object.entries(ef.spellLevels).forEach(([lvl, spells]) => {
                spells.forEach(s => {
                    if (!map[s]) map[s] = { minLevel: 99, sources: [] };
                    const l = parseInt(lvl);
                    if (l < map[s].minLevel) map[s].minLevel = l;
                    map[s].sources.push({ class: k, level: l });
                });
            });
        }
    });
    Object.entries(window.subclassEffectsData?.effects || {}).forEach(([k, ef]) => {
        if (ef.type === 'innate' && ef.spellLevels) {
            Object.entries(ef.spellLevels).forEach(([lvl, spells]) => {
                spells.forEach(s => {
                    if (!map[s]) map[s] = { minLevel: 99, sources: [] };
                    const l = parseInt(lvl);
                    if (l < map[s].minLevel) map[s].minLevel = l;
                    map[s].sources.push({ class: k, level: l });
                });
            });
        }
    });
    return map;
}

function getSubclassOptions() {
    const options = {};
    Object.entries(window.classesData || {}).forEach(([clsId, cls]) => {
        Object.entries(cls.features || {}).forEach(([lvl, lvlData]) => {
            (lvlData.options || []).forEach(opt => {
                if (!options[opt.exclusiveGroup]) options[opt.exclusiveGroup] = [];
                if (!options[opt.exclusiveGroup].find(o => o.id === opt.id)) {
                    options[opt.exclusiveGroup].push({
                        id: opt.id,
                        name: opt.name,
                        classId: clsId,
                        className: cls.name,
                        level: parseInt(lvl)
                    });
                }
            });
        });
    });
    return options;
}

function getOptionFeatures(optionId) {
    const def = window.classOptionEffectsData?.options?.[optionId];
    if (!def || !def.features) return null;
    const features = [];
    Object.entries(def.features).forEach(([lvlStr, fids]) => {
        fids.forEach(fid => {
            features.push({ name: fid, level: parseInt(lvlStr) });
        });
    });
    return features.sort((a, b) => a.level - b.level);
}

function getRaceTree() {
    return Object.entries(window.racesData || {}).map(([id, race]) => ({
        id, name: race.name, type: 'race',
        children: race.subraces ? Object.entries(race.subraces).map(([srName, sr]) => ({
            id: srName, name: srName, type: 'subrace', parentRaceId: id, parentRaceName: race.name
        })) : []
    }));
}

function getClassTree() {
    return Object.entries(window.classesData || {}).map(([id, cls]) => ({
        id, name: cls.name, type: 'class',
        children: []
    }));
}

function getSubclassTree() {
    const grouped = getSubclassOptions();
    return Object.entries(grouped).map(([group, opts]) => ({
        group,
        groupLabel: window.descriptions?.exclusiveGroups?.[group] || group,
        options: opts
    }));
}

function getSpellsByLevel() {
    const map = buildSpellLevelMap();
    const byLevel = {};
    Object.entries(map).forEach(([name, data]) => {
        const lvl = data.minLevel;
        if (!byLevel[lvl]) byLevel[lvl] = [];
        byLevel[lvl].push({ name, minLevel: lvl, sources: data.sources });
    });
    Object.keys(byLevel).forEach(lvl => {
        byLevel[lvl].sort((a, b) => a.name.localeCompare(b.name));
    });
    return byLevel;
}

function getAllRaceFeatures() {
    const desc = window.descriptions?.raceAbilities || {};
    const subraceNames = new Set();
    Object.values(window.racesData || {}).forEach(race => {
        if (race.subraces) Object.keys(race.subraces).forEach(sr => subraceNames.add(sr));
    });
    return Object.keys(desc).filter(n => !subraceNames.has(n)).sort().map(name => ({ name, desc: desc[name] }));
}

function getAllClassFeatures() {
    const classDesc = window.descriptions?.classAbilities || {};
    const subclassDesc = window.descriptions?.subclassAbilities || {};
    const result = [];
    Object.entries(classDesc).forEach(([name, desc]) => result.push({ name, desc, source: 'Class Feature' }));
    Object.entries(subclassDesc).forEach(([name, desc]) => result.push({ name, desc, source: 'Subclass Ability' }));
    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
}

function getGlossaryFeats() {
    const desc = window.descriptions?.feats || {};
    const effects = window.featEffectsData?.effects || {};
    return Object.keys(desc).sort().map(name => {
        const ef = effects[name.toLowerCase()];
        let effectText = '';
        if (ef) {
            if (ef.type === 'stat' && ef.value) effectText = `Stat Bonus: +${ef.value} to selected stat`;
            else if (ef.proficiencyType) effectText = `Grants proficiency: ${ef.proficiencyType}`;
            else if (ef.type === 'maxHP') effectText = 'Increases max HP';
        }
        return { name, desc: desc[name], effectText };
    });
}

function getProficiencyGroups() {
    const profs = window.descriptions?.proficiencies || {};
    const groups = [];
    ['armor', 'weapons', 'tools', 'savingThrows', 'skills'].forEach(group => {
        const items = profs[group];
        if (!items) return;
        groups.push({
            group,
            label: group.charAt(0).toUpperCase() + group.slice(1),
            items: Object.entries(items).map(([name, desc]) => ({ name, desc }))
        });
    });
    return groups;
}

function getRaceDetail(raceId) {
    const race = window.racesData?.[raceId];
    if (!race) return null;
    const abilities = (race.raceAbilities || []).map(a => ({
        name: a,
        desc: window.descriptions?.raceAbilities?.[a] || 'No description available.'
    }));
    const subraces = race.subraces ? Object.entries(race.subraces).map(([srName, sr]) => ({
        name: srName,
        bonuses: sr.bonuses || {},
        abilities: (sr.raceAbilities || []).map(a => ({
            name: a,
            desc: window.descriptions?.raceAbilities?.[a] || 'No description available.'
        })),
        languages: sr.languages || []
    })) : [];
    const bonusStr = race.bonuses ? Object.entries(race.bonuses).map(([s, v]) => `${s} +${v}`).join(', ') : 'None';
    return { name: race.name, desc: race.desc, size: race.size, speed: race.speed, languages: race.languages || [], bonuses: bonusStr, abilities, subraces };
}

function getSubraceDetail(raceId, srName) {
    const race = window.racesData?.[raceId];
    if (!race || !race.subraces?.[srName]) return null;
    const sr = race.subraces[srName];
    const bonusStr = sr.bonuses ? Object.entries(sr.bonuses).map(([s, v]) => `${s} +${v}`).join(', ') : 'None';
    const abilities = (sr.raceAbilities || []).map(a => ({
        name: a,
        desc: window.descriptions?.raceAbilities?.[a] || 'No description available.'
    }));
    return { name: srName, raceName: race.name, desc: window.descriptions?.raceAbilities?.[srName] || '', bonuses: bonusStr, languages: sr.languages || [], abilities };
}

function getClassDetail(clsId) {
    const cls = window.classesData?.[clsId];
    if (!cls) return null;
    const featuresByLevel = [];
    Object.entries(cls.features || {}).forEach(([lvlStr, lvlData]) => {
        const lvl = parseInt(lvlStr);
        const features = (lvlData.features || []).map(f => ({
            name: f,
            desc: window.descriptions?.classAbilities?.[f] || 'No description available.',
            isSubclass: false
        }));
        (lvlData.options || []).forEach(opt => {
            features.push({
                name: opt.name,
                type: 'option',
                optionId: opt.id,
                exclusiveGroup: opt.exclusiveGroup,
                desc: window.descriptions?.classOptions?.[opt.name] || 'Subclass choice.',
                isSubclass: true
            });
        });
        if (features.length > 0) featuresByLevel.push({ level: lvl, features });
    });
    const profs = cls.proficiencies || {};
    const subclassOptions = [];
    Object.entries(cls.features || {}).forEach(([lvl, lvlData]) => {
        (lvlData.options || []).forEach(opt => {
            if (!subclassOptions.find(o => o.optionId === opt.id)) {
                subclassOptions.push({
                    optionId: opt.id,
                    name: opt.name,
                    exclusiveGroup: opt.exclusiveGroup,
                    level: parseInt(lvl)
                });
            }
        });
    });
    return {
        name: cls.name, desc: cls.desc, hitDie: cls.hitDie, primaryStat: cls.primaryStat,
        spellcastingAbility: cls.spellcastingAbility || null,
        proficiencies: profs,
        featuresByLevel,
        subclassOptions
    };
}

function getOptionDetail(optionId) {
    const def = window.classOptionEffectsData?.options?.[optionId];
    if (!def) return null;
    const features = getOptionFeatures(optionId);
    return {
        name: def.displayName,
        desc: window.descriptions?.classOptions?.[def.displayName] || 'No description available.',
        features
    };
}

function getSpellDetail(spellName) {
    const spell = window.allSpells?.[spellName];
    if (!spell) return null;
    const map = buildSpellLevelMap();
    const data = map[spellName] || { minLevel: '?', sources: [] };
    return {
        name: spell.name,
        school: spell.school || 'Unknown',
        level: data.minLevel,
        casttime: spell.casttime || 'Unknown',
        range: spell.range || 'Unknown',
        components: spell.components || 'Unknown',
        duration: spell.duration || 'Unknown',
        ritual: spell.ritual,
        description: spell.description || 'No description available.',
        sources: data.sources || []
    };
}

function getFeatDetail(featName) {
    const desc = window.descriptions?.feats?.[featName];
    const ef = window.featEffectsData?.effects?.[featName.toLowerCase()];
    let effectText = '';
    if (ef) {
        if (ef.type === 'stat') {
            if (ef.options?.length) effectText = `Choose one stat to increase by ${ef.value || 1}. Options: ${ef.options.join(', ')}`;
            else effectText = `Stat Bonus: +${ef.value || 1}`;
        } else if (ef.type === 'proficiency') {
            effectText = `Grants proficiency: ${ef.proficiencyType} — ${ef.options?.join(', ') || ''}`;
        } else if (ef.type === 'skill') {
            effectText = `Grants skill proficiency: ${ef.options?.join(', ') || ''}`;
        } else if (ef.type === 'maxHP') {
            effectText = 'Increases maximum hit points';
        }
    }
    return { name: featName, desc: desc || 'No description available.', effectText };
}
