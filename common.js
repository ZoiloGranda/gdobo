const {
	listFiles,
	upload
} = require('./google-drive-api');
const _ = require('lodash');
const fs = require('fs');
const Promise = require('bluebird');
const chalk = require('chalk');
const readline = require('readline');
const { askForLocalFolder, askForGDriveFolder } = require('./interface')


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
		let{ localFolder, filename }= params
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

function getFolders() {
	const config = require('./config.json')
	return new Promise(async function(resolve, reject) {
		let localFolder = await askForLocalFolder(config.LOCAL_FOLDERS)
		let gDriveFolder = await askForGDriveFolder(config.GDRIVE_FOLDERS)
		let validFolders = await validateFolders({localFolder:localFolder,gDriveFolder:gDriveFolder})
		resolve({localFolder:localFolder,gDriveFolder:gDriveFolder})
	});
}

function validateFolders(params) {
	return new Promise(function(resolve, reject) {
		let {localFolder, gDriveFolder} = params
		if (localFolder) {
			let str = localFolder;
			let res = str.charAt(str.length - 1);
			if (res != '/') {
				localFolder = localFolder + '/'
			}
			console.log(chalk.cyan(`local folder to operate: ${localFolder}`));
		} else {
			console.log(chalk.red('Error: parameter NOT found in config.json for LOCAL_FOLDERS'));
			reject()
			process.end()
		}
		if (!fs.lstatSync(localFolder).isDirectory()) {
			console.log(chalk.red('Error: local folder is not a valid directory'))
			reject()
			process.end()
		}
		if (gDriveFolder) {
			console.log(chalk.cyan(`Google Drive folder to operate: ${gDriveFolder}`));
			resolve(true);
		}
	});
}

function renameTempFile(params) {
	let {file} = params;
	fs.rename(`${file}-temp`, file, (err) => {
		if (err) throw err;
	});
}

module.exports = {
	getAllGDriveFiles,
	getAllLocalFiles,
	compareFiles,
	sendFilesInArray,
	deleteLocalFile,
	getFolders,
	renameTempFile
}