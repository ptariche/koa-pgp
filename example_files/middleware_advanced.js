'use strict';

const CONFIG     = require('./config');

let fs           = require('fs');
let secureParser = require('koa-bodyparser-secure');


// requires a content-type of application/pgp-encrypted

module.exports = function (APP, koaPGP) {
  let retrievePrivateKey = function () {
    return new Promise(function (resolve, reject) {
      try {
        fs.readFile('./example_files/server_example_pk.key', 'utf8', function (err, privkey) {
          if (err) {
            throw err;
          } else {
            resolve(privkey);
          }
        });
      } catch (err) {
        console.error(err.stack);
        resolve(false);
      }
    });
  };

  // Header Content-Type required of application/pgp-encrypted
  // Header PGP-Identifier required

  APP.use( secureParser() );
  APP.use(function *(next) {

    let ctx              = this;
    ctx._pgp             = ctx._pgp             ? ctx._pgp             : yield koaPGP.init;
    ctx._pgp._privateKey = ctx._pgp._privateKey ? ctx._pgp._privateKey : yield retrievePrivateKey();
    ctx._pgp._passphrase = ctx._pgp._passphrase ? ctx._pgp._passphrase : CONFIG.secret;

    yield next;
  });

  APP.use ( koaPGP.middleware_lookup_pubkey() ); // Lookups up the key with a designated key server; it's default is set to pgp.mit.edu
  APP.use( koaPGP.middleware() );

  APP.use(function *(next) {
    console.log('decrypted body:', this.request.body);
    this.response.body = { message: 'super secret, wow', code: 200, success: true };
    console.log('secret reply:', this.response.body);
    yield next;
  });

  let injection    = {};
  injection.status = 200;

  APP.use( koaPGP.middleware_out(null, injection) );

  APP.listen(CONFIG.port);

  console.log('Starting Koa-PGP Middleware example on port:', CONFIG.port);

};
