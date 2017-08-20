'use strict';
var expect = require('chai').expect;
var assert = require('chai').assert;
var log = require('../middleware/farm/helpers/log');
var CONSTANTS = require('../middleware/farm/values/constants');
var dbi = require('../middleware/farm/models/dbi');
var api = require('../routes/api');
var request = require('request');
var rp = require('request-promise');
var currentUser;
var currentProduct;
var currentRepository;

before(function () {

});

describe('api', function () {
    beforeEach(function () {
    });
    it('create user', function (done) {
        request({
            uri: 'http://localhost:3000/api/user/email/emailName@emailHost.com',
            method: 'delete'
        }, function (error, response, body) {
            log.v('err = ', error, ', response = ', response);
            assert(!error);
            assert(response.statusCode === 200);

            request({
                uri: 'http://localhost:3000/api/user/create',
                method: 'POST',
                json: {
                    userName: 'userName',
                    email: "emailName@emailHost.com", password: "1"
                }
            }, function (error, response, body) {
                log.v('err = ', error, ', response = ', response);
                assert(!error);
                assert(response.statusCode === 200);
                assert(body.userID);
                done();
            });
        });
    });
    it('create user2', function (done) {
        request({
            uri: 'http://localhost:3000/api/user/email/emailName2@emailHost.com',
            method: 'delete'
        }, function (error, response, body) {
            log.v('err = ', error, ', response = ', response);
            assert(!error);
            assert(response.statusCode === 200);

            request({
                uri: 'http://localhost:3000/api/user/create',
                method: 'POST',
                json: {
                    userName: 'userName2',
                    email: "emailName2@emailHost.com", password: "1"
                }
            }, function (error, response, body) {
                log.v('err = ', error, ', response = ', response);
                assert(!error);
                assert(response.statusCode === 200);
                assert(body.userID);
                done();
            });
        });
    });
    it('sign in', function (done) {
        request({
            uri: 'http://localhost:3000/api/user/signin',
            method: 'post',
            json: {
                email: "emailName@emailHost.com", password: "1"
            }
        }, function (error, response, body) {
            log.v('err = ', error, ', response = ', response);
            assert(!error);
            assert(response.statusCode === 200);
            assert(body.token);
            currentUser = body;
            done();
        });
    });
    it('update user', function (done) {
        request({
            uri: 'http://localhost:3000/api/user/update',
            method: 'post',
            json: {
                firstName: 'firstName'
            },
            headers: {
                'token': currentUser.token,
                'userID': currentUser.userID
            }
        }, function (error, response, body) {
            log.v('err = ', error, ', response = ', response);
            assert(!error);
            assert(response.statusCode === 200);
            assert(body.firstName === 'firstName');
            done();
        });
    });
    it('register admin', function (done) {
        request({
            uri: 'http://localhost:3000/api/user/update',
            method: 'post',
            json: {
                type: CONSTANTS.ADMIN
            },
            headers: {
                'token': currentUser.token,
                'userID': currentUser.userID
            }
        }, function (error, response, body) {
            log.v('err = ', error, ', response = ', response);
            assert(!error);
            assert(response.statusCode === 200);
            assert(body.type === CONSTANTS.ADMIN);
            done();
        });
    });
    it('getAllUser', function (done) {
        request({
            uri: 'http://localhost:3000/api/user',
            method: 'get',
            headers: {
                'token': currentUser.token,
                'userID': currentUser.userID
            }
        }, function (error, response, body) {
            log.v('err = ', error, ', response = ', response);
            assert(!error);
            assert(response.statusCode === 200);
            done();
        });
    });
    it('createProduct', function (done) {
        request({
            uri: 'http://localhost:3000/api/res/product',
            method: 'post',
            json: {
                name: 'product a',
                price: '100',
            },
            headers: {
                'token': currentUser.token,
                'userID': currentUser.userID
            }
        }, function (error, response, product) {
            log.v('err = ', error, ', response = ', response);
            assert(!error);
            assert(response.statusCode === 200);
            assert(product.productID);
            currentProduct = product;
            done();
        });
    });
    it('updateProduct', function (done) {
        request({
            uri: 'http://localhost:3000/api/res/product',
            method: 'post',
            json: {
                productID: currentProduct.productID,
                name: 'product a',
                price: '200',
            },
            headers: {
                'token': currentUser.token,
                'userID': currentUser.userID
            }
        }, function (error, response, product) {
            log.v('err = ', error, ', response = ', response);
            assert(!error);
            assert(response.statusCode === 200);
            assert(product.price == 200);
            done();
        });
    });
    it('getProduct', function (done) {
        request({
            uri: 'http://localhost:3000/api/res/product/id/' + currentProduct.productID,
            method: 'get',
            headers: {
                'token': currentUser.token,
                'userID': currentUser.userID
            }
        }, function (error, response, product) {
            log.v('err = ', error, ', response = ', response);
            assert(!error);
            assert(response.statusCode === 200);
            assert(JSON.parse(product).price == 200);
            done();
        });
    });
    // it('deleteProduct', function (done) {
    //     request({
    //         uri: 'http://localhost:3000/api/res/product/id/' + currentProduct.productID,
    //         method: 'delete',
    //         headers: {
    //             'token': currentUser.token,
    //             'userID': currentUser.userID
    //         }
    //     }, function (error, response, product) {
    //         log.v('err = ', error, ', response = ', response);
    //         assert(!error);
    //         assert(response.statusCode === 200);
    //         done();
    //     });
    // });
    it('createRepository', function (done) {
        request({
            uri: 'http://localhost:3000/api/res/repository',
            method: 'post',
            json: {
                name: 'sjsu',
                lat: '37.336610',
                lng: '-121.881304'
            },
            headers: {
                'token': currentUser.token,
                'userID': currentUser.userID
            }
        }, function (error, response, location) {
            log.v('err = ', error, ', response = ', response);
            assert(!error);
            assert(response.statusCode === 200);
            assert(location.repositoryID);
            done();
        });
    });
    it('createRepository2', function (done) {
        request({
            uri: 'http://localhost:3000/api/res/repository',
            method: 'post',
            json: {
                name: 'san fransisco',
                lat: '37.783514',
                lng: '-122.428638'
            },
            headers: {
                'token': currentUser.token,
                'userID': currentUser.userID
            }
        }, function (error, response, location) {
            log.v('err = ', error, ', response = ', response);
            assert(!error);
            assert(response.statusCode === 200);
            assert(location.repositoryID);
            done();
        });
    });
    it('create order', function (done) {
        return rp({
            uri: 'http://localhost:3000/api/res/order',
            method: 'post',
            json: {
                items: [{productID: currentProduct.productID, amount: 2}],
                destinationLocation: {lat: 37.334921, lng: -121.993560},
                expectedDeliveryTime: new Date(),
            },
            headers: {
                'token': currentUser.token,
                'userID': currentUser.userID
            }
        }).then(function (body) {
            assert(body.orderID);
            done();
        });
    });
});

module.exports.log = true;