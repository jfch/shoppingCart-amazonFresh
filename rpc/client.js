var amqp = require('amqp');
var log = require('../middleware/farm/helpers/log');
var connection = amqp.createConnection({host: '127.0.0.1'});
var rpc = new (require('./amqprpc'))(connection);
var CONST = require('../middleware/farm/values/constants');

function make_request(req, callback) {
    rpc.makeRequest(CONST.QUEUE_NAME, req, function (err, response) {
        if (err)
            log.e(err.stack);
        else {
            callback(null, response);
        }
    });
}

function extract(req) {
    var obj = {session: {}};
    obj.method = req.method;
    obj.url = req.url;
    // obj.session.user = req.session.user;
    obj.body = req.body;
    if (req.headers) {
        obj.headers = req.headers;
    }
    obj.query = req.query;
    if (req.session && req.session.passport && req.session.passport.user) {
        obj.headers = {
            userID: req.session.passport.user.userID,
            token: req.session.passport.user.token
        };
        obj.session.passport = obj.session.passport || {};
        obj.session.passport.user = req.session.passport.user;
    }

    obj.params = req.params;
    log.i('extract(), req = ', obj);
    return obj;
}

function makeRPC(handler, req, res, callback) {
    var message = {
        req: extract(req),
        rpcHandler: typeof handler === 'function' ? handler.name : handler
    };
    log.i('makeRPC(), message = ', message);
    make_request(message, function (err, reply) {
        log.i('makeRPC(), res = ', reply.res);

        if (reply.res.resetUser) {
            req.logout();
            return res.redirect('/signin');
        }

        // customer callback
        if (callback) {
            return callback(err, reply);
        }

        // general response
        if (reply.res.statusCode) {
            res.status(reply.res.statusCode);
        }
        if (reply.res.sendObject) {
            if (message.rpcHandler === 'signin') {
                req.session.token = reply.res.sendObject.token;
            }
            res.send(reply.res.sendObject);
        }
        if (reply.res.renderObject) {
            res.render(reply.res.renderObject.file, reply.res.renderObject.args);
        }
    });
}
exports.log = true;
exports.makeRPC = makeRPC;
exports.extract = extract;

