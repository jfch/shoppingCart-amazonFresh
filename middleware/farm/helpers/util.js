'use strict';
var log = require('../helpers/log');
var util = {
    fixedLengthObject: function (callbackLength, cb) {
        var arr = {};
        var length = 0;
        arr.put = function (key, value) {
            arr[key] = value;
            length += 1;
            if (callbackLength === length) {
                cb();
            }
        };
        return arr;
    },
    removeItem: function (arr, obj) {
        if (obj.equals) {
            for (var index = 0; index < arr.length; ++index) {
                if (obj.equals(arr[index])) {
                    return arr.splice(index, 1);
                }
            }
            return;
        }
        var index = arr.indexOf(obj);
        if (index > -1) {
            arr.splice(index, 1);
        }
    },
    ensureArray: function (arr) {
        if (!arr) {
            arr = [];
        }
        return arr;
    },
    toSet: function (src) {
        var set = {};
        if (src) {
            if (Array.isArray(src)) {
                src.forEach(function (e) {
                    set[e] = true;
                })
            } else {
                for (var attr in src) {
                    if (!util.undefined(src[attr])) {
                        set[attr] = true;
                    }
                }
            }
        }
        set.add = function (e) {
            if (!set[e]) {
                set[e] = true;
            }
        };
        set.remove = function (e) {
            var removed = undefined;
            if (set[e]) {
                removed = set[e];
                set[e] = undefined;
            }
            return removed;
        };
        set.contains = function (e) {
            return set[e];
        }
        return set;
    },
    empty: function (obj) {
        if (obj == null || obj == undefined) return true;
        if (obj.length > 0)    return false;
        if (obj.length === 0)  return true;
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
        }
        return true;
    },
    getColumn: function (arr, field) {
        if (arr && arr.length) {
            var res = [];
            arr.forEach(function (e) {
                res.push(e[field]);
            });
            return res;
        }
        return arr;
    },
    arraySubtract: function (a1, a2) {
        if (!a2 || !a2.length) {
            return a1;
        }
        var a = [], diff = [];

        for (var i = 0; i < a1.length; i++) {
            a[a1[i]] = true;
        }

        for (var i = 0; i < a2.length; i++) {
            if (a[a2[i]]) {
                delete a[a2[i]];
            } else {
                a[a2[i]] = true;
            }
        }

        for (var k in a) {
            diff.push(k);
        }

        return diff;
    },
    copy: function (obj, fields) {
        if (!obj) {
            return obj;
        }
        var copy = {};
        var whiteList = false;
        var blackList = false;
        for (var attr in fields) {
            if (fields[attr] === 1) {
                whiteList = true;
            } else if (fields[attr] === -1) {
                blackList = true;
            }
        }
        for (var attr in obj) {
            if (typeof obj[attr] === 'function') {
                continue;
            }
            if (whiteList) {
                if (fields[attr] === 1) {
                    copy[attr] = obj[attr];
                }
            } else if (blackList) {
                if (fields[attr] !== -1) {
                    copy[attr] = obj[attr];
                }
            } else {
                copy[attr] = obj[attr];
            }
        }
        return copy;
    },
    mergeObjects: function () {
        var o = {};
        var copy = [].slice.call(args);
        copy.forEach(function (object) {
            for (var attr in object) {
                o[attr] = object[attr];
            }
        });
        return o;
    },
    containsAll: function (src, fields) {
        var set = util.toSet(fields);
        var val = true;
        fields.forEach(function (field) {
            if (util.undefined(src[field])) {
                val = false;
            }
        });
        return val;
    },
    undefined: function (obj) {
        return typeof obj === typeof undefined;
    },
    combine: function (dst, src) {
        var obj = util.copy(dst);
        for (var attr in src) {
            if (!util.isFunction(src[attr])) {
                obj[attr] = src[attr];
            }
        }
        return obj;
    },
    setProperties: function (dst, src) {
        for (var attr in src) {
            if (!util.isFunction(src[attr])) {
                dst[attr] = src[attr];
            }
        }
    },
    isFunction: function (obj) {
        return typeof obj === 'function';
    },
    isBoolean: function (obj) {
        return typeof obj === 'boolean';
    },
    isString: function (obj) {
        return typeof obj === 'string';
    },
    isObject: function (obj) {
        return typeof obj === 'object';
    },
    padZero: function (num, size) {
        var s = num + "";
        while (s.length < size) s = "0" + s;
        return s;
    },
    distanceOf: function (lat1, lon1, lat2, lon2) {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var theta = lon1 - lon2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        dist = dist * 1.609344;
        return dist
    },
    getPropertiesAsList: function (objs, property) {
        var properties = [];
        objs.forEach(function (obj) {
            properties.push(obj[property]);
        });
        return properties;
    },
    objectify: function (strOrObj) {
        if (util.isObject(strOrObj)) {
            return strOrObj;
        }
        return JSON.parse(strOrObj);
    }
};


module.exports = util;
module.exports.log = true;