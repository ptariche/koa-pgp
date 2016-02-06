# koa-pgp
  Pretty good middlware privacy

[![NPM](https://nodei.co/npm/koa-pgp.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/koa-pgp/) [![NPM](https://nodei.co/npm-dl/koa-pgp.png?months=6&height=3)](https://nodei.co/npm/koa-pgp/)


    npm install koa-pgp

## dependencies

    npm install koa-bodyparser-secure

## Middleware Example
 - Requires a content-type of application/pgp-encrypted with koa-bodyparser-secure installed

 ![Example of POST to Middleware ](example_files/screenshot.png "example")


## Example
```js

'use strict';
let koaPGP = require('koa-pgp');
let parser = require('koa-bodyparser-secure');

app.use(parser());

app.use(function *(next) {
  this.request.body = ':: koa-pgp: starting example ::';
  console.log(this.request.body);
  yield next;
});



let createFile = function *(file_name, data) {
  return yield function(cb){
    let file_path = './example_files/' + file_name;
    fs.writeFile(file_path, data, function(err) {
      if(err) {
        cb(null, false)
        return console.log(err);
      } else {
        console.log('Writing file ' + file_path);
        cb(null, true);
      }
    });
  }
};

let readFile = function *(file_path){
  return yield function(cb){
    fs.readFile(file_path, 'utf8', function(err, data) {
      if (err) {
        throw err;
        cb(null, false);
      } else {
        cb(null, data);
      }
    });
  }
};


app.use(function *(next){
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
  let createPubFile= yield createFile('pub.key', public_key);

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


app.use(function *(next){
  let ctx               = this;
  let encrypted_message = yield readFile('./example_files/example.msg');
  ctx.request.body      = encrypted_message;

  console.log();
  console.log();
  console.log("-----------------------ENCRYPTED MESSAGE--------------------");
  console.log(ctx.request.body);
  console.log("-----------------------ENCRYPTED MESSAGE--------------------");
  console.log();
  console.log();

  yield next;
});


app.use(function *(next){
  let ctx     = this;
  ctx._pgp    = ctx._pgp ? ctx._pgp : yield koaPGP.init;
  let pk      = yield readFile('./example_files/private.key');
  let message = yield koaPGP.decrypt(ctx, ctx.request.body, pk, secret);

  //setting the body to the decrypted message

  ctx.request.body = message;
  console.log();
  console.log();
  console.log("-----------------------DECRYPTED MESSAGE--------------------");
  console.log(ctx.request.body);
  console.log("-----------------------DECRYPTED MESSAGE--------------------");
  console.log();
  console.log();


  yield next;
});

app.use(function *(next) {
  //the decrypted body after the public key has been passed.
  this.response.status = 200;
  this.response.body   = this.request.body;
  yield next;
});
```
## As Middleware
```js
'use strict';
let fs           = require('fs');
let config       = require('./config.js');
let secureParser = require('koa-bodyparser-secure');

module.exports = function (app, koaPGP){
  fs.readFile('./example_files/private.key', 'utf8', function(err, privkey) {
    if (err) {
      throw err;
    } else {
      fs.readFile('./example_files/pub.key', 'utf8', function(err, pubkey) {
        if (err) {
          throw err;
        } else {
          // Header required of application/pgp-encrypted
          app.use(secureParser());
          app.use(koaPGP.middleware(privkey, config.secret));

          app.use(function *(next) {
            console.log(this.request.body);
            yield next;
          });

          let injection    = {};
          injection.status = 200;
          app.use(koaPGP.middleware_out(pubkey, injection))
          app.listen(1988);
        }
      });

    }
  });
};
```

## Further Examples
   See example.js -- injection arguments will soon be added


### Want to contribute to this repository? Submit a pull request!

### What's still needed?

    - Tests
    - A standard to convert PGP messsages to JSON and so forth

## Authors

  - [Peter A Tariche](https://github.com/ptariche)

# License

  MIT
