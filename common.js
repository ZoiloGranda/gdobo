const {
	listFiles,
	upload
} = require('./google-drive-api');
const _ = require('lodash');
const fs = require('fs');
const Promise = require('bluebird');
const chalk = require('chalk');

var getAllGDriveFiles = function(authData) {
	return new Promise(async function(resolve, reject) {
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
		resolve(files)
	});
}

var getAllLocalFiles = function (folder) {
	return new Promise(function(resolve, reject) {
		fs.readdir(folder, (err, filenames) => {
			if (err) reject(err)
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
	var differentFiles = _.difference(allLocalFiles, allGDriveFiles);
	console.log(differentFiles);
	var areInLocal = []
	var areInGDrive = []
	differentFiles.forEach(function(element) {
		let foundInLocal = _.indexOf(allLocalFiles, element)
		let foundInDrive = _.indexOf(allGDriveFiles, element)
		if (foundInLocal != -1) {
			areInLocal.push(element)
		} else {
			areInGDrive.push(element)
		}
	})
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
			console.log(data);
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