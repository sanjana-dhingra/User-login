
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const dbSchema = new mongoose.Schema({
    version: { type: Number },
    createdAt: { type: Date }
});

const dbVersion = mongoose.model('Dbversion', dbSchema);

module.exports = dbVersion;
