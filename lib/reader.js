'use strict';

const DEBUG = require('DEBUG')('koa-pgp:reader');

let reader = function *(ctx, key, passphrase, body) {
  try {
    ctx._pgp = ctx._pgp ? ctx._pgp : yield require('./middleware.js').init();

    DEBUG('The key passed into reader is %s', key);
    DEBUG('The passphrase passed into reader is %s', passphrase);
    DEBUG('The body passed into reader in is %s', body);

    if (body && ctx && ctx._pgp && key) {
      DEBUG('Before attempting decryption');
      let pgp_message = yield require('./utils.js').decrypt(ctx, body, key, passphrase);
      return pgp_message;
    } else {
      DEBUG('Please pass in a body, private key, and the ctx; and initiate ctx._pgp');
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
