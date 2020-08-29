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
const {
 normalizePath
} = require('../common.js')

module.exports = async function modifyConfigHandler({ auth }) {
 const config = require('../config.json');
 let localFolderPath = await askLocalFolderPath()
 console.log({localFolderPath});
 let localPathNormalized = normalizePath({localFolderPath});
 console.log({localPathNormalized});
 let localFolderName = path.basename(localPathNormalized);
 console.log({ localFolderName });
 let allGDriveFolders = await getGDriveFolders({
  auth: auth
 });
 allGDriveFolders.filter(current => current.value = current.id)
 let googleDriveFolder = await selectGDriveFolder(allGDriveFolders)
 let googleDriveFolderData = allGDriveFolders.find(element => element.id === googleDriveFolder)
 let dataToWrite = {
  LOCAL_FOLDERS: [
   ...config.LOCAL_FOLDERS,
   {
    name: localFolderName,
    value: localPathNormalized + '/'
   }
  ],
  GDRIVE_FOLDERS: [
   ...config.GDRIVE_FOLDERS,
   {
    name: googleDriveFolderData.name,
    value: googleDriveFolderData.id
   }
  ]
 }
 console.log(dataToWrite);
 fs.writeFile('config.json', JSON.stringify(dataToWrite, null, 1), function(err) {
  if (err) return console.log(err);
  console.log(chalk.green('\nconfig.json file modified successfully'));
  console.log(chalk.black.bgWhite(`Operation completed`));
 });
}