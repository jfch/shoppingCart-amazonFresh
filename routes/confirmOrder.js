var express = require('express');
var client = require('../rpc/client');
var ERROR = require('../middleware/farm/values/error');
var log = require('../middleware/farm/helpers/log');
var router = express.Router();

router.get('/', function (req, res, next) {
    res.render('confirmOrder');
});

router.post('/', function (req, res, next) {
    log.req(req);
    // TODO
    req.url = '/res/order';
    req.body.items = req.session.cart.cartList;
    req.body.destinationLocation = {lat: 37.566971, lng: -122.330963};
    req.body.expectedDeliveryTime = new Date();
    client.makeRPC('updateResource', req, res, function (err, reply) {
        if (reply.res.statusCode == 200) {
            req.session.cart = undefined;
            return res.render('confirmOrder');
        }
        ERROR.render(res, reply.res.sendObject);
    });
});


module.exports = router;