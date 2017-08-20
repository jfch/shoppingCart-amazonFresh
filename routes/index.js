var express = require('express');
var passport = require('passport');
var router = express.Router();
var log = require('../middleware/farm/helpers/log');
var auth = require('../helpers/auth');

/* GET home page. */
router.get('/', auth.ensureSignIn, function (req, res, next) {
    log.req(req);
    var pageNum = req.query.pageNum || 1;
    log.v('pageNum = ', pageNum);
    res.render('index', {pageNum: pageNum});
});

module.exports = router;
module.exports.log = true;
