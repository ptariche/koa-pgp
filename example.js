'use strict';

/**
@author:      Peter A. Tariche <ptariche@gmail.com>
@fingerprint: 599F 6D20 2806 C23E 6776  F17C 49D6 EE01 6556 E77F
@license:     MIT
**/

let fs     = require('fs');
let koa    = require('koa');
let parser = require('koa-bodyparser-secure');
let koaPGP = require('./index.js');
const APP  = koa();

let config = require('./example_files/config.js');
let secret = config.secret;

/**
APP.use(parser());

APP.use(function *(next) {
  this.request.body = ':: koa-pgp: starting example ::';
  console.log(this.request.body);
  yield next;
});



let createFile = function (file_name, data) {
  return new Promise( function (resolve,reject) {
    let file_path = './example_files/' + file_name;
    fs.writeFile(file_path, data, function (err) {
      if (err) {
        resolve(false);
        return console.log(err);
      } else {
        console.log('Writing file ' + file_path);
        resolve(true);
      }
    });
  });
};

let readFile = function (file_path) {
  return new Promise( function (resolve, reject) {
    fs.readFile(file_path, 'utf8', function (err, data) {
      if (err) {
        throw err;
        resolve(false);
      } else {
        resolve(data);
      }
    });
  });
};


APP.use(function *(next) {
  console.log('running next step in co-flow');

  let ctx  = this;

  //instantiate the inheritence of openpgp.js

  ctx._pgp = ctx._pgp ? ctx._pgp : yield koaPGP.init;

  //options argument for openpgp.js https://github.com/openpgpjs/openpgpjs
  let options = {
    numBits: 2048,
    userId: 'Jon Smith <jon.smith@example.org>',
    passphrase: secret
  };

  //create the keys
  let keys         = yield koaPGP.createKeys(this._pgp, options);
  //console.log(keys);
  let private_key  = keys.private_key;
  let public_key   = keys.public_key;

  // Write files to local example_keys directory
  let createPKFile = yield createFile('private.key', private_key);
  let createPubFile = yield createFile('pub.key', public_key);

  // Passing into scope to show example
  // ctx.public_key   = public_key;
  // ctx.private_key  = private_key;
  // ctx.passphrase   = options.passphrase;

  //encrypt the message
  let message      = yield koaPGP.encrypt(ctx, ctx.request.body, private_key);
  let createMsg    = yield createFile('example.msg', message);
  //setting the body to the encrypted message

  yield next;
});


APP.use(function *(next) {
  let ctx               = this;
  let encrypted_message = yield readFile('./example_files/example.msg');
  ctx.request.body      = encrypted_message;

  console.log();
  console.log();
  console.log('-----------------------ENCRYPTED MESSAGE--------------------');
  console.log(ctx.request.body);
  console.log('-----------------------ENCRYPTED MESSAGE--------------------');
  console.log();
  console.log();

  yield next;
});


APP.use(function *(next) {
  let ctx     = this;
  ctx._pgp    = ctx._pgp ? ctx._pgp : yield koaPGP.init;
  let pk      = yield readFile('./example_files/private.key');
  let message = yield koaPGP.decrypt(ctx, ctx.request.body, pk, secret);

  //setting the body to the decrypted message

  ctx.request.body = message;
  console.log();
  console.log();
  console.log('-----------------------DECRYPTED MESSAGE--------------------');
  console.log(ctx.request.body);
  console.log('-----------------------DECRYPTED MESSAGE--------------------');
  console.log();
  console.log();


  yield next;
});

APP.use(function *(next) {
  //the decrypted body after the public key has been passed.
  this.response.status = 200;
  this.response.body   = this.request.body;
  yield next;
});

APP.listen(1988);

**/
/** USE AS MIDDLEWARE **/

// Header required of application/pgp-encrypted and npm install koa-bodyparser-secure

require('./example_files/middleware.js')(APP, koaPGP);
