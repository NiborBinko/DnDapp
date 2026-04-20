# DnD Character Creator - Architecture Guide

## Overview
A 7-step character creation wizard for Dungeons & Dragons 5th Edition (2014 rules) with support for:
- Character creation with point buy system
- Spell selection system (Wizard spellbook)
- Dynamic ability effect system for race/class features
- Type-based effect processing via EffectHandler

---

## Current File Structure

```
/home/binko/DND/
├── index.html              # Main HTML - 7 step containers + modals
├── ARCHITECTURE.md        # This file - project architecture
├── GoalStructure.md      # Project goals/target structure
├── css/
│   └── theme.css       # All styling (tooltips, theme, bonus buttons)
├── js/
│   ├── app.js          # Entry point, event handlers
│   ├── debug.js        # Debug dropdown toggle
│   ├── renderdebug.js  # Debug dropdown content refresh
│   ├── character/      # Character data management
│   │   ├── CharacterSheet.js    # Character sheet display
│   │   └── CharacterStorage.js  # LocalStorage persistence
│   ├── effects/       # Effect recalculation system
│   │   ├── EffectHandler.js    # Central effect processor (NEW)
│   │   └── RecalculationFlags.js # Recalculation triggers
│   ├── render/        # UI rendering
│   │   ├── Render.js         # Main render functions
│   │   └── TooltipSystem.js  # Tooltip display
│   └── states/       # State management
│       ├── DataLoaders.js        # JSON loading, race stat bonuses
│       ├── UIState.js           # Current step, navigation
│       └── UserSelectedState.js  # User selections
├── data/
│   ├── classes/       # 12 class data files (JSON)
│   ├── races/        # 9 race data files (JSON)
│   ├── descriptions/  # Read-only description text (JSON)
│   ├── effects/      # Ability effect mappings (JSON)
│   │   ├── race-effects.json       # Race effects (type-based)
│   │   ├── class-effects.json     # Class effects
│   │   ├── feat-effects.json      # Feat effects
│   │   └── class-option-effects.json
│   └── spells/       # Spells by school (339 spells)
└── refPDFs/
    └── player handbook 2014/
```

---

## Directory Purposes

### `/home/binko/DND/js/app.js`
- Entry point and event handlers
- Functions: handleRaceSelect, handleClassSelect, adjustStat, toggleSkill, etc.
- Delegates to EffectHandler for choice toggling

### `/home/binko/DND/js/debug.js`
- Debug dropdown toggle button

### `/home/binko/DND/js/renderdebug.js`
- Debug dropdown content refresh
- Shows both userSelection AND characterSheet stats
- Auto-refreshes when selections change

### `/home/binko/DND/js/effects/`
- **EffectHandler.js** - Central effect processor
  - `loadEffects()` - loads all effect JSON files
  - `getEffectByName()` - looks up effect by name
  - `processFeature()` - switches on type to trigger recalc
  - `handleChoice()` - creates pending choice slots
  - `toggleChoice()` - generic toggle for any choice-type feature
  - `applyChoiceBonuses()` - applies stat bonuses from choices
  
- **RecalculationFlags.js** - Recalculation triggers
  - `triggerRecalc(flag)` - main entry point
  - `recalculateAll(flag)` - calls recalc functions in order
  - Functions: recalcRaceEffects, recalcFeatures, recalcStats, recalcVision, etc.

### `/home/binko/DND/js/render/`
- **Render.js** - Main rendering functions for each step
- **TooltipSystem.js** - Displays tooltips on hover

### `/home/binko/DND/js/states/`
- **DataLoaders.js** - Loads JSON, getRaceStatBonuses()
- **UIState.js** - Current step, navigation
- **UserSelectedState.js** - User selections (race, class, stats, featureChoices, etc.)

---

## Data Flow: Race Selection Change

### Trigger → Reset → Process → Finalize

```
User clicks race card
    │
    ▼
handleRaceSelect(raceId)
    │
    ├─► userSelection.race = raceId
    └─► triggerRecalc(RECALC_FLAGS.RACE_CHANGED)
            │
            ▼
        recalculateAll("race")
            │
            ├─► recalcRaceEffects()        [RESET]
            │       - Reset stats to 8
            │       - Clear old choices
            │       - getRaceStatBonuses()
            │       - Create pending choice slots [null, null]
            │
            ├─► recalcFeatures()          [PROCESS]
            │       - Build features list
            │       - EffectHandler.processAllFeatures()
            │       - EffectHandler.applyChoiceBonuses()
            │
            ├─► recalcVision()
            ├─► recalcSpeed()
            ├─► recalcProficiencies()
            │
            └─► recalcStats()             [FINALIZE]
                    - Update characterSheet.stats
                    - recalcStatModifiers()
```

---

## Effect Types (Standardized)

Each feature in `data/effects/*.json` has a "type" field:

| Type | Triggers | Example |
|------|----------|---------|
| `vision` | recalcVision() | Darkvision |
| `speed` | recalcSpeed() | Fleet Footed |
| `stat` | recalcStats() | Dwarven Toughness |
| `choice` | Creates pending choice | Human Versatility, Dwarven Tool Proficiency |
| `proficiency` | recalcProficiencies() | Elf Weapon Training |
| `skill` | recalcProficiencies() | Keen Senses |
| `cantrip` | recalcCantrips() | High Elf Cantrip |
| `spell` | recalcSpellSlots() | Drow Magic |
| `none` | (no recalc) | Trance, Fey Ancestry |

---

## Choice Handling System

### How It Works

1. **Feature has `type: "choice"`** in effects JSON
2. **EffectHandler.handleChoice()** creates pending choice in featureChoices:
   ```json
   {
     "human-bonus-stats": {
       "type": "choice",
       "effectType": "stat",
       "value": 1,
       "options": ["strength", "dexterity", ...],
       "count": 2,
       "selected": [null, null]
     }
   }
   ```
3. **User clicks** → EffectHandler.toggleChoice() updates selected
4. **EffectHandler.applyChoiceBonuses()** applies bonuses to stats

### Generic Choice Toggle
```javascript
// Any choice-type feature can use:
EffectHandler.toggleChoice('choice-key', 'value')
```

---

## Key Data Structures

### Race Effects JSON (data/effects/race-effects.json)
```json
{
  "effects": {
    "Darkvision": {
      "type": "vision",
      "value": 60
    },
    "Human Versatility": {
      "type": "choice",
      "effectType": "stat",
      "value": 1,
      "options": ["strength", "dexterity", ...],
      "count": 2
    },
    "Dwarven Tool Proficiency": {
      "type": "choice",
      "options": ["smith's tools", ...],
      "count": 1
    },
    "Keen Senses": {
      "type": "skill",
      "skill": "Perception"
    }
  }
}
```

### User Selection State (userSelection)
```javascript
{
  race: "human",
  class: "wizard",
  stats: { strength: 10, dexterity: 8, ... },
  featureChoices: {
    "human-bonus-stats": {
      type: "choice",
      effectType: "stat",
      value: 1,
      options: [...],
      count: 2,
      selected: ["strength", "dexterity"]  // or [null, null]
    }
  }
}
```

---

## Character Creation Steps

| Step | Action | Key Files |
|------|--------|-----------|
| 1 | Race Selection | data/races/*.json, Render.js |
| 2 | Class Selection | data/classes/*.json, Render.js |
| 3 | Point Buy + Bonus Choices | Render.js, EffectHandler.js |
| 4 | Proficiencies | data/effects/*.json |
| 5 | Abilities & Feats | data/descriptions/*.json |
| 6 | Spells | data/spells/*.json |
| 7 | Summary | CharacterSheet.js |

---

## Adding New Content

### Adding a New Race Effect
1. Add to `data/effects/race-effects.json`
2. Include `type` field for automatic processing:
   - `type: "vision"` → triggers recalcVision()
   - `type: "choice"` → creates pending choice
   - `type: "stat"` → adds to stats

### Adding a New Choice-Type Feature
1. Add effect with `type: "choice"` to effects JSON
2. Specify options, count, and effectType
3. EffectHandler handles the UI automatically

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
- refPDFs/ contains original source PDFs
- Debug dropdown shows both userSelection and characterSheet
- All recalculations follow: Reset → Process → Finalize pattern
