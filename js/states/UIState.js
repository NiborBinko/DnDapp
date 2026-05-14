/**
 * UI Navigation State - Tracks current stage
 */
let UIState = { currentStage: 0, deleteCharacterIndex: null, pointsRemaining: 27 };
const STAGES = { WELCOME: 0, CHOOSE_RACE: 1, CHOOSE_CLASS: 2, ABILITY_SCORES: 3, PROFICIENCIES: 4, FEATURES_FEATS: 5, SPELLS: 6, OVERVIEW: 7 };
const STAGE_NAMES = ['welcome', 'choose-race', 'choose-class', 'ability-scores', 'proficiencies', 'features-feats', 'spells', 'overview'];

// Helper to check if a feature choice is complete
function isChoiceComplete(choiceKey) {
    const choice = userSelection.featureChoices?.[choiceKey];
    if (!choice) return true; // No choice needed
    const filledCount = choice.selected?.filter(s => s !== null).length || 0;
    return filledCount >= choice.count;
}

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
            return true;
        }
        case 3: {
            // All points must be spent (pointsRemaining === 0)
            // AND check if Human race has pending bonus stat choice
            if (UIState.pointsRemaining !== 0) return false;
            if (userSelection.race === 'human' && !isChoiceComplete('human stat bonus')) return false;
            return true;
        }
        case 4: {
            // Skills: all required user-pick skills must be selected
            const classData = window.classesData[userSelection.class];
            const requiredCount = classData?.proficiencies?.skills?.count || 2;

            const raceAutoSkills = [];
            Object.entries(userSelection.featureChoices || {}).forEach(([key, choice]) => {
                if (choice?.type === 'proficiency' && choice?.proficiencyType === 'skill') {
                    const selected = choice.selected?.filter(s => s !== null) || [];
                    if (selected.length === choice.count && selected.length > 0) {
                        selected.forEach(skill => raceAutoSkills.push(skill));
                    }
                }
            });

            const userPickedSkills = (userSelection.selectedSkills || []).filter(s => !raceAutoSkills.includes(s));
            if (userPickedSkills.length < requiredCount) return false;

            // Proficiency choices (tool/skill/etc.) that require selection must be complete
            const pendingProficiencyChoices = Object.entries(userSelection.featureChoices || {}).filter(([key, choice]) => {
                if (choice?.type !== 'proficiency') return false;
                const optionsLen = choice.options?.length || 0;
                if (optionsLen === 0) return false;
                // Auto-granted sets (count === options.length) are not pending user choices
                return (choice.count || 0) < optionsLen && !isChoiceComplete(key);
            });

            if (pendingProficiencyChoices.length > 0) return false;
            return true;
        }
        case 5: {
            // All pending feature choices must be completed
            // Check Human bonus stat choice is complete
            if (userSelection.race === 'human' && !isChoiceComplete('human stat bonus')) return false;

            const maxFeats = (typeof getMaxFeatsAllowed === 'function')
                ? getMaxFeatsAllowed()
                : Math.floor((userSelection.lvl || 1) / 4);
            if ((userSelection.feats || []).length !== maxFeats) return false;

            // Check class options at current level are selected
            if (userSelection.class) {
                const cls = window.classesData[userSelection.class];
                const feats = cls?.features?.[userSelection.lvl];
                if (feats?.options?.length > 0) {
                    if (!userSelection.selectedFeatureChoices) return false;
                    const pendingChoices = feats.options.filter(opt => !userSelection.selectedFeatureChoices[opt.exclusiveGroup]);
                    if (pendingChoices.length > 0) return false;
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
