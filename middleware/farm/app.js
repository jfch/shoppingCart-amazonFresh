var api = require('./rpc/api');
var mongo = require('./models/mongo');
var schema = require('./models/schema');
var CONST = require('./values/constants');
var log = require('./helpers/log');
var amqp = require('amqp');
var Promise = require('bluebird');
var assert = require('chai').assert;

var admin = {
    email: 'admin@email.com',
    password: '1',
    type: CONST.ADMIN,
    firstName: 'Jake',
    LastName: 'Dashen',
};
function initAMQP() {
    var cnn = amqp.createConnection({host: '127.0.0.1'});
    cnn.on('ready', function () {
        cnn.queue(CONST.QUEUE_NAME, function (q) {
            q.subscribe(function (message, headers, deliveryInfo, m) {
                log.v('getRequest, message = ', message);

                var res = {
                    statusCode: 0,
                    status: function (status) {
                        res.statusCode = status;
                    },
                    sendObject: null,
                    send: function (obj) {
                        res.sendObject = obj;
                        res.reply();
                    },
                    renderObject: null,
                    render: function (file, args) {
                        res.renderObject = {
                            file: file,
                            args: args
                        };
                        res.reply();
                    },
                    reply: function () {
                        log.v('reply, res = ', res, 'm.replyTo = ', m.replyTo);
                        var reply = {req: message.req, res: res};
                        cnn.publish(m.replyTo, reply, {
                            contentType: 'application/json',
                            contentEncoding: 'utf-8',
                            correlationId: m.correlationId
                        });
                    }
                };

                if (api[message.rpcHandler]) {
                    api[message.rpcHandler](message.req, res);
                } else {
                    log.e('can not find rpcHandler, rpcHandler = ', message.rpcHandler);
                    throw 'can not find rpcHandler';
                }
            });
        });
    });
}

function setUpAdmin() {
    Promise.bind({}).then(function () {
        this.user = {};
        return schema.user.doCreate({type: CONST.ADMIN}, this.user, admin);
    }).then(function () {
        this.user.type = CONST.ADMIN;
        log.v('set admin, this.user = ', this.user);
        return mongo.put(this.user, CONST.USER);
    }).then(function (user) {
        user.userID = user._id.toString();
        return mongo.put(user, CONST.USER);
    }).then(function (user) {
        assert(user.userID);
        assert(user.type === CONST.ADMIN);
    });
}

function init() {
    mongo.init().then(function () {
        return mongo.db().dropDatabaseAsync();
    }).then(function () {
        return mongo.init();
    }).then(function () {
        initAMQP();
    }).then(function () {
        return setUpAdmin();
    });
}
init();


module.exports.log = true;