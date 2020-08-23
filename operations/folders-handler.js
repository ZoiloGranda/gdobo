const {
 getGDriveFolders
} = require('../google-drive-api');
const chalk = require('chalk');

//Gets google drive folders ids
module.exports = async function foldersHandler(auth) {
 let allGDriveFolders = await getGDriveFolders({
  auth: auth
 });
 console.log(allGDriveFolders);
 console.log(chalk.black.bgWhite(`Operation completed`));
}