'use strict';
var util = require('../helpers/util');
var mongo = require('../models/mongo');
var Promise = require('bluebird');
var schema = require('../models/schema');
var dbi = require('../models/dbi');
var CONST = require('../values/constants');
var ERROR = require('../values/error');
var bcrypt = require('bcrypt');
var express = require('express');
var router = express.Router();
var log = require('../helpers/log');
var compare = Promise.promisify(bcrypt.compare);

function getResName(url) {
    var strs = url.split('/');
    var name = strs[strs.length - 1] || strs[strs.length - 2];
    return name.toLowerCase();
}

function toResId(resName) {
    return resName.toLowerCase() + 'ID';
}

function getId(res, resName) {
    return res._id || res[toResId(resName)];
}
var api = {
    test: function (req, res) {
        log.v();
        res.send(req);
    },
    logError: function (res, err) {
        if (err instanceof Error) {
            err = err.stack;
        }
        log.i('logError, err = ', err);
        switch (err.code) {
            case ERROR.AUTH_REQUIRED.code:
            case ERROR.INVALID_TOKEN.code:
            case ERROR.INVALID_USER_ID.code:
                res.resetUser = true;
                break;
        }
        ERROR.badRequest(res, err);
    },
    hasRequiredParams: function (req, requiredParams) {
        return new Promise(function (resolve) {
            // log.v('hasRequiredParams');
            if (!util.containsAll(req.body, requiredParams)) {
                log.e('hasRequiredParams, param required, params = ', req.body);
                return Promise.reject(ERROR.paramRequired(requiredParams));
            }
            resolve();
        });
    },
    validateParams: function (req, schemaTemplate) {
        return new Promise(function (resolve) {
            var err = schema.validate(schemaTemplate, req.body);
            if (err) {
                log.e('validateParams, validate failed, err = ', err);
                return Promise.reject(err);
            }
            resolve();
        });
    },
    auth: function (req, res) {
        var userID = req.get ? req.get('userID') : (req.headers['userid'] || req.headers['userID']);
        var token = req.get ? req.get('token') : req.headers['token'];
        if (!userID || !token) {
            return new Promise(function () {
                log.e('auth, AUTH_REQUIRED');
                return Promise.reject(ERROR.AUTH_REQUIRED);
            });
        }

        return mongo.get(userID, CONST.USER).spread(function (user) {
            log.v('auth, user = ', user);
            if (!user) {
                log.e('auth, INVALID_USER_ID');
                return Promise.reject(ERROR.INVALID_USER_ID);
            }
            if (user.token !== token) {
                log.e('auth, INVALID_TOKEN');
                return Promise.reject(ERROR.INVALID_TOKEN);
            }
            return user;
        });
    },
    geAdmin: function (req) {
        return api.auth(req).then(function (user) {
            if (user.type === CONST.ADMIN) {
                return user;
            }
            log.v();
            return Promise.reject(ERROR.PERMISSION_DENIED);
        });
    },
    isUserOf: function (req, types) {
        if (util.undefined(types)) {
            types = [CONST.USER];
        }
        if (!Array.isArray(types)) {
            types = [types];
        }
        if (types.indexOf(CONST.GUEST) >= 0) {
            return Promise.resolve(undefined);
        }
        return api.auth(req).then(function (user) {
            if (types.indexOf(user.type) >= 0 || types.indexOf(CONST.USER) >= 0) {
                return user;
            }
            return Promise.reject(ERROR.PERMISSION_DENIED);
        });
    },
    createUser: function (req, res) {
        log.req(req);
        api.hasRequiredParams(req, ['userName', 'email', 'password']).then(function () {
            return api.validateParams(req, schema.User);
        }).then(function () {
            return mongo.get({email: req.body.email}, CONST.USER);
        }).spread(function (user) {
            log.v('create user, check email, user = ', user);
            if (user) {
                return Promise.reject(ERROR.DUP_EMAIL);
            }
            if (req.body.ssn) {
                return mongo.get({userID: req.body.ssn}).spread(function (user) {
                    if (user) {
                        return Promise.reject(ERROR.SSN_EXISTS);
                    }
                    return req.body.ssn;
                });
            }
            return dbi.createSSN(CONST.USER);
        }).then(function (ssn) {
            var user = schema.accept(schema.User, req.body);
            user._key = ssn;
            user.userID = ssn;
            user.type = CONST.CUSTOMER;
            user.password = bcrypt.hashSync(user.password, 10);
            log.v('create user, user = ', user);
            return mongo.put(user, CONST.USER);
        }).then(function (user) {
            log.v('create user, reply');
            ERROR.ok(res, user);
        }).catch(function (err) {
            api.logError(res, err);
        });
    },
    deleteUser: function (req, res) {
        log.req(req);
        mongo.remove({email: req.params.email}, CONST.USER).then(function () {
            log.v('delete user');
            ERROR.ok(res, '');
        });
    },
    signin: function (req, res) {
        log.req(req);
        api.hasRequiredParams(req, ['email', 'password']).bind({}).then(function () {
            return api.validateParams(req, schema.User);
        }).then(function () {
            return mongo.get({email: req.body.email}, CONST.USER);
        }).spread(function (user) {
            log.v('auth, user = ', user);
            if (!user) {
                return Promise.reject(ERROR.INVALID_EMAIL_OR_PASSWORD);
            }
            this.user = user;
            return compare(req.body.password, user.password);
        }).then(function (isMatch) {
            log.v('auth, isMatch = ', isMatch);
            if (!isMatch) {
                return Promise.reject(ERROR.INVALID_EMAIL_OR_PASSWORD);
            }
            return this.user;
        }).then(function (user) {
            log.v('signin, verify, user = ', user);
            if (!user) {
                return Promise.reject(ERROR.INVALID_EMAIL_OR_PASSWORD);
            }
            user.token = dbi.createToken();
            return mongo.put(user, CONST.USER);
        }).then(function (user) {
            log.v('signin, update token, user = ', user);
            req.session.user = user;
            return ERROR.ok(res, user);
        }).catch(function (err) {
            api.logError(res, err);
        });
    },
    getUserProduct: function (req, res) {
        log.req(req);
        mongo.get({farmerID: req.params.userID}, CONST.PRODUCT).then(function (products) {
            log.v('getUserProduct, products = ', products);
            ERROR.ok(res, products);
        });
    },
    updateUser: function (req, res) {
        log.req(req);
        api.auth(req).bind({}).then(function (user) {
            this.newUser = schema.accept(schema.User, req.body);
            log.v('update, newUser = ', this.newUser);
            return mongo.get(user.userID, CONST.USER)
        }).spread(function (oldUser) {
            this.newUser = util.combine(oldUser, this.newUser);
            log.v('update, oldUser = ', oldUser, ', newUser = ', this.newUser);
            return mongo.put(this.newUser, CONST.USER);
        }).then(function (user) {
            log.v('update, reply = ', user);
            ERROR.ok(res, user);
        }).catch(function (err) {
            api.logError(res, err);
        });
    },
    updateResource: function (req, res) {
        log.req(req);
        var resName = getResName(req.url);
        var schemas = schema[resName];
        var currentResource, form, userGroup, resourceSchema, resourceOperation, currentUser, afterOperation;
        var id = getId(req.body, resName);
        userGroup = id ? schema.KEY.UPDATE_USER : schema.KEY.CREATE_USER;
        log.v('updateResource, resName = ', resName, ', id = ', id);

        api.isUserOf(req, schemas[userGroup] || schemas[schema.KEY.USER]).bind({}).then(function (user) {
            log.v('updateResource, permission pass, user = ', user);
            currentUser = user;
            if (id) {
                return mongo.get(id, resName);
            }
            return [];
        }).spread(function (resource) {
            currentResource = resource || {};
            resourceSchema = resource ? schema.KEY.UPDATE : schema.KEY.CREATE;
            resourceOperation = resource ? schema.KEY.DO_UPDATE : schema.KEY.DO_CREATE;
            afterOperation = resource ? schema.KEY.AFTER_UPDATE : schema.KEY.AFTER_CREATE;
            log.v('updateResource, currentResource = ', currentResource);

            return api.validateParams(req, schemas[resourceSchema]);
        }).then(function () {
            log.v('updateResource, param format ok');
            form = schema.accept(schemas[resourceSchema], req.body);

            log.v('updateResource, before update, currentResource = ', currentResource);
            if (schemas[resourceOperation]) {
                return schemas[resourceOperation](currentUser, currentResource, form);
            }
        }).then(function () {
            log.v('updateResource, after update, currentResource = ', currentResource);
            return mongo.put(currentResource, resName);
        }).then(function (resource) {
            log.v('updateResource, resource = ', resource);
            if (schemas[afterOperation]) {
                return schemas[afterOperation](currentUser, resource, form, req, res);
            } else {
                if (!resource[toResId(resName)]) {
                    resource[toResId(resName)] = resource._id.toString();
                    return mongo.put(resource, resName);
                }
            }
            return resource;
        }).then(function (resource) {
            log.v('updateResource, update id, resource = ', resource);
            ERROR.ok(res, resource);
        }).catch(function (err) {
            api.logError(res, err);
        });
    },
    deleteResource: function (req, res) {
        log.req(req);
        var resName = req.params.resName;
        var id = req.params.resID;
        var schemas = schema[resName];
        var currentUser;
        log.v('deleteResource, resName = ', resName, ', id = ', id);

        api.isUserOf(req, schemas[schema.KEY.DELETE_USER]).bind({}).then(function (user) {
            log.v('deleteResource, permission pass, user = ', user);
            currentUser = user;
            if (!id) {
                log.e('deleteResource, id is required');
                return Promise.reject(ERROR.paramRequired('id'));
            }
            return mongo.get(id, resName);
        }).spread(function (resource) {
            if (!resource) {
                log.e('deleteResource, resource not found, id = ', id);
                return Promise.reject(ERROR.INVALID_RES_ID);
            }
            log.v('updateResource, before doDelete, resource = ', resource);
            if (schemas[schema.KEY.DO_DELETE]) {
                return schemas[schema.KEY.DO_DELETE](currentUser, resource, req.params);
            }
        }).then(function (result) {
            log.v('deleteResource, after doDelete, result = ', result);
            return mongo.remove(id, resName);
        }).then(function (result) {
            log.v('deleteResource, result = ', result);
            ERROR.ok(res, result);
        }).catch(function (err) {
            api.logError(res, err);
        });
    },
    getResource: function (req, res) {
        log.req(req);
        var resName = req.params.resName;
        var id = mongo.objectId(req.params.resID);
        var schemas = schema[resName];
        var currentUser;
        var userGroup = id ? schema.KEY.UPDATE_USER : schema.KEY.CREATE_USER;
        log.v('getResource, resName = ', resName, ', id = ', id);

        api.isUserOf(req, schemas[userGroup] || schemas[schema.KEY.USER]).bind({}).then(function (user) {
            log.v('getResource, permission pass, user = ', user);
            currentUser = user;
            if (id) {
                return mongo.getDetailed(id, resName);
            }
            log.e('getResource, id is required');
            return Promise.reject(ERROR.paramRequired('id'));
        }).spread(function (resource) {
            if (!resource) {
                log.e('getResource, resource not found, id = ', id);
                return Promise.reject(ERROR.INVALID_RES_ID);
            }
            log.v('getResource, before doGet, resource = ', resource);
            if (schemas[schema.KEY.DO_GET]) {
                return schemas[schema.KEY.DO_GET](currentUser, resource, req.params);
            }
            return resource;
        }).then(function (resource) {
            log.v('getResource, after doGet, resource = ', resource);
            ERROR.ok(res, resource);
        }).catch(function (err) {
            api.logError(res, err);
        });
    },
    getAllUserOf: function (req, res) {
        log.req(req);
        api.geAdmin(req).then(function (user) {
            log.v('getAllUserOf, user = ', user);
            return mongo.get({type: req.params.type}, CONST.USER);
        }).then(function (users) {
            log.v('getAllUserOf, users = ', users);
            ERROR.ok(res, users);
        }).catch(function (err) {
            api.logError(res, err);
        });
    },
    getResourceOf: function (req, res) {
        log.req(req);
        api.auth(req).then(function (user) {
            if (!req.params.resName) {
                return Promise.reject(ERROR.INVALID_RES_NAME);
            }
            log.v('getResourceOf, user = ', user);
            return mongo.get(mongo.toFilter(req.body), req.params.resName);
        }).then(function (users) {
            log.v('getResourceOf, users = ', users);
            ERROR.ok(res, users);
        }).catch(function (err) {
            api.logError(res, err);
        });
    },
    getProductsOfPage: function (req, res) {
        const product = mongo.collection(CONST.PRODUCT);
        var result = {};
        api.auth(req).then(function (user) {
            return product.countAsync();
        }).then(function (count) {
            var pages = Math.floor(count / CONST.PAGE_SIZE) + 1;
            result.pages = pages;
            var skip = CONST.PAGE_SIZE * (req.params.pageNum - 1);
            log.v('get best seller, count = ', count, ', pages = ', pages, ', skip = ', skip);
            return product.find().sort({orders: 1})
                .skip(skip).limit(CONST.PAGE_SIZE).toArrayAsync();
        }).then(function (products) {
            result.products = products;
            return ERROR.ok(res, result);
        }).catch(function (err) {
            api.logError(res, err);
        });
    },
    generateFilter: function (keyword, resName) {
        log.v('keyword = ', keyword, ', resName = ', resName);
        var filter = {$or: []};
        for (var attr in schema[resName]['update']) {
            if (attr == 'type') {
                continue;
            }
            var condition = {};
            condition[attr] = {$regex: keyword};
            filter.$or.push(condition);
        }
        return filter;
    },
    getResourceOfPage: function (req, res) {
        log.req(req);
        const collection = mongo.collection(req.params.resName);
        const sort = req.body.sort || {};
        var filter = req.body.keyword ? api.generateFilter(req.body.keyword, req.params.resName) : undefined;
        log.v('filter = ', filter);
        if (filter && req.body.filter) {
            filter = {$and: [filter, req.body.filter]};
            log.v('filter = ', filter);
        }
        if (!filter) {
            filter = req.body.filter || {};
            log.v('filter = ', filter);
        }
        var result = {};
        api.auth(req).then(function (user) {
            return collection.find(filter).countAsync();
        }).then(function (count) {
            var pages = Math.floor(count / CONST.PAGE_SIZE) + 1;
            result.pages = pages;
            var skip = CONST.PAGE_SIZE * (req.params.pageNum - 1);
            log.v('getResourceOfPage, count = ', count, ', pages = ', pages, ', skip = ', skip);
            return collection.find(filter).sort(sort)
                .skip(skip).limit(CONST.PAGE_SIZE).toArrayAsync();
        }).then(function (items) {
            result.items = items;
            return ERROR.ok(res, result);
        }).catch(function (err) {
            api.logError(res, err);
        });
    }
};


module.exports = api;
module.exports.log = true;
