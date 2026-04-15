const stats = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const MAX_LEVEL = 20;

const statDescriptions = {
    strength: "Measures your character's physical power. Affects melee damage, carrying capacity, and Athletics checks.",
    dexterity: "Measures your character's agility, reflexes, and balance. Affects AC, initiative, and ranged attacks.",
    constitution: "Measures your character's health and stamina. Affects hit point maximum.",
    intelligence: "Measures your character's mental acuity and memory. Important for wizards and knowledge skills.",
    wisdom: "Measures your character's perception, insight, and willpower. Important for clerics, rangers, and perception checks.",
    charisma: "Measures your character's force of personality and social influence. Important for bards, paladins, and social checks."
};

const statAbbreviations = {
    strength: "STR",
    dexterity: "DEX",
    constitution: "CON",
    intelligence: "INT",
    wisdom: "WIS",
    charisma: "CHA"
};
