const FeatsUtils = {
    getMaxFeats(character) {
        const charLevel = character.level || 1;
        const extraFeats = this.getExtraFeatCount();
        const maxFeatsFromLevel = Math.floor(charLevel / 4);
        return maxFeatsFromLevel + extraFeats;
    },

    getExtraFeatCount() {
        const raceAbs = getRaceAbilities();
        return raceAbs.filter(a => a === '+1 Feat').length;
    },

    canSelectFeat(character, featName) {
        return DataUtils.canSelectFeat(featName, character);
    },

    getFeatDescription(featName) {
        return getFeatDescriptions()[featName] || '';
    },

    getFeatsForLevel(character, gameData) {
        const maxFeats = this.getMaxFeats(character);
        const currentFeatCount = (character.featIds || []).length;
        
        return gameData.feats.map(f => {
            const isSelected = (character.featIds || []).includes(f);
            const prereqCheck = this.canSelectFeat(character, f);
            const canSelect = prereqCheck.canSelect;
            const prereqReason = prereqCheck.reason;
            const isDisabled = !isSelected && (currentFeatCount >= maxFeats || !canSelect);
            
            const baseDesc = this.getFeatDescription(f);
            const fullDesc = prereqReason 
                ? baseDesc + '\n\n⚠️ PREREQUISITE: ' + prereqReason 
                : baseDesc;
            
            return {
                name: f,
                isSelected: isSelected,
                canSelect: canSelect,
                isDisabled: isDisabled,
                description: fullDesc,
                hasWarning: !canSelect
            };
        });
    }
};

window.FeatsUtils = FeatsUtils;