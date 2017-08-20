var express = require('express');
var router = express.Router();
var passport = require('passport');
var auth = require('../helpers/auth');
var log = require('../middleware/farm/helpers/log');
var CONST = require('../middleware/farm/values/constants');

/* GET home page. */
router.get('/', function (req, res, next) {
    req.logout();
    res.render('signin');
});

router.post('/', function (req, res, next) {
    passport.authenticate(CONST.LOCAL_STATEGY, function (err, user, info) {
        log.v('sign in, user = ', user, ', err = ', err, ', info = ', info);
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.render('signin', info);
        }
        req.logIn(user, function (err) {
            if (err) {
                return next(err);
            }
            return res.redirect('/');
        });
    })(req, res, next);
});


module.exports = router;
module.exports.log = true;
