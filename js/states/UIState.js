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
        case 1: {
            // Race must be selected
            if (!userSelection.race) return false;
            // If race has subraces, one must be selected
            const race = window.racesData[userSelection.race];
            if (race?.subraces && Object.keys(race.subraces).length > 0 && !userSelection.subrace) return false;
            return true;
        }
        case 2: {
            // Class must be selected
            if (!userSelection.class) return false;
            // If class has pending options at current level, must select one
            const cls = window.classesData[userSelection.class];
            const feats = cls?.features?.[userSelection.lvl];
            if (feats?.options?.length > 0) {
                if (!userSelection.selectedFeatureChoices) return false;
                const pendingChoices = feats.options.filter(opt => !userSelection.selectedFeatureChoices[opt.exclusiveGroup]);
                if (pendingChoices.length > 0) return false;
            }
            return true;
        }
        case 3: {
            // All points must be spent (pointsRemaining === 0)
            // AND check if Human race has pending bonus stat choice
            if (UIState.pointsRemaining !== 0) return false;
            if (userSelection.race === 'human') {
                const choice = userSelection.featureChoices?.['choose-2-times-1-bonus-stat'];
                if (choice) {
                    const filledCount = choice.selected.filter(s => s !== null).length;
                    if (filledCount < choice.count) return false;
                }
            }
            return true;
        }
        case 4: {
            // All required skills must be selected
            const classData = window.classesData[userSelection.class];
            const requiredCount = classData?.proficiencies?.skills?.count || 2;
            if (userSelection.selectedSkills.length < requiredCount) return false;
            return true;
        }
        case 5: {
            // All pending feature choices must be completed
            // Check Human bonus stat choice is complete
            if (userSelection.race === 'human') {
                const choice = userSelection.featureChoices?.['choose-2-times-1-bonus-stat'];
                if (choice) {
                    const filledCount = choice.selected.filter(s => s !== null).length;
                    if (filledCount < choice.count) return false;
                }
            }
            return true;
        }
        case 6: return true; // Spell selection (future)
        case 7: return true; // Overview (future: name required)
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