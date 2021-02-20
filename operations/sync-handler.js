const chalk = require('chalk');
const _ = require('lodash');
const Promise = require('bluebird');
const {
 deleteFileGDrive
} = require('../google-drive-api');
const {
 getAllGDriveFiles,
 getAllLocalFiles,
 compareFiles,
 getFolders
} = require('../common');
const {
 askForConfirmation,
 selectFiles
} = require('../interface')

//Removes files from Google Drive
module.exports = async function syncHandler(auth) {
 let {
  localFolder,
  gDriveFolder
 } = await getFolders();
 try {
  let allLocalFiles = await getAllLocalFiles(localFolder);
  let allGDriveFiles = await getAllGDriveFiles({
   auth: auth,
   gDriveFolder: gDriveFolder,
   nameIdSize: true
  })
  let allGDriveFilesNames = _.map(allGDriveFiles, 'name');
  let differentFiles = await compareFiles({
   allLocalFiles: allLocalFiles,
   allGDriveFiles: allGDriveFilesNames
  })
  if (differentFiles.areInGDrive.length === 0) {
   console.log(chalk.yellow(`There are no files to Sync`));
   process.exit();
  }
  let filesToDelete = _.filter(allGDriveFiles, function (currentFile) {
   for (let element of differentFiles.areInGDrive) {
    if (currentFile.name === element) {
     currentFile.value = currentFile.id
     return true
     break
    }
   }
  });
  console.log(chalk.yellow(`Files to delete from Google Drive:`));
  console.log(filesToDelete);
  let confirmedFilesToDelete = await selectFiles({
   choices: filesToDelete,
   operation: 'DELETE'
  })
  if (confirmedFilesToDelete[0].value === 'back') {
   console.log(chalk.yellow(`Returning`));
   return
  }
  let filesWithData = [];
  confirmedFilesToDelete.forEach((item) => {
   let found = filesToDelete.find(element => element.id === item);
   filesWithData.push(found)
  });
  filesWithData.forEach(element => console.log(chalk.yellow(element.name)));
  let confirmation = await askForConfirmation()
  if (confirmation.answer) {
   await Promise.map(filesWithData, function (currentFile) {
     return deleteFileGDrive({
       filename: currentFile.name,
       fileId: currentFile.id,
       auth: auth,
       gDriveFolder: gDriveFolder
      })
      .then(function (deletedFile) {
       console.log(chalk.green(`\nFile deleted successfully: ${deletedFile}`));
      })
      .catch(function (err) {
       console.log(chalk.red('ERROR'));
       console.log(err);
      });
    }, {
     concurrency: 1
    })
    .then(function () {
     console.log(chalk.bgGreen.bold('Successfully deleted all files from Google Drive'));
    }).catch(function (err) {
     console.log('ERROR');
     console.log(err);
    });
  } else {
   console.log(chalk.cyan(`Nothing to do here`));
  }
 } catch (e) {
  console.log(e);
  process.exit()
 } finally {
  console.log(chalk.black.bgWhite(`Operation completed`));
 }
}