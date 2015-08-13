var debug  = require('debug')('koa-pgp');

var reader = function *(ctx, key, body, passphrase){
  try {
    ctx._pgp = ctx._pgp ? ctx._pgp : require('./middleware.js').init;
    body     = body || (ctx.request && ctx.request.body) ? ctx.request.body : false;
    if(body && ctx){
      var pgp_message = yield require('./utils.js').decrypt(ctx, body, key, passphrase);
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

module.exports = reader;