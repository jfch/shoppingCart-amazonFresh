"use strict";
var Promise = require('bluebird');
var mongodb = Promise.promisifyAll(require('mongodb'));
var MongoClient = mongodb.MongoClient;
const assert = require('assert');
var log = require('../helpers/log');
var util = Promise.promisifyAll(require('../helpers/util'));
var CONST = require('../values/constants');
const _ = require('underscore');

var dbArgs = {
    dbName: 'amazon',
    url: 'mongodb://localhost:27017/amazon'
};


function Mongo(dbArgs) {
    var db;
    this.dbArgs = dbArgs;

    this.init = function () {
        return MongoClient.connectAsync(this.dbArgs.url).then(function (database) {
            db = database;
            return test();
        });
    };

    this.db = function () {
        return db;
    };

    this.collection = function (name) {
        return db.collection(name);
    };

    function objectId(id) {
        if (id instanceof mongodb.ObjectID) {
            return id;
        }
        try {
            return new mongodb.ObjectID(id);
        } catch (err) {
            // log.v('not a objectID, id = ', id);
        }
    }

    this.objectId = objectId;

    this.put = function (object, collection) {
        if (typeof collection === 'undefined') {
            collection = CONST.DEFAULT_COLLECTION;
        }
        // log.v('put(), object = ', object, ', collection = ', collection);

        if (object._id) {
            return update(collection, {_id: objectId(object._id)}, object);
        }

        if (!object._key) {
            return insert(collection, object);
        }

        return get(object._key, collection).spread(function (result) {
            log.v('put, search key = ', object._key, ', result = ', result);
            if (result) {
                return update(collection, {_key: object._key}, object);
            } else {
                return insert(collection, object);
            }
        });
    };

    function containsID(key) {
        return key instanceof mongodb.ObjectID || key instanceof String
            || (typeof key === CONST.TYPE_OBJECT && (key._id || key._key));
    }

    function getByIDs(ids, collection) {
        return new Promise(function (resolve) {
            var objects = util.fixedLengthObject(ids.length, function () {
                resolve(objects);
            });
            ids.forEach(function (id) {
                get({_id: mongo.objectId(id)}, collection).spread(function (doc) {
                    objects.put(id, doc);
                });
            });
        });
    }

    function get(key, collection) {
        if (typeof collection === 'undefined') {
            collection = CONST.DEFAULT_COLLECTION;
        }

        if (key instanceof Array) {
            // log.v();
            return getByIDs(key, collection);
        }

        if (objectId(key)) {
            // log.v();
            return db.collection(collection).find({_id: objectId(key)}).limit(1).toArrayAsync();
        }

        if (typeof key === CONST.TYPE_STRING) {
            // log.v();
            return db.collection(collection).find({_key: key}).limit(1).toArrayAsync();
        }
        // log.v('key = ', key, ', collection = ', collection);
        return db.collection(collection).find(key).toArrayAsync();
    }

    this.get = get;

    this.remove = function (key, collection) {
        if (typeof collection === 'undefined') {
            collection = CONST.DEFAULT_COLLECTION;
        }

        if (objectId(key)) {
            // log.v();
            return db.collection(collection).deleteOneAsync({_id: objectId(key)});
        }

        if (util.isString(key)) {
            // log.v();
            return db.collection(collection).deleteOneAsync({_key: key});
        }

        return db.collection(collection).deleteManyAsync(key);
    };

    function insert(collection, object) {
        //log.v('insert(), collection = ', collection, ', object = ', object);
        return db.collection(collection).insertOneAsync(object).then(function (result) {
            object._id = result.insertedId;
            return object;
        });
    }

    function update(collection, where, object) {
        object = util.copy(object);
        if (object._id) {
            delete object._id;
        }
        if (containsID(where)) {
            return db.collection(collection).updateOneAsync(where, object).then(function () {
                return object;
            });
        } else {
            return db.collection(collection).updateAsync(where, object).then(function () {
                return object;
            });
        }
    }

    this.getDetailed = function (key, collection) {
        var inflatedObjects = [];
        return mongo.get(key, collection).then(function (objects) {
            return Promise.each(objects, function (object) {
                log.v('inflate object = ', object);
                return mongo.inflate(object).then(function (inflatedObject) {
                    log.v('inflated object = ', inflatedObject);
                    inflatedObjects.push(inflatedObject);
                });
            });
        }).then(function () {
            return inflatedObjects;
        });
    };

    this.inflate = function (object) {
        var copy = {};
        return Promise.each(_.keys(object), function (attr) {
            // log.v('attr = ', attr);
            if (util.isFunction(object[attr])) {
                log.v('inflate, skip, fun');
                return;
            }
            if (mongo.objectId(object[attr])
                && attr.endsWith('ID')
                && object[attr].toString() !== object._id.toString()) {
                var resName = attr.toLowerCase().endsWith('id') ? attr.substring(0, attr.length - 'id'.length) : attr;
                log.v('resName = ', resName);
                return mongo.get(object[attr], CONST.MAP[resName] || resName).spread(function (res) {
                    log.v('inflate, resName = ', resName, ', res = ', res);
                    copy[resName] = res;
                })
            } else {
                // log.v('inflate, resName = ', resName);
                copy[attr] = object[attr];
            }
        }).then(function () {
            log.v('inflate, copy = ', copy);
            return copy;
        });
    };

    function toFilter(obj) {
        if (util.empty(obj)) {
            return {};
        }
        var where = {$and: []};
        for (var attr in obj) {
            var condition = {};
            condition[attr] = obj[attr];
            where.$and.push(condition);
        }
        return where;
    }

    this.toFilter = toFilter;


    function test() {
        var obj = {opr: 'insert'};
        var ids = [];
        const TEST = 'test';
        return mongo.remove({}, TEST).then(function (result) {
            log.v('drop collection, result = ', result);
            return mongo.put({opr: 'insert'}, TEST);
        }).then(function (result) {
            log.v('put, result = ', result);
            assert(result._id);
            assert(result.opr === 'insert');
            obj.opr = 'update';
            obj._key = 'hello';
            return mongo.put(obj, TEST);
        }).then(function (result) {
            log.v('update, result = ', result);
            assert(result._key === 'hello');
            assert(result.opr === 'update');
            return mongo.get('hello', TEST);
        }).spread(function (result) {
            log.v('get, result = ', result);
            assert(result.opr === 'update');
            return mongo.remove('hello', TEST);
        }).then(function (result) {
            log.v('remove, result = ', result);
            return mongo.get('hello', TEST);
        }).spread(function (result) {
            log.v('remove, get, result = ', result);
            assert(!result);
            return mongo.put({opr: '1'}, TEST);
        }).then(function (result) {
            ids.push(result._id);
            return mongo.put({opr: '2'}, TEST)
        }).then(function (result) {
            ids.push(result._id);
            return mongo.get(ids, TEST);
        }).then(function (objects) {
            log.v('objects = ', objects);
            assert(objects[ids[0]]['opr'] == 1);
            assert(objects[ids[1]]['opr'] == 2);
            return mongo.put({testName: 'test inflate'}, TEST);
        }).then(function (user) {
            return mongo.put({name: 'product', testID: user._id}, TEST);
        }).then(function (product) {
            log.v('before inflate, product = ', product);
            return mongo.inflate(product);
        }).then(function (product) {
            log.v('after inflate, product = ', product);
            assert(product.test.testName === 'test inflate');
        });
    }
}

var mongo = new Mongo(dbArgs);


module.exports = mongo;
module.exports.log = true;