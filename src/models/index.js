const sequelize = require('../config/db');
const User = require('./User');
const PermitLetter = require('./PermitLetter')
const Notification  = require('./Notification');

const models = {
    User: User,
    PermitLetter,
    Notification,
};


module.exports = {
    sequelize,
    ...models,
};