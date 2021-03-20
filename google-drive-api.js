const {
 google
} = require('googleapis');
const chalk = require('chalk');
const fs = require('fs');
const readline = require('readline');

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
const listFiles = function(params) {
 return new Promise(function(resolve, reject) {
  const {
   auth,
   nextPageTkn,
   gDriveFolder
  } = params;
  const drive = google.drive({
   version: 'v3',
   auth
  });
  console.log(chalk.cyan('Getting files, please wait'));
  const listParams = {
   pageSize: 500,
   fields: 'nextPageToken, files(id, name, size)',
   pageToken: nextPageTkn,
   // q: "mimeType='application/vnd.google-apps.folder'"
   q: `parents='${gDriveFolder}' and mimeType != 'application/vnd.google-apps.folder'`
  };
  listParams.pageToken = nextPageTkn
  drive.files.list(listParams, (err, res) => {
   if (err) {
    console.log('The API returned an error: ');
    console.log(err);
    reject(err)
   }
   if (res && res.data && res.data.files.length) {
    console.log('Files:');
    resolve(res.data)
   } else {
    resolve('No files found.')
    console.log('No files found.');
   }
  });
 });
}

function upload(params) {
 return new Promise(function(resolve, reject) {
  const {
   auth,
   filename,
   localFolder,
   gDriveFolder
  } = params;
  console.log(chalk.inverse(`----------------------\nUPLOADING: ${filename}`));
  const fileSize = fs.statSync(localFolder + filename).size;
  const drive = google.drive({
   version: 'v3',
   auth: auth
  });
  const fileMetadata = {
   name: filename,
   parents: [gDriveFolder]
  };
  const media = {
   // mimeType: 'audio/mpeg',
   body: fs.createReadStream(localFolder + filename)
  };
  drive.files.create({
   resource: fileMetadata,
   media: media,
   fields: 'id'
  }, {
   onUploadProgress: evt => {
    const progress = (evt.bytesRead / fileSize) * 100;
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0, null)
    process.stdout.write(chalk.inverse(`${Math.round(progress)}% complete`));
   }
  }, function(err, file) {
   if (err) {
    console.log(chalk.red(`ERROR WITH: ${filename}`));
    console.log(err);
    reject(err)
   } else {
    resolve(file)
   }
  })
 })
}

const getGDriveFolders = function(params) {
 return new Promise(function(resolve, reject) {
  const {
   auth
  } = params;
  const drive = google.drive({
   version: 'v3',
   auth
  });
  console.log(chalk.cyan('Getting folders, please wait'));
  const listParams = {
   pageSize: 500,
   fields: 'files(id, name)',
   q: "mimeType='application/vnd.google-apps.folder'"
  };
  drive.files.list(listParams, (err, res) => {
   if (err) {
    console.log('The API returned an error: ');
    console.log(err);
    reject(err)
   }
   const folders = res.data.files;
   if (folders.length) {
    console.log('Folders:');
    resolve(folders)
   } else {
    resolve('No Folders found.')
    console.log('No Folders found.');
   }
  });
 });
}

const download = function(params) {
 return new Promise(function(resolve, reject) {
  let {
   auth,
   localFolder,
   fileId,
   filename,
   fileSize
  } = params;
  const dest = fs.createWriteStream(`${localFolder}${filename}-temp`);
  console.log(`----------------------\nCreated File: ${localFolder}${filename}-temp`);
  const drive = google.drive({
   version: 'v3',
   auth
  });
  let chunkAccumulator = 0;
  fileSize = Number(fileSize)
  drive.files.get({
   fileId: fileId,
   alt: 'media'
  }, {
   responseType: 'stream'
  }, (err, {
   data
  }) => {
   if (err) {
    console.log('err', err);
    reject(err)
   } else {
    data.pipe(dest);
    data.on('end', function() {
     resolve()
    })
    data.on('error', function(err) {
     console.log(err);
     reject(new Error('Error Happens'))
    })
    data.on('data', function(chunk) {
     chunkAccumulator += chunk.length;
     const progress = (chunkAccumulator / fileSize) * 100;
     readline.clearLine(process.stdout, 0)
     readline.cursorTo(process.stdout, 0, null)
     process.stdout.write(chalk.inverse(`Downloading ${Math.round(progress)}% completed`));
    })
   }
  })
 });
}

const deleteFileGDrive = function(params) {
 return new Promise(function(resolve, reject) {
  const {
   filename,
   fileId,
   auth
  } = params;
  const drive = google.drive({
   version: 'v3',
   auth: auth
  })
  drive.files.delete({
   fileId: fileId
  }, (err, res) => {
   if (err) {
    console.error('The API returned an error.');
    reject(err)
   } else {
    resolve(filename)
   }
  })
 });
}

module.exports = {
 listFiles,
 upload,
 getGDriveFolders,
 download,
 deleteFileGDrive
}
