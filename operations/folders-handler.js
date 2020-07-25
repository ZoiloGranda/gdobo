const {
 getGDriveFolders
} = require('../google-drive-api');

//Gets google drive folders ids
module.exports = async function foldersHandler(auth) {
 let allGDriveFolders = await getGDriveFolders({
  auth: auth
 });
 console.log(allGDriveFolders);
 process.exit()
}