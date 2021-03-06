const Promise = require('bluebird');
const chalk = require('chalk');
const _ = require('lodash');
const {
 getAllGDriveFiles,
 getAllLocalFiles,
 compareFiles,
 getFolders,
 renameTempFile
} = require('../common');
const {
 selectFiles
} = require('../interface');
const {
 download
} = require('../google-drive-api');

// downloads all the files from a google drive folder
// compares files by name to avoid downloading the same file twice
module.exports = async function downloadHandler(auth) {
 const {
  localFolder,
  gDriveFolder
 } = await getFolders();
 const allLocalFiles = await getAllLocalFiles(localFolder);
 const allGDriveFiles = await getAllGDriveFiles({
  auth: auth,
  gDriveFolder: gDriveFolder,
  nameIdSize: true
 })
 const allGDriveFilesNames = _.map(allGDriveFiles, 'name');
 const differentFiles = compareFiles({
  allLocalFiles: allLocalFiles,
  allGDriveFiles: allGDriveFilesNames
 })
 if (differentFiles.areInGDrive.length === 0) {
  console.log(chalk.yellow('Nothing to download, folders are updated'));
  return
 }
 const selectedFiles = await selectFiles({
  choices: differentFiles.areInGDrive,
  operation: 'download'
 })
 if (selectedFiles[0].value === 'back') {
  console.log(chalk.yellow('Returning'));
  return
 }
 const filesToDownload = _.filter(allGDriveFiles, function (currentFile) {
  for (const element of selectedFiles) {
   if (currentFile.name === element) {
    return true
   }
  }
 });
 console.log({
  filesToDownload
 });
 await Promise.map(filesToDownload, function (currentFile) {
  return download({
   filename: currentFile.name,
   fileId: currentFile.id,
   fileSize: currentFile.size,
   auth: auth,
   localFolder: localFolder,
   gDriveFolder: gDriveFolder
  })
   .then(function () {
    renameTempFile({
     file: `${localFolder}${currentFile.name}`
    })
    console.log(chalk.green(`\nFile saved: ${localFolder}${currentFile.name}`));
   })
   .catch(function (err) {
    console.log(chalk.red('ERROR'));
    console.log(err);
   });
 }, {
  concurrency: 1
 })
  .then(function () {
   console.log(chalk.bgGreen.bold('SUCCESS ALL FILES'));
   console.log(chalk.black.bgWhite('Operation completed'));
  }).catch(function (err) {
   console.log(err);
   process.exit()
  });
}
