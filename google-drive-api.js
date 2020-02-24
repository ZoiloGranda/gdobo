const {google} = require('googleapis');

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

module.exports = {
	listFiles
}