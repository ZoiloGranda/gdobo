const fs = require('fs');
const {google} = require('googleapis');
const Promise = require('bluebird');
const readline = require('readline');
const chalk = require('chalk');

require('dotenv').config();
const folder = process.env.FOLDER_TO_UPLOAD;
console.log(folder);
var auth;

function startProcess(authData) {
 auth = authData;
 listAllFiles();
}

function listAllFiles() {
 fs.readdir(folder, (err, filenames) => {
  console.log(chalk.gray(filenames));
  sendFilesInArray(filenames)
 });
}

function sendFilesInArray(filenames) {
 console.log(filenames);
 Promise.reduce(filenames, function(total, currentFile) {
  console.log({currentFile});
  return upload(currentFile).then(function(data) {
   console.log(chalk.green(`${data.status} ${data.statusText}`));
   return;
  });
 }).then(function(total) {
  console.log(chalk.bgGreen('SUCCESS ALL FILES'));
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
    console.log(`ERROR WITH ${filename}`);
    console.error(err);
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











