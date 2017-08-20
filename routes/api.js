'use strict';
var client = require('../rpc/client');
var express = require('express');
var router = express.Router();

// common
router.post('/user', function (req, res) {
    client.makeRPC('updateResource', req, res);
});
router.post('/res/user', function (req, res) {
    client.makeRPC('updateResource', req, res);
});
router.post('/user/signin', function (req, res) {
    client.makeRPC('signin', req, res);
});
router.delete('/res/:resName/id/:resID', function (req, res) {
    client.makeRPC('deleteResource', req, res);
});
router.get('/res/:resName/id/:resID', function (req, res) {
    client.makeRPC('getResource', req, res);
});

// admin
router.get('/user/type/:type', function (req, res) {
    client.makeRPC('getAllUserOf', req, res);
});
router.post('/res/:resName/query', function (req, res) {
    client.makeRPC('getResourceOf', req, res);
});

router.get('/user/id/:userID/product', function (req, res) {
    client.makeRPC('getUserProduct', req, res);
});

router.post('/res/product', function (req, res) {
    client.makeRPC('updateResource', req, res);
});
router.get('/res/product/bestseller/:pageNum', function (req, res) {
    client.makeRPC('getProductsOfPage', req, res);
});
router.post('/res/:resName/page/:pageNum', function (req, res) {
    client.makeRPC('getResourceOfPage', req, res);
});
router.post('/res/order', function (req, res) {
    client.makeRPC('updateResource', req, res);
});
router.post('/res/truck', function (req, res) {
    client.makeRPC('updateResource', req, res);
});
router.post('/res/repository', function (req, res) {
    client.makeRPC('updateResource', req, res);
});
router.post('/res/trip', function (req, res) {
    client.makeRPC('updateResource', req, res);
});
router.post('/res/review', function (req, res) {
    client.makeRPC('updateResource', req, res);
});

module.exports = router;
