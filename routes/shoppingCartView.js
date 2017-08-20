var express = require('express');
var router = express.Router();
var log = require('../middleware/farm/helpers/log');
var _ = require('underscore');

function initShoppingCart(req) {
    if (!req.session.cart) {
        req.session.cart = {total: 0, cartList: []};
    }
}

function updateTotal(cart) {
    cart.total = 0;
    cart.cartList.forEach(function (product) {
        cart.total += +product.price;
    });
    cart.total = Math.floor(cart.total * 100) / 100;
}

/* GET home page. */
router.get('/', function (req, res, next) {
    //res.send(cartList);
    //res.render('shoppingCartView', cartList);
    log.req(req);
    log.v('cart = ', req.session.cart);
    initShoppingCart(req);
    res.render('shoppingCartView', {cart: req.session.cart});

});

router.post('/add', function (req, res, next) {

    initShoppingCart(req);
    var product = req.body.item;
    log.v('product = ', product);
    if (!_.findWhere(req.session.cart.cartList, {productID: product.productID})) {
        req.session.cart.cartList.push(req.body.item);
    }
    updateTotal(req.session.cart);
    log.v('req.session.cart = ', req.session.cart);
    res.send(req.session.cart);
});

router.post('/remove', function (req, res, next) {

    initShoppingCart(req);
    log.v('item = ', req.body.item, ', cart = ', req.session.cart);
    req.session.cart.cartList = _.without(req.session.cart.cartList,
        _.findWhere(req.session.cart.cartList, {productID: req.body.item.productID}));
    updateTotal(req.session.cart);
    log.v('after remove, cart = ', req.session.cart);
    res.send(req.session.cart);
});

module.exports = router;
module.exports.log = true;
