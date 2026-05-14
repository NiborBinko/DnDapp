# DND App Architecture

## Runtime Ownership
- `userSelection` (`js/states/UserSelectedState.js`): user intent and in-progress choices (race/class, picked skills/feats, `featureChoices`, class option picks).
- `characterSheet` (`js/character/CharacterSheet.js`): derived/calculated sheet used for output (stats, proficiencies, hp, spell data).
- `Render.js`: reads current state and renders UI; does not own long-term data.

## Main Lifecycle
1. User action calls a handler in `UserSelectedState.js`.
2. Handler updates `userSelection`.
3. Handler calls `triggerRecalc()` (`js/effects/RecalculationFlags.js`).
4. Recalc rebuilds derived values into `characterSheet`.
5. Stage render function redraws UI; debug panel reflects both states.

## Data Layers (separated by contract)
- Origin data:
  - `data/races/*.json`
  - `data/classes/*.json`
- Effect data (machine-readable behavior only):
  - `data/effects/race-effects.json`
  - `data/effects/class-effects.json`
  - `data/effects/feat-effects.json`
  - `data/effects/class-option-effects.json` (currently data-only, not runtime-applied)
- Description data (human-readable text only):
  - `data/descriptions/*.json`

Rule: effect JSON should not carry presentation copy; tooltip/help text belongs in description JSON.

## Effect Processing
- Effect lookup: `EffectHandler.getEffectByName(name, source)`.
- Recalc functions in `RecalculationFlags.js` apply effects to the sheet.
- Accepted runtime effect types:
  - `vision`, `speed`, `stat`, `proficiency`, `cantrips`, `mainspell`,
    `innate`, `resistance`, `immunity`, `vulnerability`, `savingThrow`,
    `feat`, `maxHP`, `lookup`, `none`.

## `featureChoices` Model
`featureChoices` stores pending/selected choices keyed by feature identity.

Shape:
```json
{
  "some feature key": {
    "type": "proficiency",
    "proficiencyType": "tool",
    "count": 1,
    "options": ["smith's tools", "brewer's supplies", "mason's tools"],
    "selected": [null],
    "featureName": "Dwarven Tool Proficiency"
  }
}
```

Behavior:
- Auto-granted: if `options.length === count`, recalc can apply all options.
- User-picked: if `count < options.length`, UI renders selectable choices; `selected` transitions from `null` slots to concrete picks.

## Step 4 Proficiencies Behavior
- Class skill picks use `selectedSkills` + `toggleSkill()`.
- Feature-based proficiency picks (tool/skill/weapon/armor where selectable) use `featureChoices` + `selectFeatureChoice()`.
- Consolidated locked display combines class + granted race proficiencies for armor/weapons.

## Current Known Constraints
- `DataLoaders.js` uses hardcoded race/class IDs today; new files are not auto-discovered unless code is updated.
- `class-option-effects.json` is not loaded/applied by runtime yet.

## Extension Guide (safe path)
When adding race/class/ability content:
1. Add origin entry in `data/races/*.json` or `data/classes/*.json`.
2. Add behavior entry in matching effect JSON.
3. Add one description entry in matching description JSON.
4. Keep names consistent (case-insensitive lookup exists, but exact naming is preferred).

## Migration Plan: Manifest-Driven Auto-Detection
Goal: remove hardcoded class/race ID arrays.

Proposed changes:
1. Add `data/races/index.json` and `data/classes/index.json` with lists of IDs/files.
2. Update `loadAllGameData()` to load index files first, then fetch listed race/class files.
3. Keep fallback to current hardcoded arrays only during transition.
4. After migration, adding a new race/class requires only:
   - create JSON file,
   - add it to the corresponding index manifest,
   - provide effect + description entries.

This preserves current architecture while making content expansion low-risk and repeatable.
