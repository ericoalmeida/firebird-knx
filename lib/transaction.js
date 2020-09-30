'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _inherits = require('inherits');

var _inherits2 = _interopRequireDefault(_inherits);

var _knexLibTransaction = require('knex/lib/transaction');

var _knexLibTransaction2 = _interopRequireDefault(_knexLibTransaction);

var debug = require('debug')('knex:tx');

function Transaction_Firebird() {
  _knexLibTransaction2['default'].apply(this, arguments);
}
_inherits2['default'](Transaction_Firebird, _knexLibTransaction2['default']);

Object.assign(Transaction_Firebird.prototype, {

  begin: function begin(conn) {
    var _this = this;

    return new Promise(function (resolve, reject) {
      conn.transaction(_this.client.driver.ISOLATION_READ_COMMITED, function (error, transaction) {
        if (error) return reject(error);
        conn._transaction = transaction;
        resolve();
      });
    });
  },

  savepoint: function savepoint() {
    throw new Error('savepoints not implemented');
  },

  commit: function commit(conn, value) {
    return this.query(conn, 'commit', 1, value);
  },

  release: function release() {
    throw new Error('releasing savepoints not implemented');
  },

  rollback: function rollback(conn, error) {
    return this.query(conn, 'rollback', 2, error);
  },

  rollbackTo: function rollbackTo() {
    throw new Error('rolling back to savepoints not implemented');
  },

  query: function query(conn, method, status, value) {
    var _this2 = this;

    var q = new Promise(function (resolve, reject) {
      var transaction = conn._transaction;
      delete conn._transaction;
      transaction[method](function (error) {
        if (error) return reject(error);
        resolve();
      });
    })['catch'](function (error) {
      status = 2;
      value = error;
      _this2._completed = true;
      debug('%s error running transaction query', _this2.txid);
    }).tap(function () {
      if (status === 1) _this2._resolver(value);
      if (status === 2) _this2._rejecter(value);
    });
    if (status === 1 || status === 2) {
      this._completed = true;
    }
    return q;
  }

});

exports['default'] = Transaction_Firebird;
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Q0FBQyxFQUFFO0FBQ2hDLFVBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0tBQ3hCO0FBQ0QsV0FBTyxDQUFDLENBQUM7R0FDVjs7Q0FFRixDQUFDLENBQUM7O3FCQUVZLG9CQUFvQiIsImZpbGUiOiJ0cmFuc2FjdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBpbmhlcml0cyBmcm9tICdpbmhlcml0cyc7XG5jb25zdCBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ2tuZXg6dHgnKTtcbmltcG9ydCBUcmFuc2FjdGlvbiBmcm9tICdrbmV4L2xpYi90cmFuc2FjdGlvbic7XG5cblxuZnVuY3Rpb24gVHJhbnNhY3Rpb25fRmlyZWJpcmQgKCkge1xuICBUcmFuc2FjdGlvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufVxuaW5oZXJpdHMoVHJhbnNhY3Rpb25fRmlyZWJpcmQsIFRyYW5zYWN0aW9uKTtcblxuT2JqZWN0LmFzc2lnbihUcmFuc2FjdGlvbl9GaXJlYmlyZC5wcm90b3R5cGUsIHtcblxuICBiZWdpbihjb25uKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbm4udHJhbnNhY3Rpb24odGhpcy5jbGllbnQuZHJpdmVyLklTT0xBVElPTl9SRUFEX0NPTU1JVEVELCAoZXJyb3IsIHRyYW5zYWN0aW9uKSA9PiB7XG4gICAgICAgIGlmIChlcnJvcikgcmV0dXJuIHJlamVjdChlcnJvcik7XG4gICAgICAgIGNvbm4uX3RyYW5zYWN0aW9uID0gdHJhbnNhY3Rpb247XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuXG4gIFxuXG4gIHNhdmVwb2ludCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NhdmVwb2ludHMgbm90IGltcGxlbWVudGVkJyk7XG4gIH0sXG5cbiAgY29tbWl0KGNvbm4sIHZhbHVlKSB7XG4gICAgcmV0dXJuIHRoaXMucXVlcnkoY29ubiwgJ2NvbW1pdCcsIDEsIHZhbHVlKTtcbiAgfSxcblxuICByZWxlYXNlKCkge1xuICAgIHRocm93IG5ldyBFcnJvcigncmVsZWFzaW5nIHNhdmVwb2ludHMgbm90IGltcGxlbWVudGVkJyk7XG4gIH0sXG5cbiAgcm9sbGJhY2soY29ubiwgZXJyb3IpIHtcbiAgICByZXR1cm4gdGhpcy5xdWVyeShjb25uLCAncm9sbGJhY2snLCAyLCBlcnJvcik7XG4gIH0sXG5cbiAgcm9sbGJhY2tUbygpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3JvbGxpbmcgYmFjayB0byBzYXZlcG9pbnRzIG5vdCBpbXBsZW1lbnRlZCcpO1xuICB9LFxuXG4gIHF1ZXJ5KGNvbm4sIG1ldGhvZCwgc3RhdHVzLCB2YWx1ZSkge1xuICAgIGNvbnN0IHEgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gY29ubi5fdHJhbnNhY3Rpb247XG4gICAgICAgIGRlbGV0ZSBjb25uLl90cmFuc2FjdGlvbjtcbiAgICAgICAgdHJhbnNhY3Rpb25bbWV0aG9kXSgoZXJyb3IpID0+IHtcbiAgICAgICAgICBpZiAoZXJyb3IpIHJldHVybiByZWplY3QoZXJyb3IpO1xuICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICBzdGF0dXMgPSAyO1xuICAgICAgICB2YWx1ZSA9IGVycm9yO1xuICAgICAgICB0aGlzLl9jb21wbGV0ZWQgPSB0cnVlO1xuICAgICAgICBkZWJ1ZygnJXMgZXJyb3IgcnVubmluZyB0cmFuc2FjdGlvbiBxdWVyeScsIHRoaXMudHhpZCk7XG4gICAgICB9KVxuICAgICAgLnRhcCgoKSA9PiB7XG4gICAgICAgIGlmIChzdGF0dXMgPT09IDEpIHRoaXMuX3Jlc29sdmVyKHZhbHVlKTtcbiAgICAgICAgaWYgKHN0YXR1cyA9PT0gMikgdGhpcy5fcmVqZWN0ZXIodmFsdWUpO1xuICAgICAgfSk7XG4gICAgaWYgKHN0YXR1cyA9PT0gMSB8fCBzdGF0dXMgPT09IDIpIHtcbiAgICAgIHRoaXMuX2NvbXBsZXRlZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBxO1xuICB9XG5cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBUcmFuc2FjdGlvbl9GaXJlYmlyZDtcbiJdfQ==