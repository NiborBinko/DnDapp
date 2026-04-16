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
    "Stonecunning": "You have proficiency with History checks related to stonework. When asked about stonework, your History check is made with proficiency (doubled).",
    "Dwarven Tool Proficiency": "You gain proficiency with artisan's tools (smith's tools, brewer's supplies, or mason's tools). Choose one.",
    "Dwarven Armor Training": "You have proficiency with light armor, medium armor, and shields.",
    "Naturally Stealthy": "You can attempt to hide even when only obscured by a creature that is at least one size larger than you.",
    "Stout Resilience": "You have advantage on saving throws against poison, and you have resistance to poison damage.",
    "Natural Illusionist": "You know the Minor Illusion cantrip. Intelligence is your spellcasting ability for it.",
    "Artificer's Lore": "Whenever you make an Intelligence (History) check related to magical or mechanical items, alchemical objects, or technological devices, you can add twice your proficiency bonus.",
    "Trance": "Elves don't need to sleep. They spend 4 hours in a trance-like meditative state to gain the same benefit other races get from 8 hours of sleep.",
    "Elf Weapon Training": "You have proficiency with the longsword, shortsword, shortbow, and longbow.",
    "High Elf Cantrip": "You know one cantrip of your choice from the Wizard spell list. Intelligence is your spellcasting ability for it.",
    "Fleet Footed": "Your base walking speed increases by 5 feet.",
    "Superior Darkvision": "You can see in dim light within 120 feet as if it were bright light, and in darkness as if it were dim light.",
    "Drow Magic": "You know the Dancing Lights cantrip. At 3rd level, you can cast Faerie Fire once per long rest. At 5th level, you can cast Darkness once per long rest.",
    "Drow Weapon Training": "You have proficiency with rapiers, shortswords, and hand crossbows.",
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
    "Martial Adept": "You learn two maneuvers from the Battle Master archetype. You gain one superiority die (d6). You regain used dice after a short rest.",
    "Medium Armor Master": "You have trained to master the use of medium armor. While wearing medium armor, you can add 3 instead of 2 to your AC if you have Dexterity 16 or higher. You also gain proficiency with medium armor.",
    "Mobile": "You are exceptionally speedy and agile. Your speed increases by 10 feet. When you use the Dash action, difficult terrain doesn't cost you extra movement. When a creature makes an opportunity attack against you, you can use your reaction to move up to half your speed without provoking opportunity attacks.",
    "Mounted Combatant": "You are a dangerous foe while mounted. You have advantage on attack rolls against creatures smaller than your mount. When a creature attacks your mount, you can use your reaction to redirect the attack to yourself. Your mount can't be knocked prone while you're on it.",
    "Observant": "You can read lips and notice things others might miss. If you can see a creature, you can read its lips while it is within 30 feet. You have advantage on Wisdom (Perception) and Intelligence (Investigation) checks.",
    "Polearm Master": "When you take the Attack action, you can use a bonus action to make a melee attack with the opposite end of your weapon (d4 damage). When a creature enters your reach, you can use your reaction to make a melee attack against it.",
    "Resilient": "Choose one ability score. You gain proficiency in saving throws using that ability. You also gain +1 to that ability score.",
    "Ritual Caster": "You have learned a number of spells that can be cast as rituals. Choose one class (Bard, Cleric, Druid, Sorcerer, Warlock, or Wizard). You learn two 1st-level spells from that class's spell list and can cast them as rituals.",
    "Sentinel": "When a creature within 5 feet makes an opportunity attack, it hits automatically. When a creature within 5 feet hits a creature other than you, you can make an opportunity attack against the attacker. When a creature lands a critical hit, you can make a melee weapon attack as a reaction.",
    "Sharpshooter": "You can make ranged attacks at long range without disadvantage. Your ranged attacks ignore half and three-quarters cover. Before making a ranged attack, you can choose to take -5 to the attack roll for +10 to damage.",
    "Shield Master": "If you are wielding a shield, you can use your bonus action to shove a creature. You can add your shield's bonus to your Dexterity saves. When a creature attacks, you can use your reaction to add your shield's AC bonus to your own.",
    "Skilled": "You gain proficiency in any combination of three skills or tools of your choice.",
    "Skulker": "You can attempt to hide when lightly obscured. When you hide, you can do so without needing cover. Your stealth checks don't suffer from being in dim light.",
    "Spell Sniper": "Your ranged spell attacks ignore half and three-quarters cover. You learn one cantrip from your chosen spellcasting class. The range of spells you cast is doubled.",
    "Tavern Brawler": "Your unarmed strikes deal 1d4 damage. When you hit a creature with an unarmed strike, you can attempt to grapple as a bonus action. You are proficient with improvised weapons.",
    "Tough": "Your hit point maximum increases by 2 for each level you gain. Your HP increases by 2 each time you level up.",
    "War Caster": "You have advantage on Constitution saving throws to maintain concentration. When a creature within 5 feet casts a spell, you can use your reaction to make a melee attack. You can cast spells even while holding a weapon in each hand.",
    "Weapon Master": "You gain proficiency with all simple and martial weapons. You can also choose four weapon types and gain expertise with them (double proficiency bonus)."
};

const classFeatureDescriptions = {
    // ============ FIGHTER FEATURES ============
    "Second Wind": "You have a limited well of stamina that you can draw on to protect yourself from harm. On your turn, you can use a bonus action to regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short or long rest before you can use it again.",
    "Action Surge": "You can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action. Once you use this feature, you must finish a short or long rest before you can use it again.",
    "Martial Archetype": "You choose an archetype from the options available. The archetype you choose grants you features at 3rd level and again at 7th, 10th, 15th, and 18th level.",
    "Ability Score Improvement": "You can increase one ability score by 2, or you can increase two ability scores by 1 each. You can't increase an ability score above 20 using this feature. Alternatively, you can forgo the ability score increase to take a feat instead.",
    "Extra Attack": "You can attack twice, instead of once, whenever you take the Attack action on your turn.",
    "Martial Archetype Feature": "You gain a feature from your chosen archetype at this level.",
    "Indomitable (one use)": "You can reroll a saving throw that you fail. If you do so, you must use the new roll. Once you use this feature, you must finish a long rest before you can use it again.",
    "Indomitable (two uses)": "You can reroll a saving throw that you fail. If you do so, you must use the new roll. You can use this feature twice per long rest.",
    "Indomitable (three uses)": "You can reroll a saving throw that you fail. If you do so, you must use the new roll. You can use this feature three times per long rest.",
    "Extra Attack (2)": "You can attack three times, instead of twice, whenever you take the Attack action on your turn.",
    "Extra Attack (3)": "You can attack four times, instead of twice, whenever you take the Attack action on your turn.",
    "Action Surge (two uses)": "You can push yourself beyond your normal limits for a moment. On your turn, you can take one additional action. You can use this feature twice per short or long rest.",

    // ============ FIGHTER FIGHTING STYLES ============
    "Archery": "You gain a +2 bonus to attack rolls you make with ranged weapons.",
    "Defense": "While you are wearing armor, you gain a +1 bonus to AC.",
    "Dueling": "When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.",
    "Great Weapon Fighting": "When you roll a 1 or 2 on a damage die for an attack you make with a melee weapon that you are wielding with two hands, you can reroll the die and must use the new roll. The weapon must have the two-handed or versatile property.",
    "Two-Weapon Fighting": "When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.",
    "Protection": "When a creature within 5 feet of you attacks a target other than you that is within 5 feet of you, you can use your reaction to impose disadvantage on the attack roll.",

    // ============ FIGHTER ARCHETYPES ============
    "Champion": "You focus on the martial aspect of the fighter class. When you choose this archetype at 3rd level, you gain the Remarkable Athlete feature. At 7th, 10th, 15th, and 18th level, you gain additional features.",
    "Battle Master": "You master the martial traditions of combat. When you choose this archetype at 3rd level, you learn combat maneuvers and gain a superiority die. At 7th, 10th, 15th, and 18th level, you gain additional maneuvers and features.",
    "Eldritch Knight": "You combine martial prowess with magical study. When you choose this archetype at 3rd level, you learn spells and can cast them using the wizard spell list. At 7th, 10th, 15th, and 18th level, you gain additional spellcasting features.",

    // ============ WIZARD FEATURES ============
    "Spellcasting": "You can cast wizard spells you know using Intelligence as your spellcasting ability. You can find your spell save DC and attack bonus in your class summary. You can cast any spell in your spellbook without preparing it. As a wizard, you need to study your spellbook to memorize spells.",
    "Arcane Recovery": "You have learned to recover some of your magical energy by studying your spellbook. Once per day when you finish a short rest, you can recover a number of spell slots equal to half your wizard level (rounded down), with a maximum of 5th level.",
    "Arcane Tradition": "You choose an arcane tradition from the options available, shaping your magical practice. Your choice grants you features at 2nd level and again at 6th, 10th, 14th, and 18th level.",
    "Ritual Casting": "You can cast any wizard spell as a ritual if it has the ritual tag. You don't need to have the spell prepared, but you must have it in your spellbook.",
    "Spell Mastery": "Choose one 1st-level spell and one 2nd-level spell from the wizard spell list. You can cast these spells at their lowest level without expending a spell slot. When you cast a spell this way, you can't cast it again until you finish a long rest.",
    "Tradition Feature": "You gain a feature from your chosen arcane tradition at this level.",
    "Timeless Body": "Your aging process slows. Any poison, disease, or effect that would age you has no effect on you.",
    "Spell Mastery (Greater)": "Choose one 3rd-level spell and one 4th-level spell from the wizard spell list. You can cast these spells at their lowest level without expending a spell slot.",
    "Spell Mastery (Master)": "Choose one 5th-level spell and one 6th-level spell from the wizard spell list. You can cast these spells at their lowest level without expending a spell slot.",
    "Spell Mastery (Supreme)": "Choose one 7th-level spell and one 8th-level spell from the wizard spell list. You can cast these spells at their lowest level without expending a spell slot.",
    "Signature Spells": "Choose two spells from the wizard spell list, one of which must be 3rd level or higher. You can cast each of these spells at its lowest level once without expending a spell slot. When you do so, you can't cast them again until you finish a long rest.",

    // ============ WIZARD ARCANE SCHOOLS ============
    "School of Abjuration": "You specialize in protective magic. Abjuration wizards are seeking to discover magical methods of defensive practice, developing techniques to ward off hostile forces.",
    "School of Conjuration": "You specialize in summoning creatures and objects. Conjurers are seeking to discover the secrets of bringing objects and creatures from other planes.",
    "School of Divination": "You specialize in viewing future events and distant places. Diviners are seers, seeking to unravel the forces of time and fate.",
    "School of Enchantment": "You specialize in charm magic. Enchanters are seeking to master the arts of influencing minds and hearts.",
    "School of Evocation": "You specialize in destructive magical energy. Evokers seek to learn the most powerful offensive spells, focusing on raw power over subtlety.",
    "School of Illusion": "You specialize in deceptive magic. Illusionists are masters of deception, creating false sensory experiences to confuse and mislead.",
    "School of Necromancy": "You specialize in the magic of life and death. Necromancers seek to understand the forces that govern mortality and undeath.",
    "School of Transmutation": "You specialize in altering the physical properties of creatures and objects. Transmuters seek to master the alchemical forces that reshape matter.",

    // ============ ROGUE FEATURES ============
    "Expertise": "Choose two of your skill proficiencies, or one of your skill proficiencies and your proficiency with thieves' tools. Your proficiency bonus is doubled for any ability check you make that uses your chosen proficiency.",
    "Sneak Attack": "You know how to strike subtly and exploit a foe's distraction. Once per turn, you can deal extra damage to a target if you have advantage on the attack roll or if another enemy of the target is within 5 feet of it and that enemy isn't incapacitated.",
    "Thieves' Cant": "During your training, you learned thieves' cant, a secret mix of dialect, jargon, and code that allows you to hide messages in seemingly normal conversation.",
    "Cunning Action": "You can take a bonus action on each of your turns in combat. This action can be used to Dash, Disengage, or Hide.",
    "Roguish Archetype": "You choose an archetype from the options available. The archetype you choose grants you features at 3rd level and again at 9th, 13th, 17th, and 20th level.",
    "Uncanny Dodge": "When an attacker that you can see hits you with an attack, you can use your reaction to halve the damage.",
    "Evasion": "You can avoid even magical and unusually devastating attacks. When you are subjected to an effect that allows you to make a Dexterity saving throw to take half damage, you instead take no damage on a success and only half damage on a failure.",
    "Reliable Talent": "Whenever you make an ability check that uses a proficiency, you can treat a d20 roll of 9 or lower as a 10.",
    "Blindsense": "If you are able to hear, you are aware of the location of any hidden or invisible creature within 10 feet of you.",
    "Slippery Mind": "You have acquired greater mental resilience. You are proficient in Wisdom saving throws.",
    "Elusive": "You are so evasive that attackers rarely gain advantage against you. Attackers don't gain advantage on attack rolls against you while you aren't incapacitated.",
    "Stroke of Luck": "You have an uncanny luck when in danger. Once per long rest, when you miss with an attack roll, you can turn the miss into a hit. Alternatively, when an ability check fails, you can treat the d20 roll as a 20.",

    // ============ ROGUE ARCHETYPES ============
    "Thief": "You hone your skills in the larcenous arts. At 3rd level, you gain the Fast Hands and Second-Story Work features. At 9th, 13th, and 17th level, you gain additional features.",
    "Assassin": "You focus on brutal precision. At 3rd level, you gain the Assassinate feature. At 9th, 13th, and 17th level, you gain additional features.",
    "Arcane Trickster": "You combine magical study with larceny. At 3rd level, you learn spells and gain the Spellcasting and Sneak Attack features. At 9th, 13th, and 17th level, you gain additional spells and features.",

    // ============ CLERIC FEATURES ============
    "Spellcasting": "You can cast cleric spells using Wisdom as your spellcasting ability. You can cast any spell on the cleric spell list without preparing it, as long as you have it in your spellbook or prayer book.",
    "Divine Domain": "You choose one domain related to your deity. Your choice grants you domain spells and features at 1st level and again at 2nd, 6th, 17th, and 20th level.",
    "Channel Divinity": "You can channel holy energy to fuel divine effects. At 2nd level, you can use this once per long rest. At 6th level, you can use it twice per long rest. At 18th level, you can use it three times per long rest.",
    "Divine Domain Feature": "You gain a feature from your chosen domain at this level.",
    "Destroy Undead (CR 1/2)": "As an action, you can turn or destroy all undead creatures that can see you within 30 feet and have a challenge rating of 1/2 or lower. Each creature must make a Wisdom saving throw. On a failure, it is turned for 1 minute or destroyed if its challenge rating is 1/4 or lower.",
    "Destroy Undead (CR 1)": "As an action, you can turn or destroy all undead creatures that can see you within 30 feet and have a challenge rating of 1 or lower. Each creature must make a Wisdom saving throw. On a failure, it is turned for 1 minute or destroyed if its challenge rating is 1/4 or lower.",
    "Destroy Undead (CR 2)": "As an action, you can turn or destroy all undead creatures that can see you within 30 feet and have a challenge rating of 2 or lower.",
    "Destroy Undead (CR 3)": "As an action, you can turn or destroy all undead creatures that can see you within 30 feet and have a challenge rating of 3 or lower.",
    "Destroy Undead (CR 4)": "As an action, you can turn or destroy all undead creatures that can see you within 30 feet and have a challenge rating of 4 or lower.",
    "Divine Intervention": "You can call on your deity to intervene on your behalf. When you use this feature, you can ask your deity to use an effect equivalent to a cleric spell or domain feature. Once you use this feature, you must complete a long rest before you can use it again.",
    "Divine Intervention Improvement": "Your Divine Intervention feature now works more often. The cooldown reduces to once per week.",

    // ============ CLERIC DOMAINS ============
    "Knowledge Domain": "The Knowledge domain concerns the acquisition of knowledge and understanding. Knowledge domain clerics value learning and wisdom.",
    "Life Domain": "The Life domain promotes the vitality and wellness of all living things. Life domain clerics are healers and protectors.",
    "Light Domain": "The Light domain represents the radiance of the divine. Light domain clerics are beacons of hope and truth.",
    "Nature Domain": "The Nature domain reflects the power of the natural world. Nature domain clerics are stewards of the wilderness.",
    "Tempest Domain": "The Tempest domain harnesses the fury of storms. Tempest domain clerics are warriors of nature's wrath.",
    "Trickery Domain": "The Trickery domain represents chaos and deception. Trickery domain clerics are masters of illusion and subtlety.",
    "War Domain": "The War domain is associated with conflict and battle. War domain clerics are soldiers and champions of their deity.",

    // ============ RANGER FEATURES ============
    "Favored Enemy": "You have significant experience studying, tracking, and combating a certain type of enemy. Choose a type of fey, humanoid, beast, dragon, elemental, giant, monstrosity, or undead. You have advantage on Wisdom (Survival) checks to track your favored enemies and on Intelligence checks to recall information about them.",
    "Natural Explorer": "You are particularly familiar with one type of terrain. Choose arctic, coast, desert, forest, grassland, mountain, swamp, or underwater. When you make Wisdom (Survival) checks in your favored terrain, your proficiency bonus is doubled. You can also travel at a normal pace without leaving a trail.",
    "Spellcasting": "You have learned to use the magical nature of your ranger connection to cast spells. This works similarly to how a druid casts spells.",
    "Ranger Archetype": "You choose an archetype from the options available. The archetype you choose grants you features at 3rd level and again at 7th, 11th, 15th, and 20th level.",
    "Primeval Awareness": "You can use your bonus action to focus your senses to determine if any of your favored enemies are present within 30 feet. You can sense the presence but not their number or exact location.",
    "Favored Enemy improvement": "Your familiarity with your favored enemy deepens. You can choose a second favored enemy or add one more type to the list.",
    "Natural Explorer improvement": "Your proficiency bonus is now tripled in your favored terrain, and you can move through nonmagical difficult terrain without slowing down.",
    "Land's Stride": "You can move through nonmagical difficult terrain without extra movement. You also have resistance to damage from plants and hazards.",
    "Hide in Plain Sight": "You can hide even when only lightly obscured. When you hide, you can add your Wisdom modifier to your Dexterity (Stealth) check.",
    "Vanish": "You can use the Hide action as a bonus action. Your tracks cannot be followed by normal means.",
    "Feral Senses": "You have blindsight within 30 feet. When you can't see, you can still perceive your surroundings.",
    "Foe Slayer": "Once per turn, you can deal extra damage equal to your Wisdom modifier to a favored enemy.",

    // ============ RANGER ARCHETYPES ============
    "Hunter": "You have sworn to hunt dangerous creatures. At 3rd level, you gain Hunter's Prey. At 7th, 11th, and 15th level, you gain additional features.",
    "Beast Master": "You have formed a bond with a beast companion. At 3rd level, you gain Ranger's Companion. At 7th, 11th, and 15th level, you gain additional features.",

    // ============ RANGER FIGHTING STYLES ============
    "Archery": "You gain a +2 bonus to attack rolls you make with ranged weapons.",
    "Defense": "While you are wearing armor, you gain a +1 bonus to AC.",
    "Dueling": "When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon.",
    "Two-Weapon Fighting": "When you engage in two-weapon fighting, you can add your ability modifier to the damage of the second attack.",

    // ============ BARBARIAN FEATURES ============
    "Rage": "In battle, you fight with primal ferocity. While raging, you gain advantage on Strength checks and saving throws, bonus damage on melee weapon attacks, and resistance to bludgeoning, piercing, and slashing damage.",
    "Unarmored Defense": "While you are not wearing armor, your AC equals 10 + your Dexterity modifier + your Constitution modifier.",
    "Reckless Attack": "You can choose to attack recklessly, gaining advantage on Strength melee attack rolls, but attacks against you also have advantage until your next turn.",
    "Danger Sense": "You have advantage on Dexterity saving throws against traps and effects you can see.",
    "Primal Path": "You choose a path that determines the nature of your rage. This grants you features at 3rd level and again at 6th, 10th, 14th, and 17th level.",
    "Fast Movement": "Your speed increases by 10 feet while you aren't wearing heavy armor.",
    "Path Feature": "You gain a feature from your chosen Primal Path at this level.",
    "Feral Instinct": "You have advantage on Initiative rolls. If you are surprised at the start of combat, you can act normally if you enter a rage first.",
    "Brutal Critical (1 die)": "When you score a critical hit with a melee weapon attack, you can roll the damage dice an additional time.",
    "Relentless Rage": "If you drop to 0 hit points while raging and don't die outright, you can make a DC 10 Constitution save to stay at 1 HP.",
    "Brutal Critical (2 dice)": "When you score a critical hit, you roll your damage dice two additional times.",
    "Persistent Rage": "Your rage ends early only if you are incapacitated or if you choose to end it.",
    "Indomitable Might": "When you make a Strength check or saving throw, you can add your Proficiency Bonus if your total is less than your Strength.",
    "Primal Champion": "Your Strength and Constitution scores increase by 4, to a maximum of 24.",

    // ============ BARBARIAN PATHS ============
    "Path of the Berserker": "Your rage becomes a frenzy. At 3rd level, you gain Frenzy. At 6th, 10th, 14th, and 17th level, you gain additional features.",
    "Path of the Totem Warrior": "You follow a totem spirit. At 3rd level, you gain Spirit Seeker. At 6th, 10th, 14th, and 17th level, you gain additional totem features.",

    // ============ PALADIN FEATURES ============
    "Divine Sense": "You can detect the presence of celestial, fiendish, or undead creatures within 60 feet. You know their type but not exact location.",
    "Lay on Hands": "Your blessed touch can heal wounds. As an action, you can restore hit points equal to your Paladin level x 5. You can also cure diseases and poisons.",
    "Divine Smite": "When you hit a creature with a melee weapon attack, you can deal extra radiant damage equal to 1d8 + your Paladin level divided by 2.",
    "Divine Health": "Your immune to disease and have advantage on saving throws against being poisoned.",
    "Sacred Oath": "You choose an oath that grants you powers at 3rd, 7th, 15th, and 20th level.",
    "Aura of Protection": "Allies within 10 feet gain a bonus to saving throws equal to your Charisma modifier.",
    "Aura of Courage": "Allies within 10 feet can't be frightened while you're conscious.",
    "Improved Divine Smite": "All your melee weapon attacks deal extra radiant damage.",
    "Cleansing Touch": "You can end one disease or poison on yourself or a creature you touch.",
    "Aura improvements": "Your auras expand and grow more powerful.",

    // ============ PALADIN OATHS ============
    "Oath of Devotion": "You swear to uphold the virtues of goodness. At 3rd level, you gain Sacred Weapon and Turn the Unholy.",
    "Oath of the Ancients": "You pledge to protect the ancient world. At 3rd level, you gain Nature's Wrath and Turn the Faithless.",
    "Oath of Vengeance": "You swear to hunt evildoers. At 3rd level, you gain Abjure Enemy and Vow of Enmity.",

    // ============ PALADIN FIGHTING STYLES ============
    "Defense": "While you are wearing armor, you gain a +1 bonus to AC.",
    "Dueling": "When you are wielding a melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls.",
    "Great Weapon Fighting": "When you roll a 1 or 2 on a damage die, you can reroll the die.",
    "Protection": "When a creature within 5 feet attacks a target other than you, you can impose disadvantage.",

    // ============ BARD FEATURES ============
    "Bardic Inspiration (d6)": "You can inspire others with music. As a bonus action, you can give a creature an Inspiration die (d6) that they can add to an ability check, attack roll, or saving throw.",
    "Jack of All Trades": "You can add half your proficiency bonus to any ability check that doesn't already include it.",
    "Song of Rest (d6)": "During a short rest, you and your allies can regain additional hit points equal to your proficiency bonus.",
    "Bard College": "You join a college that grants you features at 3rd level and again at 6th, 14th, and 18th level.",
    "Expertise": "Choose two of your skill proficiencies. Your proficiency bonus is doubled for those skills.",
    "Bardic Inspiration (d8)": "Your Bardic Inspiration die becomes a d8.",
    "Font of Inspiration": "You regain your used Bardic Inspiration dice after a short or long rest.",
    "Countercharm": "As an action, you can play music that grants creatures within 30 feet advantage on saving throws against being frightened or charmed.",
    "Song of Rest (d8)": "Your Song of Rest die becomes a d8.",
    "Bardic Inspiration (d10)": "Your Bardic Inspiration die becomes a d10.",
    "Magical Secrets": "You learn two spells of your choice from any class's spell list. These are always prepared.",
    "Song of Rest (d10)": "Your Song of Rest die becomes a d10.",
    "Bardic Inspiration (d12)": "Your Bardic Inspiration die becomes a d12.",
    "Song of Rest (d12)": "Your Song of Rest die becomes a d12.",
    "Superior Inspiration": "When you roll initiative and have no Bardic Inspiration dice left, you regain one.",

    // ============ BARD COLLEGES ============
    "College of Lore": "Bards of the College of Lore are gatherers of stories. At 3rd level, you gain Cutting Words. At 6th, 14th, and 18th level, you gain additional features.",
    "College of Valor": "Bards of the College of Valor inspire courage. At 3rd level, you gain Combat Inspiration. At 6th, 14th, and 18th level, you gain additional features.",

    // ============ DRUID FEATURES ============
    "Druidic": "You know Druidic, the secret language of druids. You can use it to leave hidden messages.",
    "Wild Shape": "You can use your action to transform into a beast form. At 2nd level, you can use it twice per rest. At 4th level, you can fly or swim.",
    "Druid Circle": "You join a circle that grants you features at 2nd, 6th, 10th, and 14th level.",
    "Wild Shape Improvement": "Your Wild Shape improves, allowing you to transform into more powerful beasts.",
    "Timeless Body": "You don't age, and you are immune to aging effects. You still die of old age eventually.",
    "Beast Spells": "You can cast spells while in Wild Shape form.",
    "Archdruid": "You can use Wild Shape an unlimited number of times. You can also transform into elementals.",

    // ============ DRUID CIRCLES ============
    "Circle of the Land": "You draw on the magic of the land. At 2nd level, you gain Land's Stride. At 6th, 10th, and 14th level, you gain additional land-based features.",
    "Circle of the Moon": "You can transform into more powerful beasts. At 2nd level, you gain Circle Forms. At 6th, 10th, and 14th level, you gain additional moon-based features.",

    // ============ MONK FEATURES ============
    "Unarmored Defense": "While unarmed and unarmored, your AC equals 10 + your Dexterity modifier + your Wisdom modifier.",
    "Martial Arts": "Your fists are deadly weapons. You can use Dexterity instead of Strength for unarmed strikes, and your unarmed damage increases.",
    "Ki": "You can spend ki points to perform special abilities. At 2nd level, you have 2 ki points. You regain spent ki on a short or long rest.",
    "Unarmored Movement": "Your speed increases by 10 feet while you aren't wearing armor or carrying a shield.",
    "Monastic Tradition": "You choose a tradition that grants you features at 3rd level and again at 6th, 11th, 17th, and 18th level.",
    "Deflect Missiles": "As a reaction, you can deflect or catch a missile. If you catch it, you can throw it as a ranged weapon.",
    "Slow Fall": "When you fall, you can reduce fall damage by five times your monk level.",
    "Ki-Empowered Strikes": "Your unarmed strikes count as magical for overcoming resistance.",
    "Evasion": "When you make a Dexterity saving throw, you take no damage on a success and half damage on a failure.",
    "Stillness of Mind": "You can use an action to end one condition affecting you (frightened, poisoned, or charmed).",
    "Unarmored Movement improvement": "Your unarmored movement speed increases by 5 feet.",
    "Purity of Body": "You are immune to disease and poison.",
    "Tongue of the Sun and Moon": "You can understand all spoken languages. Additionally, all creatures can understand you.",
    "Diamond Soul": "You have proficiency in all saving throws. You can spend ki to reroll a save.",
    "Empty Body": "As an action, you become invisible for 1 minute. You have resistance to all damage except force.",
    "Perfect Self": "When you roll for initiative and have no ki, you regain 4 ki points.",

    // ============ MONK TRADITIONS ============
    "Way of the Open Hand": "Monks of the Open Hand are master manipulators. At 3rd level, you gain Open Hand Technique. At 6th, 11th, and 17th level, you gain additional features.",
    "Way of Shadow": "Monks of Shadow practice stealth. At 3rd level, you gain Shadow Step. At 6th, 11th, and 17th level, you gain additional shadow features.",
    "Way of the Four Elements": "Monks of the Four Elements learn to manipulate elemental energy. At 3rd level, you learn elemental disciplines. At 6th, 11th, and 17th level, you gain additional disciplines.",

    // ============ SORCERER FEATURES ============
    "Sorcerous Origin": "You choose an origin that grants you features at 1st level and again at 6th, 14th, and 18th level.",
    "Font of Magic": "You have a reservoir of sorcery points. You can spend them to power Metamagic or regain spell slots.",
    "Metamagic": "You learn to alter your spells in various ways. At 3rd level, you learn two Metamagic options. At 10th and 17th level, you learn additional options.",
    "Sorcerous Origin Feature": "You gain a feature from your Sorcerous Origin at this level.",
    "Sorcerous Restoration": "You regain 4 sorcery points on a short rest.",

    // ============ SORCERER ORIGINS ============
    "Draconic Bloodline": "Your innate magic comes from draconic ancestry. At 1st level, you gain Draconic Resilience. At 6th, 14th, and 18th level, you gain additional draconic features.",
    "Wild Magic": "Your magic comes from wild magic surges. At 1st level, you gain Wild Magic Surge. At 6th, 14th, and 18th level, you gain additional wild magic features.",

    // ============ SORCERER METAMAGIC OPTIONS ============
    "Careful Spell": "When you cast a spell that forces other creatures to make a saving throw, you can protect some from full effect.",
    "Distant Spell": "You can double the range of a spell or make a touch spell have 30-foot range.",
    "Empowered Spell": "When you roll damage for a spell, you can reroll a number of dice up to your Charisma modifier.",
    "Extended Spell": "You can double the duration of a spell to up to 24 hours.",
    "Heightened Spell": "When you cast a spell, you can impose disadvantage on one target's first saving throw.",
    "Quickened Spell": "You can cast a spell with a casting time of 1 action as a bonus action.",
    "Subtle Spell": "You can cast a spell without verbal or somatic components.",
    "Twinned Spell": "You can target a second creature in range with the same spell.",

    // ============ WARLOCK FEATURES ============
    "Otherworldly Patron": "You have made a pact with a powerful entity. At 1st level, you gain features based on your patron. At 6th, 10th, and 14th level, you gain additional features.",
    "Pact Magic": "You cast warlock spells using Charisma. You know a number of spells and can recover spell slots on a short rest.",
    "Eldritch Invocations": "You learn special rituals that draw upon your patron's power. At 2nd level, you learn two invocations. You learn more at higher levels.",
    "Pact Boon": "You choose a pact boon at 3rd level that grants you a special benefit.",
    "Otherworldly Patron Feature": "You gain a feature from your Otherworldly Patron at this level.",
    "Mystic Arcanum (6th level)": "You learn a 6th-level spell that you can cast once per long rest.",
    "Mystic Arcanum (7th level)": "You learn a 7th-level spell that you can cast once per long rest.",
    "Mystic Arcanum (8th level)": "You learn an 8th-level spell that you can cast once per long rest.",
    "Mystic Arcanum (9th level)": "You learn a 9th-level spell that you can cast once per long rest.",
    "Eldritch Master": "You can invoke your patron once per long rest to regain all your used Eldritch Invocations.",

    // ============ WARLOCK PATRONS ============
    "The Archfey": "Your patron is a ruler of the fey. At 1st level, you gain Fey Presence. At 6th, 10th, and 14th level, you gain additional fey features.",
    "The Fiend": "Your patron is a powerful devil. At 1st level, you gain Dark One's Blessing. At 6th, 10th, and 14th level, you gain additional fiend features.",
    "The Great Old One": "Your patron is an eldritch entity. At 1st level, you gain Awakened Mind. At 6th, 10th, and 14th level, you gain additional Great Old One features.",

    // ============ WARLOCK PACT BOONS ============
    "Pact of the Chain": "You gain a familiar that can take various forms and can cast spells.",
    "Pact of the Blade": "You can create a magical weapon that you are proficient with and can summon/dismiss.",
    "Pact of the Tome": "You gain a Book of Shadows with cantrips and rituals."
};

const featPrerequisites = {
    "Heavy Armor Master": { armorProficiency: "heavy" },
    "Medium Armor Master": { armorProficiency: "medium" },
    "Lightly Armored": { armorProficiency: "none" },
    "Heavily Armored": { armorProficiency: "medium" },
    "Defensive Duelist": { abilityScore: { stat: "dexterity", min: 13 } },
    "Grappler": { abilityScore: { stat: "strength", min: 13 } },
    "Great Weapon Master": { abilityScore: { stat: "strength", min: 13 } },
    "Charger": { abilityScore: { stat: "strength", min: 13 } },
    "War Caster": { canCastSpells: true },
    "Ritual Caster": { canCastSpells: true },
    "Spell Sniper": { canCastSpells: true },
    "Magic Initiate": { canCastSpells: true },
    "Skulker": { abilityScore: { stat: "dexterity", min: 13 } },
    "Observant": { abilityScore: { stat: "intelligence", min: 13 } },
    "Durable": { abilityScore: { stat: "constitution", min: 13 } },
    "Inspiring Leader": { abilityScore: { stat: "charisma", min: 13 } },
    "Resilient": { hasAbilityScoreIncrease: true },
    "Dual Wielder": { fightingStyle: "twoWeapon" },
    "Crossbow Expert": { weaponProficiency: "crossbow" }
};

const raceAbilitySkillMap = {
    "Keen Senses": "Perception",
    "Menacing": "Intimidation",
    "Naturally Stealthy": "Stealth"
};

const raceAbilityArmorProficiencies = {
    "Dwarven Armor Training": ["light armor", "medium armor", "shields"]
};

const raceAbilityWeaponProficiencies = {
    "Elf Weapon Training": ["longsword", "shortsword", "shortbow", "longbow"],
    "Drow Weapon Training": ["rapier", "shortsword", "hand crossbow"]
};

const raceAbilityToolProficiencies = {
    "Dwarven Tool Proficiency": {
        options: ["smith's tools", "brewer's supplies", "mason's tools"],
        count: 1
    }
};

const raceAbilityCantrips = {
    "High Elf Cantrip": { class: "wizard", spellList: "all" },
    "Drow Magic": { cantrips: ["dancing-lights"] }
};

const raceAbilityInnateSpells = {
    "Drow Magic": {
        "3": ["faerie-fire"],
        "5": ["darkness"]
    }
};

const raceAbilityStatEffects = {
    "Dwarven Toughness": { type: "hpPerLevel", value: 1 },
    "Fleet Footed": { type: "speed", value: 5 },
    "Superior Darkvision": { type: "darkvision", value: 120 }
};

const proficiencyDescriptions = {
    armor: {
        "light armor": "Padded, Leather, Studded Leather - AC 11-12. No skill needed to wear.",
        "medium armor": "Hide, Chain Shirt, Scale Mail, Breastplate, Half Plate - AC 13-15. DEX requirement for some.",
        "heavy armor": "Ring Mail, Chain Mail, Splint, Plate - AC 14-18. STR requirement. Cannot use Stealth.",
        "shields": "+2 AC. Requires one free hand. Can be used with any armor."
    },
    weapons: {
        "simple weapons": "Clubs, Daggers, Greatclubs, Handaxes, Javelins, Light hammers, Maces, Quarterstaffs, Sickles, Spears, Unarmed strikes, Shortbows, Slings, Light crossbows. Basic weapons available to all.",
        "martial weapons": "Longswords, Battleaxes, Warhammers, Greataxes, Greatswords, Longbows, Heavy crossbows, Rapiers, Scimitars, Tridents, Polearms. Better weapons requiring training.",
        "crossbow": "Light/Heavy crossbows. Heavy requires two hands to fire, but deals more damage. Loading property means you can only fire once per attack action.",
        "firearm": "Pistols, Muskets, Rifles (if using firearms in your campaign).",
        "improvised weapons": "Any object can be used as a weapon. Typically deals 1d4 damage.",
        "water weapons": "Net. Ranged weapon that imposes the Grappled condition on hit."
    },
    tools: {
        "thieves' tools": "Lockpicking and disabling traps. Used with Dexterity. Requires proficiency to add proficiency bonus.",
        "disguise kit": "Creating disguises for infiltration. Used with Charisma (Deception).",
        "forgery kit": "Creating fake documents. Used with Intelligence (Forgery).",
        "herbalism kit": "Identifying and harvesting herbs, creating potions. Used with Wisdom (Medicine).",
        "poisoner's kit": "Creating and applying poisons. Used with Intelligence.",
        "cartographer's kit": "Creating maps. Used with Intelligence.",
        "gaming set": "Dice or cards for gambling games. Used with Charisma.",
        "musical instrument": "Performing. Used with Charisma (Performance).",
        "smith's tools": "Metalworking, repairing armor/weapons. Used with Strength.",
        "woodcarver's tools": "Carving wood items. Used with Dexterity.",
        "alchemist's supplies": "Creating alchemical items. Used with Intelligence.",
        "brewer's supplies": "Creating beverages. Used with Intelligence.",
        "cook's utensils": "Preparing food, detecting poison. Used with Wisdom.",
        "mason's tools": "Stonework, creating walls. Used with Strength.",
        "carpenter's tools": "Wood construction, creating structures. Used with Strength.",
        "painter's supplies": "Creating images. Used with Charisma.",
        "calligrapher's supplies": "Fancy writing. Used with Dexterity."
    },
    savingThrows: {
        "strength": "Athletics checks, grappling, breaking objects. Resist force effects.",
        "dexterity": "Acrobatics, Stealth, Reflex saves. Avoiding fireballs, traps.",
        "constitution": "Endurance, poison resistance. Surviving harsh conditions.",
        "intelligence": "Arcana, History, Investigation, Nature, Religion checks.",
        "wisdom": "Animal Handling, Insight, Medicine, Perception, Survival checks.",
        "charisma": "Deception, Intimidation, Performance, Persuasion checks."
    },
    mastery: {
        "strength": "Mastery in Strength weapons: Attacks deal +1 damage, +2 at 5th level.",
        "dexterity": "Mastery in Dexterity weapons: Attacks deal +1 damage, +2 at 5th level.",
        "versatile": "Mastery for versatile weapons: +1 damage when wielding two-handed."
    }
};

const proficiencySources = {
    armor: {
        "light armor": "Class: Fighter, Paladin, Ranger, Warlock (Hexblade) | Feat: Lightly Armored",
        "medium armor": "Class: Fighter, Paladin, Ranger | Feat: Medium Armor Master | Race: Dwarf (Mountain)",
        "heavy armor": "Class: Fighter, Paladin | Feat: Heavily Armored | Race: Dwarf (Mountain)",
        "shields": "Class: Fighter, Paladin, Cleric | Feat: Lightly Armored"
    },
    weapons: {
        "simple weapons": "Everyone is proficient with simple weapons.",
        "martial weapons": "Class: Fighter, Barbarian, Paladin, Ranger, Monk | Feat: Weapon Master, Martial Adept",
        "crossbow": "Class: Fighter (Archery FS), Rogue (Assassin), Ranger | Feat: Crossbow Expert",
        "firearm": "Feat: Gunner | Class: Artificer (Artillerist)",
        "improvised weapons": "Feat: Tavern Brawler (grants proficiency)",
        "water weapons": "Class: Fighter, Ranger"
    },
    tools: {
        "thieves' tools": "Class: Rogue, Ranger (Gloom Stalker) | Feat: Skill Expert",
        "disguise kit": "Class: Bard (College of Lore), Warlock (Archfey) | Feat: Skill Expert",
        "forgery kit": "Class: Rogue | Feat: Skill Expert",
        "herbalism kit": "Class: Druid, Ranger | Feat: Skill Expert",
        "poisoner's kit": "Class: Rogue, Warlock (Fiend) | Feat: Skill Expert",
        "cartographer's kit": "Class: Ranger | Feat: Skill Expert",
        "gaming set": "Class: Bard | Feat: Skill Expert",
        "musical instrument": "Class: Bard | Feat: Skill Expert",
        "smith's tools": "Race: Dwarf | Feat: Skill Expert",
        "woodcarver's tools": "Race: Gnome (Forest) | Feat: Skill Expert",
        "alchemist's supplies": "Class: Artificer, Alchemist | Feat: Skilled",
        "brewer's supplies": "Feat: Skilled",
        "cook's utensils": "Feat: Healer",
        "mason's tools": "Race: Dwarf | Feat: Skilled",
        "carpenter's tools": "Race: Dwarf | Feat: Skilled",
        "painter's supplies": "Feat: Skilled",
        "calligrapher's supplies": "Feat: Skilled"
    }
};
