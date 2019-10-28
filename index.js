const fs = require('fs');
const {google} = require('googleapis');
const Promise = require('bluebird');
const readline = require('readline');
const chalk = require('chalk');
require('dotenv').config();

const folder = process.env.FOLDER_TO_UPLOAD;
var auth;

function startProcess(authData) {
 auth = authData;
 listAllFiles();
}

function listAllFiles() {
 fs.readdir(folder, (err, filenames) => {
  console.log(filenames);
  sendFilesInArray(filenames)
 });
}

function sendFilesInArray(filenames) {
 Promise.map(filenames, function(currentFile) {
  return upload(currentFile)
  .then(function(data) {
   console.log(chalk.green(`${data.status} ${data.statusText}`));
  })
  .catch(function(err) {
   console.log(chalk.red('ERROR'));
   console.log(err);
  });
 },{concurrency: 1})
 .then(function(data) {
  console.log(data);
  console.log(chalk.bgGreen.bold('SUCCESS ALL FILES'));
  const filesNotSent = data.filter((value) => isString(value))
  console.log({filesNotSent});
 }).catch(function(err) {
  console.log('ERROR');
  console.log(err);
 });
}

function upload(filename) {
 return new Promise(function(resolve, reject) {
  console.log(chalk.inverse(`UPLOADING: ${filename}`));
  const fileSize = fs.statSync(folder+filename).size;
  const drive = google.drive({version: 'v3', auth});
  var fileMetadata = {
   'name': filename
  };
  var media = {
   mimeType: 'audio/mpeg',
   body: fs.createReadStream(folder+filename)
  };
  drive.files.create({
   resource: fileMetadata,
   media: media,
   fields: 'id'
  },{
   onUploadProgress: evt => {
    const progress = (evt.bytesRead / fileSize) * 100;
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0, null)
    process.stdout.write(chalk.inverse(`${Math.round(progress)}% complete`));
   },
  }, function (err, file) {
   if (err) {
    console.log(chalk.red(`ERROR WITH ${filename}`));
    console.log(err);
    reject(err)
   } else {
    console.log(chalk.green(`\nFile saved: ${filename}`));
    resolve(file)
   }
  })
 })
}

// /**
// * Lists the names and IDs of up to 10 files.
// * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
// */
// function listFiles(auth) {
//  const drive = google.drive({version: 'v3', auth});
//  drive.files.list({
//   pageSize: 10,
//   fields: 'nextPageToken, files(id, name)',
//  }, (err, res) => {
//   if (err) return console.log('The API returned an error: ' + err);
//   const files = res.data.files;
//   if (files.length) {
//    console.log('Files:');
//    files.map((file) => {
//     console.log(`${file.name} (${file.id})`);
//    });
//   } else {
//    console.log('No files found.');
//   }
//  });
// }
// 
module.exports = {
 startProcess,
};