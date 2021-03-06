const _ = require('lodash');
const chalk = require('chalk');
const {
 getAllGDriveFiles,
 getAllLocalFiles,
 compareFiles,
 getFolders
} = require('../common');

module.exports = async function compareHandler(auth) {
 const { localFolder, gDriveFolder } = await getFolders();
 try {
  const allGDriveFiles = await getAllGDriveFiles({
   auth: auth,
   gDriveFolder: gDriveFolder
  });
  const allLocalFiles = await getAllLocalFiles(localFolder);
  const allFilesList = compareFiles({
   allGDriveFiles: allGDriveFiles,
   allLocalFiles: allLocalFiles
  })
  if (_.isEqual(allFilesList.areInLocal, allFilesList.areInGDrive)) {
   console.log(chalk.yellow('The same files are in local and Google Drive'));
  }
 } catch (e) {
  console.log(e);
  process.exit();
 } finally {
  console.log(chalk.black.bgWhite('Operation completed'));
 }
}
