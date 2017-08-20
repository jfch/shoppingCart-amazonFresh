var express = require('express');
var auth = require('../helpers/auth');
var log = require('../middleware/farm/helpers/log');
var CONST = require('../middleware/farm/values/constants');
var client = require('../rpc/client');
var router = express.Router();

/* GET home page. */
router.get('/', auth.ensureSignIn, function (req, res, next) {
    log.req(req);
    switch (req.session.passport.user.type) {
        case CONST.CUSTOMER:
            return res.render('farmer', {req: client.extract(req)});
        case CONST.FARMER:
            return res.render('productmanage', {req: client.extract(req)});
        case CONST.ADMIN:
            return res.redirect('/admin/admin');
    }
});

router.post('/create', function (req, res, next) {
    // log.v('req.body = ', req.body);
    // if (req.body.agree) {
    //     return res.redirect('/farmer');
    // } else {
    //     return res.render('farmer', {message: 'You must agree with the terms and conditions'});
    // }
});

module.exports = router;
module.exports.log = true;
