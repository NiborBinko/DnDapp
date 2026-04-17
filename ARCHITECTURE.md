# DnD Character Creator - Architecture Guide

## Overview
A 7-step character creation wizard for Dungeons & Dragons 5th Edition with support for:
- Character creation with point buy system
- Spell selection system (Wizard spellbook, Warlock invocations)
- Level up system (multiple classes)
- Multiclassing
- Inventory system (framework in place)
- Monster/NPC entities (framework in place)
- Combat calculations (framework in place)
- Dynamic ability effect system for race/class features

---

## File Structure

```
/home/binko/DND/
├── index.html                    # Main HTML - 7 step containers + 4 modals
├── statLabels.json              # Stat abbreviations (STR, DEX, etc.)
├── dnd-spell-lists.json         # Spell lists per class, cantrips, invocations
├── ARCHITECTURE.md              # This file
├── classes/                     # Individual class files (one per class)
│   ├── fighter.json
│   ├── wizard.json
│   ├── rogue.json
│   ├── cleric.json
│   ├── ranger.json
│   ├── barbarian.json
│   ├── paladin.json
│   ├── bard.json
│   ├── druid.json
│   ├── monk.json
│   ├── sorcerer.json
│   └── warlock.json
├── races/                       # Individual race files (subraces nested in each file)
│   ├── human.json
│   ├── elf.json
│   ├── dwarf.json
│   ├── halfling.json
│   ├── dragonborn.json
│   ├── gnome.json
│   ├── halfelf.json
│   ├── halforc.json
│   └── tiefling.json
├── descriptions/                # Read-only description data (JSON)
│   ├── race-abilities.json        # Race/racial ability descriptions
│   ├── class-abilities.json       # Class feature descriptions
│   ├── class-options.json         # Subclass/archetype option descriptions
│   ├── exclusive-groups.json      # Mutually exclusive feature groups
│   ├── feats.json                 # Feat descriptions
│   ├── proficiencies.json         # Armor, weapons, tools, skills, saving throws descriptions
│   └── stats.json                 # Stat descriptions and tooltips
├── effects/                    # Ability effect mappings (JSON)
│   ├── race-effects.json          # Race ability effects (skill/armor/weapon/tool mappings, stat effects)
│   ├── class-effects.json         # Class feature effects (proficiencies, abilities, spellcasting)
│   └── class-option-effects.json  # Subclass/archetype option effects
├── css/
│   └── theme.css                 # All styling including tooltip system
├── js/
│   ├── core/                    # Core utilities and state management
│   │   ├── config.js            # Constants, stat labels, flags, getter functions
│   │   ├── state.js             # DnDState object - centralized state management
│   │   ├── data-utils.js        # Data validation (canSelectFeat only)
│   │   ├── global-compat.js     # Shared global functions (getRaceAbilities, getClassFeaturesForLevel, etc.)
│   │   └── ability-system.js    # Dynamic ability effect processor
│   ├── domain/                  # Business logic entities
│   │   ├── character.js         # CharacterEntity - character data model + calculations
│   │   ├── character-create.js # Character creation handlers
│   │   ├── spells.js            # SpellManager - spell slot management
│   │   ├── spells.json          # Pure spell data (damage, description, school)
│   │   ├── inventory.js         # InventoryManager - item management
│   │   ├── monsters.js         # MonsterEntity - NPC/Monster data
│   │   └── combat.js            # CombatManager - combat calculations
│   ├── ui/                     # UI rendering and navigation
│   │   ├── render.js           # All render* functions
│   │   ├── navigation.js       # Step navigation
│   │   └── modals.js           # Modal handlers (character sheet, delete, etc.)
│   ├── features/              # Feature-specific logic
│   │   ├── levelup.js         # Level up modal logic
│   │   └── multiclass.js      # Multiclass modal logic
│   └── app.js                 # Initialization - loads data, inits app
```

---

## Data Flow

### 1. Load Phase (`app.js`)
Loads all JSON files in parallel:
- `classes/*.json` (12 class files) → individual class data
- `races/*.json` (9 race files) → individual race data (includes subraces)
- `statLabels.json` → stat abbreviations
- `descriptions/feats.json` → feat descriptions
- `descriptions/race-abilities.json` → race ability text descriptions
- `descriptions/class-abilities.json` → class feature descriptions
- `effects/race-effects.json` → race ability effect mappings
- `descriptions/proficiencies.json` → armor/weapon/tool/skill/saving throw descriptions
- `dnd-spell-lists.json` → spell lists per class
- `js/domain/spells.json` → pure spell data

Initializes:
- `DnDState` with game data
- `SpellManager` with spell data
- `AbilitySystem` with description data

### 2. State Phase (`core/state.js`)
- `DnDState.character` stores current character being created
- `DnDState.ui` stores UI state (current step, points remaining, etc.)

### 3. Selection Phase (per step)
When user selects class/race/subrace:
- `character-create.js` handlers call `AbilitySystem.recalculate()`
- Recalculates all derived values: proficiencies, stat bonuses, spells, speed, etc.
- Updates character state

### 4. Render Phase (`ui/render.js`)
- Uses `AbilitySystem.getProficiencies()` to get computed proficiencies
- **Merges class and race proficiencies**: Armor, Weapon, and Tool sections combine both sources
- Race-specific selections (like Dwarven Tool Proficiency) shown separately requiring user choice
- Renders all UI sections dynamically with combined data

---

## Key Data Structures

### DnDState.character Object (Full Data Model)
```javascript
{
    id: string,
    name: string,
    classes: [{ classId: string, level: number }],  // Multiclass support
    classId: string,           // Primary class
    level: number,
    raceId: string,           // e.g., "elf"
    subraceName: string,      // e.g., "High Elf"
    humanBonusStats: string[],
    raceAbilityIds: string[],   // Race abilities (Darkvision, Dwarven Resilience, etc.)
    toolSelectionIds: string[], // Selected race tools
    raceCantrips: string[],   // Race cantrips
    raceInnateSpells: {},    // Race innate spells by level { "3": ["faerie-fire"] }
    stats: {},
    baseStats: {},
    hitPoints: { current: number, max: number, temp: number },
    spellSlots: {},
    proficiencyIds: string[], // Selected skills
    abilityIds: string[],    // Class features
    featIds: string[],
    selectedOptions: [{ optionId, feature, level, classId }],
    inventory: [],
    equippedItems: [],
    attacks: [],
    currency: {},
    conditions: [],
    deathSaves: {},
    speed: number,
    proficiencyBonus: number,
    savingThrows: []
}
```

### AbilitySystem (ability-system.js)
Core dynamic system that calculates all ability effects:

```javascript
const AbilitySystem = {
    // Initialize with description data
    init(raceAbilityDesc, raceEffects, profDesc),
    
    // Get all race abilities for character
    getRaceAbilities(character, gameData),
    
    // Calculate all derived values (called on class/race selection)
    recalculate(character, gameData) → {
        raceAbilityIds, proficiencyIds, statBonuses, speedBonus,
        hpPerLevel, darkvision, toolOptions, cantrips, innateSpells,
        weaponProficiencies, armorProficiencies
    },
    
    // Get computed proficiencies for Step 4 display
    getProficiencies(character, gameData, classId) → {
        skills, armor, weapons, tools, toolOptions, cantrips, innateSpells
    },
    
    // Check if character is spellcaster
    isSpellcaster(character) → boolean,
    
    // Get spellcasting ability for class
    getSpellcastingAbility(classId) → string
}
```

---

## Description Data (descriptions/)

### race-abilities.json
Key-value pairs of race ability names to description text:
```json
{
    "Darkvision": "You can see in dim light within 60 feet...",
    "Keen Senses": "You have proficiency in the Perception skill.",
    "Elf Weapon Training": "You have proficiency with the longsword..."
}
```

### class-abilities.json
Key-value pairs of class feature names to description text.

### class-options.json
Key-value pairs of subclass/archetype option names to description text.

### exclusive-groups.json
Mutually exclusive feature groups (e.g., Fighting Style, Domain, College).

### feats.json
Key-value pairs of feat names to full description text.

### proficiencies.json
All proficiency descriptions:
```json
{
    "armor": { "light armor": "Padded, Leather...", "medium armor": "Hide, Chain shirt..." },
    "weapons": { "simple weapons": "...", "martial weapons": "..." },
    "tools": { "thieves' tools": "...", "smith's tools": "..." },
    "skills": { "Athletics": "Climbing, swimming...", "Perception": "Noticing danger..." },
    "savingThrows": { "strength": "...", "dexterity": "..." },
    "mastery": { "strength": "...", "dexterity": "..." }
}
```

## Effects Data (effects/)

### race-effects.json
Complex mappings for what abilities do:
```json
{
    "skillMappings": { "Keen Senses": "Perception" },
    "armorProficiencies": { "Dwarven Armor Training": ["light armor", "medium armor", "shields"] },
    "weaponProficiencies": { "Elf Weapon Training": ["longsword", "shortsword", "shortbow", "longbow"] },
    "toolProficiencies": { "Dwarven Tool Proficiency": { "options": ["smith's tools", ...], "count": 1 } },
    "statEffects": { "Dwarven Toughness": { "type": "hpPerLevel", "value": 1 } }
}
```

---

## Step Flow

| Step | Action | Updates |
|------|--------|---------|
| 1 | Class Selection | `classId`, `abilityIds` via `getClassFeaturesForLevel()` |
| 2 | Race Selection | `raceId`, `raceAbilityIds` via `AbilitySystem.recalculate()` |
| 3 | Point Buy | `stats`, `baseStats` |
| 4 | Proficiencies | `proficiencyIds` via `AbilitySystem.getProficiencies()` |
| 5 | Abilities & Feats | `abilityIds`, `featIds` |
| 6 | Spells | Spells via `SpellManager` |
| 7 | Summary | Character preview |

---

## Key Features

1. **Dynamic Ability Processing**: All race/class effects calculated dynamically via AbilitySystem
2. **Merged Proficiencies**: Class and race proficiencies combined in UI (Armor, Weapons, Tools merge sources)
3. **Separated Data**: Class data, race data, and descriptions in separate JSON files
4. **Scalable**: Easy to add new races/classes without modifying code
5. **Persistent**: Character saved to localStorage with all computed values

---

## Code Cleanup (v1.1.0)

The following unused code was removed to reduce redundancy:

### Removed Unused Functions:
- `DnDState.setCharacter()`, `getCharacter()`, `updateCharacter()`, `getCharacterClasses()` (duplicates CharacterEntity methods)
- `DnDState.getStatModifier()`, `calculateArmorClass()`, `calculateInitiative()`, `calculateSpeed()`, `getTotalLevel()` (duplicates CharacterEntity methods)
- `DataUtils.getFeatureDescription()`, `getOptionDescription()`, `getFeatDescription()`, `getFeatPrerequisites()`, `getRaceAbilitySkill()`, `getRaceAbilityStatEffect()`, `getAutoGrantedProficiencies()`, `getRaceStatEffects()`, `getSkillDescription()`, `getRaceAbilityDescription()`, `getStatDescription()` (never called)
- `AbilitySystem.getRaceAbilities()`, `getSpellcastingAbility()` (never called)
- `SpellManager.getAllSpells()`, `getSpellDescription()`, `hasFeature()`, `getInnateSpellsForClass()`, etc. (never called)
- `CharacterEntity.addSpell()`, `removeSpell()`, `addItem()`, `removeItem()`, `equipItem()`, `unequipItem()`, `addAttack()`, `updateCurrency()`, `addCondition()`, `removeCondition()` (never called - inventory/combat features not connected to UI)

### Fixed Bugs:
- `js/domain/character.js:111,132`: Malformed default object `{ races, subraces }` → `{ races: [], subraces: {} }`
- `js/core/data-utils.js:99,147`: Undefined function `getRaceAbilities()` → uses `_getRaceAbilitiesFromState()`
- `js/domain/character-create.js:349`: Operator precedence in constitution modifier calculation
- `js/domain/character-create.js:138`: Duplicate assignment removed
- `js/ui/render.js:222`: Added fallback for `AbilitySystem.getProficiencies()`
- `js/features/levelup.js:188`: Added null check for `char.abilityIds`
- `js/features/multiclass.js:59`: Added null check for class lookup

---

## Class Files (classes/)

The JSON files in `classes/` directory are the authoritative source for class data and should NOT be modified without explicit permission. They follow a specific structure and formatting:

- Each file contains one class with fields: `id`, `name`, `primaryStat`, `desc`, `hitDie`, `hitPoints`, `multiclassRequirement`, `proficiencies`, `features`, and optionally `spellSlotTable`
- Features include level 1-20 with `features` array and `options` array
- Options arrays are formatted multi-line for readability
- Skill options are formatted multi-line for readability
- spellSlotTable entries are one per line
- Some spellcasting classes include optional fields:
  - `cantrips`: number of cantrips known (e.g., number or per level array)
  - `knownSpells`: { lvl: count } - number of spells known per level
  - `preparedSpells`: { lvl: count } - number of spells prepared per level