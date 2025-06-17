const sequelize = require('../config/db');
const User = require('./User');
console.log('models/index.js: User object after import from User.js:', typeof User, User); // <--- ADD THIS

const models = {
    User: User,
};
console.log('models/index.js: models object before export:', models); // <--- ADD THIS

module.exports = {
    sequelize,
    ...models,
};