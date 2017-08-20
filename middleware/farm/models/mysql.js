"use strict";
var log = require('../helpers/log');
var Entity = require('../models/entity');
var Pool = require('generic-pool').Pool;
var Client = require('mysql');

var dbArgs = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'amazon'
};
var pool = new Pool({
    name: 'mysql',
    create: function (callback) {
        var connection = Client.createConnection(dbArgs);
        connection.connect(function (err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }
        });
        callback(null, connection);
    },
    destroy: function (client) {
        client.end();
    },
    max: 10,
    min: 1,
    idleTimeoutMillis: 30000,
    log: false
});

function DB() {
    var initedTables = {};

    function createTable(connection, table, data, cb) {
        connection.query(createTableSQL(table, data), cb);
    }

    function alterTable(connection, table, data, cb) {

        existColumns(connection, table, function (err, result) {
            var existColumns = {};
            result.forEach(function (result) {
                existColumns[result["column_name"]] = result["data_type"];
            });

            var diff = {};
            for (var name in data.FIELDS) {
                if (Entity.validName(name) && !existColumns[name]) {
                    diff[name] = data.FIELDS[name];
                }
            }

            if (!Object.keys(diff).length) {
                if (cb) {
                    cb(null, null);
                }
                return;
            }

            connection.query(alterTableSQL(table, diff), function (err, result) {
                if (err) {
                    throw err;
                }
                if (cb) {
                    cb(err, result);
                }
            });
        });
    }

    function createOrAlterTable(connection, table, data, cb) {
        tableExists(connection, table, function (err, result) {
            log.v('createOrAlterTable(), table = ', table, ', exist = ', result);
            if (result) {
                alterTable(connection, table, data, cb);
            } else {
                createTable(connection, table, data, cb);
            }
        });
    }


    function createTableSQL(table, data) {
        var columns = [];
        for (var name in data.FIELDS) {
            columns.push(name + ' ' + data.FIELDS[name]);
        }
        var sql = 'CREATE TABLE IF NOT EXISTS ' + table + '(' + columns.join(', ') + ')';
        log.v('sql = ' + sql);
        return sql;
    }

    function existColumns(connection, table, cb) {
        connection.query("SELECT column_name, data_type FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = ? AND table_name = ?",
            [dbArgs.database, table], cb);
    }

    function alterTableSQL(table, diff) {
        var columns = [];
        for (var name in diff) {
            columns.push(' ADD COLUMN ' + name + ' ' + diff[name]);
        }
        var sql = 'ALTER TABLE ' + table + columns.join(', ');
        log.v('sql = ' + sql);
        return sql;
    }

    function insertSQL(table, data) {
        var columns = [];
        var placeholders = [];
        var values = [];
        for (var name in data.fieldValues()) {
            columns.push(name);
            placeholders.push('?');
            values.push(data[name]);
        }

        var sql = "INSERT INTO " + table + " (" + columns.join(', ') + ") VALUES (" + placeholders.join(', ') + ')';
        sql += getRaw(data);
        return {sql: sql, values: values};
    }

    function updateSQL(table, where, entity) {
        var columns = [];
        var values = [];
        for (var name in entity.fieldValues()) {
            columns.push(name + '=?');
            values.push(entity[name]);
        }

        var whereColumns = [];
        for (var name in where) {
            if (Entity.validName(name) && Entity.validValue(where[name])) {
                whereColumns.push(name + '=?');
                values.push(where[name]);
            }
        }

        var sql = "UPDATE " + table + " SET " + columns.join(', ') + " WHERE " + whereColumns.join(', ')
            + getRaw(where) + getRaw(entity);
        return {
            sql: sql,
            values: values
        };
    }

    var existedTables = {};

    function tableExists(connection, table, cb) {
        table = getTableName(table);
        log.v('tableExists(), existedTables[', table, '] = ', existedTables[table]);
        if (existedTables[table]) {
            return cb(undefined, true);
        }
        var sql = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ? and table_name = ?)";
        connection.query(sql, [dbArgs.database, table], function (err, result) {
            if (err) {
                return commitOrRollback(connection, cb, err, false);
            }
            existedTables[table] = getSingleValue(result);
            log.v('tableExists(), sql = ', sql, ', table = ', table, ', exist = ', existedTables[table]);
            cb(err, existedTables[table]);
        });
    }

    this.tableExists = tableExists;

    function commit(connection, cb, err, result) {
        log.v('commit(), connection = ', !!connection, ', err = ', err, ', result = ', result);
        if (connection) {
            if (connection.transactionStarted) {
                connection.commit(function (err) {
                    if (err) {
                        connection.rollback(function () {
                            log.e("commit#rollback error");
                            throw err;
                        });
                    }
                });
                connection.transactionStarted = false;
            }
            pool.release(connection);
        }
        if (cb) {
            cb(err, result);
        }
    }

    function commitOrRollback(connection, cb, err, result) {
        if (err) {
            rollback(connection, cb, err, result);
        } else {
            commit(connection, cb, err, result);
        }
    }

    this.commitOrRollback = commitOrRollback;

    function rollback(connection, cb, err, result) {
        log.v('rollback(), err = ', err, ', result = ', result);
        if (connection) {
            if (connection.transactionStarted) {
                connection.rollback(null);
                connection.transactionStarted = false;
            }
            pool.release(connection);
        }
        if (cb) {
            cb(err, result);
        }
    }

    function begin(cb) {
        pool.acquire(function (err, connection) {
            if (err) {
                throw err;
            }
            cb(connection);
        });
    }

    this.begin = begin;

    function beginTransaction(procedure) {
        return procedure();
        var connection = pool.getConnection();
        connection.transactionStarted = true;
        connection.beginTransaction(function (err) {
            if (err) {
                log.error('beginTransaction failed.');
                throw err;
            }
            procedure(connection);
        });
    }

    this.beginTransaction = beginTransaction;

    function query(sql, values, cb) {
        begin(function (connection) {
            queryWithConnection(connection, sql, values, cb);
        });
    }

    this.query = query;
    function queryWithConnection(connection, sql, values, cb) {
        log.v('queryWithConnection(), sql = ', sql, ', values = ', values);
        connection.query(sql, values, function (err, result) {
            cb(err, result);
        });
    }

    this.queryWithConnection = queryWithConnection;

    function doInsertWithConnection(connection, table, data, cb) {
        var sql = insertSQL(table, data);
        log.v("doInsertWithConnection(), sql = ", sql);
        connection.query(sql.sql, sql.values, cb);
    }

    function getRaw(data) {
        return data.RAW ? ' ' + data.RAW : '';
    }

    this.insert = function (table, data, cb) {
        if (initedTables[table]) {
            begin(function (connection) {
                insertWithConnection(connection, data, function (err, result) {
                    commitOrRollback(connection, cb, err, result);
                });
            });
            return;
        }

        beginTransaction(function (connection) {
            insertWithConnection(connection, data, function (err, result) {
                commitOrRollback(connection, cb, err, result);
            });
        });
    };

    function insertWithConnection(connection, table, data, cb) {
        log.v('insertWithConnection(), initedTables[', table, '] = ', initedTables[table]);
        if (initedTables[table]) {
            doInsertWithConnection(connection, table, data, cb);
            return;
        }
        createOrAlterTable(connection, table, data, function (err, result) {
            if (err) {
                return commitOrRollback(connection, cb, err, result);
            }
            initedTables[table] = true;
            doInsertWithConnection(connection, table, data, cb);
        });
    }

    this.insertWithConnection = insertWithConnection;

    function selectSQL(table, where) {
        var fields = [];
        var values = [];
        for (var name in where) {
            if (Entity.validName(name) && Entity.validValue(where[name])) {
                fields.push(name + '=?');
                values.push(where[name]);
            }
        }

        var sql = 'SELECT * FROM ' + table + ' WHERE ' + fields.join(" AND ");

        var inArgs = [];
        if (where.IN) {
            where.IN.values.forEach(function (value) {
                inArgs.push('?');
                values.push(value);
            });
            if (inArgs) {
                sql += where.IN.column + ' IN ' + inArgs.join('?');
            }
        }

        sql += getRaw(where);
        return {
            sql: sql,
            values: values
        };
    }

    function inSQL(column, values) {
        values.forEach(function (value) {
            inArgs.push('?');
            inValues.push(value);
        });
        return {sql: column + ' IN ' + inArgs.join('?'), values: inValues};
    }

    this.select = function (table, where, cb) {
        begin(function (connection) {
            selectWithConnection(connection, table, where, function (err, result) {
                commitOrRollback(connection, cb, err, result);
            });
        });
    };

    function selectFirst(table, where, cb) {
        where = appendLimit1(where);
        this.select(table, where, function (err, result) {
            if (err) {
                return cb(err, undefined);
            }
            var entity = resultToObject(result);
            return cb(null, entity);
        });
    }

    this.selectFirst = selectFirst;

    function selectFirstWithConnection(connection, table, where, cb) {
        return;
        where = appendLimit1(where);
        this.selectWithConnection(connection, table, where, function (err, result) {
            if (err) {
                return commitOrRollback(connection, cb, err, undefined);
            }
            var entity = resultToObject(result);
            commitOrRollback(connection, cb, null, entity);
        });
    }

    this.selectFirstWithConnection = selectFirstWithConnection;

    function selectWithConnection(connection, table, where, cb) {
        tableExists(connection, table, function (err, exist) {
            if (exist) {
                table = getTableName(table);
                var sql = selectSQL(table, where);
                log.v("selectWithConnection(), sql = ", sql);
                connection.query(sql.sql, sql.values, cb);
            } else {
                cb(null, []);
            }
        });
    }

    this.selectWithConnection = selectWithConnection;

    function getTableName(table) {
        if (typeof table === 'function') {
            return table.name;
        }
        return table;
    }

    function doUpdate(connection, table, where, entity, cb) {
        var sql = updateSQL(table, where, entity);
        log.v('doUpdate() ', sql);
        connection.query(sql.sql, sql.values, cb);
    }

    this.update = function (where, entity, cb) {
        var table = entity.__proto__.constructor.name;

        if (initedTables[table]) {
            begin(function (connection) {
                updateWithConnection(connection, where, entity, function (err, result) {
                    commitOrRollback(connection, cb, err, result);
                });
            });
            return;
        }

        beginTransaction(function (connection) {
            updateWithConnection(connection, where, entity, function (err, result) {
                commitOrRollback(connection, cb, err, result);
            });
        });
    };

    function updateWithConnection(connection, where, entity, cb) {
        var table = entity.__proto__.constructor.name;
        if (initedTables[table]) {
            doUpdate(connection, table, where, entity, cb);
            return;
        }

        createOrAlterTable(connection, table, entity, function (err, result) {
            if (err) {
                return commitOrRollback(connection, cb, err, result);
            }

            initedTables[table] = true;
            doUpdate(connection, table, where, entity, cb);
        });
    }

    this.updateWithConnection = updateWithConnection;

    function deleteSQL(table, where) {
        var fields = [];
        var values = [];
        for (var name in where) {
            if (Entity.validName(name) && Entity.validValue(where[name])) {
                fields.push(name + '=?');
                values.push(where[name]);
            }
        }
        var sql = 'DELETE FROM ' + table + ' WHERE ' + fields.join(" AND ") + getRaw(where);
        return {sql: sql, values: values};
    }

    this.delete = function (table, where, cb) {
        begin(function (connection) {
            deleteWithConnection(connection, table, where, function (err, result) {
                commitOrRollback(connection, cb, err, result);
            });
        });
    };

    function deleteWithConnection(connection, table, where, cb) {
        table = getTableName(table);
        var sql = deleteSQL(table, where);
        log.v("sql: ", sql);
        connection.query(sql.sql, sql.values, cb);
    }

    this.deleteWithConnection = deleteWithConnection;

    function appendLimit1(where) {
        where = Object.create(where);
        var rawSQL = getRaw(where);
        if (rawSQL.indexOf('limit 1') < 0) {
            where.RAW = rawSQL + ' limit 1';
        }
        return where;
    }

    this.deleteFirst = function (table, where, cb) {
        table = getTableName(table);
        where = appendLimit1(where);
        this.delete(table, where, cb);
    };

    function resultToObject(result) {
        if (!Array.isArray(result) || result.length !== 1) {
            return null;
        }
        return result[0];
    }

    this.resultToObject = resultToObject;

    function getSingleValue(result) {
        var result = resultToObject(result);
        if (result) {
            for (var name in result) {
                return result[name];
            }
        }
        return result;
    }

    this.getSingleValue = getSingleValue;
}


var db = new DB(dbArgs);


module.exports = db;