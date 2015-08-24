var _     = require('lodash');
var pgp   = require('openpgp');
var debug = require('debug')('koa-pgp');

var middleware = function(private_key, passphrase, injection){
  injection                  = injection                  ? injection                  : {};
  injection.failed           = injection.failed           ? injection.failed           : false;
  injection.header_key       = injection.header_key       ? injection.header_key       : false;
  injection.pgp_message_key  = injection.pgp_message_key  ? injection.pgp_message_key  : false;

  function* define(ctx){
    try {
      var header_key = false;
      if(injection.header_key) header_key = ctx.request.get(injection.header_key)
      if(!injection.header_key || injection.header_key === header_key){
        var body_check;
        if( typeof(ctx.request.body) === 'object') body_check =  Object.keys(ctx.request.body);
        else                                       body_check = ctx.request.body ? (ctx.request.body.length >= 0) : false;
        debug('Before attempting to decrypt');
        if(ctx && ctx.request && ctx.request.body && body_check ){
          var message = injection.pgp_message_key ? ctx.request.body[injection.pgp_message_key] : ctx.request.body || ctx.request.body;
          var read    = (ctx.request && ctx.request.body) ? yield require('./reader.js')(ctx, private_key, passphrase, message) : false;
          if(read){
            debug('Decrypted message and placed into body');
            if(injection.pgp_message_key){
              ctx.request.body[injection.pgp_message_key] = read;
            } else {
              ctx.request.body = read;
            }
          } else {
            debug('Failed to decrypt the encrypted message');
            if(!injection.failed){
              ctx.request = ctx.request ? ctx.request : {};
              return;
            } else {
              return injection.failed;
            }
          }
        } else {
          debug('Did not have the proper preconditions to continue');
          return;
        }
      } else {
        debug('Did not have the proper headers to continue forward');
        return;
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

var middleware_out = function(public_key, injection){
  injection                  = injection                  ? injection                  : {};
  injection.failed           = injection.failed           ? injection.failed           : false;
  injection.pgp_message_key  = injection.pgp_message_key  ? injection.pgp_message_key  : false;
  injection.status           = injection.status           ? injection.status           : false;

  function* define(ctx){
    try {
      ctx._pgp    = ctx._pgp ? ctx._pgp : yield init;
      var message = injection.pgp_message_key ? ctx.request.body[injection.pgp_message_key] : ctx.request.body;
      debug('Message attempting to be encrypted out %s', message);
      var write   = (ctx.request && ctx.request.body) ? yield require('./writer.js')(ctx, public_key, message) : false;
      if(write){
        if(injection.status) ctx.response.status = injection.status;
        ctx.response.body = write;
      } else {
        debug('Failed to encrypt the message');
        if(!injection.failed){
          ctx.response = ctx.response ? ctx.response : {};
          ctx.response.status = 406;
          ctx.response.body   = {};
        } else {
          return injection.failed;
        }
      }
    } catch(err){
      console.log();
      console.error('koa-pgp:')
      console.error(err.stack);
      console.log();

      ctx.response.status = 406;
      ctx.response.body   = {};
    }
  };

  return function*(next) {
    try {
      yield define(this);
      yield next;
    } catch (err){
      debug('The middleware_out failed to initiate %s', err);
      throw err;
    }
  };
};

var init = function *(){
  var _pgp = {};
  _.extend(_pgp, pgp);
  return _pgp;
};

module.exports.init           = init;
module.exports.middleware_out = middleware_out;
module.exports.middleware     = module.exports.middleware_in = middleware;
