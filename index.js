const folder = process.env.FOLDER_TO_UPLOAD;
const fs = require('fs');
const {google} = require('googleapis');
const Promise = require('bluebird');
const readline = require('readline');
const chalk = require('chalk');
 
var auth;

function startProcess(authData) {
 auth = authData;
 listAllFiles();
}

function listAllFiles() {
 fs.readdir(folder, (err, filenames) => {
  console.log(chalk.blue(filenames));
  sendFilesInArray(filenames)
 });
}

function sendFilesInArray(filenames) {
 Promise.reduce(filenames, function(total, currentFile) {
  return upload(currentFile).then(function(data) {
   console.log(data.status);
   console.log(data.statusText);
   return ;
  });
 }).then(function(total) {
  console.log('SUCCESS ALL FILES');
 }).catch(function(err) {
  console.log('ERROR');
  console.log(err);
 });
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
function upload(filename) {
 return new Promise(function(resolve, reject) {
  console.log(`UPLOADING: ${filename}`);
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
   // Use the `onUploadProgress` event from Axios to track the
   // number of bytes uploaded to this point.
   onUploadProgress: evt => {
    const progress = (evt.bytesRead / fileSize) * 100;
    // readline.clearLine();
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0, null)
    process.stdout.write(`${Math.round(progress)}% complete`);
   },
  }, function (err, file) {
   if (err) {
    // Handle error
    console.log(`ERROR WITH ${filename}`);
    console.error(err);
    reject(err)
   } else {
    console.log('File saved: ', filename);
    resolve(file)
   }
  })
 })
}



// onUploadProgress: evt => {
//   const progress = (evt.bytesRead / fileSize) * 100;
//   readline.clearLine();
//   readline.cursorTo(0);
//   process.stdout.write(`${Math.round(progress)}% complete`);
// },

module.exports = {
 startProcess,
};