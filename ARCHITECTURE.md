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
├── dnd-classes.json             # Class data per level (features, options, spell slots, proficiencies)
├── dnd-races.json               # Race data (size, speed, languages, bonuses, racial abilities)
├── dnd-feats.json               # Feat data
├── dnd-spell-lists.json          # Spell lists per class, cantrips, invocations
├── ARCHITECTURE.md              # This file
├── descriptions/                # Read-only description data (JSON)
│   ├── race-abilities.json             # Race/racial ability descriptions
│   ├── race-ability-effects.json       # Race ability effects (skill/armor/weapon/tool mappings, stat effects)
│   └── proficiencies.json              # Armor, weapons, tools, saving throws descriptions
├── css/
│   └── theme.css                 # All styling including tooltip system
├── js/
│   ├── core/                    # Core utilities and state management
│   │   ├── config.js            # Constants, stat labels, flags (descriptions moved to JSON)
│   │   ├── state.js             # DnDState object - centralized state management
│   │   ├── data-utils.js        # Data validation and lookup helpers
│   │   ├── global-compat.js     # Shared functions (getRaceAbilities, getClassFeaturesForLevel, etc.)
│   │   └── ability-system.js    # NEW: Dynamic ability effect processor
│   ├── domain/                  # Business logic entities
│   │   ├── character.js         # CharacterEntity - character data model
│   │   ├── character-create.js # Character creation handlers
│   │   ├── spells.js            # SpellManager - spell slot management
│   │   ├── spells.json          # Pure spell data (damage, description, school)
│   │   ├── inventory.js         # InventoryManager - item management
│   │   ├── monsters.js         # MonsterEntity - NPC/Monster data
│   │   └── combat.js            # CombatManager - combat calculations
│   ├── ui/                     # UI rendering and navigation
│   │   ├── render.js           # All render* functions
│   │   ├── navigation.js      # Step navigation
│   │   └── modals.js         # Modal handlers (character sheet, delete, etc.)
│   ├── features/              # Feature-specific logic
│   │   ├── levelup.js        # Level up modal logic
│   │   └── multiclass.js     # Multiclass modal logic
│   └── app.js                # Initialization - loads data, inits app
```

---

## Data Flow

### 1. Load Phase (`app.js`)
Loads all JSON files in parallel:
- `dnd-classes.json` → class data with features per level, spell slot tables
- `dnd-races.json` → race and subrace data
- `dnd-feats.json` → feat data
- `descriptions/race-abilities.json` → race ability text descriptions
- `descriptions/race-ability-effects.json` → ability effect mappings (proficiencies, stat bonuses)
- `descriptions/proficiencies.json` → armor/weapon/tool descriptions
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

### race-ability-effects.json
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

### proficiencies.json
Armor, weapons, tools descriptions:
```json
{
    "armor": { "light armor": "Padded, Leather...", "medium armor": "Hide, Chain shirt..." },
    "weapons": { "simple weapons": "...", "martial weapons": "..." },
    "tools": { "thieves' tools": "...", "smith's tools": "..." }
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