const inquirer = require('inquirer');

function askOperation() {
 return inquirer
 .prompt([{
  type: 'list',
  name: 'option',
  message: 'Operation to perform',
  choices: operations,
  pageSize: 12
 }])
 .then(answer => {
  return answer
 });
}

function askForConfirmation() {
 return inquirer
 .prompt([{
  type: 'confirm',
  name: 'answer',
  message: 'Are you sure you want to delete these files?',
  choices: ['Yes', 'No']
 }])
 .then(answer => {
  return answer
 });
}

function askForLocalFolder(options) {
 return inquirer
 .prompt([{
  type: 'list',
  name: 'option',
  message: 'Select LOCAL folder to operate',
  choices: options,
  pageSize: 10
 }])
 .then(answer => {
  return answer.option
 });
}

function askForGDriveFolder(options) {
 return inquirer
 .prompt([{
  type: 'list',
  name: 'option',
  message: 'Select GOOGLE DRIVE folder to operate',
  choices: options,
  pageSize: 10
 }])
 .then(answer => {
  return answer.option
 });
}

function selectFiles({ choices, operation }) {
 return inquirer
 .prompt([{
  type: 'checkbox',
  message: `Select files to ${operation}`,
  name: 'files',
  choices: choices,
  validate: function(answer) {
   if (answer.length < 1) {
    return 'You must choose at least one file.';
   }
   return true;
  }
 }])
 .then(answers => {
  return [...answers.files]
 });
}

function askLocalFolderPath() {
 return inquirer
 .prompt([{
  type: 'input',
  name: 'localFolderPath',
  message: "Drag your local folder here"
 }])
 .then(answer => {
  return answer.localFolderPath.slice(1,-1)
 });
}

function selectGDriveFolder(options) {
 return inquirer
 .prompt([{
  type: 'list',
  name: 'option',
  message: 'Select GOOGLE DRIVE folder to add on config file',
  choices: options,
  pageSize: 10
 }])
 .then(answer => {
  return answer.option
 });
}

const operations = [{
  name: 'CONFIG - Generate config.json file. If this is the first time running the app, select this',
  value: 'generateConfig'
 },
 {
 name: 'UPLOAD - Upload all files from a local folder to the specified Google Drive folder. It will check the filenames and skip the ones that are already on Google Drive',
 value: 'upload'
},
{
 name: 'DOWNLOAD - Download all the files from the Google Drive folder to the local folder. It checks the filenames before downloading, to avoid downloading duplicate files',
 value: 'download'
},
{
 name: 'COMPARE - Compare files between a local folder and a Google Drive folder',
 value: 'compare'
},
{
 name: 'REMOVE FROM GDRIVE - Remove the files that are on the Google Drive folder but not on local. Should be used when some files were deleted from the local folder, and they should be removed from Google Drive too',
 value: 'sync'
},
{
 name: 'REMOVE FROM LOCAL - Remove local files that were removed from the Google Drive folder. Should be used when there were files removed from the Google Drive folder and the local folder needs to be updated',
 value: 'localsync'
},
{
 name: 'FOLDERS - Get all the folders names and id\'s from Google Drive',
 value: 'folders'
},
{
 name: 'MODIFY CONFIG - Modify an existing config.json file',
 value: 'modifyConfig'
}
]

module.exports = {
 askOperation,
 askForConfirmation,
 askForLocalFolder,
 askForGDriveFolder,
 selectFiles,
 askLocalFolderPath,
 selectGDriveFolder
}