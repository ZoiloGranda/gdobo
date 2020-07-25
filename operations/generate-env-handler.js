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

module.exports = async function generateEnvHandler({ auth }) {
 let localFolderPath = await askLocalFolderPath()
 let localFolderName = localFolderPath.substring(localFolderPath.lastIndexOf('/') + 1)
 let allGDriveFolders = await getGDriveFolders({
  auth: auth
 });
 allGDriveFolders.filter(current => current.value = current.id)
 let googleDriveFolder = await selectGDriveFolder(allGDriveFolders)
 let googleDriveFolderData = allGDriveFolders.find(element => element.id === googleDriveFolder)
 let dataToWrite = `LOCAL_FOLDERS=[{"name":"${localFolderName}","value":"${localFolderPath}/"}]
 GDRIVE_FOLDERS=[{"name":"${googleDriveFolderData.name}","value":"${googleDriveFolderData.id}"}]`
 fs.writeFile('.env', dataToWrite, function(err) {
  if (err) return console.log(err);
  console.log(chalk.green('.env file created successfully'));
 });
}