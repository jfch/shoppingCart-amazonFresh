var express = require('express');
var router = express.Router();
const ERROR = require('../middleware/farm/values/error');

/* GET home page. */
router.get('/', function (req, res, next) {
    if (!req.session.cart || !req.session.cart.cartList.length) {
        return res.render('errorInfo.jade', {err: ERROR.OPERATION_NOT_PROVIDE});
    }
    res.render('previewOrder', {cart: req.session.cart});
});
router.post('/', function (req, res, next) {
    res.redirect('previewOrder');

});

module.exports = router;
