const {
 askConfigOperation
} = require('../interface')

const createConfig = require('./modify-config-ops/create-config')
const addFolder = require('./modify-config-ops/add-folder')
const removeFolder = require('./modify-config-ops/remove-folder')

module.exports = async function modifyConfigHandler({ auth }) {
 const operation = await askConfigOperation()
 switch (operation) {
  case 'CREATE':
   await createConfig({ auth })
   break;
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
