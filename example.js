/**
@author:      Peter A. Tariche <ptariche@gmail.com>
@fingerprint: 599F 6D20 2806 C23E 6776  F17C 49D6 EE01 6556 E77F
@license:     MIT
**/

var fs     = require('fs');
var koa    = require('koa');
var parser = require('koa-bodyparser-secure');
var koaPGP = require('./index.js');
var app    = koa();

var config = require('./example_files/config.js');
var secret = config.secret;

/**
app.use(parser());

app.use(function *(next) {
  this.request.body = ':: koa-pgp: starting example ::';
  console.log(this.request.body);
  yield next;
});



var createFile = function *(file_name, data) {
  return yield function(cb){
    var file_path = './example_files/' + file_name;
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

var readFile = function *(file_path){
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

  var ctx  = this;

  //instantiate the inheritence of openpgp.js

  ctx._pgp = ctx._pgp ? ctx._pgp : yield koaPGP.init;

  //options argument for openpgp.js https://github.com/openpgpjs/openpgpjs
  var options = {
      numBits: 2048,
      userId: 'Jon Smith <jon.smith@example.org>',
      passphrase: secret
  };

  //create the keys
  var keys         = yield koaPGP.createKeys(this._pgp, options);
  //console.log(keys);
  var private_key  = keys.private_key;
  var public_key   = keys.public_key;

  // Write files to local example_keys directory
  var createPKFile = yield createFile('private.key', private_key);
  var createPubFile= yield createFile('pub.key', public_key);

  // Passing into scope to show example
  // ctx.public_key   = public_key;
  // ctx.private_key  = private_key;
  // ctx.passphrase   = options.passphrase;

  //encrypt the message
  var message      = yield koaPGP.encrypt(ctx, ctx.request.body, private_key);
  var createMsg    = yield createFile('example.msg', message);
  //setting the body to the encrypted message

  yield next;
});


app.use(function *(next){
  var ctx               = this;
  var encrypted_message = yield readFile('./example_files/example.msg');
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
  var ctx     = this;
  ctx._pgp    = ctx._pgp ? ctx._pgp : yield koaPGP.init;
  var pk      = yield readFile('./example_files/private.key');
  var message = yield koaPGP.decrypt(ctx, ctx.request.body, pk, secret);

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

app.listen(1988);

**/
/** USE AS MIDDLEWARE **/

// Header required of application/pgp-encrypted and npm install koa-bodyparser-secure

require('./example_files/middleware.js')(app, koaPGP);
