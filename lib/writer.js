var debug  = require('debug')('koa-pgp');

var writer = function *(ctx, private_key, body){
  try {
    if(ctx) ctx._pgp = ctx._pgp ? ctx._pgp : require('./middleware.js').init;
    body = body ? body : false;
    if(body && ctx){
      var pgp_message = yield require('./utils.js').encrypt(ctx, body, private_key);
      return pgp_message;
    } else {
      debug('Please pass in a body and the ctx');
      return false;
    }
  } catch(err){
    console.log();
    console.error('koa-pgp:')
    console.error(err.stack);
    console.log();
  }
};

module.exports = writer;