const {
 getAllGDriveFiles,
 getAllLocalFiles,
 compareFiles,
 getFolders
} = require('../common');
const _ = require('lodash');

module.exports = async function compareHandler(auth) {
 let { localFolder, gDriveFolder } = await getFolders();
 try {
  let allGDriveFiles = await getAllGDriveFiles({
   auth: auth,
   gDriveFolder: gDriveFolder
  });
  var allLocalFiles = await getAllLocalFiles(localFolder);
  let allFilesList = compareFiles({
   allGDriveFiles: allGDriveFiles,
   allLocalFiles: allLocalFiles
  })
  if (_.isEqual(allFilesList.areInLocal, allFilesList.areInGDrive)) {
   console.log(chalk.yellow(`The same files are in local and Google Drive`));
  }
 } catch (e) {
  console.log(e);
  process.exit();
 } finally {
  process.exit();
 }
}
