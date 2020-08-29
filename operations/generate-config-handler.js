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

module.exports = async function generateConfigHandler({ auth }) {
 let localFolderPath = await askLocalFolderPath()
 console.log({localFolderPath});
 let localPathNormalized = path.normalize(localFolderPath)
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
  LOCAL_FOLDERS:[{
   name:localFolderName,
   value:localFolderPath+'/'
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