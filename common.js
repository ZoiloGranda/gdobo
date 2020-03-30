const {
	listFiles,
	upload
} = require('./google-drive-api');
const _ = require('lodash');
const fs = require('fs');
const Promise = require('bluebird');
const chalk = require('chalk');
const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

var getAllGDriveFiles = function(params) {
	return new Promise(async function(resolve, reject) {
		let {
			auth,
			gDriveFolder,
			nameIdSize,
		} = params
		var data = {};
		var files = [];
		do {
			data = await listFiles({
				auth: auth,
				nextPageTkn: data.nextPageToken,
				gDriveFolder: gDriveFolder,
			})
			if (nameIdSize) {
				data.files.map((file) => {
					files.push(file)
				});
			}else if (!data.files) {
				console.log(chalk.red(`Google Drive Folder is empty`))
			} else {
				data.files.map((file) => {
					files.push(file.name)
				});
			}
			console.log('nextPageToken: ', data.nextPageToken);
		} while (data.nextPageToken != null);
		console.log(chalk.cyan(`Finished getting files list`))
		resolve(files)
	});
}

//only returns files not folders
var getAllLocalFiles = function(localFolder) {
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

//compares files by name
function compareFiles(params) {
	let {
		allLocalFiles,
		allGDriveFiles
	} = params
	var areInLocal = _.difference(allLocalFiles, allGDriveFiles);
	var areInGDrive = _.difference(allGDriveFiles, allLocalFiles);
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
	let {
		filenames,
		auth,
		localFolder,
		gDriveFolder
	} = params
	Promise.map(filenames, function(currentFile) {
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
		.then(function(data) {
			console.log(chalk.bgGreen.bold('SUCCESS ALL FILES'));
			console.log({
				data
			});
		}).catch(function(err) {
			console.log('ERROR');
			console.log(err);
		});
}

function askForConfirmation() {
	return new Promise(function(resolve, reject) {
		rl.question(`Are you sure? Y/N\n`, (userInput) => {
			userInput = userInput.toLowerCase();
			if (userInput.length >= 2 || userInput.length === 0 || (userInput != 'y' && userInput != 'n')) {
				console.log(chalk.red('ERROR: Input should be one character Y=Yes, N=No'));
				rl.close();
				reject()
			} else {
				rl.close();
				resolve(userInput)
			}
		});
	});
}

function deleteLocalFile(params) {
	return new Promise(function(resolve, reject) {
		let{ localFolder, filename }= params
		fs.unlink(localFolder + filename, function(err) {
			if (err) {
				console.log(chalk.red(`Could not delete: ${filename}`));
				reject(err)
			} else {
				console.log(chalk.cyan(`Successfully deleted: ${filename}`));
				resolve();
			}
		})
	});
	
}

module.exports = {
	getAllGDriveFiles,
	getAllLocalFiles,
	compareFiles,
	sendFilesInArray,
	askForConfirmation,
	deleteLocalFile
}