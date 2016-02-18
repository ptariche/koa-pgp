'use strict';

const CONFIG       = require('./config');
const FS           = require('fs');
const SECUREPARSER = require('koa-bodyparser-secure');


// requires a content-type of application/pgp-encrypted

module.exports = function (APP, KOAPGP) {
  FS.readFile('./example_files/private.key', 'utf8', function (err, privkey) {
    if (err) {
      throw err;
    } else {
      FS.readFile('./example_files/pub.key', 'utf8', function (err, pubkey) {
        if (err) {
          throw err;
        } else {
          // Header required of application/pgp-encrypted
          APP.use(SECUREPARSER());
          APP.use(KOAPGP.middleware(privkey, CONFIG.secret));

          APP.use(function * (next) {
            console.log(this.request.body);
            yield next;
          });

          let injection    = {};
          injection.status = 200;
          APP.use(KOAPGP.middleware_out(pubkey, injection));

          APP.listen(CONFIG.port);
          console.log('Starting Koa-PGP Middleware example on port:', CONFIG.port);
        }
      });

    }
  });
};
