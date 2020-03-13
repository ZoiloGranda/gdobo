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
	getGDriveFolders,
	download,
	deleteFileGDrive
} = require('./google-drive-api');
const {
	getAllGDriveFiles,
	getAllLocalFiles,
	compareFiles,
	sendFilesInArray,
	askForConfirmation,
	deleteLocalFile
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
			console.log(chalk.red('Error: FOLDER_TO_UPLOAD is not a valid local Folder'))
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
		if (!fs.lstatSync(localFolder).isDirectory()) {
			console.log(chalk.red('Error: FOLDER_TO_UPLOAD is not a valid localFolder'))
			reject()
		}
		if (gDriveFolder) {
			console.log(chalk.cyan(`Google Drive folder to operate: ${gDriveFolder}`));
			resolve();
		} else {
			console.log(chalk.yellow('Waning: FOLDER_IN_DRIVE_ID parameter NOT found in .env file, use the folders parameter to see a list of folders. File operations will fail'));
			resolve();
		}
	});
}

function checkArgs(auth) {
	var myArgs = process.argv.slice(2);
	if (myArgs[0]) {
		console.log(chalk.cyan(`Operation: ${chalk.inverse(myArgs[0])}`));
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
			case 'localsync':
				localsyncHandler(auth)
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
				console.log(chalk.red(`Operation ${myArgs[0]} not recognize, use <help> to get a list of possible parameters`));
		}
	} else {
		console.log(chalk.red(`No arguments provided, use <help> to get a list of possible parameters`));
	}
}

async function syncHandler(auth) {
	try {
		let allLocalFiles = await getAllLocalFiles(localFolder);
		let allGDriveFiles = await getAllGDriveFiles({
			auth: auth,
			gDriveFolder: gDriveFolder,
			nameIdSize: true
		})
		let allGDriveFilesNames = _.map(allGDriveFiles, 'name');
		let differentFiles = await compareFiles({
			allLocalFiles: allLocalFiles,
			allGDriveFiles: allGDriveFilesNames
		})
		if (differentFiles.areInGDrive.length === 0) {
			console.log(chalk.yellow(`There are no files to Sync`));
			process.exit();
		}
		let filesToDelete = _.filter(allGDriveFiles, function(currentFile) {
			for (let element of differentFiles.areInGDrive) {
				if (currentFile.name === element) {
					return true
					break
				}
			}
		});
		console.log(chalk.yellow(`Files to delete from Google Drive:`));
		filesToDelete.forEach(element => console.log(chalk.yellow(element.name)));
		let answer = await askForConfirmation().catch(err=>{
			console.log(err);
			process.exit()
		});
		console.log(answer);
		if (answer === 'y') {
			Promise.map(filesToDelete, function(currentFile) {
					return deleteFileGDrive({
							filename: currentFile.name,
							fileId: currentFile.id,
							auth: auth,
							gDriveFolder: gDriveFolder
						})
						.then(function(deletedFile) {
							console.log(chalk.green(`\nFile deleted successfully: ${deletedFile}`));
						})
						.catch(function(err) {
							console.log(chalk.red('ERROR'));
							console.log(err);
						});
				}, {
					concurrency: 1
				})
				.then(function(data) {
					console.log(chalk.bgGreen.bold('Successfully deleted all files from Google Drive'));
					console.log({
						data
					});
				}).catch(function(err) {
					console.log('ERROR');
					console.log(err);
				});
		} else if (answer === 'n') {
			console.log(chalk.cyan(`Nothing to do here`));
			process.exit()
		}
	} catch (e) {
		console.log(e);
		process.exit()
	} finally {

	}
}

async function uploadHandler(auth) {
	let allGDriveFiles = await getAllGDriveFiles({
		auth: auth,
		gDriveFolder: gDriveFolder
	})
	let allLocalFiles = await getAllLocalFiles(localFolder);
	let differentFiles = await compareFiles({
		allLocalFiles: allLocalFiles,
		allGDriveFiles: allGDriveFiles
	})
	let filesToUpload = differentFiles.areInLocal;
	console.log({
		filesToUpload
	});
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

async function compareHandler(auth) {
	try {
		let allGDriveFiles = await getAllGDriveFiles({
			auth: auth,
			gDriveFolder: gDriveFolder
		});
		var allLocalFiles = await getAllLocalFiles(localFolder);
		let allFilesList = compareFiles({
			allGDriveFiles: allGDriveFiles,
			allLocalFiles: allLocalFiles
		})
		if (_.isEqual(allFilesList.areInLocal, allFilesList.areInGDrive)) {
			console.log(chalk.yellow(`The same files are in local and Google Drive`));
		}
		process.exit();
	} catch (e) {
		console.log(e);
		process.exit();
	} finally {
		process.exit();
	}


}

async function foldersHandler(auth) {
	let allGDriveFolders = await getGDriveFolders({
		auth: auth
	});
	console.log(allGDriveFolders);
	process.exit()
}

function helpHandler() {
	console.log(chalk.white(`
${chalk.inverse('upload')}: Uploads all files from a local folder to the specified Google Drive folder. It will check the filenames and skip the ones that are already on Google Drive.
\n${chalk.inverse('download')}: Downloads all the files from the Google Drive folder to the local folder. It checks the filenames before downloading, to avoid downloading duplicate files
\n${chalk.inverse('compare')}: Compares files between a local folder and a Google Drive folder
\n${chalk.inverse('sync')}: Removes the files that are on the Google Drive folder but not on local. Should be used when some files were deleted from the local folder, and they should be removed from Google Drive too. 
\n${chalk.inverse('folders')}: Gets all the folders names and id's from Google Drive
\n${chalk.inverse('localsync')}: Removes local files that were removed from the Google Drive folder. Should be used when there were files removed from the Google Drive folder and the local folder needs to be updated.
\n${chalk.inverse('help')}: Shows this message
`));
	process.exit()
}

//downloads all the files from a google drive folder
//compares files by name to avoid downloading the same file twice
async function downloadHandler(auth) {
	let allLocalFiles = await getAllLocalFiles(localFolder);
	let allGDriveFiles = await getAllGDriveFiles({
		auth: auth,
		gDriveFolder: gDriveFolder,
		nameIdSize: true
	})
	let allGDriveFilesNames = _.map(allGDriveFiles, 'name');
	let differentFiles = await compareFiles({
		allLocalFiles: allLocalFiles,
		allGDriveFiles: allGDriveFilesNames
	})
	if (differentFiles.areInGDrive.length === 0) {
		console.log(chalk.yellow(`Nothing to download, folders are updated`));
		process.exit()
	}
	let filesToDownload = _.filter(allGDriveFiles, function(currentFile) {
		for (let element of differentFiles.areInGDrive) {
			if (currentFile.name === element) {
				return true
				break
			}
		}
	});
	console.log({
		filesToDownload
	});
	Promise.map(filesToDownload, function(currentFile) {
			return download({
					filename: currentFile.name,
					fileId: currentFile.id,
					fileSize: currentFile.size,
					auth: auth,
					localFolder: localFolder,
					gDriveFolder: gDriveFolder
				})
				.then(function() {
					console.log(chalk.green(`\nFile saved: ${localFolder}${currentFile.name}`));
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
			process.exit();
		}).catch(function(err) {
			console.log('ERROR');
			console.log(err);
		});
}

//removes local files that were removed from google drive
async function localsyncHandler(auth) {
	let allLocalFiles = await getAllLocalFiles(localFolder);
	let allGDriveFiles = await getAllGDriveFiles({
		auth: auth,
		gDriveFolder: gDriveFolder
	})
	let differentFiles = await compareFiles({
		allLocalFiles: allLocalFiles,
		allGDriveFiles: allGDriveFiles
	})
	let filesToDelete = differentFiles.areInLocal; 
	if (filesToDelete.length === 0) {
		console.log(chalk.yellow(`Nothing to delete, local folder is updated`));
		process.exit()
	}
	console.log(chalk.yellow(`Files to delete from local folder:`));
	filesToDelete.forEach(element => console.log(chalk.yellow(element)));
	let answer = await askForConfirmation().catch(err=>{
		console.log(err);
		process.exit()
	})
	if (answer === 'n') {
		console.log(chalk.yellow(`Exiting...`));
		process.exit()
	}
	// localFolder, filename
	Promise.map(filesToDelete, function(currentFile) {
			return deleteLocalFile({
					filename: currentFile,
					localFolder: localFolder,
				})
				.then(function() {
					console.log(chalk.green(`\nDeleted File: ${localFolder}${currentFile}`));
				})
				.catch(function(err) {
					console.log(chalk.red('ERROR'));
					console.log(err);
				});
		}, {
			concurrency: 1
		})
		.then(function(data) {
			console.log(chalk.bgGreen.bold('SUCCESS DELETING ALL FILES'));
			console.log({
				data
			});
			process.exit()
		}).catch(function(err) {
			console.log('ERROR');
			console.log(err);
		}); 

}

module.exports = {
	startProcess,
};