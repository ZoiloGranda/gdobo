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
 localsyncHandler,
 foldersHandler,
 downloadHandler,
 generateEnvHandler
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

module.exports = {
 startProcess,
};