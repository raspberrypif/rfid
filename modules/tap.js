// @wolfram77
// TAP - maintains info about card taps
// db - tap : point, time, card, status
// () - statusinfo, clear, count, get, put, add


// required modules
var EventEmitter = require('events').EventEmitter;
var z = require('./zed')();
var _ = require('lodash');



// initialize
module.exports = function(c, db) {
  var o = new EventEmitter();

  // init
  var daymillis = 86400000;


  // status info
  var statusinfo = {
    'e': 'error',
    'v': 'valid',
    'i': 'invalid'
  };



  // get tap counts (one point)
  // dst = {e, v, i}
  var count = function(dst, p, start, end) {
    console.log('[tap:count] .'+p+' '+start+' -> '+end);
    db.all('SELECT status, COUNT(*) FROM tap WHERE point=? AND time>=? AND time<? GROUP BY status', p, start, end, function(err, rows) {
      for(var i=0; i<rows.length; i++)
        dst[rows[i].status] = rows[i]['COUNT(*)'];
    });
  };


  // get tap info (a point)
  // dst = {time: [], card: [], status: []}
  var get = function(dst, p, start, end) {
    console.log('[tap:get] .'+p+' '+start+' -> '+end);
    db.all('SELECT  * FROM tap WHERE point=? AND time>=? AND time<? ORDER BY time ASC', p, start, end, function(err, rows) {
      z.group(dst, rows, ['time', 'card', 'status']);
    });
  };


  // put tap info (a point)
  // pvs = {time: [], card: [], status: []}
  var put = function(p, src) {
    console.log('[tap:put] .'+p+' '+src.time[0]+' -> '+_.last(src.time));
    for(var i=0; i<src.time.length; i++)
      db.run('INSERT INTO tap(point, time, card, status) VALUES (?, ?, ?, ?)', p, src.time[i], src.card[i], src.status[i]);
  };



  // status info
  o.statusinfo = function() {
    console.log('[tap.statusinfo]');
    return statusinfo;
  };


  // clear tap info
  o.clear = function(start, end, fn) {
    console.log('[tap.clear]');
    db.run('DELETE FROM tap WHERE time>=? AND time<?', start, end, fn);
  };


  // get tap counts
  // req = {point: {start, end}}
  // res = {point: {e, v, i}}
  o.count = function(req, fn) {
    console.log('[tap.count]');
    db.serialize(function() {
      var res = {};
      for(var p in req)
        count(res[p] = {}, p, req[p].start, req[p].end);
      db.run('PRAGMA no_op', function() {
        if(fn) fn(res);
      });
    });
  };


  // get tap info
  // req = {point: {start, end}}
  // res = {point: {time: [], card: [], status: []}}
  o.get = function(req, fn) {
    console.log('[tap.get]');
    db.serialize(function() {
      var res = {};
      for(var p in req)
        get(res[p] = {}, p, req[p].start, req[p].end);
      db.run('PRAGMA no_op', function() {
        if(fn) fn(res);
      });
    });
  };


  // put tap info
  // req = {point: {time: [], card: [], status: []}}
  o.put = function(req, fn) {
    console.log('[tap.put]');
    db.serialize(function() {
      for(var p in req)
        if(req[p].time && req[p].time.length>0) put(p, req[p]);
      db.run('PRAGMA no_op', function() {
        if(fn) fn();
      });
    });
  };


  // add tap info with check
  // req = {point, time, card, status}
  o.add = function(point, time, card, status, fn) {
    console.log('[tap.add] .'+point+' t'+time+' '+card+' :'+status);
    db.serialize(function() {
      var start = z.date(time).getTime(), end = start+daymillis;
      db.get('SELECT COUNT(*) FROM tap WHERE time>=? AND time<? AND card=?', start, end, card, function(err, row) {
        status = status!=='e'? ( err || row['COUNT(*)']<c.ndup? 'v' : 'i' ) : 'e';
        db.run('INSERT INTO tap(point, time, card, status) VALUES (?, ?, ?, ?)', point, time, card, status);
        if(fn) fn(statusinfo[status]);
      });
    });
  };



  // prepare
  db.serialize(function() {
    db.run('CREATE TABLE IF NOT EXISTS tap(point TEXT NOT NULL, time INTEGER NOT NULL, card INTEGER NOT NULL, status TEXT NOT NULL, PRIMARY KEY(point, time)) WITHOUT ROWID');
    o.clear(0, _.now()-c.dkeep);
  });

  // ready!
  console.log('[tap] ready!');
  return o;
};
