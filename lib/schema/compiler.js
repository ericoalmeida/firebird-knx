// Firebird: Column Builder & Compiler
// -------
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _knexLibSchemaCompiler = require('knex/lib/schema/compiler');

var _knexLibSchemaCompiler2 = _interopRequireDefault(_knexLibSchemaCompiler);

var _lodash = require('lodash');

// Schema Compiler
// -------

function SchemaCompiler_Firebird() {
  _knexLibSchemaCompiler2['default'].apply(this, arguments);
}

_inherits2['default'](SchemaCompiler_Firebird, _knexLibSchemaCompiler2['default']);

Object.assign(SchemaCompiler_Firebird.prototype, {
  // Compile the query to determine if a table exists.
  hasTable: function hasTable(tableName) {
    var sql = 'select r.rdb$relation_name as "Table" ' + 'from rdb$relations r where ' + (' r.rdb$relation_name = ' + this.formatter.parameter(tableName));
    this.pushQuery({ sql: sql, output: function output(resp) {
        return resp.length > 0;
      } });
  },

  // Compile the query to determine if a column exists.
  hasColumn: function hasColumn(tableName, column) {
    this.pushQuery({
      sql: 'select i.rdb$field_name as "Field" from ' + 'rdb$relations r join rdb$RELATION_FIELDS i ' + 'on (i.rdb$relation_name = r.rdb$relation_name) ' + ('where r.rdb$relation_name = ' + this.formatter.wrap(tableName)),
      output: function output(resp) {
        var _this = this;

        return _lodash.some(resp, function (col) {
          return _this.client.wrapIdentifier(col.name.toLowerCase()) === _this.client.wrapIdentifier(column.toLowerCase());
        });
      }
    });
  }
});
// Compile a rename table command.
// SchemaCompiler_Firebird.prototype.renameTable = function(from, to) {
//   this.pushQuery(
//     `alter table ${this.formatter.wrap(from)} rename to ${this.formatter.wrap(
//       to
//     )}`
//   );
// };

exports['default'] = SchemaCompiler_Firebird;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zY2hlbWEvY29tcGlsZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7d0JBRXFCLFVBQVU7Ozs7cUNBQ0osMEJBQTBCOzs7O3NCQUVoQyxRQUFROzs7OztBQUs3QixTQUFTLHVCQUF1QixHQUFJO0FBQ2xDLHFDQUFlLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7Q0FDdkM7O0FBRUQsc0JBQVMsdUJBQXVCLHFDQUFpQixDQUFDOztBQUVsRCxNQUFNLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLFNBQVMsRUFBRTs7QUFFL0MsVUFBUSxFQUFBLGtCQUFDLFNBQVMsRUFBQztBQUNqQixRQUFNLEdBQUcsR0FDUCx3RUFDNkIsZ0NBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUUsQ0FBQztBQUNsRSxRQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxFQUFILEdBQUcsRUFBRSxNQUFNLEVBQUUsZ0JBQUMsSUFBSTtlQUFLLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQztPQUFBLEVBQUUsQ0FBQyxDQUFDO0dBQzVEOzs7QUFHRCxXQUFTLEVBQUEsbUJBQUMsU0FBUyxFQUFFLE1BQU0sRUFBQztBQUMxQixRQUFJLENBQUMsU0FBUyxDQUFDO0FBQ2IsU0FBRyxFQUFFLDBGQUMwQyxvREFDSSxxQ0FDbEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUU7QUFDakUsWUFBTSxFQUFBLGdCQUFDLElBQUksRUFBRTs7O0FBQ1gsZUFBTyxhQUFLLElBQUksRUFBRSxVQUFDLEdBQUcsRUFBSztBQUN6QixpQkFDRSxNQUFLLE1BQU0sQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUNsRCxNQUFLLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQ2hEO1NBQ0gsQ0FBQyxDQUFDO09BQ0o7S0FDRixDQUFDLENBQUM7R0FDSjtDQUNGLENBQUMsQ0FBQzs7Ozs7Ozs7OztxQkFVWSx1QkFBdUIiLCJmaWxlIjoiY29tcGlsZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBGaXJlYmlyZDogQ29sdW1uIEJ1aWxkZXIgJiBDb21waWxlclxuLy8gLS0tLS0tLVxuaW1wb3J0IGluaGVyaXRzIGZyb20gJ2luaGVyaXRzJztcbmltcG9ydCBTY2hlbWFDb21waWxlciBmcm9tICdrbmV4L2xpYi9zY2hlbWEvY29tcGlsZXInO1xuXG5pbXBvcnQgeyBzb21lIH0gZnJvbSAnbG9kYXNoJztcblxuLy8gU2NoZW1hIENvbXBpbGVyXG4vLyAtLS0tLS0tXG5cbmZ1bmN0aW9uIFNjaGVtYUNvbXBpbGVyX0ZpcmViaXJkICgpIHtcbiAgU2NoZW1hQ29tcGlsZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn1cblxuaW5oZXJpdHMoU2NoZW1hQ29tcGlsZXJfRmlyZWJpcmQsIFNjaGVtYUNvbXBpbGVyKTtcblxuT2JqZWN0LmFzc2lnbihTY2hlbWFDb21waWxlcl9GaXJlYmlyZC5wcm90b3R5cGUsIHtcbiAgLy8gQ29tcGlsZSB0aGUgcXVlcnkgdG8gZGV0ZXJtaW5lIGlmIGEgdGFibGUgZXhpc3RzLlxuICBoYXNUYWJsZSh0YWJsZU5hbWUpe1xuICAgIGNvbnN0IHNxbCA9XG4gICAgICBgc2VsZWN0IHIucmRiJHJlbGF0aW9uX25hbWUgYXMgXCJUYWJsZVwiIGAgK1xuICAgICAgYGZyb20gcmRiJHJlbGF0aW9ucyByIHdoZXJlIGAgK1xuICAgICAgYCByLnJkYiRyZWxhdGlvbl9uYW1lID0gJHt0aGlzLmZvcm1hdHRlci5wYXJhbWV0ZXIodGFibGVOYW1lKX1gO1xuICAgIHRoaXMucHVzaFF1ZXJ5KHsgc3FsLCBvdXRwdXQ6IChyZXNwKSA9PiByZXNwLmxlbmd0aCA+IDAgfSk7XG4gIH0sXG5cbiAgLy8gQ29tcGlsZSB0aGUgcXVlcnkgdG8gZGV0ZXJtaW5lIGlmIGEgY29sdW1uIGV4aXN0cy5cbiAgaGFzQ29sdW1uKHRhYmxlTmFtZSwgY29sdW1uKXtcbiAgICB0aGlzLnB1c2hRdWVyeSh7XG4gICAgICBzcWw6IGBzZWxlY3QgaS5yZGIkZmllbGRfbmFtZSBhcyBcIkZpZWxkXCIgZnJvbSBgICtcbiAgICAgICAgYHJkYiRyZWxhdGlvbnMgciBqb2luIHJkYiRSRUxBVElPTl9GSUVMRFMgaSBgICtcbiAgICAgICAgYG9uIChpLnJkYiRyZWxhdGlvbl9uYW1lID0gci5yZGIkcmVsYXRpb25fbmFtZSkgYCArXG4gICAgICAgIGB3aGVyZSByLnJkYiRyZWxhdGlvbl9uYW1lID0gJHt0aGlzLmZvcm1hdHRlci53cmFwKHRhYmxlTmFtZSl9YCxcbiAgICAgIG91dHB1dChyZXNwKSB7XG4gICAgICAgIHJldHVybiBzb21lKHJlc3AsIChjb2wpID0+IHtcbiAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgdGhpcy5jbGllbnQud3JhcElkZW50aWZpZXIoY29sLm5hbWUudG9Mb3dlckNhc2UoKSkgPT09XG4gICAgICAgICAgICB0aGlzLmNsaWVudC53cmFwSWRlbnRpZmllcihjb2x1bW4udG9Mb3dlckNhc2UoKSlcbiAgICAgICAgICApO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbn0pO1xuLy8gQ29tcGlsZSBhIHJlbmFtZSB0YWJsZSBjb21tYW5kLlxuLy8gU2NoZW1hQ29tcGlsZXJfRmlyZWJpcmQucHJvdG90eXBlLnJlbmFtZVRhYmxlID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbi8vICAgdGhpcy5wdXNoUXVlcnkoXG4vLyAgICAgYGFsdGVyIHRhYmxlICR7dGhpcy5mb3JtYXR0ZXIud3JhcChmcm9tKX0gcmVuYW1lIHRvICR7dGhpcy5mb3JtYXR0ZXIud3JhcChcbi8vICAgICAgIHRvXG4vLyAgICAgKX1gXG4vLyAgICk7XG4vLyB9O1xuXG5leHBvcnQgZGVmYXVsdCBTY2hlbWFDb21waWxlcl9GaXJlYmlyZDtcbiJdfQ==