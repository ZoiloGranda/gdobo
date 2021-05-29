const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const {
 getGDriveFolders
} = require('../../google-drive-api');
const {
 askLocalFolderPath,
 selectGDriveFolder
} = require('../../interface')
const {
 normalizePath
} = require('../../common.js');

module.exports = async function addFolder({ auth }) {
 try {
  const config = require('../../config.json');
  const localFolderPath = await askLocalFolderPath()
  const localPathNormalized = normalizePath({ localFolderPath });
  if (!fs.lstatSync(localPathNormalized).isDirectory()) {
   console.log(chalk.red(`\nSelected path is not a folder: ${localPathNormalized}`));
   return
  }
  const localFolderName = path.basename(localPathNormalized);
  const allGDriveFolders = await getGDriveFolders({
   auth: auth
  });
  allGDriveFolders.forEach(current => {
   current.value = current.id
  })
  const googleDriveFolder = await selectGDriveFolder(allGDriveFolders)
  if (googleDriveFolder === 'back') {
   console.log(chalk.yellow('Returning'));
   return
  }
  const googleDriveFolderData = allGDriveFolders.find(element => element.id === googleDriveFolder)
  const dataToWrite = {
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
  fs.writeFileSync('config.json', JSON.stringify(dataToWrite, null, 1))
  console.log(chalk.green('\nconfig.json file modified successfully'));
  console.log(chalk.black.bgWhite('Operation completed'));
 } catch (error) {
  console.log(error);
  if (error.errno === -4058 && error.code === 'ENOENT' && error.syscall === 'lstat') {
   console.log(chalk.red('The path does not exists, please try again'));
  }
 }
}
