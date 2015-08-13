var _     = require('lodash');
var pgp   = require('openpgp');
var debug = require('debug')('koa-pgp');

var middleware = function(private_key, passphrase){
  function* define(ctx){
    try {
      ctx._pgp = ctx._pgp ? ctx._pgp : yield init;
      var read = (ctx.request && ctx.request.body) ? yield require('./reader.js')(ctx, private_key, passphrase) : false;
      if(read){
        ctx.request.body = read;
      } else {
        debug('Failed to decrypt the encrypted message');
        ctx.request = ctx.request ? ctx.request : {};
        return ctx.request.body = {};
      }
    } catch(err){
      console.log();
      console.error('koa-pgp:')
      console.error(err.stack);
      console.log();
      return ctx;
    }
  };

  return function*(next) {
    try {
      yield define(this);
      yield next;
    } catch (err){
      debug('The middleware failed to initiate %s', err);
      throw err;
    }
  };
};

var init = function* (){
  var _pgp = {};
  _.extend(_pgp, pgp);
  return _pgp;
};

module.exports.init       = init;
module.exports.middleware = middleware;