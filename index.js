const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const readline = require('readline');
const chalk = require('chalk');
const _ = require('lodash');
const {
 google
} = require('googleapis');
const { 
 uploadHandler,
 compareHandler,
 syncHandler,
 localsyncHandler
} = require('./operations')
const {
 listFiles,
 upload,
 getGDriveFolders,
 download,
 deleteFileGDrive
} = require('./google-drive-api');
const {
 getAllGDriveFiles,
 getAllLocalFiles,
 compareFiles,
 sendFilesInArray,
 deleteLocalFile,
 getFolders,
 renameTempFile
} = require('./common');
const {
 askOperation,
 askForConfirmation,
 askForLocalFolder,
 askForGDriveFolder,
 selectFiles,
 askLocalFolderPath,
 selectGDriveFolder
} = require('./interface')
const envPath = path.join(__dirname, '/.env');
require('dotenv').config({ path: envPath });

async function startProcess(auth) {
 let selectedOperation = await askOperation();
 try {
  if (selectedOperation.option !== 'generateEnv') {
   await checkEnv();
  }
 } catch (e) {
  if (e.code === 'ENOENT' || 'ENOTDIR') {
   console.log(chalk.red('Error: local folder is not a valid directory'))
  }
  console.log(e);
  process.exit()
 } finally {
  checkArgs(auth, selectedOperation.option)
 }
}

function checkEnv() {
 return new Promise(function(resolve, reject) {
  if (fs.existsSync(envPath)) {
   console.log(chalk.cyan('.env file found'));
   resolve();
  } else {
   console.log(chalk.red('Error: .env file NOT found'));
   reject(new Error('.env file NOT found'))
  }
 })
}

function checkArgs(auth, selectedOperation) {
 if (selectedOperation) {
  console.log(chalk.cyan(`Operation: ${chalk.inverse(selectedOperation)}`));
  switch (selectedOperation) {
   case 'upload':
    uploadHandler(auth)
    break;
   case 'compare':
    compareHandler(auth)
    break;
   case 'sync':
    syncHandler(auth)
    break;
   case 'localsync':
    localsyncHandler(auth)
    break;
   case 'folders':
    foldersHandler(auth)
    break;
   case 'download':
    downloadHandler(auth)
    break;
   case 'generateEnv':
    generateEnvHandler({ auth })
    break;
   default:
    console.log(chalk.red(`Operation ${selectedOperation} not recognize`));
  }
 } else {
  console.log(chalk.red(`No operation provided`));
 }
}

//Gets google drive folders ids
async function foldersHandler(auth) {
 let allGDriveFolders = await getGDriveFolders({
  auth: auth
 });
 console.log(allGDriveFolders);
 process.exit()
}

//downloads all the files from a google drive folder
//compares files by name to avoid downloading the same file twice
async function downloadHandler(auth) {
 let { localFolder, gDriveFolder } = await getFolders();
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
  console.log(chalk.yellow(`Nothing to download, folders are updated`));
  process.exit()
 }
 let selectedFiles = await selectFiles({
  choices: differentFiles.areInGDrive,
  operation: 'download'
 })
 let filesToDownload = _.filter(allGDriveFiles, function(currentFile) {
  for (let element of selectedFiles) {
   if (currentFile.name === element) {
    return true
   }
  }
 });
 console.log({
  filesToDownload
 });
 Promise.map(filesToDownload, function(currentFile) {
   return download({
     filename: currentFile.name,
     fileId: currentFile.id,
     fileSize: currentFile.size,
     auth: auth,
     localFolder: localFolder,
     gDriveFolder: gDriveFolder
    })
    .then(function() {
     renameTempFile({ file: `${localFolder}${currentFile.name}` })
     console.log(chalk.green(`\nFile saved: ${localFolder}${currentFile.name}`));
    })
    .catch(function(err) {
     console.log(chalk.red('ERROR'));
     console.log(err);
    });
  }, {
   concurrency: 1
  })
  .then(function() {
   console.log(chalk.bgGreen.bold('SUCCESS ALL FILES'));
   process.exit();
  }).catch(function(err) {
   console.log('ERROR');
   console.log(err);
  });
}

async function generateEnvHandler({ auth }) {
 let localFolderPath = await askLocalFolderPath()
 let localFolderName = localFolderPath.substring(localFolderPath.lastIndexOf('/') + 1)
 let allGDriveFolders = await getGDriveFolders({
  auth: auth
 });
 allGDriveFolders.filter(current => current.value = current.id)
 let googleDriveFolder = await selectGDriveFolder(allGDriveFolders)
 let googleDriveFolderData = allGDriveFolders.find(element => element.id === googleDriveFolder)
 let dataToWrite = `LOCAL_FOLDERS=[{"name":"${localFolderName}","value":"${localFolderPath}/"}]
 GDRIVE_FOLDERS=[{"name":"${googleDriveFolderData.name}","value":"${googleDriveFolderData.id}"}]`
 fs.writeFile('.env', dataToWrite, function(err) {
  if (err) return console.log(err);
  console.log(chalk.green('.env file created successfully'));
 });
}

module.exports = {
 startProcess,
};