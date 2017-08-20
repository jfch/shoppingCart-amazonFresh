var express = require('express');
var client = require('../rpc/client');
var auth = require('../helpers/auth');
var router = express.Router();

/* GET home page. */
router.get('/', auth.ensureSignIn, function (req, res, next) {
    res.render('allOrders', {req: client.extract(req)});
});


module.exports = router;