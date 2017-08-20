var express = require('express');
var log = require('../middleware/farm/helpers/log');
var client = require('../rpc/client');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    log.req(req);
    var id = req.session.passport && req.session.passport.user
        ? req.session.passport.user.userID : '';
    res.render('signup', {
        id: id, req: {}
    });
});

router.post('/', function (req, res, next) {
    log.req(req);
    if (req.body.password != req.body.passwordCheck) {
        return res.render('signup', {message: 'please input the same password'});
    }

    req.url = '/res/user';
    client.makeRPC('updateResource', req, res, function (err, replay) {
        if (replay.res.statusCode != 200) {
            log.v('failed to register, forward to sign in');
            return res.redirect('/signup');
        }
        req.logIn(replay.res.sendObject, function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect('/signin');
        });
    });
});

module.exports = router;
module.exports.log = true;
