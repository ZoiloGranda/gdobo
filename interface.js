const inquirer = require('inquirer');

function askOperation(elements) {
return inquirer
  .prompt([
    {
      type: 'list',
      name: 'option',
      message: 'Operation to perform',
						choices: operations,
						pageSize: 10
    }
  ])
  .then(answer => {
    return answer
  });
}

const operations = [
 {
  name:'Upload all files from a local folder to the specified Google Drive folder. It will check the filenames and skip the ones that are already on Google Drive',
  value:'upload'
 },
 {
  name:'Download all the files from the Google Drive folder to the local folder. It checks the filenames before downloading, to avoid downloading duplicate files',
  value:'download'
 },
 {
  name:'Compare files between a local folder and a Google Drive folder',
  value:'compare'
 },
 {
  name:'Remove the files that are on the Google Drive folder but not on local. Should be used when some files were deleted from the local folder, and they should be removed from Google Drive too',
  value:'sync'
 },
 {
  name:'Remove the files that are on the Google Drive folder but not on local. Should be used when some files were deleted from the local folder, and they should be removed from Google Drive too',
  value:'sync'
 },
 {
  name:'Get all the folders names and id\'s from Google Drive',
  value:'folders'
 },
 {
  name:'Remove local files that were removed from the Google Drive folder. Should be used when there were files removed from the Google Drive folder and the local folder needs to be updated',
  value:'localsync'
 },
]

module.exports ={
 askOperation
}