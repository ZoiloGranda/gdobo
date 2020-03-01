const {google} = require('googleapis');
const chalk = require('chalk');
const fs = require('fs');

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
var listFiles = function(params) {
 return new Promise(function(resolve, reject) {
	var {
		auth,
		nextPageTkn
	} = params;
		const drive = google.drive({
			version: 'v3',
			auth
		});
		console.log('voy');
		let listParams = {
			pageSize: 30,
			fields: 'nextPageToken, files(id, name)',
			pageToken: nextPageTkn,
			//q: "mimeType='application/vnd.google-apps.folder'"
			q: "parents='1qT4mEbnKQZIuKCGLR5Evr_fNwVcTnn9z'"
		};
		listParams.pageToken = nextPageTkn
		drive.files.list(listParams, (err, res) => {
			if (err) {
    console.log('The API returned an error: ');
    console.log(err);
    reject(err)
   }
			const files = res.data.files;
			// console.log(res.data);
			if (files.length) {
				console.log('Files:');
				// files.map((file) => {
				// 	console.log(`${file.name} (${file.id})`);
				// });
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
   folder
  } = params;
		console.log(chalk.inverse(`UPLOADING: ${filename}`));
		const fileSize = fs.statSync(folder + filename).size;
		const drive = google.drive({
			version: 'v3',
			auth
		});
		var fileMetadata = {
			'name': filename
		};
		var media = {
			mimeType: 'audio/mpeg',
			body: fs.createReadStream(folder + filename)
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

module.exports = {
	listFiles,
 upload
}