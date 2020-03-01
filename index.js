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
		case 'sync':
			syncHandler(authData)
			break;
		default:

	}
}

function uploadHandler(authData) {
	getAllLocalFiles(folder)
}

async function syncHandler(authData) {
	let allGDriveFiles = await getAllGDriveFiles(authData)
	let allLocalFiles = await getAllLocalFiles(folder);
	let differentFiles = await compareFiles({allLocalFiles:allLocalFiles,allGDriveFiles:allGDriveFiles})
	console.log({differentFiles});
	let filesToUpload = differentFiles.areInLocal;
	sendFilesInArray({auth:authData,filenames:filesToUpload, folder:folder})
	
}

function compareHandler(authData) {
	return new Promise(async function(resolve, reject) {
		let allGDriveFiles = await getAllGDriveFiles(authData)
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
	checkArgs,
};