# DND App Architecture

## 1. File System Layout

```
data/
  classes/          Class progression tables (12 files, one per class)
  races/            Race definitions (9 files, one per race)
  spells/           Spell lists by school of magic (8 files)
  effects/          Machine-readable game mechanics (5 files)
  descriptions/     Human-readable display text (12 files)

js/
  app.js                     Init/startup
  renderdebug.js             Debug panel
  states/
    DataLoaders.js           JSON loading, builds window.* globals
    UIState.js               Navigation and stage routing
    UserSelectedState.js     User intent state + action handlers
  character/
    CharacterSheet.js        Derived/calculated sheet model
    CharacterStorage.js      localStorage save/load
  effects/
    EffectHandler.js         Central effect processor + dispatch
    RecalculationFlags.js    Full recalc engine (22 steps)
  render/
    Render.js                Stage renderers (6 stages)
    ViewCharacterSheet.js    Read-only sheet output
    TooltipSystem.js         Hover tooltips
  glossary/
    GlossaryData.js          Glossary data retrieval layer
    GlossaryUI.js            Glossary overlay UI

css/
  theme.css                  Single stylesheet

index.html                   Main entry point (loads scripts in order)
test.html                    Browser-based smoke tests
tools/
  validate-features.py       Python validation (7 checks)
```

### 1.1 Data Directory — What Each File Contains

#### `data/classes/{id}.json` — One per class
Defines progression tables, proficiencies, and spellcasting.
Required fields: `id`, `name`, `primaryStat`, `hitDie`, `hitPoints`, `proficiencies`, `features` (level-by-level map of feature names and option selectors).
Optional fields: `spellcastingAbility`, `spellSlotTable`, `cantrips known`, `spells known`, `spellList`, `spells prepared`, `multiclassRequirement`.

#### `data/races/{id}.json` — One per race
Required: `id`, `name`, `size`, `speed`, `languages`, `bonuses`, `raceAbilities`.
Optional: `subraces` (object mapping subrace name to `{ bonuses, raceAbilities, languages? }`).

#### `data/spells/{school}.json` — One per school (8 total)
Array of spell objects keyed by school name. Each: `name`, `ritual`, `casttime`, `range`, `components`, `duration`, `description`.

#### `data/effects/*.json` — 5 effect files
- `race-effects.json` — racial feature mechanics
- `class-effects.json` — class feature mechanics + invocation definitions
- `subclass-effects.json` — subclass feature mechanics + discipline/maneuver definitions
- `feat-effects.json` — feat mechanics
- `class-option-effects.json` — class option definitions (subclasses, fighting styles, etc.)

Each effect file has `"effects": { "key": { "type": "...", ... } }`. Class options file has `"options": { "id": { "displayName": "...", "type": "...", "features": { ... } } }`.

#### `data/descriptions/*.json`
Flat key-value maps. Files: `class-abilities.json`, `subclass-abilities.json`, `race-abilities.json`, `feats.json`, `class-options.json`, `invocations.json`, `disciplines.json`, `maneuvers.json`, `proficiencies.json`, `stats.json`, `statLabels.json`, `exclusive-groups.json`.

---

## 2. Application Lifecycle

### 2.1 Startup (Data Loading)

`index.html` loads 14 JS files in dependency order, then `initApp()` in `app.js`:

1. **`loadAllGameData()`** loads 45 JSON files in parallel via `Promise.all`:
   - 9 races → `window.racesData`
   - 12 classes → `window.classesData`
   - 8 spell schools → `window.allSpells`
   - 5 effect files → `window.*EffectsData`
   - 12 descriptions → `window.descriptions`

2. **`initTooltips()`** — mouseover/mouseout listeners for `[data-tooltip-id]`

3. **`initializeUI()`** — welcome screen, saved characters, event listeners

### 2.2 Two-State Model

- **`userSelection`** (UserSelectedState.js) — user's raw choices (race, class, stats, skills, feats, featureChoices)
- **`characterSheet`** (CharacterSheet.js) — fully computed output (stats with bonuses, HP, proficiencies, spell slots, resistances, etc.)

`characterSheet` is rebuilt from scratch on every recalc. Render functions read only from it.

### 2.3 Main Loop

```
User action → handler updates userSelection → triggerRecalc() → recalcAll() (22 steps) → characterSheet rebuilt → render functions redraw UI
```

`recalcAll()` steps in dependency order:
```
recalcRaceEffects → recalcClassBase → recalcFeatures
→ clearRemovedFeatureSelections → recalcChoices
→ recalcProficiencies → recalcKnownCantrips
→ recalcStats → recalcStatModifiers
→ recalcMaxHp → recalcVision → recalcSpeed
→ recalcSpellcasting → recalcSpellSlots → recalcInnateSpells
→ recalcFeats → recalcCantrips → recalcMaxSpells
→ recalcSavingThrows → recalcResistances
```

### 2.4 The 6 Wizard Stages

| Stage | Function | What Happens |
|-------|----------|-------------|
| 0 Welcome | `renderWelcome()` | Saved character list, create new |
| 1 Race | `renderChooseRace()` | Race cards, subrace selector |
| 2 Class | `renderChooseClass()` | Class cards, level selector |
| 3 Abilities | `renderAbilityScores()` | 27-point buy, race bonuses, stat choices |
| 4 Proficiencies | `renderProficienciesStage()` | Skill picks, locked armor/weapons |
| 5 Features & Feats | `renderFeaturesFeats()` | Subclass selectors, choices, feats |
| 6 Spells | `renderSpellsStage()` | Cantrip picks, spells |

### 2.5 Effect Dispatch

`EffectHandler.processFeature(feature)` looks up effect by name+source, reads `type`, dispatches:

| Type | Effect |
|------|--------|
| `vision` | Sets darkvision/dayvision range |
| `speed` | Adds speed bonus |
| `stat` | Applies stat bonuses via `recalcStats()` |
| `proficiency` | Grants skill/armor/weapon/tool proficiencies |
| `cantrips` | Processed in `recalcKnownCantrips()` |
| `mainspell` | Sets spellcasting ability, progression, slots |
| `innate` | Grants innate spells |
| `resistance`/`immunity`/`vulnerability` | Appends to sheet arrays |
| `savingThrow` | Save proficiency or advantage |
| `feat` | Grants feat capacity |
| `maxHP` | Flat or per-level HP bonus |
| `choice` | Creates featureChoices entries |
| `lookup` | No-op (description only) |
| `none` | No-op (completely inert) |

---

## 3. Adding Content — Complete Guide

### 3.1 Adding a New Class

**Create `data/classes/{id}.json`** with:
- `id` (matches filename), `name`, `primaryStat`, `hitDie`, `hitPoints`
- `proficiencies`: armor, weapons, tools, savingThrows, skills (with count + options)
- `features`: level-by-level map `"N": { "features": ["Name", ...], "options": [{"id", "name", "exclusiveGroup"}, ...] }`
- Optional: `spellcastingAbility`, `spellSlotTable`, `cantrips known`, `spellList`, `spells known`/`spells prepared`, `multiclassRequirement`

**Add effects** for each feature name:
- Class features → `class-effects.json`
- Subclass features → `subclass-effects.json`
- Class option definitions → `class-option-effects.json`

**Add descriptions** in matching description files.

**Register in `DataLoaders.js`** (hardcoded class ID array, line 9).

### 3.2 Adding a New Race

**Create `data/races/{id}.json`** with:
- `id`, `name`, `desc`, `size`, `speed`, `languages`, `bonuses` (stat bonuses), `raceAbilities` (feature name strings)
- Optional: `subraces` key → `{ "Name": { bonuses: {}, raceAbilities: [], languages?: [] } }`

**Add effects** in `race-effects.json`. Each `raceAbilities` entry needs an effect key.

**Add descriptions** in `race-abilities.json`.

**Register in `DataLoaders.js`** (hardcoded race ID array, line 8).

### 3.3 Adding a Subrace

Add key to parent race's `subraces`. Fields: `bonuses` (stacks), `raceAbilities` (added), `languages` (replaces parent).

### 3.4 Adding a Feature

Each feature name used in class `features` or race `raceAbilities` needs:

1. **Effect entry** in matching JSON with lowercased-hyphenated key and `"type": "..."`:
   - `proficiency`: proficiencyType + options + count
   - `stat`: options + value + count
   - `vision`: value.nightvision or value.dayvision
   - `speed`: value (bonus feet)
   - `resistance`/`immunity`/`vulnerability`: damageType
   - `savingThrow`: saveType + effect ("advantage"/"proficiency")
   - `cantrips`: count + ability + optional class/spellList
   - `innate`: spellLevels + ability + optional terrainSpells
   - `mainspell`: optional spellcasting object for third-casters
   - `maxHP`: value ("lvl") or perLevel (number)
   - `feat`: count + optional options
   - `skill`: count
   - `language`: languages array
   - `choice`: choiceType + options + count + levelPrereqs
   - `lookup`: no extra fields
   - `none`: no extra fields

2. **Description entry** in the matching description file (key = exact display name)

### 3.5 Adding a Feat

- Description → `feats.json`
- Effect → `feat-effects.json` (lowercase key, type: stat/proficiency/skill/maxHP/lookup)

### 3.6 Adding a Spell

- Spell data → `data/spells/{school}.json`
- Add to class spell list → class JSON's `spellList` under correct level

### 3.7 Naming Conventions

- Display names: `Title Case With Spaces`
- Effect keys: `lowercase-with-hyphens`
- Description keys: exact match to display name
- Class option IDs: camelCase

### 3.8 Validation

`python3 tools/validate-features.py` — 7 checks: unknown types, glossary coverage, option cross-refs, level prereqs, duplicate keys, class-feature mapping, description coverage.
