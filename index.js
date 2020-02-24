const fs = require('fs');
const {
	google
} = require('googleapis');
const Promise = require('bluebird');
const readline = require('readline');
const chalk = require('chalk');
const {
	listFiles
} = require('./google-drive-api');
const _ = require('lodash');

require('dotenv').config();

const folder = process.env.FOLDER_TO_UPLOAD;
var allFilesInDrive = [];

function checkArgs(authData) {
	var myArgs = process.argv.slice(2);
	console.log('myArgs: ', myArgs);
	switch (myArgs[0]) {
		case 'upload':
			uploadHandler(authData)
			break;
		case 'compare':
			compareHandler(authData)
			break;
		default:

	}
}

function uploadHandler() {
	listAllLocalFiles()
}

async function compareHandler(authData) {
	var data = {};
	var files = [];
	var counter = 1
	do {
		data = await listFiles({
			auth: authData,
			nextPageTkn: data.nextPageToken
		})
		data.files.map((file) => {
			files.push(file.name)
		});
		console.log(data.nextPageToken);
		counter++;
		// } while (data.nextPageToken != null);
	} while (counter < 3);
 console.log('done');
 console.log(files);
 compareFiles(files)
}

 async function compareFiles(gDriveFiles){
	var allLocalFiles = await listAllLocalFiles();
 var differentFiles = _.difference(allLocalFiles, gDriveFiles);
 console.log(differentFiles);
 var areInLocal = []
 var areInGDrive = []
 differentFiles.forEach(function (element) {
  let foundInLocal = _.indexOf(allLocalFiles, element)
  let foundInDrive = _.indexOf(gDriveFiles, element)
  if (foundInLocal != -1) {
   areInLocal.push(element)
  } else {
   foundInDrive.push(element)
  }
 })
 console.log({areInLocal});
 console.log({areInGDrive});

}

function listAllLocalFiles() {
 return new Promise(function(resolve, reject) {
  fs.readdir(folder, (err, filenames) => {
   if (err) reject(err)
   console.log(filenames);
   resolve(filenames)
  });
 });
}

function sendFilesInArray(filenames) {
	Promise.map(filenames, function(currentFile) {
			return upload(currentFile)
				.then(async function(data) {
					console.log(chalk.green(`\nFile saved: ${currentFile} ${data.status} ${data.statusText}`));
					await deleteFile(currentFile);
				})
				.catch(function(err) {
					console.log(chalk.red('ERROR'));
					console.log(err);
				});
		}, {
			concurrency: 1
		})
		.then(function(data) {
			console.log(chalk.bgGreen.bold('SUCCESS ALL FILES'));
			console.log(data);
			const filesNotSent = data.filter((value) => isString(value))
			console.log({
				filesNotSent
			});
		}).catch(function(err) {
			console.log('ERROR');
			console.log(err);
		});
}

function upload(filename) {
	return new Promise(function(resolve, reject) {
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

function deleteFile(filename) {
	return new Promise(function(resolve, reject) {
		fs.unlink(folder + filename, function(err) {
			if (err) {
				console.log(chalk.red(`Could not delete: ${filename}`));
				reject(err)
			}
			else {
				console.log(chalk.cyan(`Successfully deleted: ${filename}`));
				resolve();
			}
		})
	});
}



module.exports = {
	checkArgs,
};