// Firebird Query Builder & Compiler
'use strict';

exports.__esModule = true;

var _obj;

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _knexLibQueryCompiler = require("knex/lib/query/compiler");

var _knexLibQueryCompiler2 = _interopRequireDefault(_knexLibQueryCompiler);

function QueryCompiler_Firebird(client, builder) {
  _knexLibQueryCompiler2['default'].call(this, client, builder);
}
_inherits2['default'](QueryCompiler_Firebird, _knexLibQueryCompiler2['default']);

Object.assign(QueryCompiler_Firebird.prototype, _obj = {
  // TODO probably buggy. test it

  // limit 5           -> rows 1 to 5   - or just rows 5
  // limit 5 offset  0 -> rows 1 to 5   - or just rows 5
  // limit 5 offset 10 -> rows 11 to 15
  //         offset 10 -> rows 11 to very big value
  //         offset  0 -> nothing

  _calcRows: function _calcRows() {
    var _single = this.single;
    var limit = _single.limit;
    var offset = _single.offset;

    if (!limit && limit !== 0) {
      if (!offset) return [];
      return [offset + 1, 1 << 30];
    } else {
      if (!offset) return [limit];
      return [offset + 1, offset + limit];
    }
  },

  limit: function limit() {
    var rows = this._calcRows()[0];
    if (rows === undefined) return;
    return 'rows ' + this.formatter.parameter(rows);
  },

  offset: function offset() {
    var to = this._calcRows()[1];
    if (to === undefined) return;
    return 'to ' + this.formatter.parameter(to);
  },

  _prepInsert: function _prepInsert(insertValues) {
    var newValues = {};
    for (var key in insertValues) {
      var value = insertValues[key];
      if (typeof value !== 'undefined') {
        newValues[key] = value;
      }
    }
    return _knexLibQueryCompiler2['default'].prototype._prepInsert.call(this, newValues);
  },
  // Compiles a `columnInfo` query
  columnInfo: function columnInfo() {
    var column = this.single.columnInfo;

    // The user may have specified a custom wrapIdentifier function in the config. We
    // need to run the identifiers through that function, but not format them as
    // identifiers otherwise.
    var table = this.client.customWrapIdentifier(this.single.table, identity);

    return {
      sql: '\n      select \n        rlf.rdb$field_name as name,\n        fld.rdb$character_length as max_length,\n        typ.rdb$type_name as type,\n        rlf.rdb$null_flag as not_null\n      from rdb$relation_fields rlf\n      inner join rdb$fields fld on fld.rdb$field_name = rlf.rdb$field_source\n      inner join rdb$types typ on typ.rdb$type = fld.rdb$field_type\n      where rdb$relation_name = \'' + table + '\'\n      ',
      output: function output(resp) {
        var rows = resp[0];
        var fields = resp[1];

        var maxLengthRegex = /.*\((\d+)\)/;
        var out = reduce(rows, function (columns, val) {
          var name = val.NAME.trim();
          columns[name] = {
            type: val.TYPE.trim().toLowerCase(),
            nullable: !val.NOT_NULL
          };

          // ATSTODO: "defaultValue" não implementado
          // defaultValue: null,
          if (val.MAX_LENGTH) {
            columns[name] = val.MAX_LENGTH;
          }

          return columns;
        }, {});
        console.log('Resultado columnInfo', { out: out, column: column });
        return column && out[column] || out;
      }
    };
  },
  whereIn: function whereIn(statement) {
    var _this = this;

    // O FB não suporta `in` de tupla para tupla; neste caso, monta um or
    if (Array.isArray(statement.column)) {
      var conditions = statement.value.map(function (valueCols) {
        return valueCols.map(function (value, idx) {
          return _this['formatter'].columnize(statement.column[idx]) + ' = ' + _this['formatter'].values(value);
        }).join(' and ');
      });
      return '( ' + conditions.join('\n or ') + ' )';
    }
    return _get(Object.getPrototypeOf(_obj), 'whereIn', this).call(this, statement);
  }

});

exports['default'] = QueryCompiler_Firebird;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9xdWVyeS9jb21waWxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozt3QkFDcUIsVUFBVTs7OztvQ0FDTCx5QkFBeUI7Ozs7QUFFbkQsU0FBUyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFO0FBQy9DLG9DQUFjLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0NBQzNDO0FBQ0Qsc0JBQVMsc0JBQXNCLG9DQUFnQixDQUFDOztBQUVoRCxNQUFNLENBQUMsTUFBTSxDQUFDLHNCQUFzQixDQUFDLFNBQVMsU0FBRTs7Ozs7Ozs7O0FBUzlDLFdBQVMsRUFBQSxxQkFBRztrQkFDZ0IsSUFBSSxDQUFDLE1BQU07UUFBN0IsS0FBSyxXQUFMLEtBQUs7UUFBRSxNQUFNLFdBQU4sTUFBTTs7QUFDckIsUUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFO0FBQ3pCLFVBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLENBQUM7QUFDdkIsYUFBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0tBQzlCLE1BQU07QUFDTCxVQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM1QixhQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUM7S0FDckM7R0FDRjs7QUFFRCxPQUFLLEVBQUEsaUJBQUc7QUFDTixRQUFNLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakMsUUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFLE9BQU87QUFDL0IsV0FBTyxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDakQ7O0FBRUQsUUFBTSxFQUFBLGtCQUFHO0FBQ1AsUUFB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RCx5RUFBcUIsU0FBUyxFQUFFO0dBQ2pDOztDQUVGLENBQUMsQ0FBQzs7cUJBRVksc0JBQXNCIiwiZmlsZSI6ImNvbXBpbGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gRmlyZWJpcmQgUXVlcnkgQnVpbGRlciAmIENvbXBpbGVyXG5pbXBvcnQgaW5oZXJpdHMgZnJvbSAnaW5oZXJpdHMnO1xuaW1wb3J0IFF1ZXJ5Q29tcGlsZXIgZnJvbSBcImtuZXgvbGliL3F1ZXJ5L2NvbXBpbGVyXCI7XG5cbmZ1bmN0aW9uIFF1ZXJ5Q29tcGlsZXJfRmlyZWJpcmQoY2xpZW50LCBidWlsZGVyKSB7XG4gIFF1ZXJ5Q29tcGlsZXIuY2FsbCh0aGlzLCBjbGllbnQsIGJ1aWxkZXIpO1xufVxuaW5oZXJpdHMoUXVlcnlDb21waWxlcl9GaXJlYmlyZCwgUXVlcnlDb21waWxlcik7XG5cbk9iamVjdC5hc3NpZ24oUXVlcnlDb21waWxlcl9GaXJlYmlyZC5wcm90b3R5cGUsIHtcbiAgLy8gVE9ETyBwcm9iYWJseSBidWdneS4gdGVzdCBpdFxuXG4gIC8vIGxpbWl0IDUgICAgICAgICAgIC0+IHJvd3MgMSB0byA1ICAgLSBvciBqdXN0IHJvd3MgNVxuICAvLyBsaW1pdCA1IG9mZnNldCAgMCAtPiByb3dzIDEgdG8gNSAgIC0gb3IganVzdCByb3dzIDVcbiAgLy8gbGltaXQgNSBvZmZzZXQgMTAgLT4gcm93cyAxMSB0byAxNVxuICAvLyAgICAgICAgIG9mZnNldCAxMCAtPiByb3dzIDExIHRvIHZlcnkgYmlnIHZhbHVlXG4gIC8vICAgICAgICAgb2Zmc2V0ICAwIC0+IG5vdGhpbmdcblxuICBfY2FsY1Jvd3MoKSB7XG4gICAgY29uc3QgeyBsaW1pdCwgb2Zmc2V0IH0gPSB0aGlzLnNpbmdsZTtcbiAgICBpZiAoIWxpbWl0ICYmIGxpbWl0ICE9PSAwKSB7XG4gICAgICBpZiAoIW9mZnNldCkgcmV0dXJuIFtdO1xuICAgICAgcmV0dXJuIFtvZmZzZXQgKyAxLCAxIDw8IDMwXTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFvZmZzZXQpIHJldHVybiBbbGltaXRdO1xuICAgICAgcmV0dXJuIFtvZmZzZXQgKyAxLCBvZmZzZXQgKyBsaW1pdF07XG4gICAgfVxuICB9LFxuXG4gIGxpbWl0KCkge1xuICAgIGNvbnN0IHJvd3MgPSB0aGlzLl9jYWxjUm93cygpWzBdO1xuICAgIGlmIChyb3dzID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICByZXR1cm4gJ3Jvd3MgJyArIHRoaXMuZm9ybWF0dGVyLnBhcmFtZXRlcihyb3dzKTtcbiAgfSxcblxuICBvZmZzZXQoKSB7XG4gICAgY29uc3QgdG8gPSB0aGlzLl9jYWxjUm93cygpWzFdO1xuICAgIGlmICh0byA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgcmV0dXJuICd0byAnICsgdGhpcy5mb3JtYXR0ZXIucGFyYW1ldGVyKHRvKTtcbiAgfSxcblxuICBfcHJlcEluc2VydChpbnNlcnRWYWx1ZXMpIHtcbiAgICBjb25zdCBuZXdWYWx1ZXMgPSB7fTtcbiAgICBmb3IgKGNvbnN0IGtleSBpbiBpbnNlcnRWYWx1ZXMpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5zZXJ0VmFsdWVzW2tleV07XG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBuZXdWYWx1ZXNba2V5XSA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gUXVlcnlDb21waWxlci5wcm90b3R5cGUuX3ByZXBJbnNlcnQuY2FsbCh0aGlzLCBuZXdWYWx1ZXMpO1xuICB9LFxuICAvLyBDb21waWxlcyBhIGBjb2x1bW5JbmZvYCBxdWVyeVxuICBjb2x1bW5JbmZvKCkge1xuICAgIGNvbnN0IGNvbHVtbiA9IHRoaXMuc2luZ2xlLmNvbHVtbkluZm87XG5cbiAgICAvLyBUaGUgdXNlciBtYXkgaGF2ZSBzcGVjaWZpZWQgYSBjdXN0b20gd3JhcElkZW50aWZpZXIgZnVuY3Rpb24gaW4gdGhlIGNvbmZpZy4gV2VcbiAgICAvLyBuZWVkIHRvIHJ1biB0aGUgaWRlbnRpZmllcnMgdGhyb3VnaCB0aGF0IGZ1bmN0aW9uLCBidXQgbm90IGZvcm1hdCB0aGVtIGFzXG4gICAgLy8gaWRlbnRpZmllcnMgb3RoZXJ3aXNlLlxuICAgIGNvbnN0IHRhYmxlID0gdGhpcy5jbGllbnQuY3VzdG9tV3JhcElkZW50aWZpZXIodGhpcy5zaW5nbGUudGFibGUsIGlkZW50aXR5KTtcblxuICAgIHJldHVybiB7XG4gICAgICBzcWw6IGBcbiAgICAgIHNlbGVjdCBcbiAgICAgICAgcmxmLnJkYiRmaWVsZF9uYW1lIGFzIG5hbWUsXG4gICAgICAgIGZsZC5yZGIkY2hhcmFjdGVyX2xlbmd0aCBhcyBtYXhfbGVuZ3RoLFxuICAgICAgICB0eXAucmRiJHR5cGVfbmFtZSBhcyB0eXBlLFxuICAgICAgICBybGYucmRiJG51bGxfZmxhZyBhcyBub3RfbnVsbFxuICAgICAgZnJvbSByZGIkcmVsYXRpb25fZmllbGRzIHJsZlxuICAgICAgaW5uZXIgam9pbiByZGIkZmllbGRzIGZsZCBvbiBmbGQucmRiJGZpZWxkX25hbWUgPSBybGYucmRiJGZpZWxkX3NvdXJjZVxuICAgICAgaW5uZXIgam9pbiByZGIkdHlwZXMgdHlwIG9uIHR5cC5yZGIkdHlwZSA9IGZsZC5yZGIkZmllbGRfdHlwZVxuICAgICAgd2hlcmUgcmRiJHJlbGF0aW9uX25hbWUgPSAnJHt0YWJsZX0nXG4gICAgICBgLFxuICAgICAgb3V0cHV0KHJlc3ApIHtcbiAgICAgICAgY29uc3QgW3Jvd3MsIGZpZWxkc10gPSByZXNwO1xuXG4gICAgICAgIGNvbnN0IG1heExlbmd0aFJlZ2V4ID0gLy4qXFwoKFxcZCspXFwpLztcbiAgICAgICAgY29uc3Qgb3V0ID0gcmVkdWNlKFxuICAgICAgICAgIHJvd3MsXG4gICAgICAgICAgZnVuY3Rpb24gKGNvbHVtbnMsIHZhbCkge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IHZhbC5OQU1FLnRyaW0oKTtcbiAgICAgICAgICAgIGNvbHVtbnNbbmFtZV0gPSB7XG4gICAgICAgICAgICAgIHR5cGU6IHZhbC5UWVBFLnRyaW0oKS50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgICAgICBudWxsYWJsZTogIXZhbC5OT1RfTlVMTCxcbiAgICAgICAgICAgICAgLy8gQVRTVE9ETzogXCJkZWZhdWx0VmFsdWVcIiBuw6NvIGltcGxlbWVudGFkb1xuICAgICAgICAgICAgICAvLyBkZWZhdWx0VmFsdWU6IG51bGwsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAodmFsLk1BWF9MRU5HVEgpIHtcbiAgICAgICAgICAgICAgY29sdW1uc1tuYW1lXSA9IHZhbC5NQVhfTEVOR1RIO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY29sdW1ucztcbiAgICAgICAgICB9LFxuICAgICAgICAgIHt9XG4gICAgICAgICk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdSZXN1bHRhZG8gY29sdW1uSW5mbycsIHsgb3V0LCBjb2x1bW4gfSk7XG4gICAgICAgIHJldHVybiAoY29sdW1uICYmIG91dFtjb2x1bW5dKSB8fCBvdXQ7XG4gICAgICB9LFxuICAgIH07XG4gIH0sXG4gIHdoZXJlSW4oc3RhdGVtZW50KSB7XG4gICAgLy8gTyBGQiBuw6NvIHN1cG9ydGEgYGluYCBkZSB0dXBsYSBwYXJhIHR1cGxhOyBuZXN0ZSBjYXNvLCBtb250YSB1bSBvclxuICAgIGlmIChBcnJheS5pc0FycmF5KHN0YXRlbWVudC5jb2x1bW4pKSB7XG4gICAgICBjb25zdCBjb25kaXRpb25zID0gc3RhdGVtZW50LnZhbHVlLm1hcCh2YWx1ZUNvbHMgPT4gdmFsdWVDb2xzLm1hcCgodmFsdWUsIGlkeCkgPT4ge1xuICAgICAgICByZXR1cm4gYCR7dGhpc1snZm9ybWF0dGVyJ10uY29sdW1uaXplKHN0YXRlbWVudC5jb2x1bW5baWR4XSl9ID0gJHt0aGlzWydmb3JtYXR0ZXInXS52YWx1ZXModmFsdWUpfWBcbiAgICAgIH0pLmpvaW4oJyBhbmQgJykpO1xuICAgICAgcmV0dXJuIGAoICR7Y29uZGl0aW9ucy5qb2luKCdcXG4gb3IgJyl9IClgO1xuICAgIH1cbiAgICByZXR1cm4gc3VwZXIud2hlcmVJbihzdGF0ZW1lbnQpO1xuICB9XG5cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBRdWVyeUNvbXBpbGVyX0ZpcmViaXJkO1xuXG4iXX0=