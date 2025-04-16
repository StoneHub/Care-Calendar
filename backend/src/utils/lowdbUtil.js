const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

const dbDir = path.join(__dirname, '..', '..', 'db'); // Store db files in backend/db/
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

const tables = [
    'team_members',
    'weeks',
    'shifts',
    'unavailability',
    'history',
    'notifications',
    'payroll_records',
    'settings', // Add any other tables you need
];

const dbs = {};

tables.forEach(table => {
    const adapter = new FileSync(path.join(dbDir, `${table}.json`));
    dbs[table] = low(adapter);
    // Set default structure if file is new/empty
    dbs[table].defaults({ [table]: [] }).write();
});

// --- Helper Functions (Mimic Knex where possible) ---

// Get all items from a table
const getAll = (table) => {
    return dbs[table].get(table).value();
};

// Find items matching a filter object
const find = (table, filter) => {
    return dbs[table].get(table).filter(filter).value();
};

// Find a single item by ID
const findById = (table, id) => {
    // Assuming your primary key is 'id'
    return dbs[table].get(table).find({ id: id }).value();
};

// Insert a new item (generates UUID if no id provided)
const insert = (table, item) => {
    const newItem = { id: uuidv4(), ...item }; // Assign a UUID
    dbs[table].get(table).push(newItem).write();
    return newItem; // Return the newly inserted item with ID
};

// Update an item by ID
const update = (table, id, updates) => {
    const updatedItem = dbs[table].get(table).find({ id: id }).assign(updates).write();
    return updatedItem;
};

// Remove an item by ID
const remove = (table, id) => {
    dbs[table].get(table).remove({ id: id }).write();
    return { id: id }; // Indicate success
};

// Remove items matching a filter
const removeWhere = (table, filter) => {
    dbs[table].get(table).remove(filter).write();
};

module.exports = {
    getAll,
    find,
    findById,
    insert,
    update,
    remove,
    removeWhere,
    // Expose raw dbs if needed for complex queries
    rawDb: (table) => dbs[table].get(table)
};
