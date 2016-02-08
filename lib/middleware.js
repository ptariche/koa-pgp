'use strict';

const ERROR = 'An internal server error occured. Please verify you have sent proper JSON, provided valid PGP keys or an Identifier, and provided all the proper preconditions';

let _     = require('lodash');
let util  = require('./utils');
let pgp   = require('openpgp');
let debug = require('debug')('koa-pgp');


let middleware_injection = function (_injectedPromiseFunctionReturningKey) {
  debug('_injectedPromiseFunctionReturningKey inside middleware_injection function %s', _injectedPromiseFunctionReturningKey);
  if (!_injectedPromiseFunctionReturningKey) throw new Error('Passing a promise as an argument is required');

  function * define(ctx) {
    try {
      ctx._pgp    = ctx._pgp ? ctx._pgp : yield init();
      let attempt = false;
      attempt     = yield _injectedPromiseFunctionReturningKey.apply(ctx);

      debug('After attempting to yield to injected promise function');

      if (!attempt) {
        debug('An error occured with the promise function');
        throw new Error('An error occured with the promise function');
      }

    } catch (err) {
      throw err;
    }
  };

  return function *(next) {
    try {
      yield define(this);
      yield next;
    } catch (err) {
      console.error(err.stack || err);
      this.response.status = 500;
      this.response.body   = {error: ERROR};
    }
  };
};

let lookup_pubkey_middlware = function (options, _injectedPromiseFunctionReturningKey) {

  debug('options inside lookup_pubkey_middlware function %s', options);
  debug('_injectedPromiseFunctionReturningKey inside lookup_pubkey_middlware function %s', _injectedPromiseFunctionReturningKey);

  function * define(ctx) {
    try {
      options                 = options            ? options            : {};
      options.header_key      = options.header_key ? options.header_key : 'PGP-Identifier';
      options.hkp_server      = options.hkp_server ? options.hkp_server : 'https://pgp.mit.edu';

      ctx._pgp                = ctx._pgp ? ctx._pgp : yield init();

      let query_email_fingerprint = ctx.request.get(options.header_key) ? ctx.request.get(options.header_key) : (options.query_email_fingerprint ? options.query_email_fingerprint : null);

      let lookupKey = false;
      debug('Before looking up key');
      if (!_injectedPromiseFunctionReturningKey && query_email_fingerprint) {
        debug('Attempting to lookup key');
        lookupKey = yield util.lookupPublicKey(ctx._pgp, query_email_fingerprint);
      } else if (_injectedPromiseFunctionReturningKey) {
        debug('Before attempting to yield to injected promise function');
        lookupKey = yield _injectedPromiseFunctionReturningKey.apply(ctx);
      }

      if (!lookupKey) {
        debug('Could not find lookup key returning 406');
        throw new Error('Unable to lookup or locate the public key with the PGP Identifier');
      } else {
        ctx._pgp._publicKey = lookupKey;
        debug('Lookup key found %s', lookupKey);
      }
    } catch (err) {
      throw err;
    }
  };

  return function *(next) {
    try {
      yield define(this);
      yield next;
    } catch (err) {
      console.error(err.stack || err);
      this.response.status = 500;
      this.response.body   = {error: ERROR};
    }
  };
};

let middleware = function (private_key, passphrase, injection) {

  debug('private_key inside middleware function %s', private_key);
  debug('passphrase inside middleware function %s', passphrase);
  debug('injection inside middleware function %s', injection);

  passphrase                 = passphrase                 ? passphrase                 : null;
  injection                  = injection                  ? injection                  : {};
  injection.failed           = injection.failed           ? injection.failed           : false;
  injection.header_key       = injection.header_key       ? injection.header_key       : false;
  injection.pgp_message_key  = injection.pgp_message_key  ? injection.pgp_message_key  : false;

  function * define(ctx) {
    try {

      ctx._pgp             = ctx._pgp ? ctx._pgp : yield init();
      ctx._pgp._passphrase = ctx._pgp._passphrase ? ctx._pgp._passphrase : (passphrase  ? passphrase  : null);
      ctx._pgp._privateKey = ctx._pgp._privateKey ? ctx._pgp._privateKey : (private_key ? private_key : null);

      let header_key = false;
      if (injection.header_key) header_key = ctx.request.get(injection.header_key);
      if (!injection.header_key || injection.header_key === header_key) {
        let body_check;
        if ( typeof (ctx.request.body) === 'object') body_check =  Object.keys(ctx.request.body);
        else body_check = ctx.request.body ? (ctx.request.body.length >= 0) : false;
        debug('Before attempting to decrypt');
        if (ctx && ctx.request && ctx.request.body && body_check ) {
          let message = injection.pgp_message_key ? ctx.request.body[injection.pgp_message_key] : ctx.request.body || ctx.request.body;
          let read    = (ctx.request && ctx.request.body && ctx._pgp._privateKey) ? yield require('./reader.js')(ctx, ctx._pgp._privateKey, ctx._pgp._passphrase, message) : false;
          if (read) {
            debug('Decrypted message and placed into body');
            if (injection.pgp_message_key) {
              ctx.request.body[injection.pgp_message_key] = read;
            } else {
              try {
                read              = JSON.parse(read);
                ctx.response.body = read;
              } catch (err) {
                debug('Error attempting to parse JSON in reading PGP');
                throw err;
              }

            }
          } else {
            debug('Failed to decrypt the encrypted message');
            throw new Error('Failed to decrypt the encrypted message');
          }
        } else {
          debug('Did not have the proper preconditions to continue');
          throw new Error('Did not have the proper pre-conditions');
        }
      } else {
        debug('Did not have the proper headers to continue forward');
        throw new Error('Did not have the proper headers');
      }
    } catch (err) {
      throw err;
    }
  };

  return function *(next) {
    try {
      yield define(this);
      yield next;

    } catch (err) {
      console.error(err.stack || err);
      this.response.status = 500;
      this.response.body   = {error: ERROR};
    }
  };
};

let middleware_out = function (public_key, injection) {

  debug('public_key inside middleware_out function %s', public_key);
  debug('injection inside middleware_out function %s', injection);

  injection                  = injection                  ? injection                  : {};
  injection.failed           = injection.failed           ? injection.failed           : false;
  injection.pgp_message_key  = injection.pgp_message_key  ? injection.pgp_message_key  : false;
  injection.status           = injection.status           ? injection.status           : false;

  function * define(ctx) {
    try {
      ctx._pgp             = ctx._pgp ? ctx._pgp : yield init();
      ctx._pgp._publicKey  = ctx._pgp._publicKey ? ctx._pgp._publicKey : (public_key ? public_key : null);
      debug('ctx._pgp._publicKey %s', ctx._pgp._publicKey);
      let message = ( (typeof ctx.response.body === 'object') || (typeof ctx.response.body === 'array') ) ? JSON.stringify(ctx.response.body) : ctx.response.body;
      debug('Message attempting to be encrypted out %s', message);
      let write   = (ctx.request && ctx.response.body) ? yield require('./writer.js')(ctx, ctx._pgp._publicKey, message) : false;
      if (write) {
        if (injection.status) ctx.response.status = injection.status;
        ctx.response.status = ctx.response.status ? ctx.response.status  : 200;
        ctx.response.body   = write;
      } else {
        debug('Failed to encrypt the message');
        throw new Error('Failed to encrypt the message');
      }
    } catch (err) {
      throw err;
    }
  };

  return function *(next) {
    try {
      yield define(this);
      yield next;
    } catch (err) {
      console.error(err.stack || err);
      this.response.status = 500;
      this.response.body   = {error: ERROR};
    }
  };
};

let init = function *() {
  let _pgp = {};
  _.extend(_pgp, pgp);
  return _pgp;
};

module.exports.init                    = init;
module.exports.lookup_pubkey_middlware = lookup_pubkey_middlware;
module.exports.middleware_injection    = middleware_injection;
module.exports.middleware_out          = middleware_out;
module.exports.middleware              = module.exports.middleware_in = middleware;
