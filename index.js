const fs = require('fs');
const {
	google
} = require('googleapis');
const Promise = require('bluebird');
const readline = require('readline');
const chalk = require('chalk');
const {
	listFiles,
	upload
} = require('./google-drive-api');
const {
	getAllGDriveFiles,
	getAllLocalFiles,
	compareFiles,
	sendFilesInArray
} = require('./common');
const _ = require('lodash');

require('dotenv').config();

let folder = process.env.FOLDER_TO_UPLOAD;
let folderId = process.env.FOLDER_IN_DRIVE_ID;
var allFilesInDrive = [];

async function startProcess(auth) {
	await checkEnv();
	checkArgs(auth)
}

function checkEnv() {
	return new Promise(function(resolve, reject) {
		let path = './.env'
		try {
			if (fs.existsSync(path)) {
				console.log(chalk.cyan('.env file found'));
			} else {
				console.log(chalk.red('Error: .env file NOT found'));
				reject()
			}
		} catch (err) {
			console.log(err);
			reject()
		}
		if (folder) {
			let str = folder;
			let res = str.charAt(str.length - 1);
			if (res != '/') {
				folder = folder + '/'
			}
			console.log(chalk.cyan(`Folder to Upload: ${folder}`));
			resolve()
		} else {
			console.log(chalk.red('Error: FOLDER_TO_UPLOAD parameter NOT found in .env file'));
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
			default:
				console.log(chalk.red(`Operation ${myArgs[0]} not recognize, posible values are <upload>, <compare>, <sync>`));
		}
	} else {
		console.log(chalk.red(`No arguments provided, posible values are <upload>, <compare>, <sync>`));
	}
}

function uploadHandler(auth) {
	getAllLocalFiles(folder)
}

async function syncHandler(auth) {
	let allGDriveFiles = await getAllGDriveFiles({auth:auth, folderId:folderId})
	let allLocalFiles = await getAllLocalFiles(folder);
	let differentFiles = await compareFiles({
		allLocalFiles: allLocalFiles,
		allGDriveFiles: allGDriveFiles
	})
	console.log({
		differentFiles
	});
	let filesToUpload = differentFiles.areInLocal;
	sendFilesInArray({
		auth: auth,
		filenames: filesToUpload,
		folder: folder
	})

}

function compareHandler(auth) {
	return new Promise(async function(resolve, reject) {
		let allGDriveFiles = await getAllGDriveFiles({auth:auth, folderId:folderId});
		var allLocalFiles = await getAllLocalFiles(folder);
		let allFilesList = compareFiles({
			allGDriveFiles: allGDriveFiles,
			allLocalFiles: allLocalFiles
		})
		resolve(allFilesList)
	});
}

function deleteFile(filename) {
	return new Promise(function(resolve, reject) {
		fs.unlink(folder + filename, function(err) {
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