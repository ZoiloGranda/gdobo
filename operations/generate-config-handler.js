const path = require('path');
const fs = require('fs').promises;
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

module.exports = async function generateConfigHandler({ auth }) {
 console.log('arepa');
 let melon = 'melon'
 console.log(melon);
 let patilla = {
  name: 'patilla'
 }
 console.log(patilla);
 console.log(patilla.name);
 let localFolderPath = await askLocalFolderPath()
 console.log(1,localFolderPath);
 let localPathNormalized = normalizePath({localFolderPath});
 console.log(2,localPathNormalized);
 let localFolderName = path.basename(localPathNormalized);
 console.log(3,localFolderName);
 let allGDriveFolders = await getGDriveFolders({
  auth: auth
 });
 allGDriveFolders.filter(current => current.value = current.id)
 let googleDriveFolder = await selectGDriveFolder(allGDriveFolders)
 let googleDriveFolderData = allGDriveFolders.find(element => element.id === googleDriveFolder)
 let dataToWrite = {
  LOCAL_FOLDERS:[{
   name:localFolderName,
   value:localPathNormalized+'/'
  }],
  GDRIVE_FOLDERS:[{
   name:googleDriveFolderData.name,
   value:googleDriveFolderData.id
  }]
 }
 await fs.writeFile('config.json', JSON.stringify(dataToWrite, null, 1))
  .then(() => {
    console.log(chalk.green('\nconfig.json file created successfully'));
    console.log(chalk.black.bgWhite(`Operation completed`));
   })
  .catch(err => {
    console.log(err);
    process.exit()
  })
}