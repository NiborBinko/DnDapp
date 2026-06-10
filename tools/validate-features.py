#!/usr/bin/env python3
"""
validate-features.py — validates D&D 5e SRD feature/effect data integrity.
Usage: python3 tools/validate-features.py
"""

import json
import os
import re

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
EFFECTS_DIR = os.path.join(DATA_DIR, 'effects')
DESCRIPTIONS_DIR = os.path.join(DATA_DIR, 'descriptions')
CLASSES_DIR = os.path.join(DATA_DIR, 'classes')

KNOWN_TYPES = {
    'lookup', 'none',
    'proficiency', 'choice', 'innate', 'mainspell', 'cantrips',
    'resistance', 'immunity', 'vulnerability',
    'savingThrow', 'stat', 'speed', 'vision', 'language', 'feat', 'maxHP', 'skill'
}

HANDLED_IN_GLOSSARY = {
    'innate', 'proficiency', 'vision', 'speed', 'choice',
    'cantrips', 'resistance', 'immunity', 'vulnerability',
    'savingThrow', 'stat', 'language', 'feat', 'mainspell',
    'maxHP', 'skill'
}

OPTIONAL_CHOICE_TYPES = {
    'hunter-prey', 'hunter-defense', 'hunter-attack', 'hunter-superior',
    'totem-spirit', 'totem-attunement', 'resistance-type',
    'fighting-style', 'transmuter-stone', 'transmuter-master', 'third-eye'
}

errors = []
warnings = []

def read_json(path):
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return json.load(f)

def option_to_key(name):
    return re.sub(r'[^a-z0-9]+', '-', name.lower().replace("'", '')).strip('-')

# 1. Load all effect data
class_effects = (read_json(os.path.join(EFFECTS_DIR, 'class-effects.json')) or {}).get('effects', {})
subclass_effects = (read_json(os.path.join(EFFECTS_DIR, 'subclass-effects.json')) or {}).get('effects', {})
race_effects = (read_json(os.path.join(EFFECTS_DIR, 'race-effects.json')) or {}).get('effects', {})
feat_effects = (read_json(os.path.join(EFFECTS_DIR, 'feat-effects.json')) or {}).get('effects', {})
class_option_effects = (read_json(os.path.join(EFFECTS_DIR, 'class-option-effects.json')) or {}).get('options', {})

all_effect_keys = set()
all_effect_keys.update(class_effects.keys())
all_effect_keys.update(subclass_effects.keys())
all_effect_keys.update(race_effects.keys())
all_effect_keys.update(feat_effects.keys())

effect_files = [
    ('class-effects.json', class_effects),
    ('subclass-effects.json', subclass_effects),
    ('race-effects.json', race_effects),
    ('feat-effects.json', feat_effects),
]

# CHECK 1: Unknown types
print('\n=== CHECK 1: Unknown effect types ===')
for source, entries in effect_files:
    for key, val in entries.items():
        t = val.get('type')
        if t not in KNOWN_TYPES:
            errors.append(f'{source}:{key} has unknown type "{t}"')
print(f'  Checked types in {len(effect_files)} effect files')

# CHECK 2: Glossary handler coverage
print('\n=== CHECK 2: Glossary handler coverage ===')
for source, entries in effect_files:
    for key, val in entries.items():
        t = val.get('type')
        if t not in ('lookup', 'none') and t not in HANDLED_IN_GLOSSARY:
            warnings.append(f'{source}:{key} has type "{t}" with no glossary handler')
print(f'  {len([w for w in warnings if "glossary handler" in w])} uncovered type(s)')

# CHECK 3: Choice options cross-reference
print('\n=== CHECK 3: Choice options cross-reference ===')
for source, entries in effect_files[:2]:
    for key, val in entries.items():
        if val.get('type') == 'choice' and val.get('options'):
            ct = val.get('choiceType', '')
            for opt in val['options']:
                opt_key = option_to_key(opt)
                if opt_key not in all_effect_keys and ct not in OPTIONAL_CHOICE_TYPES:
                    warnings.append(f'{source}:{key} option "{opt}" (key: {opt_key}) has no matching effect entry')
print(f'  Cross-reference check done')

# CHECK 4: Level prereq completeness
print('\n=== CHECK 4: Level prerequisite completeness ===')
for source, entries in effect_files[:2]:
    for key, val in entries.items():
        if val.get('type') == 'choice' and val.get('levelPrereqs') and val.get('options'):
            for opt in val['options']:
                if opt not in val['levelPrereqs']:
                    warnings.append(f'{source}:{key} option "{opt}" has no level prerequisite defined')
print(f'  Level prereq check done')

# CHECK 5: Duplicate keys
print('\n=== CHECK 5: Duplicate effect keys ===')
key_sources = {}
for source, entries in effect_files[:3]:
    for key in entries:
        key_sources.setdefault(key, []).append(source)
for key, sources in key_sources.items():
    if len(sources) > 1:
        warnings.append(f'Effect key "{key}" in multiple files: {", ".join(sources)}')
print(f'  Duplicate key check done')

# CHECK 6: Class JSON feature to effect mapping
print('\n=== CHECK 6: Class JSON feature to effect mapping ===')
if os.path.isdir(CLASSES_DIR):
    for cf in sorted(os.listdir(CLASSES_DIR)):
        if not cf.endswith('.json'):
            continue
        cls = read_json(os.path.join(CLASSES_DIR, cf))
        if not cls:
            continue
        features_by_level = cls.get('features', {})
        for lvl, data in features_by_level.items():
            for fname in data.get('features', []):
                fkey = fname.lower()
                if fkey not in all_effect_keys and fkey not in ('spellcasting', 'pact magic', '+1 feat', '+1 proficiency'):
                    warnings.append(f'{cf}: Level {lvl} feature "{fname}" (key: {fkey}) has no matching effect entry')
print(f'  Class feature mapping check done')

# CHECK 7: Option descriptions for choice options
print('\n=== CHECK 7: Description coverage for choice options ===')
maneuvers_desc = read_json(os.path.join(DESCRIPTIONS_DIR, 'maneuvers.json')) or {}
invocations_desc = read_json(os.path.join(DESCRIPTIONS_DIR, 'invocations.json')) or {}
disciplines_desc = read_json(os.path.join(DESCRIPTIONS_DIR, 'disciplines.json')) or {}
# Check invocation options have descriptions
inv_effect = class_effects.get('eldritch invocations', {})
if inv_effect.get('options'):
    for opt in inv_effect['options']:
        opt_key = option_to_key(opt)
        if opt not in invocations_desc:
            warnings.append(f'Invocation "{opt}" has no description in invocations.json')
# Check discipline options have descriptions
disc_effect = subclass_effects.get('disciple-of-the-elements', {})
if disc_effect.get('options'):
    for opt in disc_effect['options']:
        if opt not in disciplines_desc:
            warnings.append(f'Discipline "{opt}" has no description in disciplines.json')

print(f'  Description coverage check done')

# REPORT
print('\n' + '=' * 40)
print(f'VALIDATION COMPLETE')
print(f'  Errors:   {len(errors)}')
print(f'  Warnings: {len(warnings)}')
print('=' * 40)

if errors:
    print('\n=== ERRORS ===')
    for e in errors:
        print(f'  [ERROR] {e}')

if warnings:
    print('\n=== WARNINGS ===')
    for w in warnings:
        print(f'  [WARN] {w}')

if not errors and not warnings:
    print('  All checks passed!')
