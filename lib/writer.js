'use strict';

const DEBUG = require('debug')('koa-pgp:writer');

let writer = function *(ctx, key, body) {
  try {
    DEBUG('Key being passed into the writer %s', key);
    DEBUG('Body being passed into the writer %s', body);
    if (ctx) ctx._pgp = ctx._pgp ? ctx._pgp : require('./middleware.js').init();
    body = body ? body : false;
    if (body && ctx) {
      DEBUG('Has body and context of ctx');
      let pgp_message = yield require('./utils.js').encrypt(ctx, body, key);
      DEBUG('PGP Message in writer being returned %s', pgp_message);
      return pgp_message;
    } else {
      DEBUG('Please pass in a body and the ctx');
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

module.exports = writer;
