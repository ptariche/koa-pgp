// Author: Peter A. Tariche

module.exports = {
  writer: require('./lib/writer.js'),
  reader: require('./lib/reader.js'),
  decrypt: require('./lib/utils.js').decrypt,
  encrypt: require('./lib/utils.js').encrypt,
  createKeys: require('./lib/utils.js').createKeys,
  middleware: require('./lib/middleware.js').middleware,
  init: require('./lib/middleware.js').init
};