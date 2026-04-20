/**
 * UI Navigation State - Tracks current stage
 */
let UIState = { currentStage: 0, deleteCharacterIndex: null, pointsRemaining: 27 };
const STAGES = { WELCOME: 0, CHOOSE_RACE: 1, CHOOSE_CLASS: 2, ABILITY_SCORES: 3, PROFICIENCIES: 4, FEATURES_FEATS: 5, SPELLS: 6, OVERVIEW: 7 };
const STAGE_NAMES = ['welcome', 'choose-race', 'choose-class', 'ability-scores', 'proficiencies', 'features-feats', 'spells', 'overview'];

function navigateToStage(stage) {
    if (stage < 0 || stage > 7) return;
    UIState.currentStage = stage;
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('step-' + STAGE_NAMES[stage]);
    if (el) el.classList.add('active');
    renderCurrentStage();
}

function nextStage() { navigateToStage(UIState.currentStage + 1); }
function prevStage() { navigateToStage(UIState.currentStage - 1); }

function canProceed() {
    switch (UIState.currentStage) {
        case 0: return true;
        case 1: return userSelection && userSelection.race !== null;
        case 2: return userSelection && userSelection.class !== null;
        case 3: return UIState.pointsRemaining >= 0;
        case 4: return true;
        case 5: return true;
        case 6: return true;
        case 7: return true;
        default: return false;
    }
}

function renderCurrentStage() {
    switch (UIState.currentStage) {
        case 0: renderWelcome(); break;
        case 1: renderChooseRace(); break;
        case 2: renderChooseClass(); break;
        case 3: renderAbilityScores(); break;
        case 4: renderProficienciesStage(); break;
        case 5: renderFeaturesFeats(); break;
        case 6: renderSpellsStage(); break;
        case 7: renderOverview(); break;
    }
}

function resetUIState() {
    UIState = { currentStage: 0, deleteCharacterIndex: null, pointsRemaining: 27 };
}

window.UIState = UIState;
window.navigateToStage = navigateToStage;
window.nextStage = nextStage;
window.prevStage = prevStage;
window.canProceed = canProceed;
window.resetUIState = resetUIState;