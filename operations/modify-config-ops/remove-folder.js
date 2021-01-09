const fs = require('fs');
const chalk = require('chalk');
const {
 askForGDriveFolder,
 askForLocalFolder
} = require('../../interface')

module.exports = async function removeFolder({ auth }) {
 let config = require('../../config.json');
 const localFolderToDelete = await askForLocalFolder(config.LOCAL_FOLDERS)
 config.LOCAL_FOLDERS = config.LOCAL_FOLDERS.filter(elem => elem.value !== localFolderToDelete)
 const gDriveFolderToDelete = await askForGDriveFolder(config.GDRIVE_FOLDERS)
 config.GDRIVE_FOLDERS = config.GDRIVE_FOLDERS.filter(elem => elem.value !== gDriveFolderToDelete)
 fs.writeFileSync('config.json', JSON.stringify(config, null, 1))
  console.log(chalk.green('\nconfig.json file modified successfully'));
  console.log(chalk.black.bgWhite(`Operation completed`));
 
}