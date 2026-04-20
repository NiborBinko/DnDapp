/**
 * User selection state - tracks user choices
 */
let userSelection = {
    name: '', lvl: 1, race: null, subrace: null, class: null, subclass: null,
    stats: { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 },
    selectedSkills: [], selectedWeapons: [], selectedArmor: [], selectedTools: [],
    feats: [], featureChoices: {}, ASIHistory: [],
    selectedLanguages: [], spellbookSpells: [], selectedCantrips: [], selectedSpells: [], preparedSpells: []
};

function resetUserSelection() {
    return {
        name: '', lvl: 1, race: null, subrace: null, class: null, subclass: null,
        stats: { strength: 8, dexterity: 8, constitution: 8, intelligence: 8, wisdom: 8, charisma: 8 },
        selectedSkills: [], selectedWeapons: [], selectedArmor: [], selectedTools: [],
        feats: [], featureChoices: {}, ASIHistory: [],
        selectedLanguages: [], spellbookSpells: [], selectedCantrips: [], selectedSpells: [], preparedSpells: []
    };
}

window.userSelection = userSelection;
window.resetUserSelection = resetUserSelection;