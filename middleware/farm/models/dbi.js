var ERROR = require('../values/error');
var mongo = require('../models/mongo');
var mysql = require('../models/mysql');
var schema = require('../models/schema');
var log = require('../helpers/log');
var util = require('../helpers/util');
var validator = require('validator');
var Promise = require('bluebird');
var uuid = require('node-uuid');

function generateSSN() {
    return util.padZero(Math.floor(Math.random() * 1000), 3) + '-'
        + util.padZero(Math.floor(Math.random() * 100), 2) + '-'
        + util.padZero(Math.floor(Math.random() * 10000), 4);
}

var dbi = {
    createSSN: function (collection) {
        var ssn = generateSSN();
        log.v('createSSN, collection = ', collection + ', ssn = ', ssn);
        return mongo.get({_key: ssn}, collection).spread(function (obj) {
            if (obj) {
                log.v('createSSN, exist, obj = ', obj);
                return dbi.createSSN(collection);
            }
            log.v('createSSN, not exist, obj = ', obj);
            return ssn;
        });
    },
    createToken: function () {
        return uuid.v4();
    }
};

module.exports = dbi;
module.exports.log = true;