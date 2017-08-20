'user strict';
var passport = require('passport')
    , LocalStrategy = require('passport-local').Strategy;
var CONST = require('../middleware/farm/values/constants.js');
var log = require('../middleware/farm/helpers/log.js');
var client = require('../rpc/client');

var auth = {
    enable: true,
    ensureSignIn: function (req, res, next) {
        return req.session.passport && req.session.passport.user ? next() : res.redirect('/signin');
    },
    ensureAdminSignIn: function (req, res, next) {
        return req.session.passport && req.session.passport.user && req.session.passport.user.type === CONST.ADMIN
            ? next() : res.redirect('/admin');
    },
    callbacks: passport.authenticate(CONST.LOCAL_STATEGY, {
        successRedirect: '/',
        failureRedirect: '/signin',
    }),
    testUser: {
        userName: 'Haoda', email: 'wenghaoda@gmail.com', password: 'xxx'
    }
};

passport.use(CONST.LOCAL_STATEGY, new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, function (email, password, done) {
        log.v('auth, email = ', email, ', password = ', password);
        if (!auth.enable) {
            return done(null, auth.testUser);
        }
        client.makeRPC('signin', {
            body: {
                email: email,
                password: password
            }
        }, {}, function (message, reply) {
            log.v('auth.verify, reply = ', reply, ', message = ', message);
            if (reply.res.statusCode != 200) {
                log.v('done = ', done);
                return done(null, false, {message: reply.res.sendObject.msg});
            }
            var user = reply.res.sendObject;
            done(null, user);
        });
    })
);

passport.serializeUser(function (user, cb) {
    log.v('user = ', user);
    cb(null, user);
});

passport.deserializeUser(function (user, cb) {
    log.v('user = ', user);
    cb(null, user);
});

module.exports = auth;
module.exports.log = true;