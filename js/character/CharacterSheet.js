/**
 * Character sheet - final calculated state
 */
let characterSheet = {
    name: '', lvl: 1, race: '', subrace: '', class: '', subclass: '',
    stats: { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 },
    statModifiers: { strength: -1, dexterity: -1, constitution: -1, intelligence: -1, wisdom: -1, charisma: -1 },
    maxHp: 0, currentHp: 0, speed: 30, armorClass: 10, initiative: 0,
    vision: { nightvision: null, dayvision: null },
    proficiencies: { skills: [], weapons: [], armor: [], tools: [], savingThrows: [] },
    expertises: [], languages: [], features: [], feats: [],
    spellcastingAbility: null, spellSaveDC: 0, spellAttackMod: 0, spellPreparationType: null,
    spellbookSpells: [], knownCantrips: [], knownSpells: [], preparedSpells: [],
    spellSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
    maxCantripsKnown: 0, maxSpellsKnown: 0, ritualSpells: [],
    innateSpells: [], innateAbility: null
};

window.characterSheet = characterSheet;