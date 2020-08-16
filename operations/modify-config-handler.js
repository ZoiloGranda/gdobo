const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const _ = require('lodash');
const {
 getGDriveFolders
} = require('../google-drive-api');
const {
 askLocalFolderPath,
 selectGDriveFolder
} = require('../interface')

module.exports = async function modifyConfigHandler({ auth }) {
 fs.readFile('folders.json', 'utf8', function(err, contents) {
     console.log(contents);
     console.log(JSON.parse(contents));
 });
}