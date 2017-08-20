/**
 * Created by chitoo on 3/8/16.
 */
'use strict';
var CONSTANTS = {
    // types
    TYPE_STRING: (typeof ''),
    TYPE_OBJECT: (typeof {}),
    TYPE_UNDEFINED: (typeof undefined),
    TYPE_FUNCTION: (typeof function () {
    }),

    // users
    USER: 'user',
    GUEST: 'guest',
    CUSTOMER: 'customer',
    FARMER: 'farmer',
    ADMIN: 'admin',
    DRIVER: 'driver',

    // other entity
    TRIP: 'trip',
    PRODUCT: 'product',
    ORDER: 'order',
    LOCATION: 'location',
    REPOSITORY: 'repository',
    TRUCK: 'truck',
    DEAL: 'deal',

    DEFAULT_COLLECTION: 'app',
    CONFIG: 'config',
    POOL: 'pool',
    SENSOR: 'sensor',
    SCHEDULE: 'schedule',
    DATA: 'data',

    LOCAL_STATEGY: 'local',

    QUEUE_NAME: 'amazon',

    PAGE_SIZE: 12,

    MAP: {
        farmer: 'user',
        customer: 'user',
        admin: 'user'
    }
};

module.exports = CONSTANTS;