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
Array of spell objects keyed by school name. Each spell: `name`, `ritual`, `casttime`, `range`, `components`, `duration`, `description`.

#### `data/effects/race-effects.json`
Racial feature mechanics. Key: feature name (lowercase, hyphen-separated). Value: effect object with `type` + type-specific fields.

#### `data/effects/class-effects.json`
Class feature mechanics + invocation definitions with `levelPrereqs`.

#### `data/effects/subclass-effects.json`
Subclass feature mechanics + discipline/maneuver definitions.

#### `data/effects/feat-effects.json`
Feat mechanics. Key: feat name (lowercase). Value: effect object.

#### `data/effects/class-option-effects.json`
Class option definitions (subclasses, fighting styles, metamagic, pact boons).
Top-level key `"options"` maps option IDs to `{ displayName, type ("progressive"|"none"), features: {level: [effectIds]} }`.

#### `data/descriptions/*.json`
Flat key-value maps of human-readable text. Files: `class-abilities.json`, `subclass-abilities.json`, `race-abilities.json`, `feats.json`, `class-options.json`, `invocations.json`, `disciplines.json`, `maneuvers.json`, `proficiencies.json`, `stats.json`, `statLabels.json`, `exclusive-groups.json`.

---

## 2. Application Lifecycle

### 2.1 Startup (Data Loading)

`index.html` loads 14 JS files in dependency order, then `initApp()` in `app.js`:

1. **`loadAllGameData()`** loads 45 JSON files in parallel via `Promise.all`:
   - 9 races → indexed into `window.racesData`
   - 12 classes → indexed into `window.classesData`
   - 8 spell schools → merged into `window.allSpells`
   - 5 effect files → stored as `window.{source}EffectsData`
   - 12 descriptions → merged into `window.descriptions`

2. **`initTooltips()`** — mouseover/mouseout listeners for `[data-tooltip-id]` elements

3. **`initializeUI()`** — welcome screen, saved characters, event listeners

### 2.2 Two-State Model

Two global objects represent the character:

#### `userSelection` (UserSelectedState.js) — mutable user intent
```javascript
{ name, lvl, race, subrace, class, subclass, stats, selectedSkills, feats, featureChoices, ... }
```

#### `characterSheet` (CharacterSheet.js) — computed output
```javascript
{ name, stats, statModifiers, maxHp, speed, proficiencies, features, feats, resistances, spellSlots, ... }
```
Rebuilt from scratch on every recalc. Render functions read only from this.

### 2.3 Main Loop

```
User action → handler updates userSelection → triggerRecalc()
→ recalcAll() (22 steps in dependency order)
→ characterSheet fully rebuilt
→ stage render function redraws UI
→ debug panel auto-refreshes
```

`recalcAll()` steps:
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

| Stage | Render Function | What Happens |
|-------|----------------|--------------|
| 0 Welcome | `renderWelcome()` | Saved character list, create new |
| 1 Race | `renderChooseRace()` | Race cards, subrace selector |
| 2 Class | `renderChooseClass()` | Class cards, level selector |
| 3 Abilities | `renderAbilityScores()` | 27-point buy, race bonuses, stat choices |
| 4 Proficiencies | `renderProficienciesStage()` | Skill picks, locked armor/weapons |
| 5 Features & Feats | `renderFeaturesFeats()` | Subclass selectors, choices, feats |
| 6 Spells | `renderSpellsStage()` | Cantrip picks, spells |

### 2.5 Effect Dispatch

`EffectHandler.processFeature(feature)` looks up effect by name+source, reads its `type`, dispatches to the registered handler:

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
| `choice` | Creates featureChoices entries for user selection |
| `lookup` | No-op — description only, no mechanical effect |
| `none` | No-op — option-type marker, completely inert |

---

## 3. Adding Content — Complete Guide

### 3.1 Adding a New Class

**Step 1: Create `data/classes/{id}.json`**

Structure:
```javascript
{
  "id": "artificer",                              // MUST match filename stem
  "name": "Artificer",                             // Display name
  "primaryStat": "intelligence",                   // For class card display
  "spellcastingAbility": "intelligence",           // For spell DC calculations
  "desc": "Masters of magical invention",          // Hover tooltip
  "hitDie": 8,                                     // Determines HP per level
  "hitPoints": {"1": "hitDie + CON", "perLevel": "1d HitDie + CON"},
  "multiclassRequirement": { "stat": "intelligence", "min": 13 },  // Optional
  "proficiencies": {
    "armor": ["light", "medium"],                  // Armor types
    "weapons": ["simple weapons"],                 // Weapon types
    "tools": ["thieves' tools"],
    "savingThrows": ["intelligence", "wisdom"],    // Must have exactly 2
    "skills": {
      "count": 2,                                  // How many the player picks
      "options": [{"name": "Arcana"}, {"name": "History"}, ...]
    }
  },
  "features": {
    "1": {
      "features": ["Spellcasting", "Infusions"],   // Feature names → effect keys
      "options": [                                  // Subclass selectors
        {"id": "alchemist", "name": "Alchemist", "exclusiveGroup": "Artificer Specialist"}
      ]
    },
    "2": { "features": ["Infusion Improvement"], "options": [] },
    // ... levels 3-20 — each level key must exist even if empty
  },
  "spellSlotTable": {                               // Optional — omit if non-caster
    "1": {"1": 2}, "2": {"1": 2},
    "3": {"1": 2, "2": 2}, ...                       // level → {slotLevel: slotCount}
  },
  "cantrips known": { "1": 2, ... },               // Optional
  "spellList": {                                    // Optional
    "0": ["Cure Wounds", "Fire Bolt", ...],         //   "0" = cantrips
    "1": ["Absorb Elements", ...],
    ...
  },
  "spells known": "Known",                          // "Known", "Spellbook", or "Prepared"
  "spells prepared": "INT + artificer level"        // Only for Prepared casters
}
```

**Step 2: Add effect entries**
- Class features → `data/effects/class-effects.json`
- Subclass features → `data/effects/subclass-effects.json`
- Class option definitions → `data/effects/class-option-effects.json`

**Step 3: Add descriptions**
- Class features → `data/descriptions/class-abilities.json`
- Subclass abilities → `data/descriptions/subclass-abilities.json`
- Class options → `data/descriptions/class-options.json`

**Step 4: Register in `DataLoaders.js`** — add `{id}` to the hardcoded class ID array.

**Step 5 (casters):** Ensure all spell names in `spellList` exist in `data/spells/*.json`.

### 3.2 Adding a New Race

**Step 1: Create `data/races/{id}.json`**

```javascript
{
  "id": "aasimar",                                 // MUST match filename stem
  "name": "Aasimar",                               // Display name
  "desc": "Celestial-touched beings",              // Hover tooltip
  "size": "Medium",                                // "Small" or "Medium"
  "speed": 30,                                     // Base speed in feet
  "languages": ["Common", "Celestial"],
  "bonuses": { "charisma": 2, "wisdom": 1 },       // Stat bonuses (can be {})
  "raceAbilities": [
    "Darkvision",                                   // Feature names → effect keys
    "Celestial Resistance",
    "Healing Hands"
  ],
  "subraces": {                                    // Optional
    "Protector Aasimar": {
      "bonuses": { "wisdom": 1 },                   // STACKS on base bonuses
      "raceAbilities": ["Radiant Soul"],            // ADDED to feature list
      "languages": ["Celestial"]                    // REPLACES parent languages
    }
  }
}
```

**Step 2:** Add effect entries in `data/effects/race-effects.json` — one per `raceAbilities` entry.
**Step 3:** Add descriptions in `data/descriptions/race-abilities.json`.
**Step 4:** Register in `DataLoaders.js` — add ID to hardcoded race array.

### 3.3 Adding a Subrace

Add a key to the parent race's `subraces` object. No separate file needed.
- `bonuses` — stat bonuses that STACK on base race bonuses
- `raceAbilities` — feature names ADDED to the character's feature list
- `languages` — REPLACES (not extends) the base race languages

### 3.4 Adding a Feature (Class or Race)

Each feature name in a class `features` array or race `raceAbilities` array needs three things:

#### 3.4.1 Effect Entry (Machine Behavior)

In the matching effect JSON, add a key with the lowercase-hyphenated name:

```javascript
"my-feature-name": { "type": "<type>", ... }
```

**Effect Types — Complete Reference**

| Type | Required Fields | Optional Fields | Example |
|------|----------------|-----------------|---------|
| `proficiency` | `proficiencyType` (skill/armor/weapon/tool), `options` (string[]), `count` (number) | `secondaryEffects` | `{type:"proficiency", proficiencyType:"skill", options:["Perception"], count:1}` |
| `stat` | `options` (string[] — which stats), `value` (number — bonus per pick) | `count` (how many picks) | `{type:"stat", value:1, options:["strength","dex"], count:2}` |
| `vision` | `value.nightvision` or `value.dayvision` (number, feet) | | `{type:"vision", value:{nightvision:60}}` |
| `speed` | `value` (number, bonus feet) | | `{type:"speed", value:5}` |
| `resistance` | `damageType` (string) | | `{type:"resistance", damageType:"fire"}` |
| `immunity` | `damageType` | | `{type:"immunity", damageType:"poison"}` |
| `vulnerability` | `damageType` | | `{type:"vulnerability", damageType:"thunder"}` |
| `savingThrow` | `saveType` (string), `effect` ("advantage" or "proficiency") | | `{type:"savingThrow", saveType:"charmed", effect:"advantage"}` |
| `cantrips` | `count` (number), `ability` (string) | `class` (for filtering), `spellList`, `options` (fixed list) | `{type:"cantrips", class:"wizard", count:1, ability:"intelligence"}` |
| `innate` | `spellLevels` (`{level: [spellNames]}`), `ability` (string) | `terrainSpells` (for conditional) | `{type:"innate", spellLevels:{"1":["Faerie Fire"],"3":["Darkness"]}, ability:"charisma"}` |
| `mainspell` | (none — reads from class JSON) | `spellcasting` (object with `ability`, `progression`, `cantripsKnown`, `spellsKnown`, `spellList`, `spellSlotTable` — for third-casters) | `{type:"mainspell"}` |
| `maxHP` | One of: `value` ("lvl") or `perLevel` (number) | | `{type:"maxHP", perLevel:2}` |
| `feat` | `count` (number) | `options` (fixed list) | `{type:"feat", options:[], count:1}` |
| `skill` | `count` (number) | | `{type:"skill", count:3}` |
| `language` | `languages` (string[]) | | `{type:"language", languages:["Draconic"]}` |
| `choice` | `choiceType` ("invocation"/"discipline"/"maneuver"), `options` (string[]), `count` (`{level: count}`) | `levelPrereqs` (`{name: level}`) | See invocations below |
| `lookup` | (none) | | `{type:"lookup"}` — no mechanical effect, just description |
| `none` | (none) | | `{type:"none"}` — completely inert marker |

For features with multiple effects, use `secondaryEffects`:
```javascript
{
  "type": "proficiency",
  "proficiencyType": "skill", "options": ["Perception"], "count": 1,
  "secondaryEffects": [
    { "type": "cantrips", "class": "nature", "options": ["Druidcraft"], "count": 1, "ability": "wisdom" }
  ]
}
```

**Invocations / Disciplines / Maneuvers — Choice Pattern**

The parent choice defines availability; each option gets its own effect entry:

```javascript
// Parent effect:
"eldritch invocations": {
  "type": "choice",
  "choiceType": "invocation",                       // Links to glossary: invocation/discipline/maneuver
  "count": { "2": 2, "3": 3, "5": 4, ... },         // Level → how many known
  "options": ["Agonizing Blast", ...],               // All option display names
  "levelPrereqs": { "Agonizing Blast": 2, ... }     // Optional level gates
}

// Individual option effects (same file):
"agonizing-blast": { "type": "lookup" },
```

#### 3.4.2 Description Entry (Human Text)

```javascript
// data/descriptions/class-abilities.json:
"My Feature Name": "This is what the feature does in plain English."
```

Description keys must EXACTLY match the feature's display name (title case). Case-insensitive fallback exists but is not guaranteed for all lookups.

#### 3.4.3 Glossary Auto-Linking

Feature descriptions auto-link invocation, discipline, maneuver, and spell names mentioned within the text. Case-sensitive (only capitalized names match), longest-name-first to resolve multi-word names before their components. No additional setup needed — just write the name as it appears in the data.

### 3.5 Adding a Feat

**Step 1:** Add description in `data/descriptions/feats.json`:
```javascript
"New Feat Name": "What the feat does."
```

**Step 2:** Add effect in `data/effects/feat-effects.json`:
```javascript
"new feat name": {
  "type": "stat",
  "stat": "any",
  "options": ["strength", "dexterity"],
  "amount": 1
}
```
- Stat feats: `"stat": "any"` + `options` + `amount`
- Proficiency feats: `"armor"`/`"weapons"` strings + optional `"proficiencyType"`
- Skill feats: `"type": "skill"` + `"count"`
- HP feats: `"type": "maxHP"` + `"perLevel"` or `"value": "lvl"`

### 3.6 Adding a Spell

**Step 1:** Determine school (abjuration/conjuration/divination/enchantment/evocation/illusion/necromancy/transmutation).

**Step 2:** Add entry to `data/spells/{school}.json`:
```javascript
{
  "name": "Spell Name",
  "ritual": false,
  "casttime": "action",                            // "action"/"bonusAction"/"1 minute"/"reaction"
  "range": "Touch",                                // "Self"/"60 feet"/etc.
  "components": "V, S, M",                         // Comma-separated
  "duration": "Instantaneous",                     // "Instantaneous"/"1 hour"/etc.
  "description": "Full spell description text."
}
```

**Step 3:** Add the spell name to the appropriate class's `spellList` in `data/classes/{class}.json` under the correct level key (`"0"` for cantrips, `"1"`-`"9"` for leveled spells).

### 3.7 Adding Proficiencies

Descriptions live in `data/descriptions/proficiencies.json`:
```javascript
{
  "skills": { "Acrobatics": "...", ... },
  "armor": { "light": "...", ... },
  "weapons": { "simple weapons": "...", ... },
  "tools": { "smith's tools": "...", ... },
  "savingThrows": { "strength": "...", ... }
}
```

To grant via a feature: create an effect with:
- `type: "proficiency"`
- `proficiencyType` matching the category (`"skill"`/`"armor"`/`"weapon"`/`"tool"`)
- `options` listing the specific items
- `count` = `options.length` for auto-grant, or lower for user-pick

### 3.8 Where Each Addition Goes

| You want to add... | Effect file | Description file | Other action |
|---|---|---|---|
| A new class | `class-effects.json` + `subclass-effects.json` | `class-abilities.json` + `subclass-abilities.json` | Register in `DataLoaders.js` |
| A new race | `race-effects.json` | `race-abilities.json` | Register in `DataLoaders.js` |
| A subrace | (in parent race JSON subraces) | `race-abilities.json` | |
| A subclass option | `class-option-effects.json` + `subclass-effects.json` | `class-options.json` + `subclass-abilities.json` | |
| A class feature | `class-effects.json` | `class-abilities.json` | |
| A subclass feature | `subclass-effects.json` | `subclass-abilities.json` | |
| A race feature | `race-effects.json` | `race-abilities.json` | |
| A feat | `feat-effects.json` | `feats.json` | |
| A spell | | | `data/spells/{school}.json` + class `spellList` |
| An invocation | `class-effects.json` (choice + per-option) | `invocations.json` | |
| A discipline | `subclass-effects.json` (choice + per-option) | `disciplines.json` | |
| A maneuver | `subclass-effects.json` (choice + per-option) | `maneuvers.json` | |
| A proficiency | (any effect file) | `proficiencies.json` | |

### 3.9 Naming Conventions

- Feature/ability display names: `Title Case With Spaces` (e.g., `"Dwarven Resilience"`)
- Effect keys: `lowercase-with-hyphens` (e.g., `"dwarven-resilience"`)
- Description keys: exact match to the feature's display name (`"Dwarven Resilience"`)
- Effect lookup auto-tries both space-separated and hyphenated forms as fallback
- Class option IDs: camelCase (e.g., `"arcaneTrickster"`, `"battleMaster"`)

### 3.10 Validation

Run `python3 tools/validate-features.py` for 7 automated checks:
1. No unknown effect types
2. All effect types have a glossary display handler
3. Choice option IDs cross-reference to existing effect entries
4. Level prerequisite keys match option names
5. No duplicate effect keys across files
6. Class JSON feature names map to existing effect keys
7. Invocation/discipline descriptions exist for all options
