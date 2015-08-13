# koa-pgp
  Pretty good middlware privacy 
  
[![NPM](https://nodei.co/npm/koa-pgp.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/koa-waterline/) [![NPM](https://nodei.co/npm-dl/koa-pgp.png?months=6&height=3)](https://nodei.co/npm/koa-pgp/)


    npm install koa-pgp

## Example
      var koaPGP = require('koa-pgp');
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

## As Middleware
    var config = require('yourconfig.json');
    var koaPGP = require('koa-pgp');
    app.use(koaPGP.middleware(config.private_key, config.passphrase));
    
    //This expects the encrypted message to be sent in the ctx.request.body
  
## Authors

  - [Peter A Tariche](https://github.com/ptariche)

# License

  MIT

