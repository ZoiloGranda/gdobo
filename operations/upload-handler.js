const chalk = require('chalk');
const {
 getAllGDriveFiles,
 getAllLocalFiles,
 compareFiles,
 sendFilesInArray,
 getFolders
} = require('../common');
const {
 selectFiles,
 selectGDriveFolder
} = require('../interface')

module.exports = async function uploadHandler(auth) {
 let { localFolder, gDriveFolder } = await getFolders();
 let allGDriveFiles = await getAllGDriveFiles({
  auth: auth,
  gDriveFolder: gDriveFolder
 })
 let allLocalFiles = await getAllLocalFiles(localFolder);
 let differentFiles = await compareFiles({
  allLocalFiles: allLocalFiles,
  allGDriveFiles: allGDriveFiles
 })
 let filesToUpload = differentFiles.areInLocal;
 console.log({
  filesToUpload
 });
 if (filesToUpload.length === 0) {
  console.log(chalk.yellow(`Nothing to Upload`));
  return
 }
 let selectedFiles = await selectFiles({
  choices: filesToUpload,
  operation: 'upload'
 })
 sendFilesInArray({
  auth: auth,
  filenames: selectedFiles,
  localFolder: localFolder,
  gDriveFolder: gDriveFolder
 }).then(()=>{
  console.log(chalk.black.bgWhite(`Operation completed`));
 })
}