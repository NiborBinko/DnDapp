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

const skillDescriptions = {
    "Acrobatics": "Your ability to perform acrobatic stunts, including somersaults, tightrope walking, and similar tasks. (DEX)",
    "Animal Handling": "Your ability to calm, train, and work with animals. (WIS)",
    "Arcana": "Your knowledge of magical lore, spells, artifacts, and planes of existence. (INT)",
    "Athletics": "Your ability to perform physical tasks like climbing, swimming, and jumping. (STR)",
    "Deception": "Your ability to lie convincingly and disguise your true intentions. (CHA)",
    "History": "Your knowledge of historical events, civilizations, and ancient empires. (INT)",
    "Insight": "Your ability to read intentions and detect falsehoods by perceiving verbal and nonverbal cues. (WIS)",
    "Intimidation": "Your ability to threaten, frighten, or coerce others through presence. (CHA)",
    "Investigation": "Your ability to find, interpret, and piece together information from clues. (INT)",
    "Medicine": "Your ability to diagnose illnesses and treat wounds. (WIS)",
    "Nature": "Your knowledge of terrain, animals, weather, and natural phenomena. (INT)",
    "Perception": "Your ability to notice details through sight, sound, or other senses. (WIS)",
    "Performance": "Your ability to entertain through artistic expression. (CHA)",
    "Persuasion": "Your ability to influence others through honest argumentation. (CHA)",
    "Religion": "Your knowledge of gods, religious practices, and planar creatures. (INT)",
    "Sleight of Hand": "Your ability to perform tricks of manual dexterity, like picking pockets. (DEX)",
    "Stealth": "Your ability to move silently and hide. (DEX)",
    "Survival": "Your ability to track prey, navigate wilderness, and predict weather. (WIS)"
};

const raceAbilityDescriptions = {
    "Darkvision": "You can see in dim light within 60 feet as if it were bright light, and in darkness as if it were dim light.",
    "Fey Ancestry": "You have advantage on saving throws against being charmed, and magic can't put you to sleep.",
    "Dwarven Resilience": "You have advantage on saving throws against poison.",
    "Lucky": "When you roll a 1 on an attack roll, ability check, or saving throw, you can reroll and use the new result.",
    "Brave": "You have advantage on saving throws against being frightened.",
    "Menacing": "You gain proficiency in the Intimidation skill.",
    "Relentless Endurance": "When you are reduced to 0 hit points but not killed outright, you can drop to 1 hit point instead.",
    "Hellish Resistance": "You have resistance to fire damage.",
    "Gnome Cunning": "You have advantage on all Intelligence, Wisdom, and Charisma saving throws against magic.",
    "Keen Senses": "You have proficiency in the Perception skill.",
    "Mask of the Wild": "You can attempt to hide even when only lightly obscured by foliage, rain, snow, or mist.",
    "Sunlight Sensitivity": "You have disadvantage on attack rolls and Wisdom (Perception) checks that rely on sight when you or your target is in sunlight.",
    "Dwarven Toughness": "Your hit point maximum increases by 1, and it increases by 1 every time you gain a level.",
    "Stonecunning": "You have expertise in History checks related to stonework.",
    "Naturally Stealthy": "You can attempt to hide even when only obscured by a creature that is at least one size larger than you.",
    "Stout Resilience": "You have advantage on saving throws against poison, and you have resistance to poison damage.",
    "Natural Illusionist": "You know the Minor Illusion cantrip. Intelligence is your spellcasting ability for it.",
    "Artificer's Lore": "Whenever you make an Intelligence (History) check related to magical or mechanical items, alchemical objects, or technological devices, you can add twice your proficiency bonus.",
    "Breath Weapon (Acid)": "As an action, you can exhale acid in a 5-foot by 30-foot line. Creatures must make DEX save or take 2d6 acid damage (half on success).",
    "Breath Weapon (Lightning)": "As an action, you can exhale lightning in a 5-foot by 30-foot line. Creatures must make DEX save or take 2d6 lightning damage (half on success).",
    "Breath Weapon (Poison)": "As an action, you can exhale poisonous gas in a 15-foot cone. Creatures must make CON save or take 2d6 poison damage (half on success).",
    "Breath Weapon (Fire)": "As an action, you can exhale fire in a 15-foot cone. Creatures must make DEX save or take 2d6 fire damage (half on success).",
    "Breath Weapon (Cold)": "As an action, you can exhale cold in a 15-foot cone. Creatures must make CON save or take 2d6 cold damage (half on success)."
};

const featDescriptions = {
    "Alert": "You can't be surprised while conscious. Other creatures don't gain advantage on attack rolls against you as a result of being unseen. You add +5 to initiative rolls.",
    "Athlete": "When you climb or crawl, you move only 1 foot instead of spending 2 feet. Standing up from prone only costs 5 feet of movement.",
    "Actor": "You have advantage on Charisma (Deception) and Charisma (Performance) checks when interacting with creatures that don't understand your language. You can mimic speech patterns and sounds you've heard.",
    "Charger": "If you move at least 10 feet in a straight line and then hit with a melee weapon attack on the same turn, you can make a bonus action to make a melee attack with +5 damage, or use a dart to shove a creature.",
    "Crossbow Expert": "You ignore the loading property of crossbows. Being within 5 feet of a hostile creature doesn't impose disadvantage on ranged attack rolls. When you attack with a melee weapon, you can use your bonus action to make a ranged attack with a hand crossbow.",
    "Defensive Duelist": "When a creature attacks you and you can see it, and it holds a melee weapon, you can use your reaction to add your proficiency bonus to your AC.",
    "Dual Wielder": "You gain +1 AC while wielding a separate melee weapon in each hand. You can use two-weapon fighting even when the one-handed weapons aren't light. You can draw or stow two weapons when you'd normally draw or stow one.",
    "Dungeon Delver": "You have advantage on Perception and Investigation checks to detect hidden passages and traps. You search for traps twice as quickly.",
    "Durable": "When you roll a Hit Die to regain hit points, the minimum number of hit points you regain equals twice your Constitution modifier (minimum 2).",
    "Great Weapon Master": "When you score a critical hit with a melee weapon or reduce a creature to 0 hit points with one, you can make one extra melee attack as a bonus action. Before making a melee attack with a two-handed weapon, you can choose to take -5 to the attack roll for +10 to damage.",
    "Healer": "As an action, you can spend one Hit Die to heal a creature within 5 feet for HP equal to the roll + your proficiency bonus. Once per long rest, you can stabilize a dying creature without needing a kit.",
    "Heavy Armor Master": "While wearing heavy armor, you have damage reduction 1 against nonmagical attacks. Strength requirement for heavy armor is reduced by 2.",
    "Inspiring Leader": "As an action, you can inspire creatures within 60 feet who can see and hear you. Each gains temporary hit points equal to your level + your Charisma modifier. Can use once per long rest.",
    "Keen Mind": "You always know which way is north, the exact time of day, and can accurately recall anything you have seen or heard within the past month.",
    "Lightly Armored": "You gain proficiency with light armor and shields.",
    "Linguist": "You learn three languages of your choice. You can accurately copy secret messages in languages you know. Ability checks to decipher a code have advantage.",
    "Lucky": "You have 3 luck points. When you roll a d20 and don't like the result, you can spend 1 point to reroll. Attack rolls against you have disadvantage when you can see the attacker. You can also spend luck points to have enemies reroll.",
    "Mage Slayer": "You have advantage on saving throws against spells. When a creature within 5 feet casts a spell, you can make a melee attack as a reaction. When you damage a creature casting a spell, it has disadvantage on concentration checks.",
    "Magic Initiate": "Choose a class (Arcana, Nature, or Religion). You learn two cantrips and one 1st-level spell from that class's spell list. Spellcasting ability is the same as the class.",
    "Martial Adept": "You learn two maneuvers from the Battle Master archetype. You gain one superiority die (d6). You regain used dice after a short rest."
};
