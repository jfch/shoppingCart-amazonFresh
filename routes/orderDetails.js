var express = require('express');
var client = require('../rpc/client');
var auth = require('../helpers/auth');
var router = express.Router();

/* GET home page. */
router.get('/', auth.ensureSignIn, function (req, res, next) {
    res.render('orderDetails', {req: client.extract(req)});
});

router.post('/', function (req, res, next) {
    res.render('orderDetails');
});
module.exports = router;