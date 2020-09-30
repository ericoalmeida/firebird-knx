// Firebird
// -------
'use strict';

exports.__esModule = true;
var _bind = Function.prototype.bind;
var _slice = Array.prototype.slice;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _lodash = require('lodash');

var _util = require('util');

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _knexLibClient = require('knex/lib/client');

var _knexLibClient2 = _interopRequireDefault(_knexLibClient);

var _schemaColumncompiler = require('./schema/columncompiler');

var _schemaColumncompiler2 = _interopRequireDefault(_schemaColumncompiler);

var _queryCompiler = require('./query/compiler');

var _queryCompiler2 = _interopRequireDefault(_queryCompiler);

var _schemaTablecompiler = require('./schema/tablecompiler');

var _schemaTablecompiler2 = _interopRequireDefault(_schemaTablecompiler);

var _transaction = require('./transaction');

var _transaction2 = _interopRequireDefault(_transaction);

var _schemaCompiler = require('./schema/compiler');

var _schemaCompiler2 = _interopRequireDefault(_schemaCompiler);

var _formatter = require('./formatter');

var _formatter2 = _interopRequireDefault(_formatter);

function Client_Firebird(config) {
  _knexLibClient2['default'].call(this, config);
}
_inherits2['default'](Client_Firebird, _knexLibClient2['default']);

Object.assign(Client_Firebird.prototype, {

  dialect: 'firebird',

  driverName: 'node-firebird',

  _driver: function _driver() {
    return require('node-firebird');
  },

  schemaCompiler: function schemaCompiler() {
    return new (_bind.apply(_schemaCompiler2['default'], [null].concat([this], _slice.call(arguments))))();
  },
  QueryCompiler: _queryCompiler2['default'],

  columnCompiler: function columnCompiler() {
    return new (_bind.apply(_schemaColumncompiler2['default'], [null].concat([this], _slice.call(arguments))))();
  },

  tableCompiler: function tableCompiler() {
    return new (_bind.apply(_schemaTablecompiler2['default'], [null].concat([this], _slice.call(arguments))))();
  },
  Transaction: _transaction2['default'],

  wrapIdentifierImpl: function wrapIdentifierImpl(value) {

    if (value === '*') return value;

    if (!/^[A-Za-z0-9_]+$/.test(value)) {
      //Dialect 1 of firebird doesn't support special characters
      //Backquotes only available on dialect 3
      throw new Error('Invalid identifier: "' + value + '"; Dialect 1 doesn\'t support special characters.');
    }
    return value;
  },

  // Get a raw connection from the database, returning a promise with the connection object.
  acquireRawConnection: function acquireRawConnection() {
    var _this = this;

    _assert2['default'](!this._connectionForTransactions);
    return new _bluebird2['default'](function (resolve, reject) {
      _this.driver.attach(_this.connectionSettings, function (error, connection) {
        if (error) return reject(error);
        resolve(connection);
      });
    });
  },

  // Used to explicitly close a connection, called internally by the pool when
  // a connection times out or the pool is shutdown.
  destroyRawConnection: function destroyRawConnection(connection) {
    var close;
    return regeneratorRuntime.async(function destroyRawConnection$(context$1$0) {
      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          close = _util.promisify(function (cb) {
            return connection.detach(cb);
          });
          return context$1$0.abrupt('return', close());

        case 2:
        case 'end':
          return context$1$0.stop();
      }
    }, null, this);
  },

  // Runs the query on the specified connection, providing the bindings and any
  // other necessary prep work.
  _query: function _query(connection, obj) {
    if (!obj || typeof obj === 'string') obj = { sql: obj };
    return new _bluebird2['default'](function (resolver, rejecter) {
      if (!connection) {
        return rejecter(new Error('Error calling ' + callMethod + ' on connection.'));
      };

      var _obj = obj;
      var sql = _obj.sql;

      console.log('SQL', sql);
      if (!sql) return resolver();
      var c = connection._trasaction || connection;
      c.query(sql, obj.bindings, function (error, rows, fields) {
        if (error) return rejecter(error);
        obj.response = [rows, fields];
        resolver(obj);
      });
    });
  },

  _stream: function _stream(connection, sql, stream) {
    throw new Error('_stream not implemented');
    // const client = this;
    // return new Bluebird(function (resolver, rejecter) {
    //   stream.on('error', rejecter);
    //   stream.on('end', resolver);
    //   return client
    //     ._query(connection, sql)
    //     .then((obj) => obj.response)
    //     .then((rows) => rows.forEach((row) => stream.write(row)))
    //     .catch(function (err) {
    //       stream.emit('error', err);
    //     })
    //     .then(function () {
    //       stream.end();
    //     });
    // });
  },

  // Ensures the response is returned in the same format as other clients.
  processResponse: function processResponse(obj, runner) {
    if (!obj) return;
    var response = obj.response;

    if (obj.output) return obj.output.call(runner, response);

    var rows = response[0];
    var fields = response[1];

    this._fixBufferStrings(rows, fields);
    return this._fixBlobCallbacks(rows, fields);
  },

  _fixBufferStrings: function _fixBufferStrings(rows, fields) {
    if (!rows) return rows;
    for (var _iterator = rows, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var row = _ref;

      for (var cell in row) {
        var value = row[cell];
        if (Buffer.isBuffer(value)) {
          for (var _iterator2 = fields, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
            var _ref2;

            if (_isArray2) {
              if (_i2 >= _iterator2.length) break;
              _ref2 = _iterator2[_i2++];
            } else {
              _i2 = _iterator2.next();
              if (_i2.done) break;
              _ref2 = _i2.value;
            }

            var field = _ref2;

            if (field.alias === cell && (field.type === 448 || field.type === 452)) {
              // SQLVarString               
              row[cell] = value.toString('latin1');
              break;
            }
          }
        }
      }
    }
  },
  /**   
  * The Firebird library returns BLOLs with callback functions; Those need to be loaded asynchronously
  * @param {*} rows 
  * @param {*} fields 
  */
  _fixBlobCallbacks: function _fixBlobCallbacks(rows, fields) {
    if (!rows) return rows;

    var blobEntries = [];

    // Seek and verify if there is any BLOB

    var _loop = function () {
      if (_isArray3) {
        if (_i3 >= _iterator3.length) return 'break';
        _ref3 = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) return 'break';
        _ref3 = _i3.value;
      }

      var row = _ref3;

      var _loop2 = function (cell) {
        var value = row[cell];
        // ATSTODO: Está presumindo que o blob é texto; recomenda-se diferenciar texto de binário. Talvez o "fields" ajude?
        // Is it a callback BLOB?
        if (value instanceof Function) {
          blobEntries.push(new Promise(function (resolve, reject) {
            value(function (err, name, stream) {
              if (err) {
                reject(err);
                return;
              }

              // ATSTODO: Ver como fazer quando o string não tiver o "setEncoding()"
              if (!stream['setEncoding']) {
                stream['setEncoding'] = function () {
                  return undefined;
                };
              }

              // ATSTODO: Não está convertendo os cadacteres acentuados corretamente, mesmo informando a codificação
              resolve(readableToString(stream, 'latin1').then(function (blobString) {
                row[cell] = blobString;
              }));
            });
          }));
        }
      };

      for (var cell in row) {
        _loop2(cell);
      }
    };

    for (var _iterator3 = rows, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      var _ref3;

      var _ret = _loop();

      if (_ret === 'break') break;
    }
    // Returns a Promise that wait BLOBs be loaded and retuns it
    return Promise.all(blobEntries).then(function () {
      return rows;
    });
  },

  poolDefaults: function poolDefaults() {
    return _lodash.defaults({ min: 1, max: 1 }, _knexLibClient2['default'].prototype.poolDefaults.call(this));
  },

  ping: function ping(resource, callback) {
    resource.query('select 1 from RDB$DATABASE', callback);
  },
  // ddl(compiler, pragma, connection) {
  //   return new Firebird_DDL(this, compiler, pragma, connection);
  // },

  Firebird_Formatter: _formatter2['default']

});

Client_Firebird.dialect = 'firebird';

exports['default'] = Client_Firebird;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QkFBTSxDQUFDLGFBQWEsQ0FBQyxHQUFHO3lCQUFNLFNBQVM7aUJBQUEsQ0FBQztlQUN6Qzs7O0FBR0QscUJBQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsVUFBVSxFQUFJO0FBQzVELG1CQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDO2VBQ3hCLENBQUMsQ0FBQyxDQUFDO2FBQ0wsQ0FBQyxDQUFDO1dBQ0osQ0FBQyxDQUFDLENBQUM7U0FDTDs7O0FBdkJILFdBQUssSUFBTSxJQUFJLElBQUksR0FBRyxFQUFFO2VBQWIsSUFBSTtPQXdCZDs7O0FBekJILDBCQUFrQixJQUFJLHlIQUFFOzs7Ozs7S0EwQnZCOztBQUVELFdBQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUM7YUFBTSxJQUFJO0tBQUEsQ0FBQyxDQUFDO0dBQ2xEOztBQUVELGNBQVksRUFBQSx3QkFBRztBQUNiLFdBQU8saUJBQ0wsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFDbEIsMkJBQU8sU0FBUyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQ3pDLENBQUM7R0FDSDs7QUFFRCxNQUFJLEVBQUEsY0FBQyxRQUFRLEVBQUUsUUFBUSxFQUFFO0FBQ3ZCLFlBQVEsQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsUUFBUSxDQUFDLENBQUM7R0FDeEQ7Ozs7O0FBT0Qsb0JBQWtCLHdCQUFBOztDQUVuQixDQUFDLENBQUM7O0FBRUgsZUFBZSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUM7O3FCQUd0QixlQUFlIiwiZmlsZSI6ImluZGV4LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gRmlyZWJpcmRcbi8vIC0tLS0tLS1cbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5cbmltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XG5pbXBvcnQgeyBpc1VuZGVmaW5lZCwgbWFwLCBkZWZhdWx0cyB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tICd1dGlsJztcbmltcG9ydCBhc3NlcnQgZnJvbSAnYXNzZXJ0JztcbmltcG9ydCBDbGllbnQgZnJvbSAna25leC9saWIvY2xpZW50JztcblxuXG5pbXBvcnQgQ29sdW1uQ29tcGlsZXIgZnJvbSAnLi9zY2hlbWEvY29sdW1uY29tcGlsZXInO1xuaW1wb3J0IFF1ZXJ5Q29tcGlsZXIgZnJvbSAnLi9xdWVyeS9jb21waWxlcic7XG5pbXBvcnQgVGFibGVDb21waWxlciBmcm9tICcuL3NjaGVtYS90YWJsZWNvbXBpbGVyJztcbmltcG9ydCBUcmFuc2FjdGlvbiBmcm9tICcuL3RyYW5zYWN0aW9uJztcbmltcG9ydCBTY2hlbWFDb21waWxlciBmcm9tICcuL3NjaGVtYS9jb21waWxlcic7XG5pbXBvcnQgRmlyZWJpcmRfRm9ybWF0dGVyIGZyb20gJy4vZm9ybWF0dGVyJztcblxuXG5cblxuZnVuY3Rpb24gQ2xpZW50X0ZpcmViaXJkKGNvbmZpZykge1xuICBDbGllbnQuY2FsbCh0aGlzLCBjb25maWcpO1xufVxuaW5oZXJpdHMoQ2xpZW50X0ZpcmViaXJkLCBDbGllbnQpO1xuXG5PYmplY3QuYXNzaWduKENsaWVudF9GaXJlYmlyZC5wcm90b3R5cGUsIHtcblxuICBkaWFsZWN0OiAnZmlyZWJpcmQnLFxuXG4gIGRyaXZlck5hbWU6ICdub2RlLWZpcmViaXJkJyxcblxuICBfZHJpdmVyKCkge1xuICAgIHJldHVybiByZXF1aXJlKCdub2RlLWZpcmViaXJkJyk7XG4gIH0sXG5cbiAgc2NoZW1hQ29tcGlsZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBTY2hlbWFDb21waWxlcih0aGlzLCAuLi5hcmd1bWVudHMpO1xuICB9LFxuICBRdWVyeUNvbXBpbGVyLFxuXG4gIGNvbHVtbkNvbXBpbGVyKCkge1xuICAgIHJldHVybiBuZXcgQ29sdW1uQ29tcGlsZXIodGhpcywgLi4uYXJndW1lbnRzKTtcbiAgfSxcblxuICB0YWJsZUNvbXBpbGVyKCkge1xuICAgIHJldHVybiBuZXcgVGFibGVDb21waWxlcih0aGlzLCAuLi5hcmd1bWVudHMpO1xuICB9LFxuICBUcmFuc2FjdGlvbixcblxuICB3cmFwSWRlbnRpZmllckltcGwodmFsdWUpIHtcbiAgICBcbiAgICBpZiAodmFsdWUgPT09ICcqJykgcmV0dXJuIHZhbHVlOyAgIFxuXG5cbiAgICBpZiAoIS9eW0EtWmEtejAtOV9dKyQvLnRlc3QodmFsdWUpKSB7XG4gICAgICAvL0RpYWxlY3QgMSBvZiBmaXJlYmlyZCBkb2Vzbid0IHN1cHBvcnQgc3BlY2lhbCBjaGFyYWN0ZXJzXG4gICAgICAvL0JhY2txdW90ZXMgb25seSBhdmFpbGFibGUgb24gZGlhbGVjdCAzXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgaWRlbnRpZmllcjogXCIke3ZhbHVlfVwiOyBEaWFsZWN0IDEgZG9lc24ndCBzdXBwb3J0IHNwZWNpYWwgY2hhcmFjdGVycy5gKTtcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9LFxuXG5cbiAgLy8gR2V0IGEgcmF3IGNvbm5lY3Rpb24gZnJvbSB0aGUgZGF0YWJhc2UsIHJldHVybmluZyBhIHByb21pc2Ugd2l0aCB0aGUgY29ubmVjdGlvbiBvYmplY3QuXG4gIGFjcXVpcmVSYXdDb25uZWN0aW9uKCkge1xuICAgIGFzc2VydCghdGhpcy5fY29ubmVjdGlvbkZvclRyYW5zYWN0aW9ucyk7XG4gICAgcmV0dXJuIG5ldyBCbHVlYmlyZCgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICB0aGlzLmRyaXZlci5hdHRhY2godGhpcy5jb25uZWN0aW9uU2V0dGluZ3MsIChlcnJvciwgY29ubmVjdGlvbikgPT4ge1xuICAgICAgICBpZiAoZXJyb3IpIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgICByZXNvbHZlKGNvbm5lY3Rpb24pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gVXNlZCB0byBleHBsaWNpdGx5IGNsb3NlIGEgY29ubmVjdGlvbiwgY2FsbGVkIGludGVybmFsbHkgYnkgdGhlIHBvb2wgd2hlblxuICAvLyBhIGNvbm5lY3Rpb24gdGltZXMgb3V0IG9yIHRoZSBwb29sIGlzIHNodXRkb3duLlxuICBhc3luYyBkZXN0cm95UmF3Q29ubmVjdGlvbihjb25uZWN0aW9uKSB7XG4gICAgY29uc3QgY2xvc2UgPSBwcm9taXNpZnkoKGNiKSA9PiBjb25uZWN0aW9uLmRldGFjaChjYikpO1xuICAgIHJldHVybiBjbG9zZSgpO1xuICB9LFxuXG4gIC8vIFJ1bnMgdGhlIHF1ZXJ5IG9uIHRoZSBzcGVjaWZpZWQgY29ubmVjdGlvbiwgcHJvdmlkaW5nIHRoZSBiaW5kaW5ncyBhbmQgYW55XG4gIC8vIG90aGVyIG5lY2Vzc2FyeSBwcmVwIHdvcmsuXG4gIF9xdWVyeShjb25uZWN0aW9uLCBvYmopIHtcbiAgICBpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqID09PSAnc3RyaW5nJykgb2JqID0geyBzcWw6IG9iaiB9O1xuICAgIHJldHVybiBuZXcgQmx1ZWJpcmQoZnVuY3Rpb24gKHJlc29sdmVyLCByZWplY3Rlcikge1xuICAgICAgaWYgKCFjb25uZWN0aW9uKSB7XG4gICAgICAgIHJldHVybiByZWplY3RlcihcbiAgICAgICAgICBuZXcgRXJyb3IoYEVycm9yIGNhbGxpbmcgJHtjYWxsTWV0aG9kfSBvbiBjb25uZWN0aW9uLmApXG4gICAgICAgICk7XG4gICAgICB9O1xuXG4gICAgICBsZXQgeyBzcWwgfSA9IG9iajtcbiAgICAgIGNvbnNvbGUubG9nKCdTUUwnLCBzcWwpO1xuICAgICAgaWYgKCFzcWwpIHJldHVybiByZXNvbHZlcigpO1xuICAgICAgY29uc3QgYyA9IGNvbm5lY3Rpb24uX3RyYXNhY3Rpb24gfHwgY29ubmVjdGlvbjtcbiAgICAgIGMucXVlcnkoc3FsLCBvYmouYmluZGluZ3MsIChlcnJvciwgcm93cywgZmllbGRzKSA9PiB7XG4gICAgICAgIGlmIChlcnJvcikgcmV0dXJuIHJlamVjdGVyKGVycm9yKTtcbiAgICAgICAgb2JqLnJlc3BvbnNlID0gW3Jvd3MsIGZpZWxkc107XG4gICAgICAgIHJlc29sdmVyKG9iaik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICBfc3RyZWFtKGNvbm5lY3Rpb24sIHNxbCwgc3RyZWFtKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdfc3RyZWFtIG5vdCBpbXBsZW1lbnRlZCcpO1xuICAgIC8vIGNvbnN0IGNsaWVudCA9IHRoaXM7XG4gICAgLy8gcmV0dXJuIG5ldyBCbHVlYmlyZChmdW5jdGlvbiAocmVzb2x2ZXIsIHJlamVjdGVyKSB7XG4gICAgLy8gICBzdHJlYW0ub24oJ2Vycm9yJywgcmVqZWN0ZXIpO1xuICAgIC8vICAgc3RyZWFtLm9uKCdlbmQnLCByZXNvbHZlcik7XG4gICAgLy8gICByZXR1cm4gY2xpZW50XG4gICAgLy8gICAgIC5fcXVlcnkoY29ubmVjdGlvbiwgc3FsKVxuICAgIC8vICAgICAudGhlbigob2JqKSA9PiBvYmoucmVzcG9uc2UpXG4gICAgLy8gICAgIC50aGVuKChyb3dzKSA9PiByb3dzLmZvckVhY2goKHJvdykgPT4gc3RyZWFtLndyaXRlKHJvdykpKVxuICAgIC8vICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgIC8vICAgICAgIHN0cmVhbS5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgLy8gICAgIH0pXG4gICAgLy8gICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAvLyAgICAgICBzdHJlYW0uZW5kKCk7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vIH0pO1xuICB9LFxuXG4gIC8vIEVuc3VyZXMgdGhlIHJlc3BvbnNlIGlzIHJldHVybmVkIGluIHRoZSBzYW1lIGZvcm1hdCBhcyBvdGhlciBjbGllbnRzLlxuICBwcm9jZXNzUmVzcG9uc2Uob2JqLCBydW5uZXIpIHtcbiAgICBpZiAoIW9iaikgcmV0dXJuO1xuICAgIGxldCB7IHJlc3BvbnNlIH0gPSBvYmo7XG4gICAgaWYgKG9iai5vdXRwdXQpIHJldHVybiBvYmoub3V0cHV0LmNhbGwocnVubmVyLCByZXNwb25zZSk7XG5cbiAgICBjb25zdCBbcm93cywgZmllbGRzXSA9IHJlc3BvbnNlO1xuICAgIHRoaXMuX2ZpeEJ1ZmZlclN0cmluZ3Mocm93cywgZmllbGRzKTtcbiAgICByZXR1cm4gdGhpcy5fZml4QmxvYkNhbGxiYWNrcyhyb3dzLCBmaWVsZHMpO1xuICB9LFxuXG4gIF9maXhCdWZmZXJTdHJpbmdzKHJvd3MsIGZpZWxkcykge1xuICAgIGlmICghcm93cykgcmV0dXJuIHJvd3M7XG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgZm9yIChjb25zdCBjZWxsIGluIHJvdykge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHJvd1tjZWxsXTtcbiAgICAgICAgaWYgKEJ1ZmZlci5pc0J1ZmZlcih2YWx1ZSkpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGZpZWxkIG9mIGZpZWxkcykge1xuICAgICAgICAgICAgaWYgKGZpZWxkLmFsaWFzID09PSBjZWxsICYmXG4gICAgICAgICAgICAgIChmaWVsZC50eXBlID09PSA0NDggfHwgZmllbGQudHlwZSA9PT0gNDUyKSkgeyAvLyBTUUxWYXJTdHJpbmcgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIHJvd1tjZWxsXSA9IHZhbHVlLnRvU3RyaW5nKCdsYXRpbjEnKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICAvKiogICBcbiAgKiBUaGUgRmlyZWJpcmQgbGlicmFyeSByZXR1cm5zIEJMT0xzIHdpdGggY2FsbGJhY2sgZnVuY3Rpb25zOyBUaG9zZSBuZWVkIHRvIGJlIGxvYWRlZCBhc3luY2hyb25vdXNseVxuICAqIEBwYXJhbSB7Kn0gcm93cyBcbiAgKiBAcGFyYW0geyp9IGZpZWxkcyBcbiAgKi9cbiAgX2ZpeEJsb2JDYWxsYmFja3Mocm93cywgZmllbGRzKSB7ICAgIFxuICAgIGlmICghcm93cykgcmV0dXJuIHJvd3M7XG5cbiAgICBjb25zdCBibG9iRW50cmllcyA9IFtdO1xuXG4gICAgLy8gU2VlayBhbmQgdmVyaWZ5IGlmIHRoZXJlIGlzIGFueSBCTE9CXG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgZm9yIChjb25zdCBjZWxsIGluIHJvdykge1xuICAgICAgICBjb25zdCB2YWx1ZSA9IHJvd1tjZWxsXTsgICAgICAgXG4gICAgICAgIC8vIEFUU1RPRE86IEVzdMOhIHByZXN1bWluZG8gcXVlIG8gYmxvYiDDqSB0ZXh0bzsgcmVjb21lbmRhLXNlIGRpZmVyZW5jaWFyIHRleHRvIGRlIGJpbsOhcmlvLiBUYWx2ZXogbyBcImZpZWxkc1wiIGFqdWRlP1xuICAgICAgICAvLyBJcyBpdCBhIGNhbGxiYWNrIEJMT0I/XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgICAgYmxvYkVudHJpZXMucHVzaChuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB2YWx1ZSgoZXJyLCBuYW1lLCBzdHJlYW0pID0+IHtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIC8vIEFUU1RPRE86IFZlciBjb21vIGZhemVyIHF1YW5kbyBvIHN0cmluZyBuw6NvIHRpdmVyIG8gXCJzZXRFbmNvZGluZygpXCJcbiAgICAgICAgICAgICAgaWYgKCFzdHJlYW1bJ3NldEVuY29kaW5nJ10pIHtcbiAgICAgICAgICAgICAgICBzdHJlYW1bJ3NldEVuY29kaW5nJ10gPSAoKSA9PiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAvLyBBVFNUT0RPOiBOw6NvIGVzdMOhIGNvbnZlcnRlbmRvIG9zIGNhZGFjdGVyZXMgYWNlbnR1YWRvcyBjb3JyZXRhbWVudGUsIG1lc21vIGluZm9ybWFuZG8gYSBjb2RpZmljYcOnw6NvXG4gICAgICAgICAgICAgIHJlc29sdmUocmVhZGFibGVUb1N0cmluZyhzdHJlYW0sICdsYXRpbjEnKS50aGVuKGJsb2JTdHJpbmcgPT4ge1xuICAgICAgICAgICAgICAgIHJvd1tjZWxsXSA9IGJsb2JTdHJpbmc7XG4gICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICAvLyBSZXR1cm5zIGEgUHJvbWlzZSB0aGF0IHdhaXQgQkxPQnMgYmUgbG9hZGVkIGFuZCByZXR1bnMgaXRcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoYmxvYkVudHJpZXMpLnRoZW4oKCkgPT4gcm93cyk7XG4gIH0sXG5cbiAgcG9vbERlZmF1bHRzKCkge1xuICAgIHJldHVybiBkZWZhdWx0cyhcbiAgICAgIHsgbWluOiAxLCBtYXg6IDEgfSxcbiAgICAgIENsaWVudC5wcm90b3R5cGUucG9vbERlZmF1bHRzLmNhbGwodGhpcylcbiAgICApO1xuICB9LFxuXG4gIHBpbmcocmVzb3VyY2UsIGNhbGxiYWNrKSB7XG4gICAgcmVzb3VyY2UucXVlcnkoJ3NlbGVjdCAxIGZyb20gUkRCJERBVEFCQVNFJywgY2FsbGJhY2spO1xuICB9LFxuICAvLyBkZGwoY29tcGlsZXIsIHByYWdtYSwgY29ubmVjdGlvbikge1xuICAvLyAgIHJldHVybiBuZXcgRmlyZWJpcmRfRERMKHRoaXMsIGNvbXBpbGVyLCBwcmFnbWEsIGNvbm5lY3Rpb24pO1xuICAvLyB9LFxuXG5cbiAgXG4gIEZpcmViaXJkX0Zvcm1hdHRlclxuICBcbn0pO1xuXG5DbGllbnRfRmlyZWJpcmQuZGlhbGVjdCA9ICdmaXJlYmlyZCc7XG5cblxuZXhwb3J0IGRlZmF1bHQgQ2xpZW50X0ZpcmViaXJkO1xuIl19