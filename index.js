const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const chalk = require('chalk');
const _ = require('lodash');
const {
 google
} = require('googleapis');
const {
 uploadHandler,
 compareHandler,
 syncHandler,
 localsyncHandler,
 foldersHandler,
 downloadHandler,
 generateConfigHandler,
 modifyConfigHandler
} = require('./operations')
const {
 askOperation
} = require('./interface')
const configPath = path.join(__dirname, '/config.json');

async function startProcess(auth) {
 let selectedOperation = await askOperation();
 try {
  if (selectedOperation.option !== 'generateConfig') {
   await checkConfig();
  }
 } catch (e) {
  console.log(e);
  process.exit()
 } finally {
  checkArgs(auth, selectedOperation.option)
 }
}

function checkConfig() {
 return new Promise(function(resolve, reject) {
  if (fs.existsSync(configPath)) {
   console.log(chalk.cyan('config.json file found'));
   resolve();
  } else {
   console.log(chalk.red('Error: config.json file NOT found'));
   reject(new Error('config.json file NOT found'))
  }
 })
}

async function checkArgs(auth, selectedOperation) {
 console.log(chalk.cyan(`Operation: ${chalk.inverse(selectedOperation)}`));
	delete require.cache[path.resolve('./config.json')];
 try {
  if (selectedOperation) {
   switch (selectedOperation) {
    case 'upload':
    await uploadHandler(auth)
    break;
    case 'compare':
    await compareHandler(auth)
    break;
    case 'sync':
    await syncHandler(auth)
    break;
    case 'localsync':
    await localsyncHandler(auth)
    break;
    case 'folders':
    await foldersHandler(auth)
    break;
    case 'download':
    await downloadHandler(auth)
    break;
    case 'generateConfig':
    await generateConfigHandler({ auth })
    break;
    case 'modifyConfig':
    await modifyConfigHandler({ auth })
    break;
    case 'exit':
    process.exit()
    default:
    console.log(chalk.red(`Operation ${selectedOperation} not recognized`));
   }
  } else {
   console.log(chalk.red(`No operation provided`));
  }
 } catch (e) {
  console.log(e);
 } finally {
  startProcess(auth)
 }
}

module.exports = {
 startProcess,
};