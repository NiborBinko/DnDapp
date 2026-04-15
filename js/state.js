let classes = [];
let races = [];
let subraces = {};
let feats = [];
let statLabels = {};

let character = {
    classId: null,
    raceId: null,
    subraceName: null,
    stats: {},
    proficiencyIds: [],
    abilityIds: [],
    featIds: [],
    level: 1
};

let currentStep = 0;
let pointsRemaining = 27;

let viewingCharacterIndex = null;
let levelingCharacterIndex = null;
let deleteCharacterIndex = null;
let selectedLevelUpClass = null;
let availableFeaturesAtLevel = [];
let rolledHitPoints = 0;
let pendingLevelUp = null;
let pendingMulticlassClass = null;
