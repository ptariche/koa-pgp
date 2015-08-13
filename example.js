var koa    = require('koa');
var parser = require('koa-bodyparser');
var koaPGP = require('./index.js');
var app    = koa();

app.use(parser());

app.use(function *(next) {
  console.log(this.request.body);
  this.request.body = 'this is a test';
  console.log(this.request.body);
  yield next;
});


app.use(function *(next){
  console.log('running next step in co-flow');

  var ctx  = this;

  //instantiate the inheritence of openpgp.js

  ctx._pgp = yield koaPGP.init;

  //options argument for openpgp.js https://github.com/openpgpjs/openpgpjs
  var options = {
      numBits: 2048,
      userId: 'Jon Smith <jon.smith@example.org>',
      passphrase: 'super long and hard to guess secret'
  };

  //create the keys
  var keys         = yield koaPGP.createKeys(this._pgp, options);
  //console.log(keys);
  var private_key  = keys.private_key;
  var public_key   = keys.public_key;

  // Passing into scope to show example
  ctx.public_key   = public_key;
  ctx.private_key  = private_key;
  ctx.passphrase   = options.passphrase;

  //encrypt the message
  var message      = yield koaPGP.encrypt(ctx, ctx.request.body, private_key);

  //setting the body to the encrypted message
  ctx.request.body = message;

  console.log("-----------------------ENCRYPTED MESSAGE--------------------");
  console.log(ctx.request.body);
  console.log("-----------------------ENCRYPTED MESSAGE--------------------");

  yield next;
});

app.use(function *(next){
  var ctx     = this;
  ctx._pgp    = ctx._pgp ? ctx._pgp : yield koaPGP.init;
  var message = yield koaPGP.decrypt(ctx, ctx.request.body, ctx.private_key, ctx.passphrase);
  //setting the body to the decrypted message
  ctx.request.body = message;
  console.log("-----------------------DECRYPTED MESSAGE--------------------");
  console.log(ctx.request.body);
  console.log("-----------------------DECRYPTED MESSAGE--------------------");

  yield next;
});

/** USE AS MIDDLEWARE

var config = require('yourconfig.json');
app.use(koaPGP.middleware(config.private_key, config.passphrase));

**/

app.use(function *(next) {
  //the decrypted body after the public key has been passed.
  this.response.status = 200;
  this.response.body   = this.request.body;
  yield next;
});

app.listen(1988);

