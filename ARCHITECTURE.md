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

---

## File Structure

```
/home/binko/DND/
├── index.html              # Main HTML - 7 step containers + 4 modals
├── dnd-data.json           # Game data - classes, races, feats with spellSlotTable
├── dnd-spell-lists.json    # Spell lists per class, cantrips, invocations
├── ARCHITECTURE.md         # This file
├── css/
│   └── theme.css           # All styling including tooltip system
├── js/
│   ├── core/               # Core utilities and state management
│   │   ├── config.js      # Constants, descriptions, mappings
│   │   ├── state.js       # DnDState object - centralized state management
│   │   ├── data-utils.js  # Data validation and lookup helpers
│   │   └── global-compat.js # Shared functions
│   ├── domain/             # Business logic entities
│   │   ├── character.js           # CharacterEntity - character data model
│   │   ├── character-create.js    # Character creation handlers
│   │   ├── spells.js              # SpellManager - spell slot management
│   │   ├── spells.json           # Pure spell data (damage, description, school)
│   │   ├── inventory.js           # InventoryManager - item management
│   │   ├── monsters.js           # MonsterEntity - NPC/Monster data
│   │   └── combat.js              # CombatManager - combat calculations
│   ├── ui/                 # UI rendering and navigation
│   │   ├── render.js      # All render* functions
│   │   ├── navigation.js  # Step navigation
│   │   └── modals.js      # Modal handlers (character sheet, delete, etc.)
│   ├── features/           # Feature-specific logic
│   │   ├── levelup.js     # Level up modal logic
│   │   └── multiclass.js  # Multiclass modal logic
│   └── app.js             # Initialization - loads data, inits app
```

---

## Data Flow

1. **Load Phase** (`app.js`)
   - `fetch('dnd-data.json')` → loads class/race/feat data with `spellSlotTable`
   - `fetch('dnd-spell-lists.json')` → loads spell lists per class, cantrips, invocations
   - `fetch('js/domain/spells.json')` → loads pure spell data (name, damage, description)
   - Initializes `DnDState` with game data
   - Initializes `SpellManager` with spell data

2. **State Phase** (`core/state.js`)
   - `DnDState` holds all application state
   - `DnDState.character` - current character being created
   - `DnDState.savedCharacters` - loaded from localStorage
   - `DnDState.ui` - UI state (current step, modals, etc.)
   - `DnDState.gameData` - classes, races, feats, spells

3. **Config Phase** (`core/config.js`)
   - Contains all descriptions and mappings
   - Loaded as script, available immediately

4. **Render Phase** (`ui/render.js`)
   - Each step has a `render*()` function
   - Generates HTML based on DnDState.character

5. **Interaction Phase** (`domain/character-create.js`)
   - Click handlers modify `DnDState.character`
   - Re-renders relevant sections

---

## Step-by-Step Logic

| Step | Function | File | Purpose |
|------|----------|------|---------|
| 1 | `renderClasses()` | ui/render.js | Display class selection cards |
| 2 | `renderRaces()` | ui/render.js | Display race selection, subraces |
| 3 | `renderStats()` + `adjustStat()` | ui/render.js + core/global-compat.js | Point buy system (27 points) |
| 4 | `renderProficiencies()` | ui/render.js | Skill selection with race auto-grant |
| 5 | `renderAbilities()` + `renderFeats()` | ui/render.js | Class features + feats with prerequisites |
| 6 | `renderSpells()` | ui/render.js | Spell selection (Wizard spellbook, Warlock invocations) |
| 7 | `renderSummary()` | ui/render.js | Character summary + save |

---

## Key Data Structures

### DnDState.character Object (Full Data Model)
```javascript
{
    id: string,                    // Unique identifier
    name: string,                  // Character name
    classes: [                      // Multiclass support
        { classId: "fighter", level: 5 },
        { classId: "wizard", level: 2 }
    ],
    raceId: string,                // e.g., "human"
    subraceName: string,            // e.g., "Hill Dwarf"
    stats: {                       // Base stats (before race bonuses)
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
    },
    humanBonusStats: string[],     // For Human race - selected bonus stats
    hitPoints: {                   // HP tracking
        current: 25,
        max: 25,
        temp: 0
    },
    spellSlots: {                 // Spell slot tracking (1-9)
        1: 4,
        2: 3,
        3: 2
    },
    cantripsKnown: string[],       // Selected cantrips
    knownSpells: string[],         // Known spells (Sorcerer, Bard, Ranger, etc.)
    preparedSpells: string[],      // Prepared spells (Cleric, Druid, Paladin)
    spellbook: string[],           // Wizard's spellbook (unlimited)
    invocations: string[],         // Warlock's Eldritch Invocations
    spells: string[],              // General spell reference
    proficiencyIds: string[],      // Selected skills
    abilityIds: string[],         // Class features + race abilities (includes Spellcasting/Pact Magic)
    featIds: string[],             // Selected feats
    selectedOptions: [{            // Class options selected
        optionId: "archery",
        feature: "Archery",
        level: 1,
        classId: "fighter"
    }],
    inventory: [{                 // Items in inventory
        id: "potion-1",
        name: "Health Potion",
        quantity: 3,
        weight: 0.5
    }],
    equippedItems: [],             // Currently equipped
    attacks: [],                   // Weapon attacks
    currency: {                    // Currency
        copper: 0,
        silver: 0,
        gold: 100,
        platinum: 0
    },
    conditions: [],               // Active conditions
    deathSaves: {                  // Death saving throws
        successes: 0,
        failures: 0
    }
}
```

### dnd-data.json Structure
```javascript
{
    classes: [
        {
            id: "wizard",
            name: "Wizard",
            primaryStat: "intelligence",
            hitDie: 6,
            spellSlotTable: {        // Spell slot progression by character level
                "1": { "1": 2 }, "2": { "1": 3 }, "3": { "1": 4, "2": 1 },
                // ... levels 1-20
            },
            multiclassRequirement: { "stat": "intelligence", "min": 13 },
            proficiencies: {
                armor: [],
                weapons: ["daggers", "darts", "slings", "quarterstaffs", "light crossbows"],
                savingThrows: ["intelligence", "wisdom"],
                skills: { count: 2, options: [...] }
            },
            features: {
                "1": { features: ["Spellcasting"], options: [] },
                "2": { features: ["Arcane Recovery", "Arcane Tradition"], options: [...] },
                // ... levels 1-20
            }
        }
    ],
    feats: ["Alert", "Athlete", ...],  // 37 PHB feats
    races: [...],
    subraces: {...},
    statLabels: {...}
}
```

### dnd-spell-lists.json Structure
```javascript
{
  "spellcasting": {
    "wizard": {
      "type": "full",
      "cantripsAtLevel": { "1": 3, "2": 3, "3": 3, ... },
      "spellsKnownAtLevel": { "1": 6, "2": 8, ... },
      "spellList": {
        "0": ["fire-bolt", "light", ...],      // Cantrips
        "1": ["burning-hands", "magic-missile", ...],
        "2": ["acid-arrow", "misty-step", ...],
        // ... levels 1-9
      },
      "innateSpells": {}  // Auto-granted spells at certain levels
    },
    "warlock": {
      "type": "warlock",
      "cantripsAtLevel": { ... },
      "spellsKnownAtLevel": { ... },
      "spellList": { ... },
      "innateSpells": { "3": ["devil-sight"], "5": ["darkness"], ... },
      "invocations": {          // Eldritch Invocations unlocked at level
        "2": ["agonizing-blast", "armor-of-shadows", ...],
        "5": [...],
        // ...
      },
      "invocationsAtLevel": { "1": 0, "2": 2, "3": 2, "5": 3, ... }
    }
  }
}
```

### spells.json Structure (Pure Spell Data)
```javascript
{
  "cantrips": {
    "fire-bolt": {
      "name": "Fire Bolt",
      "school": "Evocation",
      "castingTime": "1 action",
      "range": "120 feet",
      "components": "V, S",
      "duration": "Instantaneous",
      "description": "You hurl a mote of fire...",
      "damage": "1d10",
      "damageType": "fire"
    }
  },
  "level1": {
    "magic-missile": { ... }
  }
}
```

---

## Domain Entities

### CharacterEntity (domain/character.js)
| Function | Purpose |
|----------|---------|
| `create(data)` | Creates a new character object |
| `getTotalLevel(character)` | Calculates total character level |
| `getClasses(character)` | Returns character classes (handles multiclass) |
| `getStatModifier(character, stat)` | Calculates stat modifier |
| `calculateMaxHP(character)` | Calculates max HP including race bonuses |
| `calculateArmorClass(character)` | Calculates AC from armor + dex |
| `calculateInitiative(character)` | Calculates initiative bonus |
| `calculateSpeed(character)` | Calculates movement speed |
| `addSpell/removeSpell()` | Spell management |
| `addItem/removeItem()` | Inventory management |
| `equipItem/unequipItem()` | Equipment management |
| `addCondition/removeCondition()` | Condition tracking |

### SpellManager (domain/spells.js)
| Function | Purpose |
|----------|---------|
| `init(spellData, spellLists)` | Initialize with spell data and spell lists |
| `isSpellcaster(character)` | Check if character has "Spellcasting" or "Pact Magic" in abilityIds |
| `calculateSpellSlots(character)` | Calculate spell slots from all classes using spellSlotTable |
| `getHighestSpellSlotLevel(character)` | Get max spell level available |
| `getCantripsKnownForClass(classId, level)` | Get cantrips known at character level |
| `getAvailableSpellsForClass(classId)` | Get all spells available to class |
| `getInnateSpellsForClass(classId, level)` | Get auto-granted spells |
| `getInvocationsAvailable(character)` | Get Warlock invocations available at level |
| `getInvocationsAtLevel(level)` | Get number of invocations at level |
| `isWizard(character)` | Check if character has Wizard class |
| `isWarlock(character)` | Check if character has Warlock class |
| `isPreparedCaster(character)` | Check if character is Cleric/Druid/Paladin |
| `getSpellSaveDC(character, ability)` | Calculates spell save DC |
| `getSpellAttackBonus(character, ability)` | Calculates spell attack bonus |
| `getSpellDescription(spellId)` | Get full spell description with damage/DC |
| `getSpell(spellId)` | Get spell data from spells.json |

### InventoryManager (domain/inventory.js)
| Function | Purpose |
|----------|---------|
| `addItemToInventory(character, item)` | Adds item to inventory |
| `removeItemFromInventory(character, itemId)` | Removes item |
| `equipItem/unequipItem()` | Equipment management |
| `calculateEncumbrance(character)` | Calculates total weight |
| `canCarryItem(character, item)` | Checks if item can be carried |

### MonsterEntity (domain/monsters.js)
| Function | Purpose |
|----------|---------|
| `create(data)` | Creates monster entity |
| `getMonster(name)` | Gets monster by name |
| `calculateChallengeRating(monster)` | Calculates CR |
| `calculateXP(cr)` | Calculates XP from CR |
| `rollInitiative(monster)` | Rolls initiative for monster |
| `getAttackRoll(monster, attackName)` | Calculates attack bonus |

### CombatManager (domain/combat.js)
| Function | Purpose |
|----------|---------|
| `startCombat(participants)` | Initializes combat |
| `rollInitiative(participants)` | Rolls initiative for all |
| `makeAttack(attacker, target, attackName)` | Resolves attack roll |
| `rollDamage(attacker, attackName)` | Rolls damage |
| `makeSavingThrow(target, dc, ability)` | Resolves saving throw |
| `applyDamage(target, damage, type)` | Applies damage |
| `healTarget(target, amount)` | Heals target |
| `makeDeathSave(character)` | Resolves death save |

---

## core/data-utils.js Functions

| Function | Purpose |
|----------|---------|
| `DataUtils.canSelectFeat(featName, character)` | Validates feat prerequisites |
| `DataUtils.getFeatureDescription(classId, featureName)` | Gets class feature description |
| `DataUtils.getFeatDescription(featName)` | Gets feat description |
| `DataUtils.getRaceAbilitySkill(abilityName)` | Maps race ability to skill |
| `DataUtils.getAutoGrantedProficiencies(character)` | Gets skills from race abilities |
| `DataUtils.getRaceStatEffects(character)` | Gets stat effects from race |

---

## core/config.js Data Mappings

### Descriptions
- `statDescriptions` - Stat purpose explanations
- `skillDescriptions` - Skill descriptions with ability
- `raceAbilityDescriptions` - Race/subrace ability descriptions
- `featDescriptions` - All 37 PHB feat descriptions
- `classFeatureDescriptions` - Class feature/descriptions (all 12 classes)

### Prerequisites & Mappings
- `featPrerequisites` - Feat prerequisites (armor, ability scores, spellcasting)
- `raceAbilitySkillMap` - Maps race abilities to skills (e.g., "Keen Senses" → "Perception")
- `raceAbilityStatEffects` - Maps race abilities to stat effects

---

## Modals

| Modal | ID | Purpose |
|-------|-----|---------|
| Character Sheet | `character-sheet-modal` | View character details |
| Delete Confirm | `delete-confirm-modal` | Confirm character deletion |
| Level Up | `level-up-modal` | Level up character |
| Multiclass | `multiclass-modal` | Add multiclass |

---

## Adding New Content

### New Spellcasting Class
1. **dnd-data.json** - Add to `classes` array with:
   - `id`, `name`, `primaryStat`, `hitDie`, `multiclassRequirement`
   - `spellSlotTable` - spell slot progression by level
   - `proficiencies` (armor, weapons, savingThrows, skills)
   - `features` (levels 1-20 - include "Spellcasting" feature at appropriate level)

2. **dnd-spell-lists.json** - Add to `spellcasting` object:
   - `cantripsAtLevel` - number of cantrips at each level
   - `spellsKnownAtLevel` - number of spells known at each level (0 for prepared casters)
   - `spellList` - array of spell IDs available at each level
   - `innateSpells` - auto-granted spells at specific levels

### New Spell
1. **js/domain/spells.json** - Add to appropriate level section:
   - `name`, `school`, `castingTime`, `range`, `components`, `duration`
   - `description` - spell text
   - `damage`, `damageType` - optional damage info
   - `healing` - optional healing info

### New Warlock Invocation
1. **dnd-spell-lists.json** - Add invocation ID to `warlock.invocations` at appropriate level key

### New Feat
1. **dnd-data.json** - Add feat name to `feats` array

2. **config.js** - Add to `featDescriptions` and optionally `featPrerequisites`

### New Race Ability
1. **dnd-data.json** - Add to race's `raceAbilities` array

2. **config.js** - Add to `raceAbilityDescriptions`

3. **config.js** - If grants skill, add to `raceAbilitySkillMap`

4. **config.js** - If grants stat effect, add to `raceAbilityStatEffects`

---

## Spell System Architecture

### How Spellcasting Detection Works
1. Character is a spellcaster if `abilityIds` contains "Spellcasting" or "Pact Magic"
2. These features are automatically added based on class features (e.g., Wizard gets "Spellcasting" at level 1)
3. Detection happens in `SpellManager.isSpellcaster(character)`

### Spell Slot Calculation
- Uses `spellSlotTable` from class definition in dnd-data.json
- For multiclassing: slots from all classes are combined (like official rules)
- Example: Wizard 5/Cleric 5 would have full progression

### Wizard vs Other Casters
- **Wizard**: Unlimited spellbook, no spells known limit
  - Shows all spells up to highest slot level
  - Stores in `spellbook` array
- **Other Known Spells** (Sorcerer, Bard, Ranger): Limited by spells known
  - Shows spells up to slot level
  - Stores in `knownSpells` array
- **Prepared** (Cleric, Druid, Paladin): Prepare from spell list
  - Stores in `preparedSpells` array
- **Warlock**: No preparation, has invocations
  - Stores in `knownSpells` array
  - Plus `invocations` array for Eldritch Invocations

### Warlock Invocations
- Available starting at level 2 (2 invocations)
- +1 at levels 5, 7, 9, 11, 13, 15, 17
- Stored in `invocations` array in character data

---

## Known Limitations

1. **Some race stat effects not tracked** - Only Dwarven Toughness currently in `raceAbilityStatEffects`
2. **Expertise vs Proficiency** - Binary only (has proficiency), no distinction for expertise
3. **Spells.json only contains cantrips and 1st level** - Higher levels need to be added

---

## CSS Classes

### Checkbox Items
- `.checkbox-item` - Base style for checkboxes
- `.race-ability` - Race-granted abilities (locked, shows 🔒)
- `.spell-disabled` - Disabled spell selection (opacity 0.5)
- `.innate-spell` - Innate/auto-granted spells (accent border)

### Tooltips
- `[data-tooltip]` - Element with tooltip
- `[data-tooltip]::after` - Tooltip popup (pseudo-element)
- `.disabled[data-tooltip]::after` - Tooltip for disabled items (always opaque)

---

## Testing Tips

- Use browser dev tools - check console for errors
- Check `localStorage` for saved characters: `localStorage.getItem('dnd-characters')`
- Clear localStorage to reset: `localStorage.clear()`

---

## Future Enhancements (Planned)

1. Expanded spell database (add levels 2-9 to spells.json)
2. Equipment/weapons selection (inventory.js)
3. Detailed character sheet view with all stats
4. Export to PDF
5. Full inventory management (inventory.js)
6. Premade monsters library (monsters.js)
7. Combat tracker (combat.js)
   - Initiative calculator
   - Damage roller
   - Turn tracker
   - AC calculation
