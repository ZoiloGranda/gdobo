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

module.exports = async function generateConfigHandler({ auth }) {
 let localFolderPath = await askLocalFolderPath()
 let localFolderName = path.basename(localFolderPath);
 console.log({localFolderName});
 let allGDriveFolders = await getGDriveFolders({
  auth: auth
 });
 allGDriveFolders.filter(current => current.value = current.id)
 let googleDriveFolder = await selectGDriveFolder(allGDriveFolders)
 let googleDriveFolderData = allGDriveFolders.find(element => element.id === googleDriveFolder)
 let dataToWrite = {
  LOCAL_FOLDERS:[{
   name:localFolderName,
   value:localFolderPath+'/'
  }],
  GDRIVE_FOLDERS:[{
   name:googleDriveFolderData.name,
   value:googleDriveFolderData.id
  }]
 }
 fs.writeFile('config.json', JSON.stringify(dataToWrite, null, 1), function(err) {
  if (err) return console.log(err);
  console.log(chalk.green('config.json file created successfully'));
 });
}