const chalk = require('chalk');
const {
 getAllGDriveFiles,
 getAllLocalFiles,
 compareFiles,
 sendFilesInArray,
 getFolders
} = require('../common');
const {
 selectFiles
} = require('../interface')

module.exports = async function uploadHandler(auth) {
 const {
  localFolder,
  gDriveFolder
 } = await getFolders();
 const allGDriveFiles = await getAllGDriveFiles({
  auth: auth,
  gDriveFolder: gDriveFolder
 })
 const allLocalFiles = await getAllLocalFiles(localFolder);
 const differentFiles = compareFiles({
  allLocalFiles: allLocalFiles,
  allGDriveFiles: allGDriveFiles
 })
 const filesToUpload = differentFiles.areInLocal;
 if (filesToUpload.length === 0) {
  console.log(chalk.yellow('Nothing to Upload'));
  return
 }
 const selectedFiles = await selectFiles({
  choices: filesToUpload,
  operation: 'upload'
 })
 if (selectedFiles[0].value === 'back') {
  console.log(chalk.yellow('Returning'));
  return
 }
 await sendFilesInArray({
  auth: auth,
  filenames: selectedFiles,
  localFolder: localFolder,
  gDriveFolder: gDriveFolder
 }).then(() => {
  console.log(chalk.black.bgWhite('Operation completed'));
 })
}
