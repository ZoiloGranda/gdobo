const Promise = require('bluebird');
const chalk = require('chalk');
const {
 getAllGDriveFiles,
 getAllLocalFiles,
 compareFiles,
 deleteLocalFile,
 getFolders
} = require('../common');
const {
 askForConfirmation,
 selectFiles
} = require('../interface')

// removes local files that were removed from google drive
module.exports = async function localsyncHandler(auth) {
 const {
  localFolder,
  gDriveFolder
 } = await getFolders();
 const allLocalFiles = await getAllLocalFiles(localFolder);
 const allGDriveFiles = await getAllGDriveFiles({
  auth: auth,
  gDriveFolder: gDriveFolder
 })
 const differentFiles = compareFiles({
  allLocalFiles: allLocalFiles,
  allGDriveFiles: allGDriveFiles
 })
 if (differentFiles.areInLocal.length === 0) {
  console.log(chalk.yellow('Nothing to delete, local folder is updated'));
  process.exit()
 }
 const filesToDelete = await selectFiles({
  choices: differentFiles.areInLocal,
  operation: 'DELETE'
 })
 if (filesToDelete[0].value === 'back') {
  console.log(chalk.yellow('Returning'));
  return
 }
 console.log(chalk.yellow('Files to delete from local folder:'));
 filesToDelete.forEach(element => console.log(chalk.yellow(element)));
 const confirmation = await askForConfirmation()
 console.log(confirmation);
 if (!confirmation.answer) {
  console.log(chalk.yellow('Exiting...'));
  process.exit()
 }
 // localFolder, filename
 await Promise.map(filesToDelete, function (currentFile) {
  return deleteLocalFile({
   filename: currentFile,
   localFolder: localFolder
  })
   .then(function () {
    console.log(chalk.green(`\nDeleted File: ${localFolder}${currentFile}`));
   })
   .catch(function (err) {
    console.log(chalk.red('ERROR'));
    console.log(err);
   });
 }, {
  concurrency: 1
 })
  .then(function () {
   console.log(chalk.bgGreen.bold('SUCCESS DELETING ALL FILES'));
   console.log(chalk.black.bgWhite('Operation completed'));
  }).catch(function (err) {
   console.log('ERROR');
   console.log(err);
   process.exit()
  });
}
