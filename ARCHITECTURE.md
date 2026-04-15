# DnD Character Creator - Architecture Guide

## Overview
A 6-step character creation wizard for Dungeons & Dragons 5th Edition with support for leveling up and multiclassing.

---

## File Structure

```
/home/binko/DND/
├── index.html          # Main HTML - 6 step containers + 3 modals
├── dnd-data.json       # Game data - classes, races, feats (loaded via fetch)
├── ARCHITECTURE.md     # This file
├── css/
│   └── theme.css       # All styling including tooltip system
└── js/
    ├── config.js       # All descriptions, prerequisites, mappings
    ├── state.js        # Global state variables
    ├── data-utils.js   # Helper functions for data lookups
    ├── features.js     # Stat calculations, feature lookups
    ├── render.js       # All render* functions (UI generation)
    ├── character.js    # Character creation/modification logic
    ├── navigation.js   # Step navigation logic
    ├── levelup.js      # Level up modal logic
    ├── multiclass.js   # Multiclass modal logic
    └── app.js          # Initialization - loads data, inits app
```

---

## Data Flow

1. **Load Phase** (`app.js`)
   - `fetch('dnd-data.json')` → loads game data
   - Populates global variables: `classes`, `races`, `subraces`, `feats`

2. **Config Phase** (`config.js`)
   - Contains all descriptions and mappings
   - Loaded as script, available immediately

3. **State Phase** (`state.js`)
   - Global `character` object holds current character data
   - Other globals: `classes`, `races`, `feats`, `pointsRemaining`

4. **Render Phase** (`render.js`)
   - Each step has a `render*()` function
   - Generates HTML based on state

5. **Interaction Phase** (`character.js`)
   - Click handlers modify `character` object
   - Re-renders relevant sections

---

## Step-by-Step Logic

| Step | Function | File | Purpose |
|------|-----------|------|---------|
| 1 | `renderClasses()` | render.js | Display class selection cards |
| 2 | `renderRaces()` | render.js | Display race selection, subraces |
| 3 | `renderStats()` + `adjustStat()` | render.js + features.js | Point buy system (27 points) |
| 4 | `renderProficiencies()` | render.js | Skill selection with race auto-grant |
| 5 | `renderAbilities()` + `renderFeats()` | render.js | Class features + feats with prerequisites |
| 6 | `renderSummary()` | render.js | Character summary + save |

---

## Key Data Structures

### character Object
```javascript
{
    classId: string,          // e.g., "fighter"
    raceId: string,            // e.g., "human"
    subraceName: string,       // e.g., "Hill Dwarf"
    stats: {
        strength: 8,
        dexterity: 8,
        constitution: 8,
        intelligence: 8,
        wisdom: 8,
        charisma: 8
    },
    proficiencyIds: string[],  // selected skills, e.g., ["Athletics", "Intimidation"]
    abilityIds: string[],       // class features/options, e.g., ["Second Wind", "Archery"]
    featIds: string[],          // selected feats, e.g., ["Alert", "Lucky"]
    level: number,              // starting level (default 1)
    humanBonusStats: string[]  // for Human race - selected bonus stats
}
```

### dnd-data.json Structure
```javascript
{
    classes: [
        {
            id: "fighter",
            name: "Fighter",
            primaryStat: "strength",
            hitDie: 10,
            proficiencies: {
                armor: ["light", "medium", "heavy", "shields"],
                weapons: ["martial weapons"],
                savingThrows: ["strength", "constitution"],
                skills: { count: 2, options: [...] }
            },
            features: {
                "1": { features: ["Second Wind"], options: [...] },
                "2": { features: ["Action Surge"], options: [] },
                // ... levels 1-20
            }
        }
    ],
    feats: ["Alert", "Athlete", ...],  // 37 PHB feats
    races: [...],
    subraces: {...}
}
```

---

## Important Functions

### features.js
| Function | Purpose |
|----------|---------|
| `getClassFeaturesForLevel(classId, level)` | Returns features/options up to a level |
| `getRaceAbilities()` | Returns all race + subrace abilities |
| `getRaceBonuses()` | Calculates stat bonuses from race |
| `getStatCost(value)` | Returns point buy cost for stat value |
| `adjustStat(stat, delta)` | Handles stat increase/decrease |
| `getExtraSkillCount()` | Returns extra skills from race |
| `getExtraFeatCount()` | Returns extra feats from race |

### data-utils.js (DataUtils)
| Function | Purpose |
|----------|---------|
| `canSelectFeat(featName, character)` | Validates feat prerequisites |
| `getFeatureDescription(featureName)` | Gets class feature description |
| `getFeatDescription(featName)` | Gets feat description |
| `getRaceAbilitySkill(abilityName)` | Maps race ability to skill |
| `getAutoGrantedProficiencies(character)` | Gets skills from race abilities |

### character.js
| Function | Purpose |
|----------|---------|
| `selectClass(classId)` | Handles class selection |
| `selectRace(raceId)` | Handles race selection |
| `selectSubrace(subraceName)` | Handles subrace selection |
| `toggleProficiency(skillName)` | Toggles skill selection |
| `toggleAbility(abilityName)` | Toggles class feature selection |
| `toggleFeat(featName)` | Toggles feat selection |
| `saveCharacter()` | Saves character to localStorage |

---

## config.js Data Mappings

### Descriptions
- `statDescriptions` - Stat purpose explanations
- `skillDescriptions` - Skill descriptions with ability
- `raceAbilityDescriptions` - Race/subrace ability descriptions
- `featDescriptions` - All 37 PHB feat descriptions
- `classFeatureDescriptions` - Class feature/descriptions (all 12 classes)

### Prerequisites & Mappings
- `featPrerequisites` - Feat prerequisites (armor, ability scores, spellcasting)
- `raceAbilitySkillMap` - Maps race abilities to skills (e.g., "Keen Senses" → "Perception")
- `raceAbilityStatEffects` - Maps race abilities to stat effects (e.g., "Dwarven Toughness" → HP/level)

---

## Adding New Content

### New Class
1. **dnd-data.json** - Add to `classes` array with:
   - `id`, `name`, `primaryStat`, `hitDie`, `multiclassRequirement`
   - `proficiencies` (armor, weapons, savingThrows, skills)
   - `features` (levels 1-20 with features and options)

2. **config.js** - Add feature descriptions to `classFeatureDescriptions`:
   ```javascript
   "Feature Name": "Description from PHB..."
   ```

### New Feat
1. **dnd-data.json** - Add feat name to `feats` array

2. **config.js** - Add to `featDescriptions`:
   ```javascript
   "Feat Name": "Description from PHB..."
   ```

3. **config.js** - Add to `featPrerequisites` (if any):
   ```javascript
   "Feat Name": { abilityScore: { stat: "strength", min: 13 } }
   ```

### New Race Ability
1. **dnd-data.json** - Add to race's `raceAbilities` array

2. **config.js** - Add to `raceAbilityDescriptions`

3. **config.js** - If grants skill, add to `raceAbilitySkillMap`:
   ```javascript
   "Ability Name": "Skill Name"
   ```

4. **config.js** - If grants stat effect, add to `raceAbilityStatEffects`:
   ```javascript
   "Ability Name": { type: "hpPerLevel", value: 1 }
   ```

---

## Known Limitations

1. **Spells not implemented** - Future feature
2. **Expertise vs Proficiency** - Binary only (has proficiency), no distinction for expertise
3. **Multiclass** - Prerequisites checked at selection time only
4. **Some race stat effects not tracked** - Only Dwarven Toughness currently in `raceAbilityStatEffects`

---

## CSS Classes

### Checkbox Items
- `.checkbox-item` - Base style for checkboxes
- `.race-ability` - Race-granted abilities (locked, shows 🔒)
- `.disabled` - Disabled/faded state (opacity 0.5)

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

## Future Enhancements (Not Yet Implemented)

1. Spell management system
2. Equipment/weapons selection
3. Detailed character sheet view with all stats
4. Export to PDF
5. Inventory management
6. Full leveling system with ability score increases
