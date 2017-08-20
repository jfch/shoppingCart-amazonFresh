var express = require('express');
var router = express.Router();
var log = require('../middleware/farm/helpers/log');
var client = require('../rpc/client');
const CONST = require('../middleware/farm/values/constants');


router.get('/id/:resID', function (req, res, next) {
    log.v('');
    // client.makeRPC('')
    res.render('product', {req: req});
});


router.post('/cart', function (req, res, next) {

    if (!req.session.productList) {
        req.session.productList = [];
    }
    var property = 'id';
    var value = req.body.data;

    req.session.productList.forEach(function (result, index) {
        if (result[property] === value) {
            //Remove from array
            productList.splice(index, 1);
        }
    });
    res.send(productList);

});


module.exports = router;
