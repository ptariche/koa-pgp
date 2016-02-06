'use strict';

let debug  = require('debug')('koa-pgp');

let reader = function *(ctx, key, passphrase, body) {
  try {
    ctx._pgp = ctx._pgp ? ctx._pgp : yield require('./middleware.js').init;

    debug('The key passed into reader is %s', key);
    debug('The passphrase passed into reader is %s', passphrase);
    debug('The body passed into reader in is %s', body);

    if (body && ctx && ctx._pgp && key) {
      let pgp_message = yield require('./utils.js').decrypt(ctx, body, key, passphrase);
      return pgp_message;
    } else {
      debug('Please pass in a body, private key, and the ctx; and initiate ctx._pgp');
      return false;
    }
  } catch (err) {
    console.log();
    console.error('koa-pgp:');
    console.error(err.stack);
    console.log();
    return false;
  }

};

module.exports = reader;
