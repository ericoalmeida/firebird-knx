// Firebird_DDL
//
//
// columns and changing datatypes.
// -------

'use strict';

var _lodash = require('lodash');

Firebird_DDL = function (client, tableCompiler, pragma, connection) {
  undefined.client = client;
  undefined.tableCompiler = tableCompiler;
  undefined.pragma = pragma;
  undefined.tableNameRaw = undefined.tableCompiler.tableNameRaw;
  undefined.alteredName = _lodash.uniqueId('_knex_temp_alter');
  undefined.connection = connection;
  undefined.formatter = client && client.config && client.config.wrapIdentifier ? client.config.wrapIdentifier : function (value) {
    return value;
  };
};

Object.assign(Firebird_DDL.prototype, {
  tableName: function tableName() {
    return this.formatter(this.tableNameRaw, function (value) {
      return value;
    });
  },

  getColumn: function getColumn(column) {
    var currentCol;
    return regeneratorRuntime.async(function getColumn$(context$1$0) {
      var _this = this;

      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          currentCol = _lodash.find(this.pragma, function (col) {
            return _this.client.wrapIdentifier(col.name).toLowerCase() === _this.client.wrapIdentifier(column).toLowerCase();
          });

          if (currentCol) {
            context$1$0.next = 3;
            break;
          }

          throw new Error('The column ' + column + ' is not in the ' + this.tableName() + ' table');

        case 3:
          return context$1$0.abrupt('return', currentCol);

        case 4:
        case 'end':
          return context$1$0.stop();
      }
    }, null, this);
  },

  getTableSql: function getTableSql() {
    var _this2 = this;

    this.trx.disableProcessing();
    return this.trx.raw('SELECT name, sql FROM sqlite_master WHERE type="table" AND name="' + this.tableName() + '"').then(function (result) {
      _this2.trx.enableProcessing();
      return result;
    });
  },

  renameTable: function renameTable() {
    return regeneratorRuntime.async(function renameTable$(context$1$0) {
      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          return context$1$0.abrupt('return', this.trx.raw('ALTER TABLE "' + this.tableName() + '" RENAME TO "' + this.alteredName + '"'));

        case 1:
        case 'end':
          return context$1$0.stop();
      }
    }, null, this);
  },

  dropOriginal: function dropOriginal() {
    return this.trx.raw('DROP TABLE "' + this.tableName() + '"');
  },

  dropTempTable: function dropTempTable() {
    return this.trx.raw('DROP TABLE "' + this.alteredName + '"');
  },

  copyData: function copyData() {
    var _this3 = this;

    return this.trx.raw('SELECT * FROM "' + this.tableName() + '"').then(function (result) {
      return _this3.insertChunked(20, _this3.alteredName, _lodash.identity, result);
    });
  },

  reinsertData: function reinsertData(iterator) {
    var _this4 = this;

    return this.trx.raw('SELECT * FROM "' + this.alteredName + '"').then(function (result) {
      return _this4.insertChunked(20, _this4.tableName(), iterator, result);
    });
  },

  insertChunked: function insertChunked(chunkSize, target, iterator, result) {
    var chunked, _iterator, _isArray, _i, _ref, batch;

    return regeneratorRuntime.async(function insertChunked$(context$1$0) {
      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          iterator = iterator || _lodash.identity;
          chunked = _lodash.chunk(result, chunkSize);
          _iterator = chunked, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();

        case 3:
          if (!_isArray) {
            context$1$0.next = 9;
            break;
          }

          if (!(_i >= _iterator.length)) {
            context$1$0.next = 6;
            break;
          }

          return context$1$0.abrupt('break', 18);

        case 6:
          _ref = _iterator[_i++];
          context$1$0.next = 13;
          break;

        case 9:
          _i = _iterator.next();

          if (!_i.done) {
            context$1$0.next = 12;
            break;
          }

          return context$1$0.abrupt('break', 18);

        case 12:
          _ref = _i.value;

        case 13:
          batch = _ref;
          context$1$0.next = 16;
          return regeneratorRuntime.awrap(this.trx.queryBuilder().table(target).insert(_lodash.map(batch, iterator)));

        case 16:
          context$1$0.next = 3;
          break;

        case 18:
        case 'end':
          return context$1$0.stop();
      }
    }, null, this);
  },

  createTempTable: function createTempTable(createTable) {
    return this.trx.raw(createTable.sql.replace(this.tableName(), this.alteredName));
  },

  _doReplace: function _doReplace(sql, from, to) {
    var oneLineSql = sql.replace(/\s+/g, ' ');
    var matched = oneLineSql.match(/^CREATE TABLE\s+(\S+)\s*\((.*)\)/);

    var tableName = matched[1];
    var defs = matched[2];

    if (!defs) {
      throw new Error('No column definitions in this statement!');
    }

    var parens = 0,
        args = [],
        ptr = 0;
    var i = 0;
    var x = defs.length;
    for (i = 0; i < x; i++) {
      switch (defs[i]) {
        case '(':
          parens++;
          break;
        case ')':
          parens--;
          break;
        case ',':
          if (parens === 0) {
            args.push(defs.slice(ptr, i));
            ptr = i + 1;
          }
          break;
        case ' ':
          if (ptr === i) {
            ptr = i + 1;
          }
          break;
      }
    }
    args.push(defs.slice(ptr, i));

    var fromIdentifier = from.replace(/[`"'[\]]/g, '');

    args = args.map(function (item) {
      var split = item.trim().split(' ');

      var fromMatchCandidates = [new RegExp('`' + fromIdentifier + '`', 'i'), new RegExp('"' + fromIdentifier + '"', 'i'), new RegExp('\'' + fromIdentifier + '\'', 'i'), new RegExp('\\[' + fromIdentifier + '\\]', 'i')];
      if (fromIdentifier.match(/^\S+$/)) {
        fromMatchCandidates.push(new RegExp('\\b' + fromIdentifier + '\\b', 'i'));
      }

      var doesMatchFromIdentifier = function doesMatchFromIdentifier(target) {
        return _lodash.some(fromMatchCandidates, function (c) {
          return target.match(c);
        });
      };

      var replaceFromIdentifier = function replaceFromIdentifier(target) {
        return fromMatchCandidates.reduce(function (result, candidate) {
          return result.replace(candidate, to);
        }, target);
      };

      if (doesMatchFromIdentifier(split[0])) {
        // column definition
        if (to) {
          split[0] = to;
          return split.join(' ');
        }
        return ''; // for deletions
      }

      // skip constraint name
      var idx = /constraint/i.test(split[0]) ? 2 : 0;

      // primary key and unique constraints have one or more
      // columns from this table listed between (); replace
      // one if it matches
      if (/primary|unique/i.test(split[idx])) {
        var ret = item.replace(/\(.*\)/, replaceFromIdentifier);
        // If any member columns are dropped then uniqueness/pk constraint
        // can not be retained
        if (ret !== item && _lodash.isEmpty(to)) return '';
        return ret;
      }

      // foreign keys have one or more columns from this table
      // listed between (); replace one if it matches
      // foreign keys also have a 'references' clause
      // which may reference THIS table; if it does, replace
      // column references in that too!
      if (/foreign/.test(split[idx])) {
        split = item.split(/ references /i);
        // the quoted column names save us from having to do anything
        // other than a straight replace here
        var replacedKeySpec = replaceFromIdentifier(split[0]);

        if (split[0] !== replacedKeySpec) {
          // If we are removing one or more columns of a foreign
          // key, then we should not retain the key at all
          if (_lodash.isEmpty(to)) return '';else split[0] = replacedKeySpec;
        }

        if (split[1].slice(0, tableName.length) === tableName) {
          // self-referential foreign key
          var replacedKeyTargetSpec = split[1].replace(/\(.*\)/, replaceFromIdentifier);
          if (split[1] !== replacedKeyTargetSpec) {
            // If we are removing one or more columns of a foreign
            // key, then we should not retain the key at all
            if (_lodash.isEmpty(to)) return '';else split[1] = replacedKeyTargetSpec;
          }
        }
        return split.join(' references ');
      }

      return item;
    });

    args = args.filter(_lodash.negate(_lodash.isEmpty));

    if (args.length === 0) {
      throw new Error('Unable to drop last column from table');
    }

    return oneLineSql.replace(/\(.*\)/, function () {
      return '(' + args.join(', ') + ')';
    }).replace(/,\s*([,)])/, '$1');
  },

  // Boy, this is quite a method.
  renameColumn: function renameColumn(from, to) {
    return regeneratorRuntime.async(function renameColumn$(context$1$0) {
      var _this5 = this;

      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          return context$1$0.abrupt('return', this.client.transaction(function callee$1$0(trx) {
            var column, sql, a, b, createTable, newSql, _invert, mappedFrom, mappedTo;

            return regeneratorRuntime.async(function callee$1$0$(context$2$0) {
              while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                  this.trx = trx;
                  context$2$0.next = 3;
                  return regeneratorRuntime.awrap(this.getColumn(from));

                case 3:
                  column = context$2$0.sent;
                  context$2$0.next = 6;
                  return regeneratorRuntime.awrap(this.getTableSql(column));

                case 6:
                  sql = context$2$0.sent;
                  a = this.client.wrapIdentifier(from);
                  b = this.client.wrapIdentifier(to);
                  createTable = sql[0];
                  newSql = this._doReplace(createTable.sql, a, b);

                  if (!(sql === newSql)) {
                    context$2$0.next = 13;
                    break;
                  }

                  throw new Error('Unable to find the column to change');

                case 13:
                  _invert = _lodash.invert(this.client.postProcessResponse(_lodash.invert({
                    from: from,
                    to: to
                  })));
                  mappedFrom = _invert.from;
                  mappedTo = _invert.to;
                  return context$2$0.abrupt('return', this.reinsertMapped(createTable, newSql, function (row) {
                    row[mappedTo] = row[mappedFrom];
                    return _lodash.omit(row, mappedFrom);
                  }));

                case 17:
                case 'end':
                  return context$2$0.stop();
              }
            }, null, _this5);
          }, { connection: this.connection }));

        case 1:
        case 'end':
          return context$1$0.stop();
      }
    }, null, this);
  },

  dropColumn: function dropColumn(columns) {
    return regeneratorRuntime.async(function dropColumn$(context$1$0) {
      var _this6 = this;

      while (1) switch (context$1$0.prev = context$1$0.next) {
        case 0:
          return context$1$0.abrupt('return', this.client.transaction(function (trx) {
            _this6.trx = trx;
            return Promise.all(columns.map(function (column) {
              return _this6.getColumn(column);
            })).then(function () {
              return _this6.getTableSql();
            }).then(function (sql) {
              var createTable = sql[0];
              var newSql = createTable.sql;
              columns.forEach(function (column) {
                var a = _this6.client.wrapIdentifier(column);
                newSql = _this6._doReplace(newSql, a, '');
              });
              if (sql === newSql) {
                throw new Error('Unable to find the column to change');
              }
              var mappedColumns = Object.keys(_this6.client.postProcessResponse(_lodash.fromPairs(columns.map(function (column) {
                return [column, column];
              }))));
              return _this6.reinsertMapped(createTable, newSql, function (row) {
                return _lodash.omit.apply(undefined, [row].concat(mappedColumns));
              });
            });
          }, { connection: this.connection }));

        case 1:
        case 'end':
          return context$1$0.stop();
      }
    }, null, this);
  },

  reinsertMapped: function reinsertMapped(createTable, newSql, mapRow) {
    var _this7 = this;

    return Promise.resolve().then(function () {
      return _this7.createTempTable(createTable);
    }).then(function () {
      return _this7.copyData();
    }).then(function () {
      return _this7.dropOriginal();
    }).then(function () {
      return _this7.trx.raw(newSql);
    }).then(function () {
      return _this7.reinsertData(mapRow);
    }).then(function () {
      return _this7.dropTempTable();
    });
  }
});

module.exports = SQLite3_DDL;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QUMsQ0FDM0IsSUFBSSxDQUFDO2FBQU0sT0FBSyxZQUFZLEVBQUU7S0FBQSxDQUFDLENBQy9CLElBQUksQ0FBQzthQUFNLE9BQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7S0FBQSxDQUFDLENBQ2hDLElBQUksQ0FBQzthQUFNLE9BQUssWUFBWSxDQUFDLE1BQU0sQ0FBQztLQUFBLENBQUMsQ0FDckMsSUFBSSxDQUFDO2FBQU0sT0FBSyxhQUFhLEVBQUU7S0FBQSxDQUFDLENBQUM7R0FDckM7Q0FDRixDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUMiLCJmaWxlIjoiZGRsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gRmlyZWJpcmRfRERMXG4vL1xuLy8gXG4vLyBjb2x1bW5zIGFuZCBjaGFuZ2luZyBkYXRhdHlwZXMuXG4vLyAtLS0tLS0tXG5cbmltcG9ydCB7ICBcbiAgdW5pcXVlSWQsXG4gIGZpbmQsXG4gIGlkZW50aXR5LFxuICBtYXAsXG4gIG9taXQsXG4gIGludmVydCxcbiAgZnJvbVBhaXJzLFxuICBzb21lLFxuICBuZWdhdGUsXG4gIGlzRW1wdHksXG4gIGNodW5rLFxufSBmcm9tICdsb2Rhc2gnO1xuXG5cbkZpcmViaXJkX0RETCA9IChjbGllbnQsIHRhYmxlQ29tcGlsZXIsIHByYWdtYSwgY29ubmVjdGlvbikgPT4ge1xuICB0aGlzLmNsaWVudCA9IGNsaWVudDtcbiAgdGhpcy50YWJsZUNvbXBpbGVyID0gdGFibGVDb21waWxlcjtcbiAgdGhpcy5wcmFnbWEgPSBwcmFnbWE7XG4gIHRoaXMudGFibGVOYW1lUmF3ID0gdGhpcy50YWJsZUNvbXBpbGVyLnRhYmxlTmFtZVJhdztcbiAgdGhpcy5hbHRlcmVkTmFtZSA9IHVuaXF1ZUlkKCdfa25leF90ZW1wX2FsdGVyJyk7XG4gIHRoaXMuY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gIHRoaXMuZm9ybWF0dGVyID1cbiAgICBjbGllbnQgJiYgY2xpZW50LmNvbmZpZyAmJiBjbGllbnQuY29uZmlnLndyYXBJZGVudGlmaWVyXG4gICAgICA/IGNsaWVudC5jb25maWcud3JhcElkZW50aWZpZXJcbiAgICAgIDogKHZhbHVlKSA9PiB2YWx1ZTtcbn1cblxuT2JqZWN0LmFzc2lnbihGaXJlYmlyZF9EREwucHJvdG90eXBlLCB7XG4gIHRhYmxlTmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5mb3JtYXR0ZXIodGhpcy50YWJsZU5hbWVSYXcsICh2YWx1ZSkgPT4gdmFsdWUpO1xuICB9LFxuXG4gIGdldENvbHVtbjogYXN5bmMgZnVuY3Rpb24oY29sdW1uKSB7XG4gICAgY29uc3QgY3VycmVudENvbCA9IGZpbmQodGhpcy5wcmFnbWEsIChjb2wpID0+IHsgICAgICBcbiAgICAgIHJldHVybiAoXG4gICAgICAgIHRoaXMuY2xpZW50LndyYXBJZGVudGlmaWVyKGNvbC5uYW1lKS50b0xvd2VyQ2FzZSgpID09PVxuICAgICAgICB0aGlzLmNsaWVudC53cmFwSWRlbnRpZmllcihjb2x1bW4pLnRvTG93ZXJDYXNlKClcbiAgICAgICk7XG4gICAgfSk7XG4gICAgaWYgKCFjdXJyZW50Q29sKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBgVGhlIGNvbHVtbiAke2NvbHVtbn0gaXMgbm90IGluIHRoZSAke3RoaXMudGFibGVOYW1lKCl9IHRhYmxlYFxuICAgICAgKTtcbiAgICByZXR1cm4gY3VycmVudENvbDtcbiAgfSxcblxuICBnZXRUYWJsZVNxbCgpIHtcbiAgICB0aGlzLnRyeC5kaXNhYmxlUHJvY2Vzc2luZygpO1xuICAgIHJldHVybiB0aGlzLnRyeFxuICAgICAgLnJhdyhcbiAgICAgICAgYFNFTEVDVCBuYW1lLCBzcWwgRlJPTSBzcWxpdGVfbWFzdGVyIFdIRVJFIHR5cGU9XCJ0YWJsZVwiIEFORCBuYW1lPVwiJHt0aGlzLnRhYmxlTmFtZSgpfVwiYFxuICAgICAgKVxuICAgICAgLnRoZW4oKHJlc3VsdCkgPT4ge1xuICAgICAgICB0aGlzLnRyeC5lbmFibGVQcm9jZXNzaW5nKCk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9KTtcbiAgfSxcblxuICByZW5hbWVUYWJsZTogYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMudHJ4LnJhdyhcbiAgICAgIGBBTFRFUiBUQUJMRSBcIiR7dGhpcy50YWJsZU5hbWUoKX1cIiBSRU5BTUUgVE8gXCIke3RoaXMuYWx0ZXJlZE5hbWV9XCJgXG4gICAgKTtcbiAgfSxcblxuICBkcm9wT3JpZ2luYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJ4LnJhdyhgRFJPUCBUQUJMRSBcIiR7dGhpcy50YWJsZU5hbWUoKX1cImApO1xuICB9LFxuXG4gIGRyb3BUZW1wVGFibGUoKSB7XG4gICAgcmV0dXJuIHRoaXMudHJ4LnJhdyhgRFJPUCBUQUJMRSBcIiR7dGhpcy5hbHRlcmVkTmFtZX1cImApO1xuICB9LFxuXG4gIGNvcHlEYXRhKCkge1xuICAgIHJldHVybiB0aGlzLnRyeFxuICAgICAgLnJhdyhgU0VMRUNUICogRlJPTSBcIiR7dGhpcy50YWJsZU5hbWUoKX1cImApXG4gICAgICAudGhlbigocmVzdWx0KSA9PlxuICAgICAgICB0aGlzLmluc2VydENodW5rZWQoMjAsIHRoaXMuYWx0ZXJlZE5hbWUsIGlkZW50aXR5LCByZXN1bHQpXG4gICAgICApO1xuICB9LFxuXG4gIHJlaW5zZXJ0RGF0YShpdGVyYXRvcikge1xuICAgIHJldHVybiB0aGlzLnRyeFxuICAgICAgLnJhdyhgU0VMRUNUICogRlJPTSBcIiR7dGhpcy5hbHRlcmVkTmFtZX1cImApXG4gICAgICAudGhlbigocmVzdWx0KSA9PlxuICAgICAgICB0aGlzLmluc2VydENodW5rZWQoMjAsIHRoaXMudGFibGVOYW1lKCksIGl0ZXJhdG9yLCByZXN1bHQpXG4gICAgICApO1xuICB9LFxuXG4gIGFzeW5jIGluc2VydENodW5rZWQoY2h1bmtTaXplLCB0YXJnZXQsIGl0ZXJhdG9yLCByZXN1bHQpIHtcbiAgICBpdGVyYXRvciA9IGl0ZXJhdG9yIHx8IGlkZW50aXR5O1xuICAgIGNvbnN0IGNodW5rZWQgPSBjaHVuayhyZXN1bHQsIGNodW5rU2l6ZSk7XG4gICAgZm9yIChjb25zdCBiYXRjaCBvZiBjaHVua2VkKSB7XG4gICAgICBhd2FpdCB0aGlzLnRyeFxuICAgICAgICAucXVlcnlCdWlsZGVyKClcbiAgICAgICAgLnRhYmxlKHRhcmdldClcbiAgICAgICAgLmluc2VydChtYXAoYmF0Y2gsIGl0ZXJhdG9yKSk7XG4gICAgfVxuICB9LFxuXG4gIGNyZWF0ZVRlbXBUYWJsZShjcmVhdGVUYWJsZSkge1xuICAgIHJldHVybiB0aGlzLnRyeC5yYXcoXG4gICAgICBjcmVhdGVUYWJsZS5zcWwucmVwbGFjZSh0aGlzLnRhYmxlTmFtZSgpLCB0aGlzLmFsdGVyZWROYW1lKVxuICAgICk7XG4gIH0sXG5cbiAgX2RvUmVwbGFjZShzcWwsIGZyb20sIHRvKSB7XG4gICAgY29uc3Qgb25lTGluZVNxbCA9IHNxbC5yZXBsYWNlKC9cXHMrL2csICcgJyk7XG4gICAgY29uc3QgbWF0Y2hlZCA9IG9uZUxpbmVTcWwubWF0Y2goL15DUkVBVEUgVEFCTEVcXHMrKFxcUyspXFxzKlxcKCguKilcXCkvKTtcblxuICAgIGNvbnN0IHRhYmxlTmFtZSA9IG1hdGNoZWRbMV07XG4gICAgY29uc3QgZGVmcyA9IG1hdGNoZWRbMl07XG5cbiAgICBpZiAoIWRlZnMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm8gY29sdW1uIGRlZmluaXRpb25zIGluIHRoaXMgc3RhdGVtZW50IScpO1xuICAgIH1cblxuICAgIGxldCBwYXJlbnMgPSAwLFxuICAgICAgYXJncyA9IFtdLFxuICAgICAgcHRyID0gMDtcbiAgICBsZXQgaSA9IDA7XG4gICAgY29uc3QgeCA9IGRlZnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCB4OyBpKyspIHtcbiAgICAgIHN3aXRjaCAoZGVmc1tpXSkge1xuICAgICAgICBjYXNlICcoJzpcbiAgICAgICAgICBwYXJlbnMrKztcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnKSc6XG4gICAgICAgICAgcGFyZW5zLS07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJywnOlxuICAgICAgICAgIGlmIChwYXJlbnMgPT09IDApIHtcbiAgICAgICAgICAgIGFyZ3MucHVzaChkZWZzLnNsaWNlKHB0ciwgaSkpO1xuICAgICAgICAgICAgcHRyID0gaSArIDE7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICcgJzpcbiAgICAgICAgICBpZiAocHRyID09PSBpKSB7XG4gICAgICAgICAgICBwdHIgPSBpICsgMTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGFyZ3MucHVzaChkZWZzLnNsaWNlKHB0ciwgaSkpO1xuXG4gICAgY29uc3QgZnJvbUlkZW50aWZpZXIgPSBmcm9tLnJlcGxhY2UoL1tgXCInW1xcXV0vZywgJycpO1xuXG4gICAgYXJncyA9IGFyZ3MubWFwKChpdGVtKSA9PiB7XG4gICAgICBsZXQgc3BsaXQgPSBpdGVtLnRyaW0oKS5zcGxpdCgnICcpO1xuXG4gICAgICBcbiAgICAgIGNvbnN0IGZyb21NYXRjaENhbmRpZGF0ZXMgPSBbXG4gICAgICAgIG5ldyBSZWdFeHAoYFxcYCR7ZnJvbUlkZW50aWZpZXJ9XFxgYCwgJ2knKSxcbiAgICAgICAgbmV3IFJlZ0V4cChgXCIke2Zyb21JZGVudGlmaWVyfVwiYCwgJ2knKSxcbiAgICAgICAgbmV3IFJlZ0V4cChgJyR7ZnJvbUlkZW50aWZpZXJ9J2AsICdpJyksXG4gICAgICAgIG5ldyBSZWdFeHAoYFxcXFxbJHtmcm9tSWRlbnRpZmllcn1cXFxcXWAsICdpJyksXG4gICAgICBdO1xuICAgICAgaWYgKGZyb21JZGVudGlmaWVyLm1hdGNoKC9eXFxTKyQvKSkge1xuICAgICAgICBmcm9tTWF0Y2hDYW5kaWRhdGVzLnB1c2gobmV3IFJlZ0V4cChgXFxcXGIke2Zyb21JZGVudGlmaWVyfVxcXFxiYCwgJ2knKSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGRvZXNNYXRjaEZyb21JZGVudGlmaWVyID0gKHRhcmdldCkgPT5cbiAgICAgICAgc29tZShmcm9tTWF0Y2hDYW5kaWRhdGVzLCAoYykgPT4gdGFyZ2V0Lm1hdGNoKGMpKTtcblxuICAgICAgY29uc3QgcmVwbGFjZUZyb21JZGVudGlmaWVyID0gKHRhcmdldCkgPT5cbiAgICAgICAgZnJvbU1hdGNoQ2FuZGlkYXRlcy5yZWR1Y2UoXG4gICAgICAgICAgKHJlc3VsdCwgY2FuZGlkYXRlKSA9PiByZXN1bHQucmVwbGFjZShjYW5kaWRhdGUsIHRvKSxcbiAgICAgICAgICB0YXJnZXRcbiAgICAgICAgKTtcblxuICAgICAgaWYgKGRvZXNNYXRjaEZyb21JZGVudGlmaWVyKHNwbGl0WzBdKSkge1xuICAgICAgICAvLyBjb2x1bW4gZGVmaW5pdGlvblxuICAgICAgICBpZiAodG8pIHtcbiAgICAgICAgICBzcGxpdFswXSA9IHRvO1xuICAgICAgICAgIHJldHVybiBzcGxpdC5qb2luKCcgJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcnOyAvLyBmb3IgZGVsZXRpb25zXG4gICAgICB9XG5cbiAgICAgIC8vIHNraXAgY29uc3RyYWludCBuYW1lXG4gICAgICBjb25zdCBpZHggPSAvY29uc3RyYWludC9pLnRlc3Qoc3BsaXRbMF0pID8gMiA6IDA7XG5cbiAgICAgIC8vIHByaW1hcnkga2V5IGFuZCB1bmlxdWUgY29uc3RyYWludHMgaGF2ZSBvbmUgb3IgbW9yZVxuICAgICAgLy8gY29sdW1ucyBmcm9tIHRoaXMgdGFibGUgbGlzdGVkIGJldHdlZW4gKCk7IHJlcGxhY2VcbiAgICAgIC8vIG9uZSBpZiBpdCBtYXRjaGVzXG4gICAgICBpZiAoL3ByaW1hcnl8dW5pcXVlL2kudGVzdChzcGxpdFtpZHhdKSkge1xuICAgICAgICBjb25zdCByZXQgPSBpdGVtLnJlcGxhY2UoL1xcKC4qXFwpLywgcmVwbGFjZUZyb21JZGVudGlmaWVyKTtcbiAgICAgICAgLy8gSWYgYW55IG1lbWJlciBjb2x1bW5zIGFyZSBkcm9wcGVkIHRoZW4gdW5pcXVlbmVzcy9wayBjb25zdHJhaW50XG4gICAgICAgIC8vIGNhbiBub3QgYmUgcmV0YWluZWRcbiAgICAgICAgaWYgKHJldCAhPT0gaXRlbSAmJiBpc0VtcHR5KHRvKSkgcmV0dXJuICcnO1xuICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgfVxuXG4gICAgICAvLyBmb3JlaWduIGtleXMgaGF2ZSBvbmUgb3IgbW9yZSBjb2x1bW5zIGZyb20gdGhpcyB0YWJsZVxuICAgICAgLy8gbGlzdGVkIGJldHdlZW4gKCk7IHJlcGxhY2Ugb25lIGlmIGl0IG1hdGNoZXNcbiAgICAgIC8vIGZvcmVpZ24ga2V5cyBhbHNvIGhhdmUgYSAncmVmZXJlbmNlcycgY2xhdXNlXG4gICAgICAvLyB3aGljaCBtYXkgcmVmZXJlbmNlIFRISVMgdGFibGU7IGlmIGl0IGRvZXMsIHJlcGxhY2VcbiAgICAgIC8vIGNvbHVtbiByZWZlcmVuY2VzIGluIHRoYXQgdG9vIVxuICAgICAgaWYgKC9mb3JlaWduLy50ZXN0KHNwbGl0W2lkeF0pKSB7XG4gICAgICAgIHNwbGl0ID0gaXRlbS5zcGxpdCgvIHJlZmVyZW5jZXMgL2kpO1xuICAgICAgICAvLyB0aGUgcXVvdGVkIGNvbHVtbiBuYW1lcyBzYXZlIHVzIGZyb20gaGF2aW5nIHRvIGRvIGFueXRoaW5nXG4gICAgICAgIC8vIG90aGVyIHRoYW4gYSBzdHJhaWdodCByZXBsYWNlIGhlcmVcbiAgICAgICAgY29uc3QgcmVwbGFjZWRLZXlTcGVjID0gcmVwbGFjZUZyb21JZGVudGlmaWVyKHNwbGl0WzBdKTtcblxuICAgICAgICBpZiAoc3BsaXRbMF0gIT09IHJlcGxhY2VkS2V5U3BlYykge1xuICAgICAgICAgIC8vIElmIHdlIGFyZSByZW1vdmluZyBvbmUgb3IgbW9yZSBjb2x1bW5zIG9mIGEgZm9yZWlnblxuICAgICAgICAgIC8vIGtleSwgdGhlbiB3ZSBzaG91bGQgbm90IHJldGFpbiB0aGUga2V5IGF0IGFsbFxuICAgICAgICAgIGlmIChpc0VtcHR5KHRvKSkgcmV0dXJuICcnO1xuICAgICAgICAgIGVsc2Ugc3BsaXRbMF0gPSByZXBsYWNlZEtleVNwZWM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3BsaXRbMV0uc2xpY2UoMCwgdGFibGVOYW1lLmxlbmd0aCkgPT09IHRhYmxlTmFtZSkge1xuICAgICAgICAgIC8vIHNlbGYtcmVmZXJlbnRpYWwgZm9yZWlnbiBrZXlcbiAgICAgICAgICBjb25zdCByZXBsYWNlZEtleVRhcmdldFNwZWMgPSBzcGxpdFsxXS5yZXBsYWNlKFxuICAgICAgICAgICAgL1xcKC4qXFwpLyxcbiAgICAgICAgICAgIHJlcGxhY2VGcm9tSWRlbnRpZmllclxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKHNwbGl0WzFdICE9PSByZXBsYWNlZEtleVRhcmdldFNwZWMpIHtcbiAgICAgICAgICAgIC8vIElmIHdlIGFyZSByZW1vdmluZyBvbmUgb3IgbW9yZSBjb2x1bW5zIG9mIGEgZm9yZWlnblxuICAgICAgICAgICAgLy8ga2V5LCB0aGVuIHdlIHNob3VsZCBub3QgcmV0YWluIHRoZSBrZXkgYXQgYWxsXG4gICAgICAgICAgICBpZiAoaXNFbXB0eSh0bykpIHJldHVybiAnJztcbiAgICAgICAgICAgIGVsc2Ugc3BsaXRbMV0gPSByZXBsYWNlZEtleVRhcmdldFNwZWM7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzcGxpdC5qb2luKCcgcmVmZXJlbmNlcyAnKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGl0ZW07XG4gICAgfSk7XG5cbiAgICBhcmdzID0gYXJncy5maWx0ZXIobmVnYXRlKGlzRW1wdHkpKTtcblxuICAgIGlmIChhcmdzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gZHJvcCBsYXN0IGNvbHVtbiBmcm9tIHRhYmxlJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG9uZUxpbmVTcWxcbiAgICAgIC5yZXBsYWNlKC9cXCguKlxcKS8sICgpID0+IGAoJHthcmdzLmpvaW4oJywgJyl9KWApXG4gICAgICAucmVwbGFjZSgvLFxccyooWywpXSkvLCAnJDEnKTtcbiAgfSxcblxuICAvLyBCb3ksIHRoaXMgaXMgcXVpdGUgYSBtZXRob2QuXG4gIHJlbmFtZUNvbHVtbjogYXN5bmMgZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgICByZXR1cm4gdGhpcy5jbGllbnQudHJhbnNhY3Rpb24oXG4gICAgICBhc3luYyAodHJ4KSA9PiB7XG4gICAgICAgIHRoaXMudHJ4ID0gdHJ4O1xuICAgICAgICBjb25zdCBjb2x1bW4gPSBhd2FpdCB0aGlzLmdldENvbHVtbihmcm9tKTtcbiAgICAgICAgY29uc3Qgc3FsID0gYXdhaXQgdGhpcy5nZXRUYWJsZVNxbChjb2x1bW4pO1xuICAgICAgICBjb25zdCBhID0gdGhpcy5jbGllbnQud3JhcElkZW50aWZpZXIoZnJvbSk7XG4gICAgICAgIGNvbnN0IGIgPSB0aGlzLmNsaWVudC53cmFwSWRlbnRpZmllcih0byk7XG4gICAgICAgIGNvbnN0IGNyZWF0ZVRhYmxlID0gc3FsWzBdO1xuICAgICAgICBjb25zdCBuZXdTcWwgPSB0aGlzLl9kb1JlcGxhY2UoY3JlYXRlVGFibGUuc3FsLCBhLCBiKTtcbiAgICAgICAgaWYgKHNxbCA9PT0gbmV3U3FsKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gZmluZCB0aGUgY29sdW1uIHRvIGNoYW5nZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgeyBmcm9tOiBtYXBwZWRGcm9tLCB0bzogbWFwcGVkVG8gfSA9IGludmVydChcbiAgICAgICAgICB0aGlzLmNsaWVudC5wb3N0UHJvY2Vzc1Jlc3BvbnNlKFxuICAgICAgICAgICAgaW52ZXJ0KHtcbiAgICAgICAgICAgICAgZnJvbSxcbiAgICAgICAgICAgICAgdG8sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIClcbiAgICAgICAgKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5yZWluc2VydE1hcHBlZChjcmVhdGVUYWJsZSwgbmV3U3FsLCAocm93KSA9PiB7XG4gICAgICAgICAgcm93W21hcHBlZFRvXSA9IHJvd1ttYXBwZWRGcm9tXTtcbiAgICAgICAgICByZXR1cm4gb21pdChyb3csIG1hcHBlZEZyb20pO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICB7IGNvbm5lY3Rpb246IHRoaXMuY29ubmVjdGlvbiB9XG4gICAgKTtcbiAgfSxcblxuICBkcm9wQ29sdW1uOiBhc3luYyBmdW5jdGlvbihjb2x1bW5zKSB7XG4gICAgcmV0dXJuIHRoaXMuY2xpZW50LnRyYW5zYWN0aW9uKFxuICAgICAgKHRyeCkgPT4ge1xuICAgICAgICB0aGlzLnRyeCA9IHRyeDtcbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGNvbHVtbnMubWFwKChjb2x1bW4pID0+IHRoaXMuZ2V0Q29sdW1uKGNvbHVtbikpKVxuICAgICAgICAgIC50aGVuKCgpID0+IHRoaXMuZ2V0VGFibGVTcWwoKSlcbiAgICAgICAgICAudGhlbigoc3FsKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjcmVhdGVUYWJsZSA9IHNxbFswXTtcbiAgICAgICAgICAgIGxldCBuZXdTcWwgPSBjcmVhdGVUYWJsZS5zcWw7XG4gICAgICAgICAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBhID0gdGhpcy5jbGllbnQud3JhcElkZW50aWZpZXIoY29sdW1uKTtcbiAgICAgICAgICAgICAgbmV3U3FsID0gdGhpcy5fZG9SZXBsYWNlKG5ld1NxbCwgYSwgJycpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoc3FsID09PSBuZXdTcWwpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gZmluZCB0aGUgY29sdW1uIHRvIGNoYW5nZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgbWFwcGVkQ29sdW1ucyA9IE9iamVjdC5rZXlzKFxuICAgICAgICAgICAgICB0aGlzLmNsaWVudC5wb3N0UHJvY2Vzc1Jlc3BvbnNlKFxuICAgICAgICAgICAgICAgIGZyb21QYWlycyhjb2x1bW5zLm1hcCgoY29sdW1uKSA9PiBbY29sdW1uLCBjb2x1bW5dKSlcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlaW5zZXJ0TWFwcGVkKGNyZWF0ZVRhYmxlLCBuZXdTcWwsIChyb3cpID0+XG4gICAgICAgICAgICAgIG9taXQocm93LCAuLi5tYXBwZWRDb2x1bW5zKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICB7IGNvbm5lY3Rpb246IHRoaXMuY29ubmVjdGlvbiB9XG4gICAgKTtcbiAgfSxcblxuICByZWluc2VydE1hcHBlZChjcmVhdGVUYWJsZSwgbmV3U3FsLCBtYXBSb3cpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKClcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuY3JlYXRlVGVtcFRhYmxlKGNyZWF0ZVRhYmxlKSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuY29weURhdGEoKSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuZHJvcE9yaWdpbmFsKCkpXG4gICAgICAudGhlbigoKSA9PiB0aGlzLnRyeC5yYXcobmV3U3FsKSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXMucmVpbnNlcnREYXRhKG1hcFJvdykpXG4gICAgICAudGhlbigoKSA9PiB0aGlzLmRyb3BUZW1wVGFibGUoKSk7XG4gIH0sXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTUUxpdGUzX0RETDtcbiJdfQ==