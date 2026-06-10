/**
 * Renders a full read-only character sheet from a saved character record.
 * @param {Object} savedChar - The character as stored in localStorage.
 *   Shape: { name, lvl, race, subrace, class, selection, sheet }
 *   where `sheet` is the post-recalc characterSheet snapshot.
 * @returns {string} HTML string
 */
function renderCharacterSheet(savedChar) {
    const c = savedChar;
    const s = c.sheet || {};
    const sel = c.selection || {};
    const stats = s.stats || {};
    const mods = s.statModifiers || {};
    const profs = s.proficiencies || {};
    const vision = s.vision || {};
    const features = s.features || [];
    const feats = sel.feats || [];
    const slots = s.spellSlots || {};

    const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
    const modStr = (n) => (n >= 0 ? '+' : '') + n;
    const listOrDash = (arr) => (arr && arr.length) ? arr.join(', ') : '—';
    const titleCase = (str) => str ? str.split(/[\s-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';

    const raceName = window.racesData?.[c.race]?.name || titleCase(c.race);
    const classDef = window.classesData?.[c.class];
    const className = classDef?.name || titleCase(c.class);
    const subraceName = c.subrace ? (window.racesData?.[c.race]?.subraces?.[c.subrace]?.name || titleCase(c.subrace)) : '';
    const subclassName = sel.subclass ? titleCase(sel.subclass) : (s.subclass ? titleCase(s.subclass) : '');

    const profBonus = c.lvl ? Math.floor((c.lvl - 1) / 4) + 2 : 2;

    const statOrder = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

    const raceFeatures = features.filter(f => f.source === 'race');
    const classFeatures = features.filter(f => f.source === 'class');
    const subclassFeatures = features.filter(f => f.source === 'subclass');
    const otherFeatures = features.filter(f => !['race', 'class', 'subclass'].includes(f.source));

    const savingThrowsList = statOrder.map(st => ({
        stat: st,
        proficient: (profs.savingThrows || []).includes(st)
    }));

    const allSkills = []; // unused, kept for backward compat

    let html = '';

    html += `<div class="cs-header">`;
    html += `<h2>${esc(c.name) || 'Unnamed Character'}</h2>`;
    html += `<div class="cs-subheader">`;
    html += `<span><strong>Race:</strong> ${esc(raceName)}${subraceName ? ' (' + esc(subraceName) + ')' : ''}</span> `;
    html += `<span><strong>Class:</strong> ${esc(className)}${subclassName ? ' (' + esc(subclassName) + ')' : ''}</span> `;
    html += `<span><strong>Level:</strong> ${c.lvl || 1}</span>`;
    html += `</div></div>`;

    html += `<div class="cs-section">`;
    html += `<h3>Ability Scores</h3>`;
    html += `<div class="cs-stats">`;
    for (const st of statOrder) {
        html += `<div class="cs-stat">`;
        html += `<div class="cs-stat-label">${st.slice(0, 3).toUpperCase()}</div>`;
        html += `<div class="cs-stat-value">${stats[st] ?? 10}</div>`;
        html += `<div class="cs-stat-mod">${modStr(mods[st] ?? 0)}</div>`;
        html += `</div>`;
    }
    html += `</div></div>`;

    html += `<div class="cs-section">`;
    html += `<h3>Combat</h3>`;
    html += `<div class="cs-combat-grid">`;
    html += `<div><strong>HP:</strong> ${s.maxHp ?? 0}</div>`;
    html += `<div><strong>AC:</strong> ${s.armorClass ?? 10}</div>`;
    html += `<div><strong>Speed:</strong> ${s.speed ?? 30} ft</div>`;
    html += `<div><strong>Initiative:</strong> ${modStr(s.initiative ?? 0)}</div>`;
    html += `<div><strong>Prof. Bonus:</strong> +${profBonus}</div>`;
    if (vision.nightvision) html += `<div><strong>Darkvision:</strong> ${vision.nightvision} ft</div>`;
    html += `</div></div>`;

    html += `<div class="cs-section">`;
    html += `<h3>Saving Throws</h3>`;
    html += `<div class="cs-list">`;
    html += savingThrowsList.map(st =>
        `<span class="${st.proficient ? 'cs-proficient' : ''}">${st.proficient ? '●' : '○'} ${titleCase(st.stat)}</span>`
    ).join(', ');
    html += `</div></div>`;

    html += `<div class="cs-section">`;
    html += `<h3>Skills</h3>`;
    html += `<div class="cs-list cs-skills">`;
    html += (profs.skills || []).map(sk => `<span class="cs-proficient">${titleCase(sk)}</span>`).join(', ') || '<em>None</em>';
    html += `</div></div>`;

    html += `<div class="cs-section">`;
    html += `<h3>Proficiencies</h3>`;
    html += `<div><strong>Armor:</strong> ${listOrDash(profs.armor)}</div>`;
    html += `<div><strong>Weapons:</strong> ${listOrDash(profs.weapons)}</div>`;
    html += `<div><strong>Tools:</strong> ${listOrDash(profs.tools)}</div>`;
    html += `<div><strong>Languages:</strong> ${listOrDash(s.languages)}</div>`;
    html += `</div>`;

    if (features.length) {
        html += `<div class="cs-section">`;
        html += `<h3>Features</h3>`;
        const renderFeatGroup = (label, list) => {
            if (!list.length) return '';
            let out = `<div class="cs-feature-group"><strong>${label}:</strong><ul>`;
            for (const f of list) {
                const lvl = f.level ? ` <em>(L${f.level})</em>` : '';
                out += `<li>${esc(f.name)}${lvl}</li>`;
            }
            return out + `</ul></div>`;
        };
        html += renderFeatGroup('Race Abilities', raceFeatures);
        html += renderFeatGroup('Class Features', classFeatures);
        html += renderFeatGroup('Subclass Features', subclassFeatures);
        html += renderFeatGroup('Other', otherFeatures);
        html += `</div>`;
    }

    if (feats.length) {
        html += `<div class="cs-section">`;
        html += `<h3>Feats</h3>`;
        html += `<ul>`;
        for (const f of feats) html += `<li>${esc(f)}</li>`;
        html += `</ul></div>`;
    }

    if (s.spellcastingAbility) {
        html += `<div class="cs-section">`;
        html += `<h3>Spellcasting</h3>`;
        html += `<div><strong>Ability:</strong> ${titleCase(s.spellcastingAbility)}</div>`;
        html += `<div><strong>Save DC:</strong> ${s.spellSaveDC || 0}</div>`;
        html += `<div><strong>Attack Mod:</strong> ${modStr(s.spellAttackMod || 0)}</div>`;
        html += `<div><strong>Preparation:</strong> ${s.spellPreparationType || '—'}</div>`;
        html += `<div><strong>Progression:</strong> ${s.spellProgression || '—'}</div>`;
        html += `</div>`;

        const hasSlots = Object.values(slots).some(v => v > 0);
        if (hasSlots) {
            html += `<div class="cs-section">`;
            html += `<h3>Spell Slots</h3>`;
            html += `<div class="cs-slots">`;
            for (let i = 1; i <= 9; i++) {
                const n = slots[i] || 0;
                html += `<div class="cs-slot ${n ? 'cs-slot-full' : ''}"><div class="cs-slot-lvl">${i}</div><div class="cs-slot-n">${n}</div></div>`;
            }
            html += `</div></div>`;
        }

        const renderSpellList = (label, list, max) => {
            if (!list || !list.length) return '';
            const maxStr = max != null && max >= 0 ? ` (max ${max}${max === -1 ? ' = unlimited' : ''})` : '';
            let out = `<div class="cs-section"><h3>${label}${maxStr}</h3><ul>`;
            for (const name of list) {
                out += `<li>${esc(name)}</li>`;
            }
            return out + `</ul></div>`;
        };
        html += renderSpellList('Cantrips Known', sel.selectedCantrips, s.maxCantripsKnown);
        html += renderSpellList('Spells Known', sel.selectedSpells, s.maxSpellsKnown);
        html += renderSpellList('Spellbook', sel.spellbookSpells, null);
        html += renderSpellList('Prepared Spells', sel.preparedSpells, null);
        html += renderSpellList('Innate Spells', (s.innateSpells || []).map(sp => typeof sp === 'string' ? sp : sp.name), null);
    }

    return html;
}

window.renderCharacterSheet = renderCharacterSheet;
