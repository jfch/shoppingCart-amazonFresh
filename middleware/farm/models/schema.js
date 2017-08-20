'use strict';
var ERROR = require('../values/error');
var mongo = require('../models/mongo');
var dbi = require('../models/dbi');
var log = require('../helpers/log');
var util = require('../helpers/util');
var CONST = require('../values/constants');
var validator = require('validator');
var Promise = require('bluebird');
var bcrypt = require('bcrypt');
var mysql = require('../models/mysql');
var Order = require('../models/order');
var OrderItem = require('../models/orderItem');
var _ = require('underscore');

validator.isSSN = function (str) {
    // str = str.split('-').join('');
    // return validator.isDecimal(str) && str.length == 9;
    return true;
};
validator.isNotEmpty = function (str) {
    return str.length;
};
validator.isEmpty = function (str) {
    return !str.length;
};
validator.between0to10 = function (str) {
    return validator.isPositiveInteger(str) && str < 11;
};
validator.isPositiveInteger = function (str) {
    return Number.isInteger(str) || parseInt(str) > 0;
};
validator.objectOfProducts = function (products) {
    for (var productID in products) {
        if (!validator.isMongoId(productID)) {
            return false;
        }
        if (!validator.isPositiveInteger(products[productID])) {
            return false;
        }
    }
    return true;
};
validator.listOfProducts = function (products) {
    // log.v('listOfProducts, products = ', products);
    if (!products || products.length == 0) {
        return false;
    }

    for (var i = 0; i < products.length; ++i) {
        var product = products[i];
        // log.v('listOfProducts, product = ', product);
        if (!validator.isMongoId(product['productID'])) {
            return false;
        }
    }
    return true;
};
validator.anything = function anything() {
    return true;
}

function getClosestLocation(target) {
    return mongo.get({}, CONST.REPOSITORY).then(function (locations) {
        if (util.empty(locations)) {
            return Promise.reject(ERROR.NO_REPOSITORY_AVAILABLE);
        }
        var minIndex;
        var minDistance = Number.MAX_VALUE;
        for (var i = 0; i < locations.length; ++i) {
            var distance = util.distanceOf(target.lat, target.lng, locations[i].lat, locations[i].lng);
            if (distance < minDistance) {
                minDistance = distance;
                minIndex = i;
            }
        }

        return {repo: locations[minIndex], dist: Math.round(minDistance * 10) / 10};
    });
}

function getProducts(items) {
    if (util.empty(items)) {
        return Promise.reject(ERROR.invalidParam(CONST.PRODUCT));
    }
    var total = 0;
    var ids = _.pluck(items, 'productID');
    return mongo.get(ids, CONST.PRODUCT).then(function (products) {
        // log.v('products = ', products);
        items.forEach(function (item) {
            var product = products[item.productID];
            product.count = item.count || 1;
            total += product.price * product.count;
        });
        return {total: total, products: products};
    });
}

function pass(validator, str) {
    if (validator instanceof RegExp) {
        return validator.test(str);
    }
    if (util.isFunction(validator)) {
        return validator(str || '');
    }
}

var schema = {
    user: {
        createUser: [CONST.GUEST],
        create: {
            email: validator.anything,
            password: validator.anything,
            ssn: validator.isSSN, // CustomerID
            firstName: validator.anything,
            lastName: validator.anything,
            address: validator.anything,
            city: validator.anything,
            state: validator.anything,
            zipCode: validator.anything,
            phoneNumber: validator.anything,

            // customer
            cardNumber: validator.anything,

            // farmer
            images: validator.anything,
            video: validator.anything,

            // all
            type: validator.anything,

        },
        doCreate: function (user, target, form) {
            return mongo.get({email: form.email}, CONST.USER).spread(function (existedUser) {
                if (existedUser) {
                    log.v('existedUser = ', existedUser);
                    return Promise.reject(ERROR.DUP_EMAIL);
                }
                return mongo.get(form.ssn).spread(function (user) {
                    if (user) {
                        return Promise.reject(ERROR.SSN_EXISTS);
                    }
                    return form.ssn;
                });
            }).then(function (ssn) {
                util.setProperties(target, form);
                target.type = form.type || CONST.CUSTOMER;
                target.avatar = '/images/' + (Math.floor(Math.random() * 56) + 1) + '.jpg';
                target.password = bcrypt.hashSync(form.password || '', 10);
            });
        },
        update: {
            userName: validator.anything,
            email: validator.anything,
            password: validator.anything,
            ssn: validator.isSSN, // CustomerID
            firstName: validator.anything,
            lastName: validator.anything,
            address: validator.anything,
            city: validator.anything,
            state: validator.anything,
            zipCode: validator.anything,
            phoneNumber: validator.anything,

            // customer
            cardNumber: validator.anything,

            // farmer
            images: validator.anything,
            video: validator.anything,
            type: validator.anything,
        },
        doUpdate: function (user, target, form) {
            if (!user) {
                return Promise.reject(ERROR.AUTH_REQUIRED);
            }
            if (user.type !== CONST.ADMIN && user.userID !== target.userID) {
                return Promise.reject(ERROR.PERMISSION_DENIED);
            }
            util.setProperties(target, form);
            if (form.password) {
                target.password = bcrypt.hashSync(form.password, 10);
            }
            if (form.type) {
                if (form.type === CONST.ADMIN && user.type !== CONST.ADMIN) {
                    return Promise.reject(ERROR.PERMISSION_DENIED);
                }
            }
        },
        doDelete: function (user, target, form) {
            if (user.type === CONST.ADMIN) {
                log.i('delete user, permission allow, admin');
                return;
            }
            if (user.userID !== form.resID) {
                log.i('delete user, permission denied, user = ', user, ', form = ', form);
                return Promise.reject(ERROR.PERMISSION_DENIED);
            }
        }
    },
    product: {
        create: {
            name: validator.anything,
            price: validator.anything,
            description: [validator.isEmpty, validator.anything],
            image: validator.anything
        },
        doCreate: function (user, target, form) {
            util.setProperties(target, form);
            target.orders = 0;
            target.farmerID = user.userID;
        },
        update: {
            productID: validator.isMongoId,
            name: [validator.isEmpty, validator.anything],
            price: [validator.isEmpty, validator.anything],
            description: [validator.isEmpty, validator.anything],
            image: validator.anything
        },
        doUpdate: function (user, target, form) {
            if (target.farmerID !== user.userID) {
                return Promise.reject(ERROR.PERMISSION_DENIED);
            }
            util.setProperties(target, form);
        },
        doGet: function (user, target, form) {
            return mongo.inflate(target);
        }
    },
    review: {
        create: {
            productID: validator.isMongoId,
            rating: validator.between0to10,
            comment: validator.anything,
        },
        doCreate: function (user, target, form) {
            util.setProperties(target, form);
            target.userID = user.userID;
            target.userName = user.userName;
            target.avatar = user.avatar;
            target.time = new Date();
        },
        update: {},
        doUpdate: function (user, target, form) {
            return Promise.reject(ERROR.OPERATION_NOT_PROVIDE);
        },
    },
    order: {
        create: {
            items: validator.listOfProducts,
            destinationLocation: validator.anything,
            expectedDeliveryTime: validator.anything,
            customerID: validator.anything,
            driverID: validator.anything,
        },
        doCreate: function (user, target, form) {
            util.setProperties(target, form);
            if (form.customerID) {
                target.customerID = form.customerID;
            } else {
                target.customerID = user.userID;
            }
            target.date = new Date();
            return mongo.get({type: CONST.DRIVER}, CONST.USER).spread(function (driver) {
                log.v('create order, get driver = ', driver, ', target = ', target);
                if (!driver) {
                    return Promise.reject(ERROR.NO_DRIVER_AVAILABLE);
                }
                if (form.driverID) {
                    target.driverID = form.driverID;
                } else {
                    target.driverID = driver.userID;
                }
                target.destinationLocation = form.destinationLocation;
                return getClosestLocation(target.destinationLocation);
            }).then(function (closest) {
                log.v('create order, get closest = ', closest, ', target = ', target);
                target.sourceLocation = closest.repo;
                target.distanceCovered = closest.dist;
                target.expectedDeliveryTime = form.expectedDeliveryTime;
                return getProducts(form.items);
            }).bind({}).then(function (products) {
                log.v('create order, get products = ', products);
                target.total = products.total;
                target.items = [];
                for (var attr in products.products) {
                    if (!util.isFunction(products.products[attr])) {
                        target.items.push(products.products[attr]);
                    }
                }
                log.v('create order, target = ', target);

                return Promise.each(_.keys(products.products), function (productID) {
                    var product = products.products[productID];
                    return mongo.put({
                        productID: product.productID,
                        farmerID: product.farmerID,
                        productName: product.name,
                        count: product.count,
                    }, CONST.DEAL);
                }).then(function (deal) {
                    if (!deal) {
                        return Promise.reject(ERROR.FAILED_TO_SAVE_DEAL);
                    }
                    return mongo.put({
                        _id: mongo.objectId(deal.productID),
                        $inc: {orders: 1}
                    }, CONST.PRODUCT);
                });
            }).then(function () {
                var tripForm = schema.accept(schema.trip.create, target);
                this.trip = {};
                return schema.trip.doCreate(user, this.trip, tripForm);
            }).then(function () {
                return mongo.put(this.trip, CONST.TRIP);
            });
        },
        update: {
            // orderID: validator.anything,
            // customerID: validator.anything,
            // driverID: validator.anything,
            // sourceLocation: validator.anything,
            // destinationLocation: validator.anything,
            // distanceCovered: validator.anything,
            // date: validator.anything,
            // expectedDeliveryTime: validator.anything,
            // totalAmount: validator.anything,
        }
        ,
        doUpdate: function (user, product, form) {
            return Promise.reject(ERROR.OPERATION_NOT_PROVIDE);
        }
        ,
    },
    repository: {
        user: [CONST.ADMIN],
        create: {
            name: validator.anything,
            lat: validator.anything,
            lng: validator.anything,
            address: [validator.isEmpty, validator.anything],
        },
        doCreate: function (user, target, form) {
            return mongo.get({lat: form.lat, lng: form.lng}, CONST.REPOSITORY).spread(function (repo) {
                if (repo) {
                    // return Promise.reject( ERROR.REPOSITORY_EXIST);
                    util.setProperties(target, repo);
                    return;
                }
                util.setProperties(target, form);

            })
        },
        update: {},
        doUpdate: function (user, target, form) {
            return Promise.reject(ERROR.PERMISSION_DENIED);
        },
    },
    truck: {
        create: {
            details: validator.anything
        },
        doCreate: function (user, target, form) {
            target.driverID = user.userID;
            target.details = form.details;
        }
    },
    trip: {
        create: {
            customerID: validator.anything,
            driverID: validator.anything,
            sourceLocation: validator.anything,
            destinationLocation: validator.anything,
        },
        doCreate: function (user, target, form) {
            log.v('create trip, form = ', form);
            util.setProperties(target, form);
            target.date = new Date();
            return mongo.get({driverID: form.driverID}, CONST.TRUCK).spread(function (truck) {
                if (!truck) {
                    return Promise.reject(ERROR.NO_TRUCK_AVAILABLE);
                }
                target.truckID = truck.truckID;
            });
        },
        update: {
            currentLocation: validator.anything,
            status: validator.anything
        },
        doUpdate: function (user, target, form) {
            util.setProperties(target, form);
            return target;
        }
    },
    validate: function (schema, src) {
        var errs = [];
        for (var attr in schema) {
            if (util.undefined(src[attr])) {
                continue;
            }
            var validators = schema[attr];
            if (!Array.isArray(validators)) {
                validators = [validators];
            }
            var passed = false;
            validators.forEach(function (validator) {
                if (pass(validator, src[attr])) {
                    passed = true;
                }
            });
            if (!passed) {
                errs.push(attr + '(' + src[attr] + ')');
            }
        }
        if (errs.length) {
            return ERROR.invalidParam(errs);
        }
    },
    accept: function (schema, src, fields) {
        var obj = {};
        var set = util.toSet(fields);
        for (var attr in schema) {
            if (util.undefined(src[attr])) {
                continue;
            }
            if (fields && !set.contains(attr)) {
                continue;
            }
            obj[attr] = src[attr];
        }
        return obj;
    },
    KEY: {
        INIT_PARAMS: 'initParams',
        UPDATE: 'update',
        GET: 'get',
        CREATE: 'create',
        DELETE: 'delete',
        DO_GET: 'doGet',
        DO_CREATE: 'doCreate',
        DO_UPDATE: 'doUpdate',
        DO_DELETE: 'doDelete',
        AFTER_GET: 'afterGet',
        AFTER_CREATE: 'afterCreate',
        AFTER_UPDATE: 'afterUpdate',
        AFTER_DELETE: 'afterDelete',
        USER: 'user',
        CREATE_USER: 'createUser',
        UPDATE_USER: 'updateUser',
        DELETE_USER: 'deleteUser',
        GET_USER: 'getUser',
        DB: 'db',
        FORM: 'form',
        ALIAS: 'alias',
    },
    mapping: {
        farmer: 'user',
        customer: 'user',
        amdin: 'user'
    },
    map: function (name) {
        return schema.mapping[name] || name;
    }
};

module.exports = schema;
module.exports.log = true;