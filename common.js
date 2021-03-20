const path = require('path');
const _ = require('lodash');
const fs = require('fs');
const Promise = require('bluebird');
const chalk = require('chalk');
const { askForLocalFolder, askForGDriveFolder } = require('./interface')
const {
 listFiles,
 upload
} = require('./google-drive-api');

const getAllGDriveFiles = async function(params) {
 const {
  auth,
  gDriveFolder,
  nameIdSize
 } = params
 let data = {};
 const files = [];
 do {
  data = await listFiles({
   auth: auth,
   nextPageTkn: data.nextPageToken,
   gDriveFolder: gDriveFolder
  })
  if (nameIdSize) {
   data.files.forEach((file) => {
    files.push(file)
   });
  } else if (!data.files) {
   console.log(chalk.red('Google Drive Folder is empty'))
  } else {
   data.files.forEach((file) => {
    files.push(file.name)
   });
  }
  console.log('nextPageToken: ', data.nextPageToken);
 } while (data.nextPageToken != null);
 console.log(chalk.cyan('Finished getting files list'))
 return (files)
};

// only returns files not folders
const getAllLocalFiles = function(localFolder) {
 return new Promise(function(resolve, reject) {
  fs.readdir(localFolder, (err, filenames) => {
   if (err) reject(err)
   const onlyFiles = filenames.filter(file => {
    return fs.lstatSync(localFolder + file).isFile();
   });
   resolve(onlyFiles)
  });
 });
}

// compares files by name
function compareFiles(params) {
 const {
  allLocalFiles,
  allGDriveFiles
 } = params
 const areInLocal = _.difference(allLocalFiles, allGDriveFiles);
 const areInGDrive = _.difference(allGDriveFiles, allLocalFiles);
 console.log({
  areInLocal
 });
 console.log({
  areInGDrive
 });
 return {
  areInLocal: areInLocal,
  areInGDrive: areInGDrive
 }
}

function sendFilesInArray(params) {
 const {
  filenames,
  auth,
  localFolder,
  gDriveFolder
 } = params
 return Promise.map(filenames, function(currentFile) {
  return upload({
   filename: currentFile,
   auth: auth,
   localFolder: localFolder,
   gDriveFolder: gDriveFolder
  })
   .then(function(data) {
    console.log(chalk.green(`\nFile saved: ${currentFile} ${data.status} ${data.statusText}`));
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
  }).catch(function(err) {
   console.log('ERROR');
   console.log(err);
  });
}

function deleteLocalFile(params) {
 return new Promise(function(resolve, reject) {
  const { localFolder, filename } = params
  fs.unlink(localFolder + filename, function(err) {
   if (err) {
    console.log(chalk.red(`Could not delete: ${filename}`));
    reject(err)
   } else {
    // console.log(chalk.cyan(`Successfully deleted: ${filename}`));
    resolve();
   }
  })
 });
}

async function getFolders() {
 const config = require('./config.json')
 // return new Promise(async function(resolve, reject) {
 const localFolder = await askForLocalFolder(config.LOCAL_FOLDERS)
 const gDriveFolder = await askForGDriveFolder(config.GDRIVE_FOLDERS)
 const validFolders = await validateFolders({ localFolder: localFolder, gDriveFolder: gDriveFolder })
 if (validFolders) {
  return ({ localFolder: localFolder, gDriveFolder: gDriveFolder })
 }
}

function validateFolders(params) {
 return new Promise(function(resolve, reject) {
  let { localFolder, gDriveFolder } = params
  if (localFolder) {
   const str = localFolder;
   const res = str.charAt(str.length - 1);
   if (res !== '/') {
    localFolder = localFolder + '/'
   }
   console.log(chalk.cyan(`local folder to operate: ${localFolder}`));
  } else {
   console.log(chalk.red('Error: parameter NOT found in config.json for LOCAL_FOLDERS'));
   reject(new Error('Error: parameter NOT found in config.json for LOCAL_FOLDERS'))
   process.end()
  }
  if (!fs.lstatSync(localFolder).isDirectory()) {
   console.log(chalk.red('Error: local folder is not a valid directory'))
   reject(new Error('Error: local folder is not a valid directory'))
   process.end()
  }
  if (gDriveFolder) {
   console.log(chalk.cyan(`Google Drive folder to operate: ${gDriveFolder}`));
   resolve(true);
  }
 });
}

function renameTempFile(params) {
 const { file } = params;
 fs.rename(`${file}-temp`, file, (err) => {
  if (err) throw err;
 });
}

function normalizePath({ localFolderPath }) {
 // remove first and last '
 if (localFolderPath.charAt(0) === '\'' &&
  localFolderPath.charAt(localFolderPath.length - 1) === '\'') {
  localFolderPath = localFolderPath.slice(1, -1)
 }
 // remove first and last "
 if (localFolderPath.charAt(0) === '"' &&
  localFolderPath.charAt(localFolderPath.length - 1) === '"') {
  localFolderPath = localFolderPath.slice(1, -1)
 }
 return path.normalize(localFolderPath)
}

module.exports = {
 getAllGDriveFiles,
 getAllLocalFiles,
 compareFiles,
 sendFilesInArray,
 deleteLocalFile,
 getFolders,
 renameTempFile,
 normalizePath
}
