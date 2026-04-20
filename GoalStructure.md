# NewDND Character Creation Tool - Architecture Specification

## Overview

This document specifies the architecture for a scalable D&D 5e character creation system. The design follows the principle that **all game data lives in JSON files** - adding new races, classes, features, or spells requires **no JavaScript code changes**.

---

## Project Structure

```
NewDND/
├── index.html                          # Entry point
├── css/
│   └── theme.css                       # Styling
├── data/
│   ├── classes/                        # Class definitions (12 files)
│   │   ├── barbarian.json
│   │   ├── bard.json
│   │   ├── cleric.json
│   │   ├── druid.json
│   │   ├── fighter.json
│   │   ├── monk.json
│   │   ├── paladin.json
│   │   ├── ranger.json
│   │   ├── rogue.json
│   │   ├── sorcerer.json
│   │   ├── warlock.json
│   │   └── wizard.json
│   ├── races/                          # Race definitions (9 files)
│   │   ├── dragonborn.json
│   │   ├── dwarf.json
│   │   ├── elf.json
│   │   ├── gnome.json
│   │   ├── halfelf.json
│   │   ├── halfling.json
│   │   ├── halforc.json
│   │   ├── human.json
│   │   └── tiefling.json
│   ├── descriptions/                   # Flavor text/descriptions
│   │   ├── class-abilities.json
│   │   ├── class-options.json
│   │   ├── exclusive-groups.json
│   │   ├── feats.json
│   │   ├── proficiencies.json
│   │   ├── race-abilities.json
│   │   └── stats.json
│   ├── spells/                          # Spell definitions (sorted by school)
│   │   ├── abjuration/
│   │   │   ├── 0.json                   # Cantrips
│   │   │   ├── 1.json
│   │   │   ├── 2.json
│   │   │   └── ... (up to 9)
│   │   ├── conjuration/
│   │   │   └── ...
│   │   ├── divination/
│   │   ├── enchantment/
│   │   ├── evocation/
│   │   ├── illusion/
│   │   ├── necromancy/
│   │   └── transmutation/
│   └── effects/                        # Effect definitions
│       ├── race-effects.json           # One-time race effects (bonuses, abilities)
│       ├── race-options-effects.json  # Race recursive effects (empty for now, reserved for future)
│       ├── class-effects.json         # One-time class effects (features, proficiencies)
│       ├── class-options-effects.json  # Class recursive effects (archetypes, invocations, domains)
│       ├── feat-effects.json           # One-time feat effects
│       └── feat-options-effects.json   # Feat recursive effects (empty for now, reserved for future)
├── js/
│   ├── render/
│   │   ├── render.js                   # Page layout per stage
│   │   ├── renderUIFunctions.js         # Helper functions for render.js
│   │   └── renderTooltips.js            # Tooltip system
│   ├── states/
│   │   ├── UIState.js                   # Navigation state (current stage)
│   │   └── UserSelectedState.js         # User inputs/selections
│   ├── character/
│   │   ├── character.js                # localStorage save/load/delete
│   │   ├── characterSheet.js          # Final calculated character
│   │   └── recalculateStats.js         # Recalculation logic
│   └── effects/
│       ├── raceEffects.js              # Handle race effect types (one-time)
│       ├── classEffects.js             # Handle class effect types (one-time)
│       ├── featEffects.js               # Handle feat effect types (one-time)
│       ├── classOptionsEffects.js       # Handle class recursive effects (archetypes, invocations)
│       └── renderTooltips.js            # Tooltip system
```

---

## Data File Specifications

### 1. Race JSON (data/races/[race].json)

```json
{
  "id": "elf",
  "name": "Elf",
  "desc": "Graceful and long-lived beings with keen senses and innate magic.",
  "size": "Medium",
  "speed": 30,
  "languages": ["Common", "Elvish"],
  "bonuses": {
    "dexterity": 2
  },
  "raceAbilities": ["Darkvision", "Fey Ancestry", "Keen Senses", "Trance"],
  "subraces": {
    "High Elf": {
      "bonuses": { "intelligence": 1 },
      "raceAbilities": ["Elf Weapon Training", "High Elf Cantrip"],
      "languages": ["One extra language of your choice"],
      "speed": null
    },
    "Wood Elf": {
      "speed": 35,
      "bonuses": { "wisdom": 1 },
      "raceAbilities": ["Mask of the Wild", "Fleet Footed", "Elf Weapon Training"]
    },
    "Drow": {
      "bonuses": { "charisma": 1 },
      "raceAbilities": ["Superior Darkvision", "Drow Magic", "Sunlight Sensitivity", "Drow Weapon Training"]
    }
  }
}
```

### 2. Class JSON (data/classes/[class].json)

```json
{
  "id": "wizard",
  "name": "Wizard",
  "primaryStat": "intelligence",
  "desc": "Arcane spellcasters who study the secrets of magic.",
  "hitDie": 6,
  "hitPoints": { "1": "hitDie + CON", "perLevel": "1d HitDie + CON" },
  "multiclassRequirement": { "stat": "intelligence", "min": 13 },
  "proficiencies": {
    "armor": [],
    "weapons": ["daggers", "darts", "slings", "quarterstaffs", "light crossbows"],
    "tools": [],
    "savingThrows": ["intelligence", "wisdom"],
    "skills": {
      "count": 2,
      "options": [
        { "name": "Arcana" },
        { "name": "History" },
        { "name": "Insight" },
        { "name": "Investigation" },
        { "name": "Medicine" },
        { "name": "Religion" }
      ]
    }
  },
  "features": {
    "1": { "features": ["Spellcasting", "Arcane Recovery"], "options": [] },
    "2": { "features": [],
      "options": [
        { "id": "abjurer", "name": "School of Abjuration", "exclusiveGroup": "Arcane Tradition" },
        { "id": "conjurer", "name": "School of Conjuration", "exclusiveGroup": "Arcane Tradition" }
      ]
    },
    "3": { "features": ["Ritual Casting"], "options": [] },
    "4": { "features": ["Ability Score Improvement"], "options": [] },
    "5": { "features": ["Spell Mastery"], "options": [] }
  },
  "spellSlotTable": {
    "1": { "1": 2 },
    "2": { "1": 3 },
    "3": { "1": 4, "2": 2 }
  },
  "cantrips known": {
    "1": 3, "2": 3, "3": 3, "4": 4, "5": 4
  },
  "spells known": "Spellbook",
  "spells prepared": "INT + wizard level",
  "spellList": {
    "0": ["fire-bolt", "light", "mage-hand"],
    "1": ["burning-hands", "charm-person"]
  },
  "invocations": { "2": 2, "5": 3, "7": 4, "9": 5, "11": 5, "13": 6, "15": 7, "17": 8, "19": 9 }
}
```

**Key Class Fields:**
- `primaryStat`: Used for spellcasting ability (intelligence/wisdom/charisma) - stored as spellcastingAbility in characterSheet
- `spells known`: "Spellbook" (wizard), number (warlock/bard), or null (preparers like cleric/druid)
- `spells prepared`: Formula string like "WIS + cleric level" or null
- `spellSlotTable`: Lookup table for spell slots by character level
- `cantrips known`: Maximum cantrips by level (array or object mapping level to count)
- `spellList`: learnable spells by class
- `invocations`: Invocation slots by level (warlock only)

### 3. Effect JSON (data/effects/race-effects.json)

```json
{
  "effects": {
    "darkvision": {
      "name": "Darkvision",
      "type": "vision",
      "mode": "set",
      "value": { "nightvision": 60, "dayvision": null },
      "source": "race"
    },
    "elf-weapon-training": {
      "name": "Elf Weapon Training",
      "type": "weaponProficiencies",
      "mode": "add",
      "value": ["longsword", "shortsword", "longbow", "shortbow"],
      "source": "race"
    },
    "dwarven-toughness": {
      "name": "Dwarven Toughness",
      "type": "hitpoints",
      "mode": "add",
      "value": 1,
      "source": "race"
    },
    "keen-senses": {
      "name": "Keen Senses",
      "type": "skill",
      "mode": "add",
      "value": "Perception",
      "source": "race"
    },
    "extra-attack": {
      "name": "Extra Attack",
      "type": "feature",
      "mode": "add",
      "value": { "name": "Extra Attack" },
      "source": "class"
    },
    "evasion": {
      "name": "Evasion",
      "type": "feature",
      "mode": "add",
      "value": { "name": "Evasion" },
      "source": "class"
    }
  }
}
```

### 4. Spell JSON (data/spells/[school]/[level].json)

```json
// data/spells/evocation.json
{
  "evocation": [
    {
      "name": "Acid Splash",
      "ritual": false,
      "casttime": "action",
      "range": "60 feet",
      "components": "V, S",
      "duration": "Instantaneous",
      "description": "You create an acidic bubble at a point within range, where it explodes in a 5-foot-radius Sphere. Each creature in that Sphere must succeed on a Dexterity saving throw or take 1d6 Acid damage."
    }...]

```

### 5. Class Options Effects JSON (data/effects/class-options-effects.json)

For features that are **recursive** - user selects one option, which unlocks additional choices at that level or later levels.

```json
{
  "options": {
    "wizard-school": {
      "baseFeature": "Arcane Tradition",
      "selectionLevel": 2,
      "choices": {
        "abjurer": {
          "name": "School of Abjuration",
          "effects": ["abjuration-sculptor", "abjuration-ward"],
          "unlocks": {
            "6": ["abjuration-protective-ward"],
            "10": ["abjuration-master-ward"],
            "14": ["abjuration-spell-resistance"],
            "18": ["abjuration-zero-state"]
          }
        },
        "conjurer": {
          "name": "School of Conjuration",
          "effects": ["conjuration-summoning", "conjuration-benign"],
          "unlocks": {
            "6": ["conjuration-rapid-summoning"],
            "10": ["conjuration-focused-conjuration"],
            "14": ["conjuration-durable-summons"],
            "18": ["conjuration-dimension-shift"]
          }
        }
      }
    },
    "warlock-patron": {
      "baseFeature": "Otherworldly Patron",
      "selectionLevel": 1,
      "choices": {
        "archfey": {
          "name": "The Archfey",
          "effects": ["archfey-misty-escape"],
          "unlocks": {
            "6": ["archfey-beguiling-defenses"],
            "10": ["archfey-dark-delirium"],
            "14": ["archfey-misty-step-fey"],
            "18": ["archfey-beauty-of-dreams"]
          }
        },
        "fiend": {
          "name": "The Fiend",
          "effects": ["fiend-dark-one-blessing"],
          "unlocks": {
            "6": ["fiend-fire-temptation"],
            "10": ["fiend-hurl-through-hell"],
            "14": ["fiend-renegade-escape"],
            "18": ["fiend-wrathful-caller"]
          }
        }
      }
    },
    "warlock-invocations": {
      "baseFeature": "Eldritch Invocations",
      "selectionLevel": 2,
      "isRepeatable": true,
      "repeatLevelRequirement": 2,
      "maxChoices": {
        "2": 2,
        "5": 3,
        "7": 4,
        "9": 5,
        "11": 5,
        "13": 6,
        "15": 7,
        "17": 8,
        "19": 9
      },
      "choices": {
        "agonizing-blast": {
          "name": "Agonizing Blast",
          "prerequisiteLevel": 2,
          "effects": ["invocation-agonizing-blast"]
        },
        "armor-of-shadows": {
          "name": "Armor of Shadows",
          "prerequisiteLevel": 2,
          "effects": ["invocation-armor-of-shadows"]
        },
        "eldritch-smite": {
          "name": "Eldritch Smite",
          "prerequisiteLevel": 5,
          "effects": ["invocation-eldritch-smite"]
        },
        "thirsting-blade": {
          "name": "Thirsting Blade",
          "prerequisiteLevel": 5,
          "effects": ["invocation-thirsting-blade"],
          "requiredClassFeature": "Pact of the Blade"
        }
      }
    }
  }
}
```

#### Class Options Effects Fields

| Field | Type | Description |
|-------|------|-------------|
| `baseFeature` | string | Name of the feature this is for |
| `selectionLevel` | number | Level at which user makes initial selection |
| `isRepeatable` | boolean | Whether user can select multiple options (like invocations) |
| `repeatLevelRequirement` | number | Level required to select more options |
| `maxChoices` | object | Max options by level (e.g., { "2": 2, "5": 3 }) |
| `choices` | object | Map of option IDs to option details |
| `choices[].effects` | array | Effect keys to apply when this option is selected |
| `choices[].unlocks` | object | Level-based additional options (e.g., { "6": ["effect1"], "10": ["effect2"] }) |
| `choices[].prerequisiteLevel` | number | Minimum level to select this option |
| `choices[].requiredClassFeature` | string | Required class feature (e.g., "Pact of the Blade") |

---

## State Structures

### 1. UserSelectedState.js (User Inputs)

Stores **what the user has chosen** - not the final calculated values.

```javascript
let userSelection = {
    // Identity
    name: "",                           // User input string
    lvl: 1,                             // 1-20

    // Race & Class (references to JSON files)
    race: null,                         // race.json id (e.g., "elf", "dwarf")
    subrace: null,                      // subrace key from race.json (e.g., "High Elf")
    class: null,                        // class.json id (e.g., "wizard")
    subclass: null,                     // subclass id from class.json (e.g., "abjurer")

    // Multiclass support
    multiclassLevels: [
        // { classId: "wizard", level: 3, subclass: "abjurer" }
    ],

    // Features from choices - list of feature names user has selected
    features: [],
    selectedFeatureChoices: {},
    // Example: { "wizard-school": "abjurer", "warlock-invocation-1": "agonizing-blast" }

    // Feats - player chosen feats
    feats: [],
    featChoices: {},

    // Ability Scores - starting values (8 base + user choices)
    stats: {
        strength: 8,
        dexterity: 8,
        constitution: 8,
        intelligence: 8,
        wisdom: 8,
        charisma: 8
    },
    pointBuyUsed: 27,                   // Points spent in point-buy system (default 27 for standard array equivalent)
    ASIHistory: [
        // { level: 4, stat: "strength", amount: 2, source: "ASI" }
    ],

    // Proficiencies - user selected proficiencies
    selectedSkills: [],                 // User-chosen skill proficiencies
    selectedWeapons: [],               // User-chosen weapon proficiencies
    selectedArmor: [],                 // User-chosen armor proficiencies
    selectedTools: [],                 // User-chosen tool proficiencies

    // Expertise - double proficiency (can be skill, tool, weapon, armor)
    expertises: [],

    // Languages
    selectedLanguages: [],             // User-chosen additional languages

    // Spells
    spellPreparationType: null,       // "prepare" | "spellbook" | "known" | "pact-magic" | null (derived from class)
    spellbookSpells: [],               // For wizard - spells in spellbook
    selectedCantrips: [],              // User-selected cantrips
    selectedSpells: [],                // User-selected known spells
    preparedSpells: [],                // For cleric/druid - prepared spells
    selectedSpellOptions: {}          // Map of choice IDs to selections
};
```

### 2. CharacterSheet.js (Final Calculated State)

Stores the **fully calculated character** - derived from UserSelectedState + game data.

```javascript
let characterSheet = {
    // Identity
    name: "",
    lvl: 1,
    race: "",
    subrace: "",
    class: "",
    subclass: "",

    // Final calculated stats
    stats: {
        strength: 8,
        dexterity: 8,
        constitution: 8,
        intelligence: 8,
        wisdom: 8,
        charisma: 8
    },
    statModifiers: {
        // Calculated: floor((score-10)/2)
        strength: 0,
        dexterity: 0,
        constitution: 0,
        intelligence: 0,
        wisdom: 0,
        charisma: 0
    },

    // Combat
    maxHp: 0,                         // Calculated: hitDie + CON mod + race/class bonuses
    currentHp: 0,
    speed: 30,                         // Base + race/subrace/feat bonuses
    armorClass: 10,                    // Calculated: 10 + DEX (unarmored) or armor + DEX
    initiative: 0,                     // Usually equal to DEX modifier

    // Vision
    vision: {
        nightvision: null,            // feet or null (e.g., 60, 120)
        dayvision: null               // feet or null
    },

    // Proficiencies (calculated, deduplicated from all sources)
    proficiencies: {
        skills: [],                   // e.g., ["Perception", "Arcana"]
        weapons: [],                  // e.g., ["longsword", "shortbow"]
        armor: [],                   // e.g., ["light armor", "shields"]
        tools: [],                   // e.g., ["thieves' tools"]
        savingThrows: []             // e.g., ["intelligence", "wisdom"]
    },

    // Expertise - double proficiency (from Rogue's Expertise, Bard's Jack of All Trades, etc.)
    expertises: [],                   // e.g., ["Stealth", "Persuasion"] - can include any proficiency type

    // Languages
    languages: [],                    // e.g., ["Common", "Elvish"]

    // Features (ALL features from race + class + subclass + feats + level-ups)
    features: [
        // { name: "Darkvision", description: "...", source: "race", sourceId: "elf" }
    ],

    // Feats - the actual feat objects with full details
    feats: [],

    // Spellcasting
    spellcastingAbility: null,       // "intelligence" | "wisdom" | "charisma" (derived from class.primaryStat)
    spellSaveDC: 0,                   // Calculated: 8 + proficiency + spellcasting ability mod
    spellAttackMod: 0,               // Calculated: proficiency + spellcasting ability mod
    spellPreparationType: null,      // "prepare" | "spellbook" | "known" | "pact-magic" | null
    spellbookSpells: [],             // Wizard's spellbook contents
    knownCantrips: [],               // e.g., ["fire-bolt", "light"]
    knownSpells: [],                 // e.g., ["shield", "magic-missile"]
    preparedSpells: [],               // e.g., ["cure-wounds", "shield of faith"] (forcleric, druid)
    spellSlots: {
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
    },
    maxCantripsKnown: 0,             // Maximum allowed cantrips (from class)
    maxSpellsKnown: 0,               // Maximum known spells (from class level)
    ritualSpells: []                  // Spells that can be cast as rituals (from Ritual Caster feat, class features)
};
```

---

## Effect Type System

### Effect Types and Value Formats

| Type | Value Format | Description |
|------|--------------|-------------|
| `stat` | `{ stat: string, amount: number }` | Modify ability score (e.g., +2 strength) |
| `skill` | `string` (skill name) | Add skill proficiency (e.g., "Perception") |
| `expertise` | `string | number | array` | Add expertise. String = single item, number = count of available expertise slots, array = multiple items |
| `weaponProficiencies` | `array of strings` | Add weapon proficiencies (e.g., ["longsword", "shortbow"]) |
| `armorProficiencies` | `array of strings` | Add armor proficiencies (e.g., ["light armor", "shields"]) |
| `toolProficiencies` | `array of strings` | Add tool proficiencies (e.g., ["thieves' tools"]) |
| `savingThrow` | `string` (stat name) | Add saving throw proficiency (e.g., "wisdom") |
| `vision` | `{ nightvision: number, dayvision: number }` | Set vision range in feet |
| `speed` | `number` | Add to base speed (e.g., +5) |
| `hitpoints` | `number` | Add to max HP per level (e.g., +1 per level from Dwarven Toughness) |
| `cantrip` | `{ spells: array, choice: boolean, choiceCount: number }` | Grant cantrip(s). choice=true means user must select |
| `spell` | `{ spells: array, choice: boolean, levels: { "3": [], "5": [] } }` | Grant spell(s). levels = level-dependent spells |
| `feature` | `{ name: string, description: string }` | Add named feature with description |
| `language` | `string | array` | Add language(s) (e.g., "Elvish" or ["Elvish", "Common"]) |
| `none` | `null` | Feature only (no stat effect, just adds to features list) |

### Mode Definitions

| Mode | Behavior |
|------|----------|
| `add` | Add value to existing (e.g., +5 speed, +1 skill). Default for most. |
| `set` | Set to specific value regardless of existing (e.g., set speed to 35, override existing vision) |
| `override` | Replace existing entirely (for features that completely replace others, rarely used) |

### Effect JSON Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name (for feature list, tooltips) |
| `type` | string | Yes | Effect type (see table above) |
| `mode` | string | Yes | "add", "set", or "override" |
| `value` | any | Yes | Type-dependent value |
| `source` | string | Yes | "race", "class", "feat", "background" |
| `levels` | object | No | Level-dependent values (e.g., { "3": ["faerie-fire"], "5": ["darkness"] }) |

---

## UI Stage System

| Stage | Name | Description |
|-------|------|-------------|
| 0 | Welcome | Character list, create new, delete |
| 1 | Choose Race | Select race and subrace |
| 2 | Choose Class | Select class and subclass (and multiclass levels) |
| 3 | Ability Scores | Point buy or manual entry |
| 4 | Proficiencies | Select skills, weapons, armor, tools, expertises |
| 5 | Features & Feats | Class features at each level, select feats |
| 6 | Spells | Select cantrips, spells (known/prepared), prepare spells |
| 7 | Overview & Name | Final review, name character, calculate final stats, save |

---

## Recalculation System

### Flag-Based Recalculation

When user makes a selection, a **flag** is sent indicating what changed. Only affected stats recalculate.

```javascript
const RECALC_FLAGS = {
    RACE_CHANGED: 'race',              // Race or subrace changed
    SUBCLASS_CHANGED: 'subclass',      // Subrace changed
    CLASS_CHANGED: 'class',            // Main class changed (resets subclass)
    SUBCLASS_CHANGED: 'subclass',      // Class subclass/archetype changed
    LEVEL_CHANGED: 'level',            // Level changed (1-20)
    STAT_CHANGED: 'stat',              // Any ability score changed
    FEATURE_CHANGED: 'feature',        // Feature selection changed
    FEAT_CHANGED: 'feat',              // Feat selection changed
    SKILL_CHANGED: 'skill',            // Skill proficiency selection changed
    EXPERTISE_CHANGED: 'expertise',    // Expertise selection changed
    LANGUAGE_CHANGED: 'language',      // Language selection changed
    SPELL_CHANGED: 'spell'             // Spell selection changed
};
```

### Recalculation Function Mapping

```javascript
// In recalculateStats.js

function recalculateAll(changedFlag) {
    switch(changedFlag) {
        case RECALC_FLAGS.RACE_CHANGED:
            recalculateRaceEffects();    // Apply race bonuses to stats
            recalculateVision();         // Race vision effects
            recalculateSpeed();          // Race speed effects
            recalculateLanguages();      // Race languages
            recalculateFeatures();       // Race features/abilities
            recalculateProficiencies();  // Race weapon/armor/tool profs
            break;

        case RECALC_FLAGS.SUBCLASS_CHANGED:
            recalculateRaceEffects();    // Same as race for subrace bonuses
            recalculateVision();
            recalculateSpeed();
            recalculateLanguages();
            recalculateFeatures();
            recalculateProficiencies();
            break;

        case RECALC_FLAGS.CLASS_CHANGED:
            recalculateClassBase();      // Hit die, primary stat, base proficiencies
            recalculateClassFeatures();  // Class features by level
            recalculateSavingThrows();   // Class saving throws
            recalculateProficiencies();  // Class weapon/armor/tool profs
            recalculateSkillProficiencies(); // Class skill count
            recalculateSpellcasting();   // Spellcasting ability, preparation type
            recalculateMaxHp();          // Hit die + CON
            recalculateFeatures();
            recalculateSpellSlots();     // Based on class and level
            recalculateCantrips();       // Max cantrips by level
            recalculateKnownSpells();    // Max known spells by level
            break;

        case RECALC_FLAGS.SUBCLASS_CHANGED:
            recalculateSubclassFeatures(); // Subclass features
            recalculateFeatures();
            recalculateSpellcasting();    // Some subclasses add spellcasting
            break;

        case RECALC_FLAGS.LEVEL_CHANGED:
            recalculateClassFeatures();   // New features at this level
            recalculateMaxHp();          // Additional hit die
            recalculateSpellSlots();      // Updated spell slot table
            recalculateCantrips();        // New cantrips at certain levels
            recalculateKnownSpells();    // More spells known at certain levels
            recalculateFeatures();        // Include new features
            recalculateAvailableFeats(); // Check if ASI gained
            break;

        case RECALC_FLAGS.STAT_CHANGED:
            recalculateStatModifiers();  // floor((score-10)/2)
            recalculateArmorClass();     // 10 + DEX or armor + DEX
            recalculateInitiative();     // Usually DEX mod
            recalculateSpellAttackMod(); // proficiency + spell stat mod
            recalculateSpellSaveDC();    // 8 + proficiency + spell stat mod
            recalculateMaxHp();          // CON affects HP
            break;

        case RECALC_FLAGS.FEATURE_CHANGED:
            recalculateFeatures();       // Update features list
            recalculateProficiencies();  // Some features add proficiencies
            recalculateSpellcasting();   // Some features enable spellcasting
            recalculateSavingThrows();   // Some features add saving throws
            break;

        case RECALC_FLAGS.FEAT_CHANGED:
            recalculateFeats();          // Apply feat effects
            recalculateFeatures();       // Feats may add features
            recalculateStats();          // Some feats add stat bonuses
            recalculateProficiencies();  // Some feats add proficiencies
            recalculateExpertises();     // Some feats add expertise
            recalculateSpeed();          // Mobile feat adds speed
            recalculateVision();         // Observant feat adds darkvision
            recalculateMaxHp();          // Tough feat adds HP
            break;

        case RECALC_FLAGS.SKILL_CHANGED:
            recalculateSkillProficiencies(); // Update selected skills
            break;

        case RECALC_FLAGS.EXPERTISE_CHANGED:
            recalculateExpertises();     // Update expertise list
            break;

        case RECALC_FLAGS.LANGUAGE_CHANGED:
            recalculateLanguages();      // Update languages list
            break;

        case RECALC_FLAGS.SPELL_CHANGED:
            recalculateKnownCantrips();  // Update selected cantrips
            recalculateKnownSpells();     // Update selected spells
            recalculatePreparedSpells(); // Update prepared spells (if applicable)
            break;
    }
    updateCharacterSheet();
}
```

### Recalculation Pattern (ALL recalculations follow this pattern)

Every recalculation function follows the same pattern: **clear existing values, then recalculate from all sources**. This ensures consistency and prevents stale data.

```javascript
// Example: recalculateExpertises
function recalculateExpertises() {
    // 1. Start fresh - clear existing
    characterSheet.expertises = [];
    userSelection.availableExpertiseSlots = 0;

    // 2. Apply all sources in order (each source starts from base, not incremental)
    // Race effects
    applyAllRaceExpertiseEffects();
    // Class effects
    applyAllClassExpertiseEffects();
    // Feat effects
    applyAllFeatExpertiseEffects();

    // 3. Apply user selections (slots they chose to use)
    userSelection.expertises.forEach(exp => {
        if (!characterSheet.expertises.includes(exp)) {
            characterSheet.expertises.push(exp);
        }
    });
}

// This pattern applies to ALL recalculation functions:
// - recalculateProficiencies() - clears, applies all sources, applies user selections
// - recalculateFeatures() - clears, applies race/class/feat/subclass features
// - recalculateLanguages() - clears, applies race/class/feat languages
// - recalculateMaxHp() - clears, calculates from hit die + CON + all bonuses
// - recalculateSpellSlots() - clears, calculates from class + level tables
// etc.
```

**Why clear-and-recalculate?**
1. No stale data if effects change mid-session
2. Multiclass correctly combines all sources in correct order
3. Order of application is always consistent
4. Easier to debug - always start from known state
5. Handles effect removal correctly (if user unselects something)

---

## Effect Handlers

### Race Effects Handler (effects/raceEffects.js)

```javascript
function applyRaceEffect(effectKey, effect, currentLevel) {
    if (!meetsLevelRequirement(effect, currentLevel)) return;

    switch(effect.type) {
        case 'stat':
            userSelection.stats[effect.value.stat] += effect.value.amount;
            triggerFlag(RECALC_FLAGS.STAT_CHANGED);
            break;

        case 'skill':
            if (!userSelection.selectedSkills.includes(effect.value)) {
                userSelection.selectedSkills.push(effect.value);
            }
            triggerFlag(RECALC_FLAGS.SKILL_CHANGED);
            break;

        case 'expertise':
            applyExpertiseEffect(effect.value, 'race');
            triggerFlag(RECALC_FLAGS.EXPERTISE_CHANGED);
            break;

        case 'weaponProficiencies':
            effect.value.forEach(weapon => {
                if (!userSelection.selectedWeapons.includes(weapon)) {
                    userSelection.selectedWeapons.push(weapon);
                }
            });
            break;

        case 'armorProficiencies':
            effect.value.forEach(armor => {
                if (!userSelection.selectedArmor.includes(armor)) {
                    userSelection.selectedArmor.push(armor);
                }
            });
            break;

        case 'toolProficiencies':
            effect.value.forEach(tool => {
                if (!userSelection.selectedTools.includes(tool)) {
                    userSelection.selectedTools.push(tool);
                }
            });
            break;

        case 'vision':
            if (effect.mode === 'set') {
                characterSheet.vision = { ...characterSheet.vision, ...effect.value };
            } else {
                // add mode - add to existing
                if (effect.value.nightvision) {
                    characterSheet.vision.nightvision = (characterSheet.vision.nightvision || 0) + effect.value.nightvision;
                }
            }
            break;

        case 'speed':
            characterSheet.speed += effect.value;
            break;

        case 'hitpoints':
            // Store as per-level bonus, applied during HP calculation
            userSelection.maxHpBonus = (userSelection.maxHpBonus || 0) + effect.value;
            break;

        case 'cantrip':
            handleCantripEffect(effect);
            break;

        case 'spell':
            handleSpellEffect(effect);
            break;

        case 'feature':
            addFeatureToSheet(effect, 'race', effectKey);
            break;

        case 'language':
            const langs = Array.isArray(effect.value) ? effect.value : [effect.value];
            langs.forEach(lang => {
                if (!userSelection.selectedLanguages.includes(lang)) {
                    userSelection.selectedLanguages.push(lang);
                }
            });
            break;

        case 'none':
            // Just add as feature with no stat effect
            addFeatureToSheet(effect, 'race', effectKey);
            break;
    }
}

function applyExpertiseEffect(value, source) {
    // value can be: number (count), string (single), array (multiple)
    if (typeof value === 'number') {
        // Add to available expertise slots - user will select which later
        userSelection.availableExpertiseSlots = (userSelection.availableExpertiseSlots || 0) + value;
    } else if (typeof value === 'string') {
        // Directly add to expertises
        if (!userSelection.expertises.includes(value)) {
            userSelection.expertises.push(value);
        }
    } else if (Array.isArray(value)) {
        value.forEach(item => {
            if (!userSelection.expertises.includes(item)) {
                userSelection.expertises.push(item);
            }
        });
    }
}
```

### Class Effects Handler (effects/classEffects.js)

Similar structure to raceEffects.js but processes class-specific effects including:
- Spellcasting ability (from primaryStat)
- Spell slots calculation
- Class features by level
- Subclass effects

### Feat Effects Handler (effects/featEffects.js)

Similar structure but processes feat-specific effects including:
- Stat bonuses
- Proficiencies
- Features
- Special abilities (like Mobile speed, Observant darkvision, Tough HP)

### Class Options Effects Handler (effects/classOptionsEffects.js)

Handles recursive effects - features that unlock more choices as the character levels up.

```javascript
// Example: warlock-invocations
function applyClassOptionEffect(optionKey, optionData, currentLevel) {
    // 1. Check if current level meets selection level
    if (currentLevel < optionData.selectionLevel) return;

    // 2. Check prerequisites (level, required features)
    if (!meetsPrerequisites(optionData, currentLevel, userSelection)) return;

    // 3. Apply initial effects
    optionData.effects.forEach(effectKey => {
        applyEffectFromEffectsFile(effectKey);
    });

    // 4. Check for unlocks at current level
    if (optionData.unlocks && optionData.unlocks[currentLevel]) {
        const unlockEffects = optionData.unlocks[currentLevel];
        unlockEffects.forEach(effectKey => {
            applyEffectFromEffectsFile(effectKey);
        });
    }
}

function getAvailableOptions(optionGroup, currentLevel, userSelection) {
    const optionData = classOptionsEffectsData[optionGroup];
    if (!optionData) return [];

    const available = [];

    // Get max choices at this level
    const maxChoices = optionData.maxChoices
        ? getMaxAtLevel(optionData.maxChoices, currentLevel)
        : 1;

    // Check which choices are available (level + prerequisites)
    for (const [choiceId, choiceData] of Object.entries(optionData.choices)) {
        if (currentLevel >= choiceData.prerequisiteLevel) {
            // Check required features
            if (!choiceData.requiredClassFeature ||
                hasFeature(userSelection, choiceData.requiredClassFeature)) {
                available.push({ id: choiceId, ...choiceData });
            }
        }
    }

    return available;
}
```

---

## File Dependencies (Load Order)

The following order ensures all dependencies are available when needed:

1. `js/states/UserSelectedState.js` - User selections (empty initially)
2. `js/character/characterSheet.js` - Final sheet (empty initially)
3. `js/character/character.js` - Storage utilities (localStorage operations)
4. `js/effects/raceEffects.js` - Race one-time effect handlers
5. `js/effects/classEffects.js` - Class one-time effect handlers
6. `js/effects/featEffects.js` - Feat one-time effect handlers
7. `js/effects/classOptionsEffects.js` - Class recursive effect handlers (archetypes, invocations)
8. `js/character/recalculateStats.js` - Recalculation system (depends on effects handlers)
9. `js/states/UIState.js` - Navigation state (depends on recalculateStats)
10. `js/render/renderUIFunctions.js` - UI helpers + data loaders (loads JSON files)
11. `js/render/renderTooltips.js` - Tooltip system (depends on loaded data)
12. `js/render/render.js` - Main render (depends on all above)

---

## Tooltip System

### Tooltip Data Flow

1. **Load Descriptions**: On init, load all files from `data/descriptions/`
2. **Load Effects**: On init, load all effect files from `data/effects/`
3. **Create Tooltip**: When rendering, check if item has description in effects

```javascript
// In renderTooltips.js

// Global description storage
let allDescriptions = {};
let raceEffectsData = {};
let classEffectsData = {};
let featEffectsData = {};

function loadAllDescriptions() {
    // Load race-abilities.json
    // Load class-abilities.json
    // Load feats.json
    // Load stats.json
    // Load proficiencies.json
}

function loadAllEffects() {
    // Fetch data/effects/race-effects.json
    // Fetch data/effects/class-effects.json
    // Fetch data/effects/feat-effects.json
}

function createTooltip(element, itemKey, itemType) {
    let description = "";
    let source = "";
    let sourceFile = "";

    // 1. First check effects (has priority - contains actual game mechanics)
    const effectSource = getEffectSource(itemKey);
    if (effectSource) {
        const effectData = getEffectData(itemKey, effectSource.type);
        if (effectData) {
            description = effectData.description || effectData.name;
            source = effectSource.type; // "race", "class", "feat"
            sourceFile = effectSource.file; // e.g., "race-effects.json"
        }
    }

    // 2. If not in effects, check descriptions folder
    if (!description && allDescriptions[itemKey]) {
        description = allDescriptions[itemKey];
        source = "description";
        sourceFile = getDescriptionSourceFile(itemKey);
    }

    // Set tooltip content
    element.setAttribute('data-tooltip', `
        <div class="tooltip-content">
            <strong>${itemKey}</strong>
            <span class="tooltip-source">Source: ${source} (${sourceFile})</span>
            <p>${description || "No description available."}</p>
        </div>
    `);
}

function getEffectSource(effectKey) {
    // Check race-effects.json
    if (raceEffectsData[effectKey]) {
        return { type: "race", file: "race-effects.json" };
    }
    // Check class-effects.json
    if (classEffectsData[effectKey]) {
        return { type: "class", file: "class-effects.json" };
    }
    // Check feat-effects.json
    if (featEffectsData[effectKey]) {
        return { type: "feat", file: "feat-effects.json" };
    }
    return null;
}

function getEffectData(effectKey, sourceType) {
    switch(sourceType) {
        case "race": return raceEffectsData[effectKey];
        case "class": return classEffectsData[effectKey];
        case "feat": return featEffectsData[effectKey];
        default: return null;
    }
}

function getDescriptionSourceFile(itemKey) {
    // Determine which description file contains this key
    // Could be: race-abilities.json, class-abilities.json, feats.json, stats.json, proficiencies.json
    // Check each and return filename
}
```

---

## Spell Calculation Logic

### Spell Stats (Calculated at Final Save Step)

```javascript
// In recalculateStats.js - called when saving character

function calculateSpellStats() {
    // 1. Get spellcasting ability from class primaryStat
    const classData = loadClassData(userSelection.class);
    const primaryStat = classData.primaryStat; // "intelligence", "wisdom", or "charisma"

    characterSheet.spellcastingAbility = primaryStat;

    // 2. Get ability modifier
    const statMod = characterSheet.statModifiers[primaryStat];

    // 3. Get proficiency bonus
    const proficiency = getProficiencyBonus(userSelection.lvl);

    // 4. Spell Save DC = 8 + proficiency + ability modifier
    characterSheet.spellSaveDC = 8 + proficiency + statMod;

    // 5. Spell Attack Mod = proficiency + ability modifier
    characterSheet.spellAttackMod = proficiency + statMod;
}

function getProficiencyBonus(level) {
    // Proficiency bonus by level (5e rules)
    // Level 1-4: +2
    // Level 5-8: +3
    // Level 9-12: +4
    // Level 13-16: +5
    // Level 17-20: +6
    return Math.floor((level - 1) / 4) + 2;
}

function getClassPrimaryStat(classId) {
    const classData = loadClassData(classId);
    return classData.primaryStat;
}
```

### Spell Preparation Type (Derived from Class)

```javascript
function determineSpellPreparationType(classData) {
    if (classData.spellsPrepared) {
        return "prepare"; // Cleric, Druid
    }
    if (classData.spellsKnown === "Spellbook") {
        return "spellbook"; // Wizard
    }
    if (classData.spellsKnown && typeof classData.spellsKnown === 'number') {
        return "known"; // Warlock, Bard, Sorcerer, Ranger
    }
    return null;
}
```

---

## Multiclass Proficiencies Logic

### Max Skill Proficiencies Calculation

```javascript
function calculateMaxSkillProficiencies() {
    const caps = [];

    // Get main class skill count
    if (userSelection.class) {
        const classData = loadClassData(userSelection.class);
        caps.push(classData.proficiencies.skills.count);
    }

    // Get race skill cap if any
    if (userSelection.race) {
        const raceCap = getRaceSkillCap(userSelection.race);
        if (raceCap) caps.push(raceCap);
    }

    // Get multiclass skill caps
    userSelection.multiclassLevels.forEach(mc => {
        const mcClassData = loadClassData(mc.classId);
        caps.push(mcClassData.proficiencies.skills.count);
    });

    // If all caps are same number, add +1 (PHB multiclassing rule)
    // Otherwise use highest cap
    if (caps.length > 0 && caps.every(c => c === caps[0])) {
        return caps[0] + 1;
    }
    return Math.max(...caps);
}

function getRaceSkillCap(raceId) {
    // Check if race gives bonus skill proficiency
    // Some races might have skill bonuses in their bonuses section
    // Return number or null
    return null;
}
```

---

## Adding New Content Without Code Changes

### Adding a New Race

1. Create `data/races/newrace.json` with race data
2. Add race bonuses to `data/effects/race-effects.json` (type: stat, skill, vision, etc.)
3. Add race abilities to `data/descriptions/race-abilities.json`

### Adding a New Class

1. Create `data/classes/newclass.json` with class data
2. Add class features to `data/effects/class-effects.json`
3. Add class abilities to `data/descriptions/class-abilities.json`

### Adding a New Feat

1. Add feat description to `data/descriptions/feats.json`
2. Add feat effects to `data/effects/feat-effects.json`

### Adding New Spells

1. Add spell to `data/spells/[school]/[level].json`
2. Class spell lists are in class.json - no changes needed unless adding to a class's spell list

### Adding a New Subclass/Archetype

1. Add subclass options to class.json `features` section
2. Add subclass features to `data/effects/class-effects.json`

---

## Scalability Checklist

- [ ] Add new race: Only edit data/races/[race].json + effects/race-effects.json
- [ ] Add new class: Only edit data/classes/[class].json + effects/class-effects.json
- [ ] Add new feat: Only edit descriptions/feats.json + effects/feat-effects.json
- [ ] Add new spell: Only edit data/spells/[school]/[level].json
- [ ] Add new subclass: Only edit class.json + class-effects.json + class-options-effects.json
- [ ] Add new class options (archetypes, invocations): Only edit class-options-effects.json
- [ ] Multiclass works correctly with separate level tracking
- [ ] Effect recalculation only updates affected stats via flags
- [ ] Clear-and-recalculate pattern prevents stale data
- [ ] Tooltips show correct descriptions and sources
- [ ] Character sheet saves and loads correctly
- [ ] All calculations happen at final save step (spell DC, attack mod)

---

## Key Design Decisions Summary

1. **Two-State Architecture**: UserSelectedState (choices) + CharacterSheet (calculated)
2. **Flag-Based Recalculation**: Only recalculate what's affected by a change
3. **Generic Effect Handlers**: Process by type, not by specific effect
4. **Clear-and-Recalculate Pattern**: Every recalculation clears existing and rebuilds from all sources
5. **Data-Driven**: All game content in JSON, no JS changes for new content
6. **No Descriptions in Effects**: All flavor text in data/descriptions/ folder
7. **No minLevel in Effects**: Level info comes from class.json features
8. **Separate Options Effects**: Recursive effects (archetypes, invocations) in separate JSON/JS files
9. **Spell Stats at Save**: DC and attack mod calculated at final step
10. **Expertise as New Type**: Supports all proficiency types (skill/tool/weapon/armor)
11. **Multiclass Support**: Separate tracking for each class's levels
12. **Description + Source in Tooltips**: Show where each feature came from