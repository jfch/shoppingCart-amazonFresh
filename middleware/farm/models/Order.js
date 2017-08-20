'use strict';
var Entity = require('./entity');

function Order(data) {
    Entity.call(this, data);
}
Order.prototype = new Entity();
Order.prototype.constructor = Order;

Order.prototype.FIELDS = {
    id: 'int unique AUTO_INCREMENT',
    date: 'long',
    customerID: 'long',
    total: 'long',
    'PRIMARY KEY': '(id)'
};
Order.prototype.FIELDS.__proto__ = new Entity().FIELDS;

module.exports = Order;