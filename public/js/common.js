/**
 * Created by chitoo on 3/18/16.
 */
const HOST_CALLER_INDEX = 3;

var global = {};
Object.defineProperty(global, '__stack', {
    get: function () {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__file', {
    get: function () {
        return global.__stack[HOST_CALLER_INDEX].getFileName().split('/').slice(-1)[0];
    }
});

Object.defineProperty(global, '__full_file', {
    get: function () {
        return global.__stack[HOST_CALLER_INDEX].getFileName();
    }
});

Object.defineProperty(global, '__line', {
    get: function () {
        return global.__stack[HOST_CALLER_INDEX].getLineNumber();
    }
});

function addFileAndLineInfo(args) {
    var copy = [].slice.call(args);
    copy.push('<' + global.__full_file + ':' + global.__line + '>');
    for (var i = 0; i < copy.length; ++i) {
        if (typeof copy[i] === typeof {}) {
            copy[i] = JSON.stringify(copy[i]);
        }
    }
    return copy;
}

function log() {
    console.log.apply(console, addFileAndLineInfo(arguments));
}

function apiRequest(url, key, $scope, $http, cb) {
    $http.get(url).success(function (data, status, headers, config) {
        log('url = ', url, ', key = ', key, ', data = ', data);
        $scope[key] = data;
        if (cb) {
            cb(data);
        }
    }).error(function (data, status, headers, config) {
        log('errror, status = ', status);
        $scope['error'] = data;
    });
}
function apiPost(url, payload, key, $scope, $http, cb) {
    $http.post(url, payload).success(function (data, status, headers, config) {
        log('url = ', url, ', key = ', key, ', data = ', data);
        $scope[key] = data;
        if (cb) {
            cb(data);
        }
    }).error(function (data, status, headers, config) {
        log('errror, status = ', status);
        $scope['error'] = data;
    });
}
function apiDelete(url, key, $scope, $http, callback) {
    log('delete url = ', url);
    $http.delete(url).success(function (data, status, headers, config) {
        log('url = ', url, ', key = ', key, ', data = ', data);
        $scope[key] = data;
        if (callback) {
            callback(data);
        }
    }).error(function (data, status, headers, config) {
        log('errror, status = ', status);
        $scope['error'] = data;
    });
}

function addToCart(item, $http) {
    log('item = ', item);
    $http.post('/shoppingCartView/add', {item: item}).then(function (res) {
        document.getElementById('shopping-cart').contentWindow.location.reload();
    });
}