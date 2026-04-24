# DnD Character Creator - Architecture Guide

## Overview
A 7-step character creation wizard for Dungeons & Dragons 5th Edition (2014 rules) with support for:
- Character creation with point buy system
- Spell selection system (Wizard spellbook)
- Dynamic ability effect system for race/class features
- Type-based effect processing via feature list

---

## Current File Structure

```
/home/binko/DND/
├── index.html              # Main HTML - 7 step containers + modals
├── ARCHITECTURE.md        # This file - project architecture
├── GoalStructure.md      # Project goals/target structure
├── css/
│   └── theme.css       # All styling (tooltips, theme, buttons)
├── js/
│   ├── app.js          # Entry point, initialization
│   ├── debug.js        # Debug dropdown toggle
│   ├── renderdebug.js  # Debug dropdown content refresh
│   ├── character/      # Character data management
│   │   ├── CharacterSheet.js    # Character sheet object
│   │   └── CharacterStorage.js  # LocalStorage persistence
│   ├── effects/       # Effect recalculation system
│   │   ├── EffectHandler.js    # Effect processing
│   │   └── RecalculationFlags.js # Recalculation triggers & logic
│   ├── render/        # UI rendering
│   │   ├── Render.js         # Main render functions
│   │   └── TooltipSystem.js  # Tooltip display
│   └── states/       # State management
│       ├── DataLoaders.js        # JSON loading, data access helpers
│       ├── UIState.js           # Current step, navigation, canProceed()
│       └── UserSelectedState.js  # User selections & handlers
├── data/
│   ├── classes/       # 12 class data files (JSON)
│   ├── races/        # 9 race data files (JSON)
│   ├── descriptions/  # Read-only description text (JSON)
│   ├── effects/      # Ability effect mappings (JSON)
│   │   ├── race-effects.json       # Race effects (type-based)
│   │   ├── class-effects.json     # Class effects
│   │   ├── feat-effects.json      # Feat effects
│   │   └── class-options-effects.json
│   └── spells/       # Spells by school (339 spells)
└── refPDFs/
    └── player handbook 2014/
```

---

## Architecture Principles

### State Separation
- **UserSelectedState.js**: Holds user selections + handler functions that modify state
- **CharacterSheet.js**: Holds calculated values (derived from UserSelectedState)
- **Render.js**: Pure rendering - reads state, generates HTML

### Flow: User Action → State Update → Recalc → Render

```
User clicks → Handler (UserSelectedState.js)
    ↓
State updated (userSelection.*)
    ↓
triggerRecalc(flag) → recalculateAll()
    ↓
Recalc functions loop through characterSheet.features
    ↓
characterSheet updated
    ↓
renderXxx() called
    ↓
UI refreshed
```

---

## Directory Purposes

### `/home/binko/DND/js/app.js`
- Entry point, initialization
- Functions: `initApp()`, `startNewCharacter()`, `getDefaultSheet()`
- Setup event listeners for modals

### `/home/binko/DND/js/debug.js` & `/home/binko/DND/js/renderdebug.js`
- Debug dropdown toggle and content refresh
- Shows both `userSelection` AND `characterSheet` stats
- Auto-refreshes when selections change (called from handlers)

### `/home/binko/DND/js/character/`
- **CharacterStorage.js** - LocalStorage save/load/delete
- **CharacterSheet.js** - Character sheet object with calculated values

### `/home/binko/DND/js/effects/`
- **RecalculationFlags.js** - Main recalculation logic
  - `triggerRecalc(flag)` - main entry point
  - `recalculateAll(flag)` - calls recalc functions in order
  - `getRaceEffect(featureName)` - looks up effect in race-effects.json
  - `getEffectSelections(effect)` - handles options logic (auto-apply or user selection)
  - Functions: `recalcRaceEffects`, `recalcFeatures`, `recalcStats`, `recalcProficiencies`, etc.
  
- **EffectHandler.js** - Effect processing helper

### `/home/binko/DND/js/render/`
- **Render.js** - Main rendering functions for each step
- **TooltipSystem.js** - Displays tooltips on hover

### `/home/binko/DND/js/states/`
- **UserSelectedState.js** - User selections + handlers
  - State: `race`, `class`, `stats`, `selectedSkills`, `feats`, `featureChoices`, etc.
  - Handlers: `handleRaceSelect()`, `handleClassSelect()`, `toggleSkill()`, `toggleFeat()`, etc.
- **UIState.js** - Navigation state + `canProceed()` validation
- **DataLoaders.js** - Loads JSON, provides data access helpers

---

## Data Flow: Race Selection Change

### Step-by-Step Flow

```
User clicks race card
    │
    ▼
handleRaceSelect(raceId) [UserSelectedState.js]
    │
    ├─► userSelection.race = raceId
    ├─► userSelection.subrace = null
    ├─► triggerRecalc(RECALC_FLAGS.RACE_CHANGED)
    ├─► renderChooseRace()
    └─► refreshDebugIfOpen()
            │
            ▼
        recalculateAll("race") [RecalculationFlags.js]
            │
            ├─► recalcRaceEffects()
            │       - Reset stats to 8
            │       - getRaceStatBonuses() applies race bonuses
            │
            ├─► recalcFeatures()
            │       - Build features list (race + class)
            │       - Each feature stored with name, source
            │
            ├─► recalcVision()
            ├─► recalcSpeed()
            ├─► recalcProficiencies()
            │
            └─► recalcStats()
                    - Apply stat bonuses from features
                    - Loop: characterSheet.features → getRaceEffect() → apply if type matches
                    - recalcStatModifiers()
```

---

## Effect Types (Standardized)

Each feature in `data/effects/*.json` has a "type" field:

| Type | Triggers | Example | Has Options |
|------|----------|---------|-------------|
| `vision` | recalcVision() | Darkvision | No |
| `speed` | recalcSpeed() | Fleet Footed | No |
| `stat` | recalcStats() | Dwarven Toughness | Yes (user choice) |
| `proficiency` | recalcProficiencies() | Elf Weapon Training, Dwarven Tool Proficiency | Yes (auto-apply if length===count) |
| `skill` | recalcProficiencies() | Keen Senses | No |
| `cantrip` | recalcCantrips() | High Elf Cantrip | No |
| `spell` | recalcSpellSlots() | Drow Magic | No |
| `none` | (no recalc) | Trance, Fey Ancestry | No |

### Options Logic
If an effect has `options` array:
1. Check if user has made selections in `userSelection.featureChoices`
2. If yes → apply those selections
3. If no AND `options.length === count` → auto-apply all options
4. If no AND `options.length !== count` → wait for user to choose (don't apply)

---

## Race Effects JSON Structure

```json
{
  "effects": {
    "Darkvision": {
      "type": "vision",
      "value": 60
    },
    "Dwarven Toughness": {
      "type": "stat",
      "stat": "constitution",
      "value": 1
    },
    "Fleet Footed": {
      "type": "speed",
      "value": 5
    },
    "Choose 2 Times +1 Bonus Stat": {
      "type": "stat",
      "value": 1,
      "options": ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"],
      "count": 2
    },
    "Elf Weapon Training": {
      "type": "proficiency",
      "proficiencyType": "weapon",
      "options": ["longswords", "shortswords", "shortbows", "longbows"],
      "count": 4
    },
    "Dwarven Tool Proficiency": {
      "type": "proficiency",
      "proficiencyType": "tool",
      "options": ["smith's tools", "brewer's supplies", "mason's tools"],
      "count": 1
    },
    "Keen Senses": {
      "type": "skill",
      "skill": "Perception"
    }
  }
}
```

---

## User Selection State

```javascript
// In UserSelectedState.js
let userSelection = {
    name: '',
    lvl: 1,
    race: null,           // Selected race ID
    subrace: null,       // Selected subrace name
    class: null,         // Selected class ID
    subclass: null,      // Selected subclass
    stats: {
        strength: 8, dexterity: 8, constitution: 8,
        intelligence: 8, wisdom: 8, charisma: 8
    },
    selectedSkills: [],        // User-chosen skill proficiencies
    feats: [],                 // User-chosen feats
    featureChoices: {},        // Pending choices by key
    // ... other fields
};
```

---

## Character Sheet (Calculated)

```javascript
// In CharacterSheet.js
let characterSheet = {
    stats: { strength: 10, ... },           // Calculated with bonuses
    statModifiers: { strength: 0, ... },   // floor((score-10)/2)
    maxHp: 10,
    armorClass: 10,
    speed: 30,
    vision: { nightvision: 60, dayvision: null },
    proficiencies: {
        skills: [], weapons: [], armor: [], tools: [], savingThrows: []
    },
    features: [
        { name: "Darkvision", source: "race", sourceId: "elf" },
        { name: "Choose 2 Times +1 Bonus Stat", source: "race", sourceId: "human" }
    ],
    // ... spell data
};
```

---

## Next Button Validation (canProceed)

Each step validates required selections before enabling Next button:

| Stage | Validation |
|-------|-----------|
| 1: Race | Requires race + subrace if race has subraces |
| 2: Class | Requires class + subclass options if any |
| 3: Stats | All 27 points spent + pending choices complete |
| 4: Skills | Required number of skills selected |
| 5: Features | All pending choices complete |
| 6: Spells | Always allowed (future: spell validation) |
| 7: Overview | Always allowed (future: name required) |

---

## Key Data Structures

### Feature Choice (Pending Choice)

```javascript
{
    type: "stat",           // Effect type (stat, proficiency, etc.)
    value: 1,               // Amount to apply
    options: ["str", "dex", ...],  // Available options
    count: 2,               // How many must be chosen
    selected: [null, null]  // User's selections (null = not chosen)
}
```

---

## Character Creation Steps

| Step | Content | Key Files |
|------|---------|-----------|
| 1 | Race & Subrace Selection | `data/races/*.json`, Render.js |
| 2 | Class Selection | `data/classes/*.json`, Render.js |
| 3 | Point Buy (Stats) | DataLoaders.js, RecalculationFlags.js |
| 4 | Skills & Proficiencies | UserSelectedState.js |
| 5 | Abilities & Feats | Render.js, RecalculationFlags.js |
| 6 | Spells | Render.js (future) |
| 7 | Summary & Save | CharacterStorage.js |

---

## Adding New Content

### Adding a New Race Effect
1. Add to `data/effects/race-effects.json`
2. Include `type` field:
   - `type: "vision"` → triggers recalcVision()
   - `type: "stat"` → adds to stats (may have options for user choice)
   - `type: "proficiency"` → adds to proficiencies (may have options)
   - etc.

### Auto-apply vs User Choice
- If effect has `options` AND `options.length === count` → auto-apply all
- If effect has `options` AND `options.length !== count` → user must choose
- If no `options` → apply immediately

---

## Dependencies

### External
- None - all data is local JSON

### Browser APIs
- LocalStorage - character persistence
- Vanilla JavaScript - no frameworks

---

## Notes

- Data sourced from SRD 5.2 (2014 rules)
- 339 spells across 8 schools
- Debug dropdown shows both userSelection and characterSheet
- Recalculation follows: Reset → Process → Finalize pattern
- All handlers call `refreshDebugIfOpen()` for live debug updates