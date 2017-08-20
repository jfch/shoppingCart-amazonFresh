/**
 * Created by chitoo on 3/8/16.
 */
function Entity(data) {
    for (var name in this.FIELDS) {
        if (data && typeof data[name] !== 'undefined') {
            this[name] = data[name];
        }
    }
}

Entity.prototype.FIELDS = {};

Entity.prototype.fieldValues = function () {
    var mappedValues = {};
    for (var name in this) {
        var value = this.FIELDS[name];
        if (Entity.validValue(value)) {
            mappedValues[name] = this[name];
        }
    }
    return mappedValues;
};

Entity.prototype.dump = function () {
    var obj = {};
    for (var name in this.FIELDS) {
        if (typeof this[name] !== 'undefined') {
            obj[name] = this[name];
        }
    }
    return obj;
};
Entity.prototype.RAW = '';

Entity.validName = function (name) {
    return name !== name.toUpperCase();
};

Entity.validValue = function (value) {
    var type = typeof value;
    return (type === typeof 0 || type === typeof '' || type === typeof {} || type === typeof false);
};

module.exports = Entity;