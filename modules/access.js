// @wolfram77
// ACCESS - maintains access info for card tap
// db - access : start, end, count
// () - clear, count, get, put


// required modules
var EventEmitter = require('events').EventEmitter;
var z = require('./zed')();
var _ = require('lodash');



// initialize
module.exports = function(c, db) {
  var o = new EventEmitter();



  // clear access info
  // req = {start: [], end: []}
  o.clear = function(req, fn) {
    console.log('[access.clear]');
    db.serialize(function() {
      for(var i=0; i<req.start.length; i++)
        db.run('DELETE FROM access WHERE start=? AND end=?', req.start[i], req.end[i]);
      db.run('PRAGMA no_op', fn);
    });
  };


  // get access count
  o.count = function(card, fn) {
    console.log('[access.count] '+card);
    db.get('SELECT *, MIN(end-start) FROM access WHERE start<=? AND end>?', card, card, function(err, row) {
      if(fn) fn(row? row.count : 0);
    });
  };


  // get access info (within range)
  // res = {start: [], end: [], count: []}
  o.get = function(start, end, fn) {
    console.log('[access.get]');
    db.all('SELECT * FROM access WHERE start<=? AND end>=?', start, end, function(err, rows) {
      z.group(res = {}, rows, ['start', 'end', 'count']);
      if(fn) fn(res);
    });
  };


  // put access info
  // req = {start: [], end: [], count: []}
  o.put = function(req, fn) {
    console.log('[access.put]');
    db.serialize(function() {
      for(var i=0; i<req.start.length; i++)
        db.run('INSERT INTO access(start, end, count) VALUES (?, ?, ?)', req.start[i], req.end[i], req.count[i]);
      db.run('PRAGMA no_op', fn);
    });
  };



  // prepare
  db.run('CREATE TABLE IF NOT EXISTS access(start INTEGER NOT NULL, end INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(start, end)) WITHOUT ROWID');

  // ready!
  console.log('[access] ready!');
  return o;
};
