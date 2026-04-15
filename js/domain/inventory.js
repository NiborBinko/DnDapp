const InventoryManager = {
    items: [],

    init(items) {
        this.items = items;
    },

    getItem(itemId) {
        return this.items.find(i => i.id === itemId);
    },

    getItemsByCategory(category) {
        return this.items.filter(i => i.category === category);
    },

    getWeapons() {
        return this.items.filter(i => i.type === 'weapon');
    },

    getArmor() {
        return this.items.filter(i => i.type === 'armor');
    },

    getTools() {
        return this.items.filter(i => i.type === 'tool');
    },

    getConsumables() {
        return this.items.filter(i => i.type === 'consumable');
    },

    getItemValue(item) {
        return (item.copperValue || 0);
    },

    convertCurrency(fromType, toType, amount) {
        const conversions = {
            copper: { silver: 10, gold: 100, platinum: 1000 },
            silver: { copper: 1, gold: 10, platinum: 100 },
            gold: { silver: 10, copper: 100, platinum: 10 },
            platinum: { gold: 10, silver: 100, copper: 1000 }
        };

        const rate = conversions[fromType]?.[toType];
        if (!rate) return 0;

        return Math.floor(amount * rate);
    },

    addItemToInventory(character, item, quantity = 1) {
        if (!character.inventory) character.inventory = [];

        const existing = character.inventory.find(i => i.id === item.id);
        if (existing) {
            existing.quantity = (existing.quantity || 1) + quantity;
        } else {
            character.inventory.push({ ...item, quantity });
        }
    },

    removeItemFromInventory(character, itemId, quantity = 1) {
        if (!character.inventory) return false;

        const existing = character.inventory.find(i => i.id === itemId);
        if (!existing) return false;

        if (existing.quantity <= quantity) {
            const idx = character.inventory.indexOf(existing);
            character.inventory.splice(idx, 1);
        } else {
            existing.quantity -= quantity;
        }

        return true;
    },

    calculateEncumbrance(character) {
        let total = 0;

        const inventory = character.inventory || [];
        inventory.forEach(item => {
            const qty = item.quantity || 1;
            total += (item.weight || 0) * qty;
        });

        const equipped = character.equippedItems || [];
        equipped.forEach(item => {
            total += item.weight || 0;
        });

        return total;
    },

    isEncumbered(character) {
        const str = character.stats.strength || 10;
        const maxCarry = str * 15;
        return this.calculateEncumbrance(character) > maxCarry;
    },

    canCarryItem(character, item) {
        const str = character.stats.strength || 10;
        const maxCarry = str * 15;
        return (this.calculateEncumbrance(character) + (item.weight || 0)) <= maxCarry;
    },

    equipItem(character, item) {
        this.removeItemFromInventory(character, item.id);
        if (!character.equippedItems) character.equippedItems = [];
        character.equippedItems.push(item);
    },

    unequipItem(character, itemId) {
        if (!character.equippedItems) return;

        const idx = character.equippedItems.findIndex(i => i.id === itemId);
        if (idx > -1) {
            const item = character.equippedItems.splice(idx, 1)[0];
            this.addItemToInventory(character, item);
        }
    },

    getTotalWeight(character) {
        return this.calculateEncumbrance(character);
    },

    getMaxCarryWeight(character) {
        return (character.stats.strength || 10) * 15;
    }
};

window.InventoryManager = InventoryManager;
