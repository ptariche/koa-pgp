'use strict';
// Author: Peter A. Tariche

module.exports = {
  init: require('./lib/middleware.js').init,
  writer: require('./lib/writer.js'),
  reader: require('./lib/reader.js'),
  decrypt: require('./lib/utils.js').decrypt,
  encrypt: require('./lib/utils.js').encrypt,
  createKeys: require('./lib/utils.js').createKeys,
  middleware: require('./lib/middleware.js').middleware,
  middleware_in: require('./lib/middleware.js').middleware_in,
  middleware_out: require('./lib/middleware.js').middleware_out
};
