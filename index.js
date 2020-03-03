const fs = require('fs');
const {
	google
} = require('googleapis');
const Promise = require('bluebird');
const readline = require('readline');
const chalk = require('chalk');
const {
	listFiles,
	upload,
	getGDriveFolders
} = require('./google-drive-api');
const {
	getAllGDriveFiles,
	getAllLocalFiles,
	compareFiles,
	sendFilesInArray
} = require('./common');
const _ = require('lodash');

require('dotenv').config();

let localFolder = process.env.FOLDER_TO_UPLOAD;
let gDriveFolder = process.env.FOLDER_IN_DRIVE_ID;
var allFilesInDrive = [];

async function startProcess(auth) {
	try {
		await checkEnv();
	} catch (e) {
		if (e.code === 'ENOENT' || 'ENOTDIR') {
			console.log(chalk.red('Error: FOLDER_TO_UPLOAD is not a valid localFolder'))
		}
		console.log(e);
		process.exit()
	} finally {
		checkArgs(auth)
	}
}

function checkEnv() {
	return new Promise(function(resolve, reject) {
		let path = './.env';
		if (fs.existsSync(path)) {
			console.log(chalk.cyan('.env file found'));
		} else {
			console.log(chalk.red('Error: .env file NOT found'));
			reject()
		}
		if (localFolder) {
			let str = localFolder;
			let res = str.charAt(str.length - 1);
			if (res != '/') {
				localFolder = localFolder + '/'
			}
			console.log(chalk.cyan(`localFolder to Upload: ${localFolder}`));
		} else {
			console.log(chalk.red('Error: FOLDER_TO_UPLOAD parameter NOT found in .env file'));
			reject()
		}
		if (fs.lstatSync(localFolder).isDirectory()) {
			resolve();
		} else {
			console.log(chalk.red('Error: FOLDER_TO_UPLOAD is not a valid localFolder'))
			reject()
		}
	});
}

function checkArgs(auth) {
	var myArgs = process.argv.slice(2);
	if (myArgs[0]) {
		console.log(chalk.cyan(`Operation: ${myArgs[0]}`));
		switch (myArgs[0]) {
			case 'upload':
				uploadHandler(auth)
				break;
			case 'compare':
				compareHandler(auth)
				break;
			case 'sync':
				syncHandler(auth)
				break;
			case 'folders':
				foldersHandler(auth)
				break;
			case 'download':
				downloadHandler(auth)
				break;
			case 'help':
				helpHandler()
				break;
			default:
				console.log(chalk.red(`Operation ${myArgs[0]} not recognize, posible values are <upload>, <compare>, <sync>, <folders>, <help>`));
		}
	} else {
		console.log(chalk.red(`No arguments provided, posible values are <upload>, <compare>, <sync>, <folders>, <help>`));
	}
}

function uploadHandler(auth) {
	getAllLocalFiles(localFolder)
}

async function syncHandler(auth) {
	let allGDriveFiles = await getAllGDriveFiles({
		auth: auth,
		gDriveFolder: gDriveFolder
	})
	let allLocalFiles = await getAllLocalFiles(localFolder);
	let differentFiles = await compareFiles({
		allLocalFiles: allLocalFiles,
		allGDriveFiles: allGDriveFiles
	})
	console.log({
		differentFiles
	});
	let filesToUpload = differentFiles.areInLocal;
	if (filesToUpload[0]) {
		sendFilesInArray({
			auth: auth,
			filenames: filesToUpload,
			localFolder: localFolder,
			gDriveFolder: gDriveFolder
		})
	} else {
		console.log(chalk.yellow(`Nothing to Upload`));
	}

}

function compareHandler(auth) {
	return new Promise(async function(resolve, reject) {
		let allGDriveFiles = await getAllGDriveFiles({
			auth: auth,
			gDriveFolder: gDriveFolder
		});
		var allLocalFiles = await getAllLocalFiles(localFolder);
		let allFilesList = compareFiles({
			allGDriveFiles: allGDriveFiles,
			allLocalFiles: allLocalFiles
		})
		resolve(allFilesList)
	});
}

function foldersHandler(auth) {
	return new Promise(async function(resolve, reject) {
		let allGDriveFolders = await getGDriveFolders({
			auth: auth
		});
		console.log(allGDriveFolders);
		resolve(allGDriveFolders)
	});
}

function helpHandler() {
	console.log(chalk.magenta (`
upload: Uploads ALL files from local folder to the specified Google Drive folder
compare: Compares files between a local folder and a Google Drive folder
sync: Uploads the files from a local folder that are not on the specified Google Drive folder
folders: Gets all the folders names and id's from Google Drive
help: Shows this message
`));
}

function deleteFile(filename) {
	return new Promise(function(resolve, reject) {
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
	startProcess,
};