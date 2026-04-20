/**
 * Character storage - localStorage operations
 */
const STORAGE_KEY = 'dnd-characters';

function saveCharacter() {
    const name = document.getElementById('char-name')?.value || userSelection.name;
    if (!name?.trim()) { alert('Enter a name.'); return false; }
    const chars = getAllSaved();
    const idx = chars.findIndex(c => c.name === name);
    const data = { name, lvl: userSelection.lvl, race: userSelection.race, subrace: userSelection.subrace, class: userSelection.class, selection: userSelection, sheet: characterSheet };
    if (idx >= 0) chars[idx] = data; else chars.push(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chars));
    return true;
}

function getAllSaved() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function loadCharacter(index) {
    const chars = getAllSaved();
    if (index < 0 || index >= chars.length) return null;
    const c = chars[index];
    userSelection = { ...resetUserSelection(), ...c.selection };
    characterSheet = { ...characterSheet, ...c.sheet };
    triggerRecalc(RECALC_FLAGS.ALL_CHANGED);
    return c;
}

function deleteCharacter(index) {
    const chars = getAllSaved();
    if (index >= 0 && index < chars.length) { chars.splice(index, 1); localStorage.setItem(STORAGE_KEY, JSON.stringify(chars)); }
}

function getSavedCharacter(index) { const chars = getAllSaved(); return chars[index] || null; }

window.saveCharacter = saveCharacter;
window.getAllSaved = getAllSaved;
window.loadCharacter = loadCharacter;
window.deleteCharacter = deleteCharacter;
window.getSavedCharacter = getSavedCharacter;