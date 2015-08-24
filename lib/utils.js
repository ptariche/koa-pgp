var debug = require('debug')('koa-pgp');

var createKeys = function *(pgp, options){
  debug('pgp inside createKeys function %s', pgp);
  debug('pgp inside createKeys function %s', options);

  if(pgp && options){
    var keys = yield pgp.generateKeyPair(options);
    debug('Creating Keys %s', keys);
    if(keys){
      var armored_keys         = {};
      armored_keys.private_key = keys.privateKeyArmored;
      armored_keys.public_key  = keys.publicKeyArmored;
      return armored_keys;
    } else {
      debug('Failed to create Keys');
      return false;
    }
  } else {
    console.log();
    console.error('koa-pgp: Please provide init koa-pgp in as pgp and pass in a options parameter');
    console.log();
    return false;
  }
};

var decrypt = function *(ctx, body, key, passphrase){
  try {
    debug('pgp inside decrypt function %s', ctx._pgp);
    debug('body inside decrypt function %s', body);
    debug('key inside decrypt function %s', key);
    debug('passphrase inside decrypt function %s', passphrase);

    if(ctx._pgp && body && key) {
      var privateKey = ctx._pgp.key.readArmored(key).keys[0];
      debug('Private Key %s', privateKey);

      if(passphrase && privateKey){
        debug('Attempting to decrypt with password %s and %s', passphrase, privateKey);
        try {
          privateKey.decrypt(passphrase);
        } catch(err){
          throw err;
          return false;
        }
        debug('decrypted private key %s', privateKey);
      }

      debug('Attempting to read armored message');
      var pgpMessage = ctx._pgp.message.readArmored(body);
      debug('PGP Message %s', pgpMessage);

      debug('Before Decryption');
      var plaintext  = yield ctx._pgp.decryptMessage(privateKey, pgpMessage);
      debug('After Decryption');

      if(plaintext){
        return plaintext;
      } else {
        debug('Failed to decrypt %s', body);
        return false;
      }
    } else {
      console.log();
      console.error('koa-pgp: decrypt function: please provide init koa-pgp; pass in a body and a key');
      console.log();
      return false;
    }
  } catch(err){
    debug('There was an error decrypting %s', err);
    throw err;
    return false;
  }
};

var encrypt = function *(ctx, body, key){
  try {

    debug('pgp inside encrypt function %s', ctx._pgp);
    debug('body inside encrypt function %s', body);
    debug('key inside encrypt function %s', key);

    if(ctx._pgp && body && key) {
      var publicKey  = ctx._pgp.key.readArmored(key);
      var pgpMessage = yield ctx._pgp.encryptMessage(publicKey.keys, body);
      if(pgpMessage){
        return pgpMessage;
      } else {
        debug('Failed to encrypt %s', body);
        return false;
      }
    } else {
      console.log();
      console.error('koa-pgp: encrypt function: please provide init koa-pgp; pass in a body and a key');
      console.log();
      return false;
    }
  } catch(err){
    debug('There was an error encrypting %s', err);
    throw err;
    return false;
  }
};

module.exports.decrypt    = decrypt;
module.exports.encrypt    = encrypt;
module.exports.createKeys = createKeys;
