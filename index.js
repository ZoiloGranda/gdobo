const fs = require('fs');
const path = require('path');
const {
 google
} = require('googleapis');
const Promise = require('bluebird');
const readline = require('readline');
const chalk = require('chalk');
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
const _ = require('lodash');
const {
 askOperation,
 askForConfirmation,
 askForLocalFolder,
 askForGDriveFolder,
 selectFiles
} = require('./interface')
const envPath = path.join(__dirname,'/.env');
require('dotenv').config({path: envPath});

async function startProcess(auth) {
 let selectedOperation = await askOperation();
 try {
  await checkEnv();
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
   reject()
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
   default:
    console.log(chalk.red(`Operation ${selectedOperation} not recognize`));
  }
 } else {
  console.log(chalk.red(`No operation provided`));
 }
}

async function syncHandler(auth) {
 let {localFolder, gDriveFolder} = await getFolders();
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
  let filesToDelete = _.filter(allGDriveFiles, function(currentFile) {
   for (let element of differentFiles.areInGDrive) {
    if (currentFile.name === element) {
     return true
     break
    }
   }
  });
  console.log(chalk.yellow(`Files to delete from Google Drive:`));
  filesToDelete.forEach(element => console.log(chalk.yellow(element.name)));
  let confirmation = await askForConfirmation()
  if (confirmation.answer) {
   Promise.map(filesToDelete, function(currentFile) {
     return deleteFileGDrive({
       filename: currentFile.name,
       fileId: currentFile.id,
       auth: auth,
       gDriveFolder: gDriveFolder
      })
      .then(function(deletedFile) {
       console.log(chalk.green(`\nFile deleted successfully: ${deletedFile}`));
      })
      .catch(function(err) {
       console.log(chalk.red('ERROR'));
       console.log(err);
      });
    }, {
     concurrency: 1
    })
    .then(function() {
     console.log(chalk.bgGreen.bold('Successfully deleted all files from Google Drive'));
     process.exit();
    }).catch(function(err) {
     console.log('ERROR');
     console.log(err);
    });
  } else {
   console.log(chalk.cyan(`Nothing to do here`));
   process.exit()
  }
 } catch (e) {
  console.log(e);
  process.exit()
 } finally {

 }
}

async function uploadHandler(auth) {
 let {localFolder, gDriveFolder} = await getFolders();
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
 if (filesToUpload[0]) {
  sendFilesInArray({
   auth: auth,
   filenames: filesToUpload,
   localFolder: localFolder,
   gDriveFolder: gDriveFolder
  })
 } else {
  console.log(chalk.yellow(`Nothing to Upload`));
 }

}

async function compareHandler(auth) {
 let {localFolder, gDriveFolder} = await getFolders();
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
 let {localFolder, gDriveFolder} = await getFolders();
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
  choices:differentFiles.areInGDrive,
  operation:'download'
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
     renameTempFile({file:`${localFolder}${currentFile.name}`})
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

//removes local files that were removed from google drive
async function localsyncHandler(auth) {
 let {localFolder, gDriveFolder} = await getFolders();
 let allLocalFiles = await getAllLocalFiles(localFolder);
 let allGDriveFiles = await getAllGDriveFiles({
  auth: auth,
  gDriveFolder: gDriveFolder
 })
 let differentFiles = await compareFiles({
  allLocalFiles: allLocalFiles,
  allGDriveFiles: allGDriveFiles
 })
 let filesToDelete = differentFiles.areInLocal;
 if (filesToDelete.length === 0) {
  console.log(chalk.yellow(`Nothing to delete, local folder is updated`));
  process.exit()
 }
 console.log(chalk.yellow(`Files to delete from local folder:`));
 filesToDelete.forEach(element => console.log(chalk.yellow(element)));
 let confirmation = await askForConfirmation()
	console.log(confirmation);
 if (!confirmation.answer) {
  console.log(chalk.yellow(`Exiting...`));
  process.exit()
 }
 // localFolder, filename
 Promise.map(filesToDelete, function(currentFile) {
   return deleteLocalFile({
     filename: currentFile,
     localFolder: localFolder,
    })
    .then(function() {
     console.log(chalk.green(`\nDeleted File: ${localFolder}${currentFile}`));
    })
    .catch(function(err) {
     console.log(chalk.red('ERROR'));
     console.log(err);
    });
  }, {
   concurrency: 1
  })
  .then(function() {
   console.log(chalk.bgGreen.bold('SUCCESS DELETING ALL FILES'));
   process.exit()
  }).catch(function(err) {
   console.log('ERROR');
   console.log(err);
  });

}

module.exports = {
 startProcess,
};