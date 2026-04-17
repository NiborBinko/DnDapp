const StatsUtils = {
    getStatCost(value) {
        if (value <= 8) return 0;
        if (value === 9) return 1;
        if (value === 10) return 2;
        if (value === 11) return 3;
        if (value === 12) return 4;
        if (value === 13) return 5;
        if (value === 14) return 7;
        if (value === 15) return 9;
        return 0;
    },

    getUsedPoints(character) {
        let usedPoints = 0;
        stats.forEach(stat => {
            const base = character.stats[stat] ?? 8;
            usedPoints += this.getStatCost(base);
        });
        return usedPoints;
    },

    getPointsRemaining(character) {
        return 27 - this.getUsedPoints(character);
    },

    getTotalStatValue(character, stat, bonuses) {
        const base = character.stats[stat] ?? 8;
        const isHuman = character.raceId === 'human';
        const humanBonus = isHuman && (character.humanBonusStats || []).includes(stat) ? 1 : 0;
        const raceBonus = bonuses[stat] || 0;
        return base + humanBonus + raceBonus;
    },

    getModifier(statValue) {
        return Math.floor((statValue - 10) / 2);
    },

    canIncreaseStat(character, stat, bonuses) {
        const base = character.stats[stat] ?? 8;
        const total = this.getTotalStatValue(character, stat, bonuses);
        const isHuman = character.raceId === 'human';
        const humanBonus = isHuman && (character.humanBonusStats || []).includes(stat) ? 1 : 0;
        const raceBonus = bonuses[stat] || 0;
        const maxBase = (humanBonus + raceBonus) > 0 ? 16 : 15;
        
        return {
            canIncrease: base < maxBase && total < 16,
            maxBase: maxBase
        };
    },

    getCostToIncrease(statValue) {
        const currentCost = this.getStatCost(statValue);
        const nextCost = this.getStatCost(statValue + 1);
        return nextCost - currentCost;
    },

    canProceedFromStats(character, bonuses) {
        const isHuman = character.raceId === 'human';
        if (!isHuman) return true;
        
        const humanBonusCount = (character.humanBonusStats || []).length;
        const maxHumanBonus = bonuses.chosen || 0;
        
        return humanBonusCount === maxHumanBonus;
    },

    formatStatRow(character, stat, bonuses, gameData, selectedClass) {
        const base = character.stats[stat] ?? 8;
        const isHuman = character.raceId === 'human';
        const humanBonus = isHuman && (character.humanBonusStats || []).includes(stat) ? 1 : 0;
        const raceBonus = bonuses[stat] || 0;
        const total = this.getTotalStatValue(character, stat, bonuses);
        const modifier = this.getModifier(total);
        const isHumanBonusSelected = isHuman && (character.humanBonusStats || []).includes(stat);
        const maxBase = (humanBonus + raceBonus) > 0 ? 16 : 15;
        const isPrimary = selectedClass && stat === selectedClass.primaryStat;
        
        const currentCost = this.getStatCost(base);
        const nextCost = this.getStatCost(base + 1);
        const costDiff = nextCost - currentCost;
        
        return {
            stat: stat,
            base: base,
            humanBonus: humanBonus,
            raceBonus: raceBonus,
            total: total,
            modifier: modifier,
            isHumanBonusSelected: isHumanBonusSelected,
            maxBase: maxBase,
            isPrimary: isPrimary,
            costDiff: costDiff,
            statLabel: gameData.statLabels[stat],
            statDesc: getStatDescriptions()[stat],
            classPrimaryHint: isPrimary ? `\n\n⭐ This is your ${selectedClass.name}'s primary stat!` : ''
        };
    }
};

window.StatsUtils = StatsUtils;