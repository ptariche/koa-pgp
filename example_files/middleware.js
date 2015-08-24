var fs           = require('fs');
var config       = require('./config.js');
var secureParser = require('koa-bodyparser-secure');

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

          var injection    = {};
          injection.status = 200;
          app.use(koaPGP.middleware_out(pubkey, injection))
          app.listen(1988);
        }
      });

    }
  });
};
