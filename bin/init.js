'use strict';
var Promise = require('bluebird');
var client = require('../rpc/client');
var expect = require('chai').expect;
var assert = require('chai').assert;
var log = require('../middleware/farm/helpers/log');
var util = require('../middleware/farm/helpers/util');
var CONST = require('../middleware/farm/values/constants');
var rp = require('request-promise');
var customer;
var farmer;
var driver;
var admin;
var currentProduct;
var currentRepository;


function init() {
    if (process.env.NODE_DO_INIT || true) {
        doInit();
    }
}

function doInit() {
    log.i('doInit()');

    var assertProperties = function (body, json) {
        body = util.objectify(body);
        for (var attr in json) {
            log.v('body[' + attr + '] = ', body[attr], ', json[' + attr + '] = ', json[attr]);
            assert(body[attr] === json[attr]);
        }
    };
    var createUser = function (json) {
        return rp({
            uri: 'http://localhost:3000/api/user',
            method: 'POST',
            json: json
        }).then(function (body) {
            log.v(body);
            assert(body.userID);
            return body;
        });
    };
    var updateUser = function (email, password, json) {
        return rp({
            uri: 'http://localhost:3000/api/user/signin',
            method: 'post',
            json: {
                email: email, password: password
            }
        }).then(function (user) {
            assert(user.token);
            json['userID'] = user.userID;
            return rp({
                uri: 'http://localhost:3000/api/user',
                method: 'post',
                json: json,
                headers: {
                    'token': user.token,
                    'userID': user.userID
                }
            });
        }).then(function (body) {
            log.v(body);
            assertProperties(body, json);
            return body;
        });
    };
    var createTruck = function (json) {
        return rp({
            uri: 'http://localhost:3000/api/res/truck',
            method: 'POST',
            json: json,
            headers: {
                'token': driver.token,
                'userID': driver.userID
            }
        }).then(function (body) {
            log.v(body);
            assert(body.truckID);
            return body;
        });
    };
    var getAllUserOf = function (type) {
        return rp({
            uri: 'http://localhost:3000/api/user/type/' + type,
            method: 'get',
            headers: {
                'token': admin.token,
                'userID': admin.userID
            }
        }).then(function (body) {
            log.v(body);
            assert(JSON.parse(body).length > 0);
            return body;
        });
    };
    var getResourceOf = function (resName, json) {
        return rp({
            uri: 'http://localhost:3000/api/res/' + resName + '/query',
            method: 'post',
            json: json,
            headers: {
                'token': admin.token,
                'userID': admin.userID
            }
        }).then(function (body) {
            log.v(body);
            return body;
        });
    };
    var createOrUpdateProduct = function (json) {
        return rp({
            uri: 'http://localhost:3000/api/res/product',
            method: 'post',
            json: json,
            headers: {
                'token': admin.token,
                'userID': admin.userID
            }
        }).then(function (body) {
            log.v('body = ', body, ', json = ', json);
            assertProperties(body, json);
            return body;
        }).then(function (body) {
            return rp({
                uri: 'http://localhost:3000/api/res/product/id/' + body.productID,
                method: 'get',
                headers: {
                    'token': admin.token,
                    'userID': admin.userID
                }
            });
        }).then(function (body) {
            log.v(body);
            body = JSON.parse(body);
            assertProperties(body, json);
            return body;
        });
    };
    var removeResource = function (resName, id) {
        return rp({
            uri: 'http://localhost:3000/api/res/' + resName + '/id/' + id,
            method: 'delete',
            headers: {
                'token': farmer.token,
                'userID': farmer.userID
            }
        }).then(function (body) {
            log.v('body = ', body);
            return body;
        });
    };

    function getBestSeller(pageNum) {
        return rp({
            uri: 'http://localhost:3000/api/res/product/bestseller/' + pageNum,
            method: 'get',
            headers: {
                'token': customer.token,
                'userID': customer.userID
            }
        }).then(function (body) {
            log.v('body = ', body);
            assert(util.objectify(body).products.length > 0);
            return body;
        });
    }

    function getResourceOfPage(resName, pageNum, json) {
        return rp({
            uri: 'http://localhost:3000/api/res/' + resName + '/page/' + pageNum,
            method: 'post',
            json: json,
            headers: {
                'token': admin.token,
                'userID': admin.userID
            }
        }).then(function (body) {
            log.v('body = ', body);
            assert(util.objectify(body).items.length > 0);
            return body;
        });
    }

    function begin() {
        return Promise.bind({});
    }

    function testMQ() {
        log.v();
        return new Promise(function (resolver, reject) {
            log.v();
            // client.makeRPC('test', {url: '/test'}, {status: 200}, function (message, reply) {
            //     log.v(reply);
            //     resolver(reply);
            // });

            client.makeRPC('signin', {
                body: {
                    email: 'wenghaoda@gam',
                    password: ""
                }
            }, {}, function (message, reply) {
                log.v('testMQ, reply = ', reply, ', message = ', message);
                resolver(reply);
            });
            setTimeout(function () {
                log.v();
                reject();
            }, 1000);
        })
    }

    begin().then(function () {
        // return testMQ();
    }).then(function () {
        return createUser({
            userName: 'customer',
            email: "customer@email.com", password: "1"
        });
    }).then(function (body) {
        return updateUser('customer@email.com', '1', {firstName: 'hello'});
    }).then(function (body) {
        assert(body.token);
        customer = util.objectify(body);
        return createUser({
            userName: 'farmer',
            email: "farmer@email.com", password: "1"
        });
    }).then(function () {
        return updateUser("farmer@email.com", '1', {type: 'farmer'});
    }).then(function (body) {
        farmer = util.objectify(body);
        // return removeResource('user', farmer.userID);
        return;
    }).then(function (body) {
        return createUser({
            userName: 'driver',
            email: "driver@email.com", password: "1"
        });
    }).then(function () {
        return updateUser("driver@email.com", '1', {type: 'driver'});
    }).then(function (body) {
        driver = util.objectify(body);
        return createTruck({details: 'Benz'});
    }).then(function (body) {
        log.v('body = ', body);
        assert(util.objectify(body).driverID == driver.userID);
        return createUser({
            userName: 'false admin',
            email: "custom2@email.com", password: "1"
        });
    }).then(function (body) {
        return updateUser("admin@email.com", '1', {userName: 'admin'});
    }).then(function (body) {
        admin = body;
        return getAllUserOf(CONST.CUSTOMER);
    }).then(function () {
        return getAllUserOf(CONST.ADMIN);
    }).then(function () {
        return getResourceOf(CONST.USER, {email: 'farmer@email.com', type: CONST.FARMER});
    }).then(function (body) {
        log.v('body = ', body);
        assert(util.objectify(body)[0].type === CONST.FARMER);
        return createOrUpdateProduct({
            name: 'product a',
            price: '100',
        });
    }).then(function (body) {
        return createOrUpdateProduct({
            productID: body.productID,
            name: 'product a',
            price: '200',
        });
    }).then(function (body) {
        return rp({
            uri: 'http://localhost:3000/api/res/product/id/' + body.productID,
            method: 'delete',
            headers: {
                'token': admin.token,
                'userID': admin.userID
            }
        });
    }).then(function (body) {
        log.v(body);
        return createOrUpdateProduct({
            name: 'product b',
            price: '100',
            image: '/images/' + (Math.floor(Math.random() * 56) + 1) + '.jpg'
        });
    }).then(function (body) {
        log.v(body);
        return createOrUpdateProduct({
            name: 'product c',
            price: '100',
            image: '/images/' + (Math.floor(Math.random() * 56) + 1) + '.jpg'
        });
    }).then(function (body) {
        log.v(body);
        return createOrUpdateProduct({
            name: 'product d',
            price: '100',
            image: '/images/' + (Math.floor(Math.random() * 56) + 1) + '.jpg'
        });
    }).then(function (body) {
        log.v(body);
        return createOrUpdateProduct({
            name: 'product e',
            price: '100',
            image: '/images/' + (Math.floor(Math.random() * 56) + 1) + '.jpg'
        });
    }).then(function (body) {
        currentProduct = body;
        return rp({
            uri: 'http://localhost:3000/api/res/product/id/' + currentProduct._id,
            method: 'get',
            headers: {
                'token': admin.token,
                'userID': admin.userID
            }
        });
    }).then(function (body) {
        log.v(body);
        body = util.objectify(body);
        assert(body.farmer.email);
        currentProduct = body;
        return rp({
            uri: 'http://localhost:3000/api/res/repository',
            method: 'post',
            json: {
                name: 'sjsu',
                lat: '37.336610',
                lng: '-121.881304',
                address: '1 Washington Sq, San Jose, CA 95192'
            },
            headers: {
                'token': admin.token,
                'userID': admin.userID
            }
        });
    }).then(function (body) {
        log.v(body);
        assert(body.repositoryID);
        return rp({
            uri: 'http://localhost:3000/api/res/repository',
            method: 'post',
            json: {
                name: 'san fransisco',
                lat: '37.783514',
                lng: '-122.428638'
            },
            headers: {
                'token': admin.token,
                'userID': admin.userID
            }
        });
    }).then(function (body) {
        log.v(body);
        assert(body.repositoryID);
        return rp({
            uri: 'http://localhost:3000/api/res/order',
            method: 'post',
            json: {
                items: [{productID: currentProduct.productID, count: 2}],
                destinationLocation: {
                    lat: 37.326065,
                    lng: -121.945682,
                    name: 'Westfield Valley Fair',
                    address: '2855 Stevens Creek Blvd, Santa Clara, CA 95050'
                },
                expectedDeliveryTime: new Date(),
            },
            headers: {
                'token': admin.token,
                'userID': admin.userID
            }
        });
    }).then(function (body) {
        assert(body.orderID);
        return rp({
            uri: 'http://localhost:3000/api/res/review',
            method: 'post',
            json: {
                productID: currentProduct.productID,
                rating: 3,
                comment: "very good!",
            },
            headers: {
                'token': admin.token,
                'userID': admin.userID
            }
        });
    }).then(function (body) {
        assert(body.reviewID);
        return getBestSeller(1);
    }).then(function (body) {
        body = util.objectify(body);
        assert(body.pages);
        assert(body.products.length);
        return getResourceOfPage(CONST.USER, 1, {keyword: 'admin', filter: {type: CONST.ADMIN}});
    }).then(function (body) {
        body = util.objectify(body);
        assert(body.pages);
        assert(body.items.length);
    }).catch(function (err) {
        if (err && err.stack) {
            log.e('err = ', err.stack);
        } else {
            log.e('err = ', err);
        }
    });

}

module.exports = init;
module.exports.log = true;