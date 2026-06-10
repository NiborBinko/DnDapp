/**
 * validate-features.js
 * Validates D&D 5e SRD feature/effect data integrity.
 * Usage: node tools/validate-features.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const EFFECTS_DIR = path.join(DATA_DIR, 'effects');
const DESCRIPTIONS_DIR = path.join(DATA_DIR, 'descriptions');
const CLASSES_DIR = path.join(DATA_DIR, 'classes');

const KNOWN_TYPES = new Set([
  'lookup', 'none',
  'proficiency', 'choice', 'innate', 'mainspell', 'cantrips',
  'resistance', 'immunity', 'vulnerability',
  'savingThrow', 'stat', 'speed', 'vision', 'language', 'feat', 'maxHP'
]);

const HANDLED_IN_GLOSSARY = new Set([
  'innate', 'proficiency', 'vision', 'speed', 'choice',
  'cantrips', 'resistance', 'immunity', 'vulnerability',
  'savingThrow', 'stat', 'language', 'feat', 'mainspell'
]);

const CHOICE_TYPE_MAP = {
  invocation: 'class-effects.json:eldritch invocations',
  discipline: 'subclass-effects.json:disciple-of-the-elements',
  maneuver: 'subclass-effects.json:combat-superiority'
};

let errors = [];
let warnings = [];

function readJSON(relPath) {
  const p = path.join(DATA_DIR, relPath);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function readEffectsFile(filename) {
  const p = path.join(EFFECTS_DIR, filename);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function readDescriptionFile(filename) {
  const p = path.join(DESCRIPTIONS_DIR, filename);
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function readClassFile(filename) {
  const p = path.join(CLASSES_DIR, filename);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// 1. Load all effect data
const classEffects = readEffectsFile('class-effects.json');
const subclassEffects = readEffectsFile('subclass-effects.json');
const raceEffects = readEffectsFile('race-effects.json');
const featEffects = readEffectsFile('feat-effects.json');
const classOptionEffects = readEffectsFile('class-option-effects.json');

const classEffectsEntries = classEffects.effects || {};
const subclassEffectsEntries = subclassEffects.effects || {};
const raceEffectsEntries = raceEffects.effects || {};
const featEffectsEntries = featEffects.effects || {};

// 2. Check all effect types are known
console.log('\n=== CHECK 1: Unknown effect types ===');
[classEffectsEntries, subclassEffectsEntries, raceEffectsEntries, featEffectsEntries].forEach((entries, i) => {
  const source = ['class-effects.json', 'subclass-effects.json', 'race-effects.json', 'feat-effects.json'][i];
  Object.entries(entries).forEach(([key, val]) => {
    if (!KNOWN_TYPES.has(val.type)) {
      errors.push(`${source}:${key} has unknown type "${val.type}"`);
    }
  });
});
console.log(`  Checked types in 4 effect files`);

// 3. Check glossary coverage for non-lookup types
console.log('\n=== CHECK 2: Glossary handler coverage ===');
[classEffectsEntries, subclassEffectsEntries, raceEffectsEntries].forEach((entries, i) => {
  const source = ['class-effects.json', 'subclass-effects.json', 'race-effects.json'][i];
  const nonLookup = Object.entries(entries).filter(([_, v]) => v.type !== 'lookup' && v.type !== 'none');
  const uncovered = nonLookup.filter(([_, v]) => !HANDLED_IN_GLOSSARY.has(v.type));
  uncovered.forEach(([key, val]) => {
    warnings.push(`${source}:${key} has type "${val.type}" which has no handler in GlossaryUI.renderEffectDetails`);
  });
});
console.log(`  ${warnings.filter(w => w.includes('no handler')).length} uncovered types found`);

// 4. Check choice options cross-reference
console.log('\n=== CHECK 3: Choice options cross-reference ===');
const allEffectKeys = new Set([
  ...Object.keys(classEffectsEntries),
  ...Object.keys(subclassEffectsEntries),
  ...Object.keys(raceEffectsEntries),
  ...Object.keys(featEffectsEntries)
]);

[classEffectsEntries, subclassEffectsEntries].forEach((entries, i) => {
  const source = ['class-effects.json', 'subclass-effects.json'][i];
  Object.entries(entries).forEach(([key, val]) => {
    if (val.type === 'choice' && val.options) {
      val.options.forEach(opt => {
        const optKey = opt.toLowerCase().replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const hasEffect = allEffectKeys.has(optKey) || key === optKey;
        if (!hasEffect && val.choiceType !== 'hunter-prey' && val.choiceType !== 'hunter-defense' && val.choiceType !== 'hunter-attack' && val.choiceType !== 'hunter-superior' && val.choiceType !== 'totem-spirit' && val.choiceType !== 'totem-attunement' && val.choiceType !== 'resistance-type' && val.choiceType !== 'fighting-style' && val.choiceType !== 'transmuter-stone' && val.choiceType !== 'transmuter-master' && val.choiceType !== 'third-eye') {
          warnings.push(`${source}:${key} option "${opt}" (key: ${optKey}) has no matching effect entry`);
        }
      });
    }
  });
});

// 5. Check level prereq completeness
console.log('\n=== CHECK 4: Level prerequisite completeness ===');
[classEffectsEntries, subclassEffectsEntries].forEach((entries, i) => {
  const source = ['class-effects.json', 'subclass-effects.json'][i];
  Object.entries(entries).forEach(([key, val]) => {
    if (val.type === 'choice' && val.levelPrereqs && val.options) {
      val.options.forEach(opt => {
        if (val.levelPrereqs[opt] === undefined) {
          warnings.push(`${source}:${key} option "${opt}" has no level prerequisite defined`);
        }
      });
    }
  });
});

// 6. Check for duplicate keys across files
console.log('\n=== CHECK 5: Duplicate effect keys ===');
const keySources = {};
[classEffectsEntries, subclassEffectsEntries, raceEffectsEntries].forEach((entries, i) => {
  const source = ['class-effects.json', 'subclass-effects.json', 'race-effects.json'][i];
  Object.keys(entries).forEach(key => {
    if (!keySources[key]) keySources[key] = [];
    keySources[key].push(source);
  });
});
Object.entries(keySources).forEach(([key, sources]) => {
  if (sources.length > 1) {
    warnings.push(`Effect key "${key}" appears in multiple files: ${sources.join(', ')}`);
  }
});

// 7. Check feature names in class JSONs map to effect keys
console.log('\n=== CHECK 6: Class JSON feature to effect mapping ===');
const classFiles = fs.readdirSync(CLASSES_DIR).filter(f => f.endsWith('.json'));
classFiles.forEach(cf => {
  const cls = readClassFile(cf);
  if (!cls) return;
  const clsId = cls.id || path.basename(cf, '.json');
  const featuresByLevel = cls.features || {};
  Object.entries(featuresByLevel).forEach(([lvl, data]) => {
    (data.features || []).forEach(fname => {
      const fkey = fname.toLowerCase();
      if (!allEffectKeys.has(fkey) && fkey !== 'spellcasting' && fkey !== 'pact magic' && fkey !== '+1 feat') {
        warnings.push(`${cf}: Level ${lvl} feature "${fname}" (key: ${fkey}) has no matching effect entry`);
      }
    });
  });
});

// 8. Report
console.log('\n========================================');
console.log(`VALIDATION COMPLETE`);
console.log(`  Errors:   ${errors.length}`);
console.log(`  Warnings: ${warnings.length}`);
console.log('========================================\n');

if (errors.length > 0) {
  console.log('=== ERRORS ===');
  errors.forEach(e => console.log(`  [ERROR] ${e}`));
}

if (warnings.length > 0) {
  console.log('=== WARNINGS ===');
  warnings.forEach(w => console.log(`  [WARN] ${w}`));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('All checks passed!');
}
