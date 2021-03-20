const {
 askConfigOperation
} = require('../interface')

const addFolder = require('./modify-config-ops/add-folder')
const removeFolder = require('./modify-config-ops/remove-folder')

module.exports = async function modifyConfigHandler({ auth }) {
 const operation = await askConfigOperation()
 switch (operation) {
  case 'ADD':
   await addFolder({ auth })
   break;
  case 'REMOVE':
   await removeFolder({ auth })
   break;
  default:
   break;
 }
}
