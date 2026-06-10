/**
 * Main render module - renders each stage
 */

/**
 * Returns a kebab-case school-specific feature id (e.g. "projected-ward")
 * if the chosen subclass option provides one for (class, level, index).
 * Used to override generic class-JSON placeholders like "Tradition Feature".
 */
function getSubclassFeatureOverride(classId, level, index) {
    const cls = window.classesData?.[classId];
    if (!cls?.options) return null;
    const selected = userSelection.selectedFeatureChoices || {};
    for (const opt of cls.options) {
        const optionId = selected[opt.exclusiveGroup];
        if (!optionId) continue;
        const def = window.classOptionEffectsData?.options?.[optionId];
        if (!def?.features) continue;
        const kebabId = def.features[String(level)]?.[index];
        if (kebabId) return kebabId;
    }
    return null;
}

function kebabToTitle(s) {
    return (s || '').split('-').map(w => w ? w.charAt(0).toUpperCase() + w.slice(1) : '').join(' ');
}

function statLabel(stat) {
    if (!stat) return '';
    const map = { strength: 'STR', dexterity: 'DEX', constitution: 'CON', intelligence: 'INT', wisdom: 'WIS', charisma: 'CHA' };
    return map[stat.toLowerCase()] || stat;
}

function renderFeatStatChoice(featName, effect, isSelected) {
    if (!isSelected || !effect) return '';
    const slots = [];
    if (effect.type === 'stat' && effect.stat === 'any' && Array.isArray(effect.options)) {
        slots.push({ key: '', options: effect.options });
    }
    if (effect.secondaryStat?.stat === 'any' && Array.isArray(effect.secondaryStat.options)) {
        slots.push({ key: '__secondary', options: effect.secondaryStat.options });
    }
    if (effect.secondary?.type === 'savingThrow' && effect.secondary.ability === 'any' && Array.isArray(effect.secondary.options)) {
        slots.push({ key: '__secondary-save', options: effect.secondary.options });
    }
    if (effect.type === 'savingThrow' && effect.ability === 'any' && Array.isArray(effect.options)) {
        slots.push({ key: '__save', options: effect.options });
    }
    if (!slots.length) return '';
    const selects = slots.map(slot => {
        const current = userSelection.featChoices?.[`${featName.toLowerCase()}${slot.key}`]?.stat;
        const opts = slot.options.map(o => `<option value="${o}" ${current === o ? 'selected' : ''}>${statLabel(o)}</option>`).join('');
        return `<select data-feat="${featName}" data-slot="${slot.key}" onchange="event.stopPropagation();">${opts}</select>`;
    }).join(' ');
    return ` <span class="feat-choice">${selects}</span>`;
}

function bindFeatStatChoiceHandlers(root) {
    if (!root) return;
    root.querySelectorAll('select[data-feat]').forEach(sel => {
        sel.addEventListener('change', function() {
            const feat = this.getAttribute('data-feat');
            const slot = this.getAttribute('data-slot') || '';
            const key = slot ? `${feat.toLowerCase()}-${slot}` : feat.toLowerCase();
            if (!userSelection.featChoices) userSelection.featChoices = {};
            userSelection.featChoices[key] = { stat: this.value };
            recalculateAll();
            renderAbilityScores();
        });
    });
}

function renderWelcome() { renderSavedCharactersList(); }

function renderChooseRace() {
    const grid = document.getElementById('race-grid');
    if (!grid) return;
    grid.innerHTML = Object.values(window.racesData).map(race => {
        const bonuses = race.bonuses ? Object.entries(race.bonuses).map(([s, v]) => `+${v} ${s.slice(0, 3).toUpperCase()}`).join(', ') : race.desc;
        return `<div class="card ${userSelection.race === race.id ? 'selected' : ''}" 
            onclick="handleRaceSelect('${race.id}')"
            data-tooltip-id="${race.id}"
            data-tooltip-type="race"
            ><h3>${race.name}</h3><p>${bonuses}</p></div>`;
    }).join('');
    
    const subraceSection = document.getElementById('subrace-section');
    if (userSelection.race && window.racesData[userSelection.race]?.subraces) {
        renderSubraces(window.racesData[userSelection.race].subraces);
        if (subraceSection) subraceSection.style.display = 'block';
    } else if (subraceSection) { subraceSection.style.display = 'none'; }
    
    updateNextButton();
}

function renderSubraces(subraces) {
    const grid = document.getElementById('subrace-grid');
    if (!grid) return;
    grid.innerHTML = Object.keys(subraces).map(name => {
        const bonuses = subraces[name].bonuses ? Object.entries(subraces[name].bonuses).map(([s, v]) => `+${v} ${s.slice(0, 3)}`).join(', ') : '';
        return `<div class="card ${userSelection.subrace === name ? 'selected' : ''}" 
            onclick="handleSubraceSelect('${name}')"
            data-tooltip-id="${name}"
            data-tooltip-type="race-ability"
            data-origin="Race: ${userSelection.race}"><h3>${name}</h3><p>${bonuses}</p></div>`;
    }).join('');
}

function renderChooseClass() {
    const grid = document.getElementById('class-grid');
    if (!grid) return;
    grid.innerHTML = Object.values(window.classesData).map(cls => {
        return `<div class="card ${userSelection.class === cls.id ? 'selected' : ''}" 
            onclick="handleClassSelect('${cls.id}')"
            data-tooltip-id="${cls.id}"
            data-tooltip-type="class"
            ><h3>${cls.name} <span>(${cls.primaryStat?.slice(0, 3).toUpperCase()})</span></h3><p>d${cls.hitDie}</p></div>`;
    }).join('');
    updateNextButton();
}

function renderAbilityScores() {
    const container = document.getElementById('stats-container');
    if (!container) return;
    const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
    const raceBonuses = window.raceStatBonuses || {};
    const primaryStat = getClassPrimaryStat();

    // Calculate points spent using user's allocated stats
    let pointsSpent = 0;
    stats.forEach(stat => {
        const base = userSelection.stats[stat] || 8;
        if (base > 8) {
            if (base <= 13) pointsSpent += (base - 8);
            else pointsSpent += 5 + (base - 13) * 2;
        }
    });
    UIState.pointsRemaining = 27 - pointsSpent;

    let html = `<div class="points-remaining">Points: <span id="points-remaining">${UIState.pointsRemaining}</span></div>`;

    html += stats.map(stat => {
        const base = userSelection.stats[stat] || 8;
        const raceBonus = raceBonuses[stat] || 0;
        const choiceBonus = window.featureChoiceBonuses?.[stat] || 0;
        const totalBonus = raceBonus + choiceBonus;
        const charStat = characterSheet.stats?.[stat] || (base + totalBonus);
        const mod = Math.floor((charStat - 10) / 2);
        const cost = base >= 13 ? 2 : 1;
        const canDec = base > 8;
        const canInc = UIState.pointsRemaining >= cost && base < (15 + raceBonus) && (base + 1 + raceBonus) <= 16;
        return `<div class="stat-row ${primaryStat === stat ? 'primary-stat-row' : ''}"
            data-tooltip-id="${stat}" 
            data-tooltip-type="stat"
            ${raceBonuses[stat] ? `data-origin="Race: ${userSelection.race}"` : ''}>
            <div class="stat-name">${stat.toUpperCase().slice(0, 3)} ${primaryStat === stat ? '⭐' : ''}</div>
            <div class="stat-controls">
                <button class="stat-btn" onclick="adjustStat('${stat}', -1)" ${!canDec ? 'disabled' : ''}>-</button>
                <div class="stat-value">${base}</div>
                <button class="stat-btn" 
                    onclick="adjustStat('${stat}', 1)" 
                    ${!canInc ? 'disabled' : ''}
                    >+${cost > 1 ? cost : ''}</button>
                <div class="stat-bonus">${(totalBonus && totalBonus > 0) ? '+' + totalBonus : ''}</div>
                <div class="stat-total">${charStat}</div>
                <div class="stat-modifier">${mod >= 0 ? '+' : ''}${mod}</div>
            </div>
        </div>`;
    }).join('');
    
    // Render stat choice features (e.g., Human bonus stat, ASI)
    Object.entries(userSelection.featureChoices).forEach(([key, choice]) => {
        if (choice && choice.type === 'stat' && choice.options && choice.options.length > 0) {
            const selectedItems = choice.selected?.filter(s => s !== null) || [];
            const canSelect = selectedItems.length < choice.count;
            const displayKey = key.replace(/-?\d+$/, '');  // Strip trailing numbers for display
            const title = displayKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            
            html += `<div class="section-header">${title}</div><div class="checkbox-grid">`;
            choice.options.forEach(opt => {
                const isSelected = selectedItems.includes(opt);
                const atCap = (characterSheet.stats?.[opt] || 0) >= 20;
                const disabled = (!canSelect && !isSelected) || atCap ? 'disabled' : '';
                html += `<label class="checkbox-item ${isSelected ? 'selected' : ''}" 
                    data-tooltip-id="${opt}" 
                    data-tooltip-type="stat" 
                    data-origin="${title}"
                    ><input type="checkbox" ${isSelected ? 'checked' : ''} ${disabled} onchange="selectFeatureChoice('${key}', '${opt}')">${opt}</label>`;
            });
            html += '</div>';
        }
    });
    
    container.innerHTML = html;
    updateNextButton();
}

function getClassPrimaryStat() {
    if (!userSelection.class) return null;
    return window.classesData[userSelection.class]?.primaryStat || null;
}

function renderProficienciesStage() {
    const grid = document.getElementById('proficiencies-grid');
    if (!grid) return;
    const classData = window.classesData[userSelection.class];
    if (!classData) { grid.innerHTML = '<p>Select a class first.</p>'; return; }
    
    let html = '';
    const profs = classData.proficiencies || {};
    
    // Skills - all in one list, auto-granted increase limit
    const skillOptions = classData.proficiencies?.skills?.options || [];
    const classMaxSkills = classData.proficiencies?.skills?.count || 2;
    const classSkillNames = skillOptions.map(opt => opt.name);
    
    // Get race auto-granted skills from featureChoices (auto-added when count === selections)
    const raceAutoGrantedSkills = [];
    Object.entries(userSelection.featureChoices || {}).forEach(([key, choice]) => {
        if (choice?.type === 'proficiency' && choice?.proficiencyType === 'skill') {
            const selected = choice.selected?.filter(s => s !== null) || [];
            // Auto-grant: selections.length === count (no choice needed)
            if (selected.length === choice.count && selected.length > 0) {
                selected.forEach(skill => raceAutoGrantedSkills.push(skill));
            }
        }
    });
    
    // Skills not in class options (extra from race)
    const raceExtraSkills = raceAutoGrantedSkills.filter(s => !classSkillNames.includes(s));
    
    // Calculate limit: only class max + race bonus (+1 Proficiency)
    // Auto-granted skills are locked but don't increase the max count
    const raceSkillLimitBonus = window.raceSkillLimitBonus || 0;
    const maxSkills = classMaxSkills + raceSkillLimitBonus;
    const userPickedSkills = userSelection.selectedSkills.filter(s => !raceAutoGrantedSkills.includes(s));
    const currentUserPicks = userPickedSkills.length;
    
    html += `<div class="section-header">Skills (${currentUserPicks}/${maxSkills})</div><div class="checkbox-grid">`;
    
    // Auto-granted skills (all locked at top)
    raceAutoGrantedSkills.forEach(skill => {
        const source = userSelection.raceAutoGrantSources[skill] || 'Race';
        html += `<label class="checkbox-item locked" 
            data-tooltip-id="${skill}" 
            data-tooltip-type="proficiency"
            data-origin="${source}"
            ><input type="checkbox" checked disabled>${skill} 🔒</label>`;
    });
    
    // Class options (user picks)
    skillOptions.forEach(skill => {
        const isSel = userSelection.selectedSkills.includes(skill.name);
        const isRaceAuto = raceAutoGrantedSkills.includes(skill.name);
        const isDis = !isSel && !isRaceAuto && currentUserPicks >= maxSkills;
        if (!isRaceAuto) {  // Don't show race auto-granted twice
            html += `<label class="checkbox-item ${isDis ? 'disabled' : ''} ${isSel ? 'selected' : ''}" 
                data-tooltip-id="${skill.name}" 
                data-tooltip-type="proficiency"
                ><input type="checkbox" ${isSel ? 'checked' : ''} ${isDis ? 'disabled' : ''} onchange="toggleSkill('${skill.name}')">${skill.name}</label>`;
        }
    });
    html += '</div>';
    
    // Note: +1 Proficiency from race just increases maxSkills above, no separate block needed
    
    // ===== CONSOLIDATED ARMOR BLOCK =====
    const allArmor = [];
    const armorSources = {};  // { "light": "Class: Fighter", "shields": "Race: Dwarf - Dwarven Armor Training" }
    
    // Class armor
    if (profs.armor) {
        profs.armor.forEach(a => {
            if (!allArmor.includes(a)) {
                allArmor.push(a);
                armorSources[a] = `Class: ${classData.name}`;
            }
        });
    }
    
    // Race armor from featureChoices (proficiencyType: "armor")
    Object.entries(userSelection.featureChoices || {}).forEach(([key, choice]) => {
        if (choice?.type === 'proficiency' && choice?.proficiencyType === 'armor') {
            const selected = choice.selected?.filter(s => s !== null) || [];
            const granted = selected.length > 0
                ? selected
                : (choice.count === (choice.options?.length || 0) ? (choice.options || []) : []);

            granted.forEach(opt => {
                if (!allArmor.includes(opt)) {
                    allArmor.push(opt);
                }
                // Track source: use feature name for tooltip
                const raceName = window.racesData?.[userSelection.race]?.name || userSelection.race;
                const featureLabel = choice.featureName || key;
                if (!armorSources[opt]) {
                    armorSources[opt] = `Race: ${raceName} - ${featureLabel}`;
                }
            });
        }
    });
    
    if (allArmor.length > 0) {
        html += `<div class="section-header">Armor</div><div class="checkbox-grid">`;
        allArmor.forEach(armor => {
            const source = armorSources[armor] || 'Unknown';
            const isClassSource = source.startsWith('Class:');
            html += `<label class="checkbox-item locked" 
                data-tooltip-id="${armor}" 
                data-tooltip-type="proficiency" 
                data-origin="${source}"
                ><input type="checkbox" checked disabled>${armor} ${isClassSource ? '🔒' : '🔒'}</label>`;
        });
        html += '</div>';
    }
    
    // ===== CONSOLIDATED WEAPONS BLOCK =====
    const allWeapons = [];
    const weaponSources = {};
    
    // Class weapons
    if (profs.weapons) {
        profs.weapons.forEach(w => {
            if (!allWeapons.includes(w)) {
                allWeapons.push(w);
                weaponSources[w] = `Class: ${classData.name}`;
            }
        });
    }
    
    // Race weapons from featureChoices (proficiencyType: "weapon")
    Object.entries(userSelection.featureChoices || {}).forEach(([key, choice]) => {
        if (choice?.type === 'proficiency' && choice?.proficiencyType === 'weapon') {
            const selected = choice.selected?.filter(s => s !== null) || [];
            const granted = selected.length > 0
                ? selected
                : (choice.count === (choice.options?.length || 0) ? (choice.options || []) : []);

            granted.forEach(opt => {
                if (!allWeapons.includes(opt)) {
                    allWeapons.push(opt);
                }
                const raceName = window.racesData?.[userSelection.race]?.name || userSelection.race;
                const featureLabel = choice.featureName || key;
                if (!weaponSources[opt]) {
                    weaponSources[opt] = `Race: ${raceName} - ${featureLabel}`;
                }
            });
        }
    });
    
    if (allWeapons.length > 0) {
        html += `<div class="section-header">Weapons</div><div class="checkbox-grid">`;
        allWeapons.forEach(weapon => {
            const source = weaponSources[weapon] || 'Unknown';
            const isClassSource = source.startsWith('Class:');
            html += `<label class="checkbox-item locked" 
                data-tooltip-id="${weapon}" 
                data-tooltip-type="proficiency" 
                data-origin="${source}"
                ><input type="checkbox" checked disabled>${weapon} ${isClassSource ? '🔒' : '🔒'}</label>`;
        });
        html += '</div>';
    }

    // ===== SELECTABLE PROFICIENCY CHOICES (featureChoices) =====
    Object.entries(userSelection.featureChoices || {}).forEach(([key, choice]) => {
        if (choice?.type !== 'proficiency') return;

        const options = choice.options || [];
        if (options.length === 0) return;

        // Auto-granted sets (count === options.length) are already represented above.
        if ((choice.count || 0) >= options.length) return;

        const selectedItems = choice.selected?.filter(s => s !== null) || [];
        const canSelect = selectedItems.length < (choice.count || 1);
        const raceName = window.racesData?.[userSelection.race]?.name || userSelection.race;
        const featureLabel = choice.featureName || key;
        const source = `Race: ${raceName} - ${featureLabel}`;
        const choiceKeyArg = JSON.stringify(key);
        const profLabel = choice.proficiencyType ? `${choice.proficiencyType[0].toUpperCase()}${choice.proficiencyType.slice(1)}s` : 'Proficiencies';

        html += `<div class="section-header">${profLabel} (${selectedItems.length}/${choice.count || 1})</div><div class="checkbox-grid">`;
        options.forEach(item => {
            const isSelected = selectedItems.includes(item);
            const disabled = !canSelect && !isSelected ? 'disabled' : '';
            const itemArg = JSON.stringify(item);
            html += `<label class="checkbox-item ${isSelected ? 'selected' : ''} ${disabled}" 
                data-tooltip-id="${item}" 
                data-tooltip-type="proficiency" 
                data-origin="${source}"
                ><input type="checkbox" ${isSelected ? 'checked' : ''} ${disabled} data-choice-key=${choiceKeyArg} data-choice-value=${itemArg} data-choice-handler="feature-proficiency">${item}</label>`;
        });
        html += '</div>';
    });
    
    // Saving Throws
    if (profs.savingThrows?.length) {
        html += `<div class="section-header">Saves</div><div class="checkbox-grid">`;
        html += profs.savingThrows.map(s => `<label class="checkbox-item locked" data-tooltip-id="${s}" data-tooltip-type="saving-throw" data-origin="Class: ${classData.name}"><input type="checkbox" checked disabled>${s.toUpperCase().slice(0, 3)} 🔒</label>`).join('');
        html += '</div>';
    }
    
    // Note: +1 Proficiency from race increases maxSkills, handled above
    // No separate block needed for proficiency choices - just skill count adjustment
    
    // Helper to expand category to individual items (kept for Armor/Weapons if needed later)
    
    grid.innerHTML = html;
    bindFeatureProficiencyChoiceHandlers(grid);
    updateNextButton();
}

function bindFeatureProficiencyChoiceHandlers(root) {
    if (!root) return;
    root.querySelectorAll('input[data-choice-handler="feature-proficiency"]').forEach(input => {
        input.addEventListener('change', function() {
            const choiceKey = this.getAttribute('data-choice-key');
            const value = this.getAttribute('data-choice-value');
            if (!choiceKey || !value) return;
            selectFeatureChoice(choiceKey, value);
        });
    });
}

function renderFeaturesFeats() {
    const abilitiesGrid = document.getElementById('abilities-grid');
    const featsGrid = document.getElementById('feats-grid');

    if (abilitiesGrid) {
        let html = '';
        if (userSelection.race) {
            const race = window.racesData[userSelection.race];
            if (race?.raceAbilities) {
                html += `<div class="section-header">Race Abilities</div><div class="checkbox-grid">`;
                html += race.raceAbilities.map(a => {
                    return `<label class="checkbox-item locked" data-tooltip-id="${a}" data-tooltip-type="race-ability" data-origin="Race: ${race.name}"><input type="checkbox" checked disabled>${a} 🔒</label>`;
                }).join('');
                html += '</div>';
            }
        }
        if (userSelection.class) {
            const cls = window.classesData[userSelection.class];
            const currentLvl = userSelection.lvl;
            
            // Collect ALL features from levels 1 to currentLevel
            let allFeatures = [];
            let levelsWithFeatures = [];
            for (let lvl = 1; lvl <= currentLvl; lvl++) {
                const lvlFeatures = cls?.features?.[lvl];
                if (lvlFeatures?.features) {
                    lvlFeatures.features.forEach((f, idx) => {
                        const override = getSubclassFeatureOverride(userSelection.class, lvl, idx);
                        if (override) {
                            const composite = `${kebabToTitle(override)} (${f})`;
                            allFeatures.push({ name: composite, tooltipId: kebabToTitle(override), level: lvl });
                        } else {
                            allFeatures.push({ name: f, level: lvl });
                        }
                    });
                    levelsWithFeatures.push(lvl);
                }
            }
            
            if (allFeatures.length > 0) {
                html += `<div class="section-header">Class Features (L${levelsWithFeatures.join(', ')})</div><div class="checkbox-grid">`;
                html += allFeatures.map(f => {
                    const tooltipId = f.tooltipId || f.name;
                    return `<label class="checkbox-item locked" data-tooltip-id="${tooltipId}" data-tooltip-type="ability" data-origin="Class: ${cls.name} (L${f.level})"><input type="checkbox" checked disabled>${f.name} (L${f.level}) 🔒</label>`;
                }).join('');
                html += '</div>';
            }

            // Subclass features gained from selected class options (progressive by level)
            const subclassFeatures = (characterSheet.features || [])
                .filter(f => f.source === 'subclass' && (f.level || 0) <= currentLvl)
                .sort((a, b) => (a.level || 0) - (b.level || 0));

            if (subclassFeatures.length > 0) {
                html += `<div class="section-header">Subclass Features</div><div class="checkbox-grid">`;
                html += subclassFeatures.map(f => {
                    const displayName = (f.name || '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                    return `<label class="checkbox-item locked" data-tooltip-id="${displayName}" data-tooltip-type="subclass-ability" data-origin="Class Option: ${f.sourceId} (L${f.level})"><input type="checkbox" checked disabled>${displayName} (L${f.level}) 🔒</label>`;
                }).join('');
                html += '</div>';
            }
            
            // Collect options from ALL levels (not just current)
            let allOptions = [];
            for (let lvl = 1; lvl <= currentLvl; lvl++) {
                const lvlFeatures = cls?.features?.[lvl];
                if (lvlFeatures?.options?.length) {
                    lvlFeatures.options.forEach(opt => {
                        allOptions.push({ ...opt, level: lvl });
                    });
                }
            }
            
            if (allOptions.length > 0) {
                // Group by exclusiveGroup
                const groupedOptions = {};
                allOptions.forEach(opt => {
                    if (!groupedOptions[opt.exclusiveGroup]) {
                        groupedOptions[opt.exclusiveGroup] = [];
                    }
                    groupedOptions[opt.exclusiveGroup].push(opt);
                });
                
                Object.entries(groupedOptions).forEach(([group, opts]) => {
                    html += `<div class="section-header">Choose: ${group}</div><div class="checkbox-grid">`;
                    html += opts.map(opt => {
                        const isSel = userSelection.selectedFeatureChoices[opt.exclusiveGroup] === opt.id;
                        return `<label class="checkbox-item ${isSel ? 'selected' : ''}" data-tooltip-id="${opt.name}" data-tooltip-type="class-option" data-origin="Class: ${cls.name} (L${opt.level})"><input type="checkbox" ${isSel ? 'checked' : ''} onchange="selectClassOption('${opt.exclusiveGroup}', '${opt.id}')">${opt.name} (L${opt.level})</label>`;
                    }).join('');
                    html += '</div>';
                });
            }
        }
        
            // Render terrain choices (e.g., Circle of the Land)
            Object.entries(userSelection.featureChoices || {}).forEach(([key, choice]) => {
                if (choice?.type !== 'terrain') return;
                const terrainNames = choice.optionNames || {};
                const selectedVal = choice.selected?.filter(s => s !== null)?.[0];
                const title = choice.featureName || 'Choose Terrain';
                html += `<div class="section-header">${title}</div><div class="checkbox-grid">`;
                html += choice.options.map(opt => {
                    const displayName = terrainNames[opt] || opt;
                    const isSel = selectedVal === opt;
                    return `<label class="checkbox-item ${isSel ? 'selected' : ''}" data-tooltip-id="Circle Spells Land" data-tooltip-type="subclass-ability"><input type="checkbox" ${isSel ? 'checked' : ''} onchange="selectFeatureChoice('${key}', '${opt}')">${displayName}</label>`;
                }).join('');
                html += '</div>';
            });

            // Render general choice features (maneuvers, disciplines, invocations, etc.)
            Object.entries(userSelection.featureChoices || {}).forEach(([key, choice]) => {
                if (choice?.type !== 'choice') return;
                if (!choice.options?.length) return;
                const selectedItems = (choice.selected || []).filter(s => s !== null);
                const canSelect = selectedItems.length < (choice.count || 1);
                const title = choice.featureName || 'Make a Selection';
                const choiceTypeLabels = {
                    'maneuver': 'Maneuvers',
                    'discipline': 'Elemental Disciplines',
                    'invocation': 'Eldritch Invocations',
                    'hunter-prey': 'Hunter\'s Prey',
                    'hunter-defense': 'Defensive Tactics',
                    'hunter-attack': 'Multiattack',
                    'hunter-superior': 'Superior Hunter\'s Defense',
                    'totem-spirit': 'Totem Spirit',
                    'totem-attunement': 'Totemic Attunement',
                    'resistance-type': 'Fiendish Resilience'
                };
                const sectionLabel = choiceTypeLabels[choice.choiceType] || title;
                html += `<div class="section-header">${sectionLabel} (${selectedItems.length}/${choice.count})</div><div class="checkbox-grid">`;
                choice.options.forEach(opt => {
                    const isSel = selectedItems.includes(opt);
                    const minLvl = choice.levelPrereqs?.[opt] || 0;
                    const meetsLvlReq = (userSelection.lvl || 1) >= minLvl;
                    const disabled = (!canSelect && !isSel) || !meetsLvlReq ? 'disabled' : '';
                    const tooltipType = choice.choiceType === 'maneuver' ? 'maneuver' : choice.choiceType === 'discipline' ? 'discipline' : choice.choiceType === 'invocation' ? 'invocation' : '';
                    const originText = !meetsLvlReq && minLvl > 0 ? `Requires level ${minLvl}` : sectionLabel;
                    const escKey = key.replace(/'/g, "\\'");
                    const escOpt = opt.replace(/'/g, "\\'");
                    html += `<label class="checkbox-item ${isSel ? 'selected' : ''} ${disabled}" 
                        data-tooltip-id="${opt.replace(/'/g, '&apos;')}" 
                        data-tooltip-type="${tooltipType}"
                        data-origin="${originText}"
                        ><input type="checkbox" ${isSel ? 'checked' : ''} ${disabled} onchange="selectFeatureChoice('${escKey}', '${escOpt}')">${opt}</label>`;
                });
                html += '</div>';
            });

        abilitiesGrid.innerHTML = html;
    }

    if (featsGrid) {
        const feats = Object.keys(window.descriptions?.feats || {});
        const maxFeats = (typeof getMaxFeatsAllowed === 'function')
            ? getMaxFeatsAllowed()
            : Math.floor((userSelection.lvl || 1) / 4);
        const note = document.getElementById('feats-note');
        if (note) note.textContent = maxFeats > 0 ? `Select ${maxFeats - userSelection.feats.length} feat(s)` : 'Feats at lvl 4, 8, 12, 16, 19';

        let html = `<div class="section-header">Feats (${userSelection.feats.length}/${maxFeats})</div>`;
        html += feats.map(feat => {
            const isSel = userSelection.feats.includes(feat);
            const isDis = !isSel && userSelection.feats.length >= maxFeats;
            const effect = window.featEffectsData?.effects?.[feat.toLowerCase()];
            const choiceUI = renderFeatStatChoice(feat, effect, isSel);
            return `<label class="checkbox-item ${isSel ? 'selected' : ''} ${isDis ? 'disabled' : ''}"
                data-tooltip-id="${feat}"
                data-tooltip-type="feat"
                data-origin="Feat"
                ><input type="checkbox" ${isSel ? 'checked' : ''} ${isDis ? 'disabled' : ''} onchange="toggleFeat('${feat}')">${feat}${choiceUI}</label>`;
        }).join('');
        featsGrid.innerHTML = html;
        bindFeatStatChoiceHandlers(featsGrid);
    }
    updateNextButton();
}

function renderSpellsStage() {
    const grid = document.getElementById('spells-grid');
    const msg = document.getElementById('spellcaster-message');
    const info = document.getElementById('spell-selection-info');
    if (!grid) return;
    
    const prepType = characterSheet.spellPreparationType;
    const spellListClass = characterSheet.spellListClass || userSelection.class;
    
    let html = '';
    
    // Innate Spells (render for ALL characters, including non-casters)
    if (characterSheet.innateSpells?.length > 0) {
        html += `<div class="section-header">Innate Spells</div><div class="checkbox-grid">`;
        characterSheet.innateSpells.forEach(spell => {
            const originAttr = spell.origin ? ` data-origin="${spell.origin}"` : '';
            html += `<label class="checkbox-item locked" data-tooltip-id="${spell.name}" data-tooltip-type="spell"${originAttr}><input type="checkbox" checked disabled>${spell.name} 🔒</label>`;
        });
        html += '</div>';
    }
    
    // Cantrip Choices (race, subclass, class)
    Object.entries(userSelection.featureChoices || {}).forEach(([key, choice]) => {
        if (choice?.type !== 'cantrips') return;
        if (!choice.options?.length) return;
        const selectedItems = (choice.selected || []).filter(s => s !== null);
        const title = choice.featureName || 'Cantrip';
        let originText;
        if (choice.source === 'race') {
            const raceName = userSelection.race ? (window.racesData?.[userSelection.race]?.name || userSelection.race) : 'Race';
            originText = `${title} - ${raceName}`;
        } else if (choice.source === 'subclass' || choice.source === 'class') {
            originText = `${title} (${choice.source})`;
        } else {
            originText = title;
        }
        html += `<div class="section-header">${title} (${selectedItems.length}/${choice.count})</div><div class="checkbox-grid">`;
        choice.options.forEach(cantrip => {
            const isSel = selectedItems.includes(cantrip);
            const isDis = !isSel && selectedItems.length >= (choice.count || 1);
            html += `<label class="checkbox-item ${isSel ? 'selected' : ''} ${isDis ? 'disabled' : ''}"
                data-tooltip-id="${cantrip}" data-tooltip-type="spell"
                data-origin="${originText}"
                ><input type="checkbox" ${isSel ? 'checked' : ''} ${isDis ? 'disabled' : ''} data-racial-cantrip-key="${key}" data-racial-cantrip-value="${cantrip.replace(/"/g, '&quot;')}">${cantrip}</label>`;
        });
        html += '</div>';
    });
    
    // Early return for non-casters — spells grid is done (innate/cantrip already rendered)
    if (!characterSheet.spellcastingAbility) {
        if (msg) { msg.textContent = 'Your class has no spellcasting.'; msg.style.display = 'block'; }
        if (info) info.style.display = 'none';
        grid.innerHTML = html;
        updateNextButton();
        return;
    }
    if (msg) msg.style.display = 'none';
    
    // Spell Slots
    const slots = characterSheet.spellSlots || {};
    const activeSlots = Object.entries(slots).filter(([_, count]) => count > 0);
    if (activeSlots.length > 0) {
        html += `<div class="section-header">Spell Slots</div><div class="spell-slots-row">`;
        activeSlots.forEach(([level, count]) => {
            html += `<div class="slot-group"><span class="slot-level">L${level}</span>`;
            for (let i = 0; i < count; i++) {
                html += `<span class="slot-pip"></span>`;
            }
            html += '</div>';
        });
        html += '</div>';
    }
    
    const innateCount = characterSheet.innateSpells?.length || 0;
    
    // Info line
    if (info) {
        info.style.display = 'block';
        let infoHtml = `<p><strong>Spellcasting:</strong> ${characterSheet.spellcastingAbility}`;
        if (prepType === 'known') infoHtml += ` | <strong>Spells Known:</strong> ${userSelection.selectedSpells.length}/${characterSheet.maxSpellsKnown}`;
        else if (prepType === 'spellbook') infoHtml += ` | <strong>Spellbook:</strong> ${userSelection.spellbookSpells.length} spells`;
        else if (prepType === 'prepare') {
            const castingMod = characterSheet.statModifiers?.[characterSheet.spellcastingAbility] || 0;
            const clsLevel = userSelection.lvl;
            const maxPrep = Math.max(0, clsLevel + castingMod);
            const prepCount = userSelection.preparedSpells.length;
            const displayText = innateCount > 0 ? `${prepCount}/${maxPrep} (+${innateCount} always prepared)` : `${prepCount}/${maxPrep}`;
            infoHtml += ` | <strong>Prepared:</strong> ${displayText}`;
        }
        infoHtml += ` | <strong>Save DC:</strong> ${characterSheet.spellSaveDC} | <strong>Attack:</strong> +${characterSheet.spellAttackMod}</p>`;
        info.innerHTML = infoHtml;
    }

    // Cantrip Selection
    const maxCantrips = characterSheet.maxCantripsKnown || 0;
    if (maxCantrips > 0) {
        const cantrips = getClassSpellList(spellListClass, 0);
        const selectedCount = userSelection.selectedCantrips.length;

        html += `<div class="section-header">Cantrips (${selectedCount}/${maxCantrips})</div><div class="checkbox-grid">`;
        cantrips.forEach(cantrip => {
            const isSel = userSelection.selectedCantrips.includes(cantrip);
            const isDis = !isSel && selectedCount >= maxCantrips;
            html += `<label class="checkbox-item ${isSel ? 'selected' : ''} ${isDis ? 'disabled' : ''}"
                data-tooltip-id="${cantrip}" data-tooltip-type="spell"
                ><input type="checkbox" ${isSel ? 'checked' : ''} ${isDis ? 'disabled' : ''} onchange="toggleCantrip('${cantrip.replace(/'/g, "\\'")}')">${cantrip}</label>`;
        });
        html += '</div>';
    }
    
    // Spell Selection
    const maxSpellLevel = Math.max(0, ...Object.entries(slots).filter(([_, c]) => c > 0).map(([l]) => parseInt(l)));
    if (maxSpellLevel > 0 || prepType === 'spellbook') {
        const allSpells = [];
        for (let lvl = 1; lvl <= maxSpellLevel; lvl++) {
            const spells = getClassSpellList(spellListClass, lvl);
            spells.forEach(s => allSpells.push({ name: s, level: lvl }));
        }
        
        if (prepType === 'spellbook') {
            const selectedCount = userSelection.spellbookSpells.length;
            html += `<div class="section-header">Spellbook Spells (${selectedCount} spells)</div>`;
            
            for (let lvl = 1; lvl <= 9; lvl++) {
                const levelSpells = allSpells.filter(s => s.level === lvl);
                if (levelSpells.length === 0) continue;
                
                html += `<div class="subsection-header">Level ${lvl}</div><div class="checkbox-grid">`;
                levelSpells.forEach(spell => {
                    const isSel = userSelection.spellbookSpells.includes(spell.name);
                    html += `<label class="checkbox-item ${isSel ? 'selected' : ''}" 
                        data-tooltip-id="${spell.name}" data-tooltip-type="spell"
                        ><input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSpell('${spell.name.replace(/'/g, "\\'")}')">${spell.name}</label>`;
                });
                html += '</div>';
            }
        } else if (prepType === 'known') {
            const maxSpells = characterSheet.maxSpellsKnown || 0;
            const selectedCount = userSelection.selectedSpells.length;
            html += `<div class="section-header">Spells Known (${selectedCount}/${maxSpells})</div>`;
            
            for (let lvl = 1; lvl <= maxSpellLevel; lvl++) {
                const levelSpells = allSpells.filter(s => s.level === lvl);
                if (levelSpells.length === 0) continue;
                
                html += `<div class="subsection-header">Level ${lvl}</div><div class="checkbox-grid">`;
                levelSpells.forEach(spell => {
                    const isSel = userSelection.selectedSpells.includes(spell.name);
                    const isDis = !isSel && selectedCount >= maxSpells;
                    html += `<label class="checkbox-item ${isSel ? 'selected' : ''} ${isDis ? 'disabled' : ''}" 
                        data-tooltip-id="${spell.name}" data-tooltip-type="spell"
                        ><input type="checkbox" ${isSel ? 'checked' : ''} ${isDis ? 'disabled' : ''} onchange="toggleSpell('${spell.name.replace(/'/g, "\\'")}')">${spell.name}</label>`;
                });
                html += '</div>';
            }
        } else if (prepType === 'prepare') {
            const castingMod = characterSheet.statModifiers?.[characterSheet.spellcastingAbility] || 0;
            const clsLevel = userSelection.lvl;
            const maxPrep = Math.max(0, clsLevel + castingMod);
            const selectedCount = userSelection.preparedSpells.length;
            html += `<div class="section-header">Prepared Spells (${selectedCount}/${maxPrep})</div>`;
            
            for (let lvl = 1; lvl <= maxSpellLevel; lvl++) {
                const levelSpells = allSpells.filter(s => s.level === lvl);
                if (levelSpells.length === 0) continue;
                
                html += `<div class="subsection-header">Level ${lvl}</div><div class="checkbox-grid">`;
                levelSpells.forEach(spell => {
                    const isSel = userSelection.preparedSpells.includes(spell.name);
                    html += `<label class="checkbox-item ${isSel ? 'selected' : ''}" 
                        data-tooltip-id="${spell.name}" data-tooltip-type="spell"
                        ><input type="checkbox" ${isSel ? 'checked' : ''} onchange="toggleSpell('${spell.name.replace(/'/g, "\\'")}')">${spell.name}</label>`;
                });
                html += '</div>';
            }
        }
    }
    
    grid.innerHTML = html;
    bindRacialCantripHandlers(grid);
    updateNextButton();
}

function bindRacialCantripHandlers(root) {
    if (!root) return;
    root.querySelectorAll('input[data-racial-cantrip-key]').forEach(input => {
        input.addEventListener('change', function() {
            const key = this.getAttribute('data-racial-cantrip-key');
            const value = this.getAttribute('data-racial-cantrip-value');
            if (!key || !value) return;
            selectFeatureChoice(key, value);
        });
    });
}

function renderSavedCharactersList() {
    const list = document.getElementById('character-list');
    if (!list) return;
    const saved = getAllSaved();
    if (saved.length === 0) { list.innerHTML = '<p>No saved characters yet.</p>'; return; }
    if (saved.length === 0) { list.innerHTML = '<p>No saved characters yet.</p><div style="margin-top:12px"><button class="btn-secondary" onclick="openGlossary()">Glossary</button></div>'; return; }
    list.innerHTML = saved.map((c, i) => {
        const raceName = window.racesData?.[c.race]?.name || c.race || 'Unknown';
        const className = window.classesData?.[c.class]?.name || c.class || 'Unknown';
        const safeName = String(c.name || 'Unnamed').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        const safeRace = String(raceName).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        const safeClass = String(className).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
        return `
        <div class="character-item" data-index="${i}">
            <div><strong>${safeName}</strong> <span>- Lvl ${c.lvl} ${safeRace}</span> <span>[${safeClass}]</span></div>
            <div style="display:flex;gap:8px;">
                <button class="view-btn" onclick="viewCharacter(${i})">View</button>
                <button class="delete-btn" onclick="confirmDelete(${i})">Delete</button>
            </div>
        </div>
    `;}).join('');
    list.innerHTML += '<div style="margin-top:12px"><button class="btn-secondary" onclick="openGlossary()">Glossary</button></div>';
}

function updateNextButton() {
    const stage = UIState.currentStage;
    let btnId = '';
    
    if (stage === 1) btnId = 'btn-choose-race-next';
    else if (stage === 2) btnId = 'btn-choose-class-next';
    else if (stage === 3) btnId = 'btn-ability-scores-next';
    else if (stage === 4) btnId = 'btn-proficiencies-next';
    else if (stage === 5) btnId = 'btn-features-feats-next';
    else return;
    
    const btn = document.getElementById(btnId);
    if (btn) btn.disabled = !canProceed();
}

window.renderWelcome = renderWelcome;
window.renderChooseRace = renderChooseRace;
window.renderSubraces = renderSubraces;
window.renderChooseClass = renderChooseClass;
window.renderAbilityScores = renderAbilityScores;
window.renderProficienciesStage = renderProficienciesStage;
window.renderFeaturesFeats = renderFeaturesFeats;
window.renderSpellsStage = renderSpellsStage;
window.renderSavedCharactersList = renderSavedCharactersList;
window.updateNextButton = updateNextButton;
