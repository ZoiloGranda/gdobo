const {
	listFiles,
	upload
} = require('./google-drive-api');
const _ = require('lodash');
const fs = require('fs');
const Promise = require('bluebird');
const chalk = require('chalk');

var getAllGDriveFiles = function(params) {
	let {auth, folderId} = params
	return new Promise(async function(resolve, reject) {
		var data = {};
		var files = [];
		do {
			data = await listFiles({
				auth: auth,
				nextPageTkn: data.nextPageToken,
				folderId: folderId
			})
			data.files.map((file) => {
				files.push(file.name)
			});
			console.log(data.nextPageToken);
			} while (data.nextPageToken != null);
		console.log('done');
		console.log(files);
		resolve(files)
	});
}

var getAllLocalFiles = function (folder) {
	return new Promise(function(resolve, reject) {
		fs.readdir(folder, (err, filenames) => {
			if (err) reject(err)
			var numbers = [1, 5, 10, 15];
			var onlyFiles= numbers.map(function(x) {
				return x * 2;
			});
			console.log(filenames);
			resolve(filenames)
		});
	});
}


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
  filenames, auth, folder
 } = params
	Promise.map(filenames, function(currentFile) {
			return upload({
					filename: currentFile,
					auth: auth,
     folder:folder
				})
				.then(async function(data) {
					console.log(chalk.green(`\nFile saved: ${currentFile} ${data.status} ${data.statusText}`));
					//await deleteFile(currentFile);
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
			console.log({data});
			// const filesNotSent = data.filter((value) => isString(value))
   const filesNotSent = data;
			console.log({
				filesNotSent
			});
		}).catch(function(err) {
			console.log('ERROR');
			console.log(err);
		});
}

module.exports = {
	getAllGDriveFiles,
 getAllLocalFiles,
 compareFiles,
 sendFilesInArray
}