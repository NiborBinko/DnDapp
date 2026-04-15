const MonsterEntity = {
    monsterData: {},

    init(monsterData) {
        this.monsterData = monsterData;
    },

    create(data) {
        return {
            id: data.id || 'monster_' + Date.now(),
            name: data.name || 'Unknown Creature',
            type: data.type || 'humanoid',
            size: data.size || 'medium',
            alignment: data.alignment || 'neutral',
            armorClass: data.armorClass || 10,
            armorType: data.armorType || '',
            hitPoints: data.hitPoints || 10,
            hitDice: data.hitDice || '1d8',
            speed: data.speed || 30,
            stats: data.stats || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
            savingThrows: data.savingThrows || [],
            skills: data.skills || {},
            damageResistances: data.damageResistances || [],
            damageImmunities: data.damageImmunities || [],
            conditionImmunities: data.conditionImmunities || [],
            senses: data.senses || { passivePerception: 10 },
            languages: data.languages || 'Common',
            challengeRating: data.challengeRating || '0',
            experiencePoints: data.experiencePoints || 0,
            actions: data.actions || [],
            reactions: data.reactions || [],
            legendaryActions: data.legendaryActions || [],
            specialAbilities: data.specialAbilities || [],
            spells: data.spells || [],
            legendaryActionsCount: data.legendaryActionsCount || 0
        };
    },

    getMonster(name) {
        return this.monsterData[name] || null;
    },

    getMonstersByChallengeRating(cr) {
        return this.monsterData.filter(m => m.challengeRating === cr);
    },

    getMonstersByType(type) {
        return this.monsterData.filter(m => m.type === type);
    },

    calculateChallengeRating(monster) {
        const cr = monster.challengeRating || '0';
        const crParts = cr.split('/');
        if (crParts.length === 2) {
            return parseInt(crParts[0]) / parseInt(crParts[1]);
        }
        return parseFloat(cr);
    },

    calculateXP(cr) {
        const xpTable = {
            '0': 0, '1/8': 25, '1/4': 50, '1/2': 100,
            '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
            '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900,
            '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000,
            '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
            '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000,
            '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000
        };
        return xpTable[cr] || 0;
    },

    getStatModifier(monster, stat) {
        const value = monster.stats[stat] || 10;
        return Math.floor((value - 10) / 2);
    },

    calculatePassivePerception(monster) {
        const wisMod = this.getStatModifier(monster, 'wisdom');
        const perception = monster.skills?.perception || 0;
        return 10 + wisMod + perception;
    },

    getAttackRoll(monster, attackName) {
        const attack = monster.actions?.find(a => a.name === attackName);
        if (!attack) return null;

        const statMatch = attack.stat || 'strength';
        const statMod = this.getStatModifier(monster, statMatch);
        const profBonus = this.getProficiencyBonus(monster);

        return {
            bonus: statMod + profBonus,
            statModifier: statMod,
            proficiency: profBonus
        };
    },

    getProficiencyBonus(monster) {
        const cr = this.calculateChallengeRating(monster);
        if (cr <= 4) return 2;
        if (cr <= 8) return 3;
        if (cr <= 12) return 4;
        if (cr <= 16) return 5;
        if (cr <= 20) return 6;
        return 7;
    },

    rollDamage(attack) {
        const damageDice = attack.damage || '';
        const match = damageDice.match(/(\d+)d(\d+)([+-]\d+)?/);
        if (!match) return 0;

        const numDice = parseInt(match[1]);
        const dieSize = parseInt(match[2]);
        const bonus = match[3] ? parseInt(match[3]) : 0;

        let total = 0;
        for (let i = 0; i < numDice; i++) {
            total += Math.floor(Math.random() * dieSize) + 1;
        }
        total += bonus;

        return total;
    },

    rollInitiative(monster) {
        const dexMod = this.getStatModifier(monster, 'dexterity');
        return Math.floor(Math.random() * 20) + 1 + dexMod;
    }
};

window.MonsterEntity = MonsterEntity;
