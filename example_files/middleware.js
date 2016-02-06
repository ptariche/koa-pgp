'use strict';

let fs           = require('fs');
const CONFIG     = require('./config.js');
let secureParser = require('koa-bodyparser-secure');


// content-type of application/pgp-encrypted

module.exports = function (APP, koaPGP) {
  fs.readFile('./example_files/private.key', 'utf8', function (err, privkey) {
    if (err) {
      throw err;
    } else {
      fs.readFile('./example_files/pub.key', 'utf8', function (err, pubkey) {
        if (err) {
          throw err;
        } else {
          // Header required of application/pgp-encrypted
          APP.use(secureParser());
          APP.use(koaPGP.middleware(privkey, CONFIG.secret));

          APP.use(function *(next) {
            console.log(this.request.body);
            yield next;
          });

          let injection    = {};
          injection.status = 200;
          APP.use(koaPGP.middleware_out(pubkey, injection));
          APP.listen(1988);
          console.log('Starting Koa-PGP Middleware example on port:', 1988);
        }
      });

    }
  });
};
