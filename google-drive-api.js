const {google} = require('googleapis');
const chalk = require('chalk');
const fs = require('fs');
const readline = require('readline');

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
var listFiles = function(params) {
 return new Promise(function(resolve, reject) {
	var {
		auth,
		nextPageTkn,
  gDriveFolder
	} = params;
		const drive = google.drive({
			version: 'v3',
			auth
		});
		console.log('voy');
		let listParams = {
			pageSize: 500,
			fields: 'nextPageToken, files(id, name)',
			pageToken: nextPageTkn,
			//q: "mimeType='application/vnd.google-apps.folder'"
			q: `parents='${gDriveFolder}'`
		};
		listParams.pageToken = nextPageTkn
		drive.files.list(listParams, (err, res) => {
			if (err) {
    console.log('The API returned an error: ');
    console.log(err);
    reject(err)
   }
			const files = res.data.files;
			if (files.length) {
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
  let {
   auth,
   filename,
   localFolder,
   gDriveFolder
  } = params;
		console.log(chalk.inverse(`UPLOADING: ${filename}`));
		const fileSize = fs.statSync(localFolder + filename).size;
		const drive = google.drive({
			version: 'v3',
			auth: auth
		});
		var fileMetadata = {
			'name': filename,
   parents: [gDriveFolder]
		};
		var media = {
			mimeType: 'audio/mpeg',
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
			},
		}, function(err, file) {
			if (err) {
				console.log(chalk.red(`ERROR WITH: ${filename}`));
				console.log(err);
				reject(err)
			}
			else {
				resolve(file)
			}
		})
	})
}

var getGDriveFolders = function(params) {
 return new Promise(function(resolve, reject) {
	var {
		auth,
	} = params;
		const drive = google.drive({
			version: 'v3',
			auth
		});
		console.log('voy');
		let listParams = {
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

module.exports = {
	listFiles,
 upload,
 getGDriveFolders
}