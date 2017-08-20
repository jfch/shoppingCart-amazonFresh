'use strict';
var Entity = require('./entity');

function Inventory(data) {
    Entity.call(this, data);
}
Inventory.prototype = new Entity();
Inventory.prototype.constructor = Inventory;

Inventory.prototype.FIELDS = {
    id: 'int unique AUTO_INCREMENT',
    productID: 'long ',
    orderID: 'long ',
    amount: 'long not null ',
    'PRIMARY KEY': '(id) '
};
Inventory.prototype.FIELDS.__proto__ = new Entity().FIELDS;

module.exports = Inventory;