module.exports = {
  uploadHandler: require('./upload-handler'),
  compareHandler: require('./compare-handler'),
  syncHandler: require('./sync-handler'),
  localsyncHandler: require('./localsync-handler'),
  foldersHandler: require('./folders-handler'),
  downloadHandler: require('./download-handler'),
  generateConfigHandler: require('./generate-config-handler'),
  modifyConfigHandler: require('./modify-config-handler')
};