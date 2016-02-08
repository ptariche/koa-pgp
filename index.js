'use strict';

/**
@author:      Peter A. Tariche <ptariche@gmail.com>
@fingerprint: 599F 6D20 2806 C23E 6776  F17C 49D6 EE01 6556 E77F
@license:     MIT
**/

let middlewareLib = require('./lib/middleware');
let utilLib       = require('./lib/utils');

module.exports = {
  writer:                   require('./lib/writer.js'),
  reader:                   require('./lib/reader.js'),
  decrypt:                  utilLib.decrypt,
  encrypt:                  utilLib.encrypt,
  uploadPublicKey:          utilLib.uploadPublicKey,
  lookupPublicKey:          utilLib.lookupPublicKey,
  verifySignature:          utilLib.verifySignature,
  createKeys:               utilLib.createKeys,
  init:                     middlewareLib.init,
  middleware:               middlewareLib.middleware,
  middleware_in:            middlewareLib.middleware_in,
  middleware_out:           middlewareLib.middleware_out,
  middleware_injection:     middlewareLib.middleware_injection,
  middleware_lookup_pubkey: middlewareLib.lookup_pubkey_middlware
};
