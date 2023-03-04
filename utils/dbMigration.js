const User = require('./../models/userModel');
const dbVersion = require('./../models/dbMigrationModel');

async function dbMigration() {
    const dbVersionData = await dbVersion.findOne({});

    if (!dbVersionData) {
        for (let i = 0; i < 20; i++){
            await User.create({ name: `test${i}`, email: `test${i}@yopmail.com`, password: "1234", zipCode: 125120, currentLocation: { type: "Point" , coordinates: [`76.71787${i}`, `30.70464${i}`]}  });
        }
        
        await dbVersion.create({ version: 1 });
        return;
    }

}

module.exports = dbMigration;