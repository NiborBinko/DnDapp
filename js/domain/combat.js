const CombatManager = {
    combatState: {
        active: false,
        participants: [],
        round: 0,
        currentTurn: 0,
        initiative: []
    },

    init(participants) {
        this.combatState.participants = participants;
    },

    startCombat(participants) {
        this.combatState.active = true;
        this.combatState.participants = participants;
        this.combatState.round = 1;
        this.combatState.currentTurn = 0;
        this.rollInitiative(participants);
    },

    endCombat() {
        this.combatState.active = false;
        this.combatState.participants = [];
        this.combatState.round = 0;
        this.combatState.currentTurn = 0;
        this.combatState.initiative = [];
    },

    rollInitiative(participants) {
        const initiative = participants.map(p => {
            let roll;
            let modifier;

            if (p.isPlayer) {
                const dexMod = CharacterEntity.getStatModifier(p, 'dexterity');
                const featBonus = this._hasFeat(p, 'Alert') ? 5 : 0;
                roll = Math.floor(Math.random() * 20) + 1 + dexMod + featBonus;
                modifier = dexMod;
            } else {
                const dexMod = MonsterEntity.getStatModifier(p, 'dexterity');
                roll = Math.floor(Math.random() * 20) + 1 + dexMod;
                modifier = dexMod;
            }

            return { participant: p, roll, modifier, initiative: roll };
        });

        initiative.sort((a, b) => b.initiative - a.initiative);

        this.combatState.initiative = initiative;
        return initiative;
    },

    getCurrentParticipant() {
        if (!this.combatState.active) return null;
        return this.combatState.initiative[this.combatState.currentTurn]?.participant || null;
    },

    nextTurn() {
        if (!this.combatState.active) return;

        this.combatState.currentTurn++;
        if (this.combatState.currentTurn >= this.combatState.initiative.length) {
            this.combatState.currentTurn = 0;
            this.combatState.round++;
        }
    },

    previousTurn() {
        if (!this.combatState.active) return;

        this.combatState.currentTurn--;
        if (this.combatState.currentTurn < 0) {
            this.combatState.currentTurn = this.combatState.initiative.length - 1;
            this.combatState.round--;
        }
    },

    makeAttack(attacker, target, attackName, advantage = false, disadvantage = false) {
        let attackRoll;
        if (advantage && !disadvantage) {
            const r1 = Math.floor(Math.random() * 20) + 1;
            const r2 = Math.floor(Math.random() * 20) + 1;
            attackRoll = Math.max(r1, r2);
        } else if (disadvantage && !advantage) {
            const r1 = Math.floor(Math.random() * 20) + 1;
            const r2 = Math.floor(Math.random() * 20) + 1;
            attackRoll = Math.min(r1, r2);
        } else {
            attackRoll = Math.floor(Math.random() * 20) + 1;
        }

        let attackBonus;
        let statModifier;

        if (attacker.isPlayer) {
            const strMod = CharacterEntity.getStatModifier(attacker, 'strength');
            const dexMod = CharacterEntity.getStatModifier(attacker, 'dexterity');
            const profBonus = CharacterEntity.calculateProficiencyBonus(attacker);
            statModifier = this._isRangedAttack(attackName) ? dexMod : strMod;
            attackBonus = statModifier + profBonus;
        } else {
            const attack = MonsterEntity.getAttackRoll(attacker, attackName);
            statModifier = attack?.statModifier || 0;
            attackBonus = attack?.bonus || statModifier;
        }

        const totalRoll = attackRoll + attackBonus;
        const naturalRoll = attackRoll;

        const targetAC = target.isPlayer 
            ? CharacterEntity.calculateArmorClass(target) 
            : target.armorClass;

        const result = {
            naturalRoll,
            attackBonus,
            statModifier,
            totalRoll,
            targetAC,
            hit: totalRoll >= targetAC || naturalRoll === 20,
            critical: naturalRoll === 20,
            miss: naturalRoll === 1
        };

        if (result.hit && !result.miss) {
            result.damage = this.rollDamage(attacker, attackName, result.critical);
        }

        return result;
    },

    rollDamage(attacker, attackName, critical = false) {
        let damage = 0;
        let damageType = 'slashing';

        if (attacker.isPlayer) {
            const attacks = attacker.attacks || [];
            const attack = attacks.find(a => a.name === attackName);
            if (attack) {
                damageType = attack.damageType || 'slashing';
                const dice = attack.damageDice || '1d8';
                const statMod = CharacterEntity.getStatModifier(attacker, attack.stat || 'strength');
                const profBonus = CharacterEntity.calculateProficiencyBonus(attacker);

                const match = dice.match(/(\d+)d(\d+)/);
                if (match) {
                    const numDice = parseInt(match[1]) * (critical ? 2 : 1);
                    const dieSize = parseInt(match[2]);

                    for (let i = 0; i < numDice; i++) {
                        damage += Math.floor(Math.random() * dieSize) + 1;
                    }
                }

                damage += statMod + profBonus;
            }
        } else {
            const monster = attacker;
            const action = monster.actions?.find(a => a.name === attackName);
            if (action) {
                damage = MonsterEntity.rollDamage(action);
                damageType = action.damageType || 'slashing';
            }
        }

        return { total: damage, type: damageType };
    },

    makeSavingThrow(target, dc, ability, advantage = false, disadvantage = false) {
        let roll;
        if (advantage && !disadvantage) {
            const r1 = Math.floor(Math.random() * 20) + 1;
            const r2 = Math.floor(Math.random() * 20) + 1;
            roll = Math.max(r1, r2);
        } else if (disadvantage && !advantage) {
            const r1 = Math.floor(Math.random() * 20) + 1;
            const r2 = Math.floor(Math.random() * 20) + 1;
            roll = Math.min(r1, r2);
        } else {
            roll = Math.floor(Math.random() * 20) + 1;
        }

        let saveBonus;
        let statModifier;

        if (target.isPlayer) {
            statModifier = CharacterEntity.getStatModifier(target, ability);
            const profBonus = CharacterEntity.calculateProficiencyBonus(target);
            const hasProficiency = target.savingThrows?.includes(ability);
            saveBonus = statModifier + (hasProficiency ? profBonus : 0);
        } else {
            const savedThrow = target.savingThrows?.find(s => s.ability === ability);
            statModifier = MonsterEntity.getStatModifier(target, ability);
            saveBonus = savedThrow?.bonus || statModifier;
        }

        const totalRoll = roll + saveBonus;
        const naturalRoll = roll;

        return {
            naturalRoll,
            saveBonus,
            statModifier,
            totalRoll,
            dc,
            success: totalRoll >= dc,
            failure: naturalRoll === 1,
            criticalSuccess: naturalRoll === 20
        };
    },

    applyDamage(target, damage, damageType = null) {
        if (target.isPlayer) {
            let reduction = 0;

            if (target.conditions?.includes('Resistance: ' + damageType)) {
                reduction = Math.floor(damage / 2);
            }
            if (target.conditions?.includes('Immunity: ' + damageType)) {
                reduction = damage;
            }

            const finalDamage = damage - reduction;
            target.hitPoints.current = Math.max(0, target.hitPoints.current - finalDamage);

            return { damage: finalDamage, reduced: reduction };
        } else {
            target.hitPoints = Math.max(0, target.hitPoints - damage);
            return { damage, reduced: 0 };
        }
    },

    healTarget(target, amount) {
        if (target.isPlayer) {
            const oldMax = target.hitPoints.max;
            target.hitPoints.current = Math.min(target.hitPoints.max, target.hitPoints.current + amount);
            return target.hitPoints.current - oldMax;
        } else {
            const oldHP = target.hitPoints;
            target.hitPoints = Math.min(target.hitPoints_max || target.hitPoints, target.hitPoints + amount);
            return target.hitPoints - oldHP;
        }
    },

    checkDeath(target) {
        if (target.isPlayer) {
            return target.hitPoints.current <= 0;
        } else {
            return target.hitPoints <= 0;
        }
    },

    makeDeathSave(character) {
        const roll = Math.floor(Math.random() * 20) + 1;

        if (roll === 1) {
            CharacterEntity.makeDeathSave(character, false);
            CharacterEntity.makeDeathSave(character, false);
        } else if (roll === 20) {
            character.hitPoints.current = 1;
            CharacterEntity.resetDeathSaves(character);
            return { success: true, revived: true };
        } else if (roll >= 10) {
            CharacterEntity.makeDeathSave(character, true);
        } else {
            CharacterEntity.makeDeathSave(character, false);
        }

        const ds = character.deathSaves;
        if (ds.failures >= 3) {
            return { success: false, dead: true };
        }
        if (ds.successes >= 3) {
            character.hitPoints.current = 1;
            CharacterEntity.resetDeathSaves(character);
            return { success: true, revived: true };
        }

        return { success: roll >= 10, revived: false };
    },

    _hasFeat(character, featName) {
        return character.featIds?.includes(featName) || false;
    },

    _isRangedAttack(attackName) {
        const rangedKeywords = ['bow', 'crossbow', 'ranged', 'dart', 'firearm'];
        return rangedKeywords.some(k => attackName.toLowerCase().includes(k));
    },

    getCombatStatus() {
        return {
            active: this.combatState.active,
            round: this.combatState.round,
            turn: this.combatState.currentTurn + 1,
            totalParticipants: this.combatState.initiative.length,
            currentParticipant: this.getCurrentParticipant()
        };
    }
};

window.CombatManager = CombatManager;
