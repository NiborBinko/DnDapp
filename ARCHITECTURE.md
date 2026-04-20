# DnD Character Creator - Architecture Guide

## Overview
A 7-step character creation wizard for Dungeons & Dragons 5th Edition (2014 rules) with support for:
- Character creation with point buy system
- Spell selection system (Wizard spellbook)
- Dynamic ability effect system for race/class features

---

## Current File Structure

```
/home/binko/DND/
├── index.html              # Main HTML - 7 step containers + modals
├── ARCHITECTURE.md        # This file - project architecture (current)
├── GoalStructure.md      # Project goals/target structure
├── css/
│   └── theme.css         # All styling (tooltips, theme)
├── js/
│   ├── app.js           # Entry point - loads data, initializes app
│   ├── character/       # Character data management
│   │   ├── CharacterSheet.js  # Character sheet display/rendering
│   │   └── CharacterStorage.js # LocalStorage persistence
│   ├── effects/         # Effect recalculation
│   │   └── RecalculationFlags.js # Flags for what needs recalc
│   ├── render/         # UI rendering
│   │   ├── Render.js       # Main render functions
│   │   └── TooltipSystem.js # Tooltip display
│   └── states/        # State management
│       ├── DataLoaders.js    # Parallel JSON loading
│       ├── UIState.js       # Current step, navigation state
│       └── UserSelectedState.js # User selections
├── data/
│   ├── classes/       # 12 class data files (JSON)
│   │   ├── barbarian.json     # Barbarian class
│   │   ├── bard.json        # Bard class
│   │   ├── cleric.json     # Cleric class
│   │   ├── druid.json     # Druid class
│   │   ├── fighter.json   # Fighter class
│   │   ├── monk.json      # Monk class
│   │   ├── paladin.json    # Paladin class
│   │   ├── ranger.json    # Ranger class
│   │   ├── rogue.json     # Rogue class
│   │   ├── sorcerer.json # Sorcerer class
│   │   ├── warlock.json  # Warlock class
│   │   └── wizard.json   # Wizard class
│   ├── races/       # 9 race data files (JSON)
│   │   ├── dragonborn.json  # Dragonborn race
│   │   ├── dwarf.json     # Dwarf race
│   │   ├── elf.json       # Elf race (includes subraces)
│   │   ├── gnome.json     # Gnome race
│   │   ├── halfelf.json   # Half-Elf race
│   │   ├── halfling.json # Halfling race
│   │   ├── halforc.json # Half-Orc race
│   │   ├── human.json    # Human race
│   │   └── tiefling.json  # Tiefling race
│   ├── descriptions/ # Read-only description text (JSON)
│   │   ├── class-abilities.json    # Class feature descriptions
│   │   ├── class-options.json      # Subclass/archetype options
│   │   ├── exclusive-groups.json   # Mutually exclusive features
│   │   ├── feats.json           # Feat descriptions
│   │   ├── proficiencies.json   # Armor, weapons, tools, skills
│   │   ├── race-abilities.json # Race ability text
│   │   ├── statLabels.json    # STR, DEX, etc abbreviations
│   │   └── stats.json         # Stat descriptions
│   ├── effects/    # Ability effect mappings (JSON)
│   │   ├── class-effects.json       # Class feature effects
│   │   ├── class-option-effects.json # Subclass effects
│   │   ├── feat-effects.json     # Feat effects
│   │   └── race-effects.json    # Race ability effects
│   └── spells/   # Spells organized by school (339 spells total)
│       ├── abjuration.json     # 48 spells - protective magic
│       ├── conjuration.json    # 54 spells - summoning/creating
│       ├── divination.json     # 31 spells - knowledge/scrying
│       ├── enchantment.json   # 34 spells - charm/mind control
│       ├── evocation.json    # 55 spells - energy/damage
│       ├── illusion.json     # 29 spells - deception
│       ├── necromancy.json   # 27 spells - death/undeath
│       └── transmutation.json # 61 spells - transformation
└── refPDFs/
    └── player handbook 2014/  # Source PDF files
        ├── 5E_Player's_Handbook.pdf   # Official WotC PHB
        ├── allspellsdesc.pdf         # Extracted spell descriptions
        └── pages_208-212.pdf         # Spell lists extracted
```

---

## Directory Purposes

### `/home/binko/DND/index.html`
- Main HTML entry point
- Contains 7 step containers for wizard
- Contains modals for character sheet, delete confirmation, etc
- Loads js/app.js

### `/home/binko/DND/css/theme.css`
- All CSS styling
- Theme colors (gold/black D&D theme)
- Tooltip styling and positioning
- Step visibility toggles

### `/home/binko/DND/js/app.js`
- Entry point
- Loads all JSON files in parallel via DataLoaders.js
- Initializes state managers
- Sets up event listeners

### `/home/binko/DND/js/character/`
- **CharacterSheet.js** - Renders the final character sheet with all stats, equipment, spells
- **CharacterStorage.js** - Saves/loads character to LocalStorage for persistence

### `/home/binko/DND/js/effects/`
- **RecalculationFlags.js** - Defines which data needs recalculation when selections change (class, race, subrace, stats, level)

### `/home/binko/DND/js/render/`
- **Render.js** - Main rendering functions for each step (class selection, race selection, etc)
- **TooltipSystem.js** - Displays tooltips on hover for abilities, features

### `/home/binko/DND/js/states/`
- **DataLoaders.js** - Loads all JSON files in parallel, stores in DnDState.gameData
- **UIState.js** - Tracks current step, navigation state
- **UserSelectedState.js** - Tracks user's selections (selected class, race, etc)

### `/home/binko/DND/data/classes/`
- Individual class JSON files (12 total)
- Each contains: id, name, primaryStat, hitDie, hitPoints, proficiencies, features by level
- Features include: name, text description
- Spellcasting info (spell casting ability, cantrips known, spells known, prepared)

### `/home/binko/DND/data/races/`
- Individual race JSON files (9 total)
- Each contains: id, name, statBonuses, abilities
- Subraces nested within main race file (e.g., elf includes High Elf, Wood Elf)

### `/home/binko/DND/data/descriptions/`
- **class-abilities.json** - Text descriptions for all class features
- **class-options.json** - Subclass/archetype options text
- **exclusive-groups.json** - Features that can't be taken together
- **feats.json** - Feat descriptions
- **proficiencies.json** - Armor/weapon/tool/skill descriptions
- **race-abilities.json** - Racial ability text
- **statLabels.json** - Stat abbreviations (STR, DEX, CON, INT, WIS, CHA)
- **stats.json** - Stat descriptions for tooltips

### `/home/binko/DND/data/effects/`
- **class-effects.json** - What class features do (skill bonuses, spellcasting, etc)
- **class-option-effects.json** - Subclass feature effects
- **feat-effects.json** - Feat effects (stat bonuses, skills, etc)
- **race-effects.json** - Racial ability effects (darkvision, weapon proficiencies, etc)

### `/home/binko/DND/data/spells/`
- 339 spells organized by school
- Each file: `{ "schoolname": [ {spell}, ... ] }`
- Spell format: name, level, ritual, casttime, range, components, duration, description
- Sorted by level (0 cantrips first, then 1-9), then alphabetically

### `/home/binko/DND/refPDFs/player handbook 2014/`
- **5E_Player's_Handbook.pdf** - Official WotC Player's Handbook (71MB)
- **allspellsdesc.pdf** - Extracted spell descriptions from PHB
- **pages_208-212.pdf** - Spell lists pages extracted

---

## Data Flow

### 1. Load Phase (js/app.js)
1. Calls DataLoaders.loadAll() in parallel
2. Loads all JSON from data/ directories
3. Stores in DnDState.gameData
4. Initializes: UIState, CharacterStorage

### 2. Selection Phase (user clicks)
1. RecalculationFlags.check() determines what needs recalc
2. Ability effects recalculated
3. Render.js updates affected UI sections

### 3. Character Creation Flow
| Step | Action | Key Files |
|------|--------|-----------|
| 1 | Class Selection | data/classes/*.json, Render.js |
| 2 | Race Selection | data/races/*.json, Render.js |
| 3 | Point Buy | UIState.js, Render.js |
| 4 | Proficiencies | data/effects/*.json, Render.js |
| 5 | Abilities & Feats | data/descriptions/*.json, Render.js |
| 6 | Spells | data/spells/*.json, Render.js |
| 7 | Summary | CharacterSheet.js |

---

## Key Data Structures

### Spell JSON Format (data/spells/{school}.json)
```json
{
  "schoolname": [
    {
      "name": "Acid Splash",
      "level": 0,
      "ritual": false,
      "casttime": "action",
      "range": "60 feet",
      "components": "V, S",
      "duration": "Instantaneous",
      "description": "You create an acidic bubble..."
    }
  ]
}
```
- level: 0 = cantrip, 1-9 = spell levels
- Sorted by level, then alphabetically

### Class JSON Format (data/classes/{class}.json)
```json
{
  "id": "wizard",
  "name": "Wizard",
  "primaryStat": "intelligence",
  "hitDie": "d6",
  "hitPoints": 6,
  "spellcasting": { "ability": "intelligence", "levels": {...} },
  "proficiencies": { "armor": [], "weapons": ["quarterstaff"], "skills": [...] },
  "features": {
    "1": [ { "name": "Spellcasting", "text": "..." } ],
    "2": [ { "name": "Ritual Casting", "text": "..." } ]
  }
}
```

### Race JSON Format (data/races/{race}.json)
```json
{
  "id": "elf",
  "name": "Elf",
  "statBonuses": { "dexterity": 2 },
  "abilities": [ "Keen Senses", "Fey Ancestry", "Trance" ],
  "subraces": [ { "id": "high-elf", "name": "High Elf", "bonus": {...} } ]
}
```

---

## Adding New Content

### Adding a New Spell
1. Add to appropriate `data/spells/{school}.json`
2. Follow format: name, level, ritual, casttime, range, components, duration, description

### Adding a New Class
1. Create `data/classes/{classid}.json`
2. Include all required fields (id, name, primaryStat, hitDie, etc)
3. Add features for levels 1-20

### Adding a New Race
1. Create `data/races/{raceid}.json`
2. Include statBonuses, abilities
3. Add subraces if applicable

---

## Dependencies

### External
- None - all data is local JSON files

### Browser APIs
- LocalStorage - character persistence
- Vanilla JavaScript - no frameworks

---

## Notes

- Data sourced from SRD 5.2 (2014 rules)
- 339 spells across 8 schools
- refPDFs/ contains original source PDFs