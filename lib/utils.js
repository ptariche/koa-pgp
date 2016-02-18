'use strict';

const DEBUG = require('DEBUG')('koa-pgp:utils');

let lookupPublicKey = function *(pgp, search_query, hkp_server) {
  try {
    DEBUG('pgp inside lookupKey function %s', pgp);
    DEBUG('search_query inside lookupKey function %s', search_query);
    DEBUG('hkp_server inside lookupKey function %s', hkp_server);

    DEBUG('looking up key %s', hkp_server);

    hkp_server    = hkp_server ? hkp_server : 'https://pgp.mit.edu';
    let hkp       = new pgp.HKP(hkp_server);
    let key       = yield hkp.lookup({ query: search_query });
    DEBUG('key found %s', key);
    return key;
  } catch (err) {
    DEBUG('There was an error looking up the key %s', err);
    console.log();
    console.error('koa-pgp:');
    console.error(err.stack);
    console.log();
    return false;
  }

};

let uploadPublicKey = function *(pgp, pub_key, hkp_server) {
  try {
    DEBUG('pgp inside uploadPublicKey function %s', pgp);
    DEBUG('pub_key inside uploadPublicKey function %s', pub_key);
    DEBUG('hkp_server inside uploadPublicKey function %s', hkp_server);

    DEBUG('uploading public key to %s', hkp_server);

    hkp_server = hkp_server ? hkp_server : 'https://pgp.mit.edu';
    let hkp    = new pgp.HKP(hkp_server);
    let upload = yield hkp.upload(pub_key);

    DEBUG('uploading public key is a %s', upload);
    return true;
  } catch (err) {
    DEBUG('There was an error uplading the public key %s', err);
    console.log();
    console.error('koa-pgp:');
    console.error(err.stack);
    console.log();
    return false;
  };

};

let verifySignature = function *(pgp, pub_key, priv_key, passphrase, signed_message) {
  try {
    DEBUG('pgp inside verifySignature function %s', pgp);
    DEBUG('pub_key inside verifySignature function %s', pub_key);
    DEBUG('priv_key inside verifySignature function %s', priv_key);
    DEBUG('passphrase inside verifySignature function %s', passphrase);
    DEBUG('signed_message inside verifySignature function %s', signed_message);

    let privKeys   = pgp.key.readArmored(priv_key);
    let publicKeys = pgp.key.readArmored(pub_key);
    let privKey    = privKeys.keys[0];
    let success    = privKey.decrypt(passphrase);
    let message    = pgp.cleartext.readArmored(signed_message);
    let verified   = pgp.verifyClearSignedMessage(publicKeys.keys, message);

    if (verified.signatures[0].valid === true) {
      return true;
    } else {
      return false;
    }

  } catch (err) {
    DEBUG('There was an error verifying the signature %s', err);
    console.log();
    console.error('koa-pgp:');
    console.error(err.stack);
    console.log();
    return false;
  }

};

let createKeys = function *(pgp, options) {
  try {
    DEBUG('pgp inside createKeys function %s', pgp);
    DEBUG('pgp inside createKeys function %s', options);

    if (pgp && options) {
      let keys = yield pgp.generateKeyPair(options);
      DEBUG('Creating Keys %s', keys);
      if (keys) {
        let armored_keys         = {};
        armored_keys.private_key = keys.privateKeyArmored;
        armored_keys.public_key  = keys.publicKeyArmored;
        return armored_keys;
      } else {
        DEBUG('Failed to create Keys');
        return false;
      }
    } else {
      console.log();
      console.error('koa-pgp: Please provide init koa-pgp in as pgp and pass in a options parameter');
      console.log();
      return false;
    }
  } catch (err) {
    DEBUG('An error occured attempting to create they keys %s', err);
    throw err;
    return false;
  }
};

let decrypt = function *(ctx, body, key, passphrase) {

  try {
    DEBUG('pgp inside decrypt function %s', ctx._pgp);
    DEBUG('body inside decrypt function %s', body);
    DEBUG('key inside decrypt function %s', key);
    DEBUG('passphrase inside decrypt function %s', passphrase);

    if (ctx._pgp && body && key && (body.length > 0) ) {
      let privateKey = ctx._pgp.key.readArmored(key).keys[0];
      DEBUG('Private Key %s', privateKey);

      if (passphrase && privateKey) {
        DEBUG('Attempting to decrypt with password %s and %s', passphrase, privateKey);
        try {
          privateKey.decrypt(passphrase);
        } catch (err) {
          throw err;
          return false;
        }

        DEBUG('decrypted private key %s', privateKey);
      }

      DEBUG('body content %s', body);

      DEBUG('Attempting to read armored message');
      let pgpMessage = ctx._pgp.message.readArmored(body);
      DEBUG('PGP Message %s', pgpMessage);

      DEBUG('Before Decryption');
      let plaintext  = yield ctx._pgp.decryptMessage(privateKey, pgpMessage);
      DEBUG('plain text decryption', plaintext);
      DEBUG('After Decryption');

      if (plaintext) {
        return plaintext;
      } else {
        DEBUG('Failed to decrypt %s', body);
        return false;
      }
    } else {
      console.log();
      console.error('koa-pgp: decrypt function: please provide init koa-pgp; pass in a body with a pgp message and a key');
      console.log();
      return false;
    }
  } catch (err) {
    DEBUG('There was an error decrypting %s', err);
    throw err;
    return false;
  }
};

let encrypt = function *(ctx, body, key) {
  try {

    DEBUG('pgp inside encrypt function %s', ctx._pgp);
    DEBUG('body inside encrypt function %s', body);
    DEBUG('key inside encrypt function %s', key);

    if (ctx._pgp && body && key) {
      let publicKey  = ctx._pgp.key.readArmored(key);
      let pgpMessage = yield ctx._pgp.encryptMessage(publicKey.keys, body);
      if (pgpMessage) {
        return pgpMessage;
      } else {
        DEBUG('Failed to encrypt %s', body);
        return false;
      }
    } else {
      console.log();
      console.error('koa-pgp: encrypt function: please provide init koa-pgp; pass in a body and a key');
      console.log();
      return false;
    }
  } catch (err) {
    DEBUG('There was an error encrypting %s', err);
    throw err;
    return false;
  }
};

module.exports.verifySignature = verifySignature;
module.exports.lookupPublicKey = lookupPublicKey;
module.exports.uploadPublicKey = uploadPublicKey;
module.exports.decrypt         = decrypt;
module.exports.encrypt         = encrypt;
module.exports.createKeys      = createKeys;
