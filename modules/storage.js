// @wolfram77
// STORAGE - maintains info about card swipes
// db - dd_mm_yyyy - point, time, card, status
// () - clear, count, get, put, add


// required modules
var EventEmitter = require('events').EventEmitter;
var sqlite3 = require('sqlite3').verbose();
var z = require('./zed')();
var _ = require('lodash');



// initialize
module.exports = function(c) {
  var o = new EventEmitter();

  // init
  var db = new sqlite3.Database(c.file);



  // status description
  var status = {
    'e': 'error',
    'v': 'valid',
    'i': 'invalid'
  };


  // initialize
  var init = function() {
    db.run('CREATE TABLE IF NOT EXISTS card(start INTEGER NOT NULL, end INTEGER NOT NULL, ndup INTEGER NOT NULL, PRIMARY KEY(start, end)) WITHOUT ROWID');
    db.run('CREATE TABLE IF NOT EXISTS tap(time INTEGER NOT NULL, point TEXT NOT NULL, card INTEGER NOT NULL, status TEXT NOT NULL, PRIMARY KEY(time, point)) WITHOUT ROWID');
  };


  // table name
  var table = function(t) {
    var d = (typeof t === 'number')? new Date(t) : t;
    return 'date_'+d.getDate()+'_'+(d.getMonth()+1)+'_'+d.getFullYear();
  };


  // create tables
  var create = function(start, end) {
    console.log('[storage:create] '+start+' -> '+end);
    for(var d=z.date(start); d<=new Date(end); d.setDate(d.getDate()+1))
      db.run('CREATE TABLE IF NOT EXISTS '+table(d)+'(point TEXT NOT NULL, time INTEGER NOT NULL, card INTEGER NOT NULL, status TEXT NOT NULL, PRIMARY KEY(point, time)) WITHOUT ROWID');
  };


  // clear data
  var clear = function(start, end) {
    console.log('[storage:clear] '+start+' -> '+end);
    for(var d=z.date(start); d<=new Date(end); d.setDate(d.getDate()+1)) {
      var tab = table(d);
      db.run('DELETE FROM '+tab+' WHERE time>=? AND time<=?', start, end, function() {
        db.get('SELECT COUNT(*) FROM '+tab, function(err, row) {
          if(row['COUNT(*)'] === 0) db.run('DROP TABLE IF EXISTS '+tab);
        });
      });
    }
  };


  // get data counts (a point)
  var count = function(dst, start, end, p) {
    console.log('[storage:count] '+start+' -> '+end+' .'+p);
    for(var d=z.date(start); d<=new Date(end); d.setDate(d.getDate()+1))
      db.all('SELECT status, COUNT(*) FROM '+table(d)+' WHERE point=? GROUP BY status', p, function(err, rows) {
        _.forEach(rows, function(r) {
          if(!dst[r.status]) dst[r.status] = 0;
          dst[r.status] += r['COUNT(*)'];
        });
      });
  };


  // get data (a point)
  // dst = {time: [], card: [], status: []}
  var get = function(dst, start, end, p) {
    console.log('[storage:get] '+start+' -> '+end+' .'+p);
    for(var d=z.date(start); d<=new Date(end); d.setDate(d.getDate()+1))
      db.all('SELECT * FROM '+table(d)+' WHERE time>=? AND time<=? AND point=? ORDER BY time ASC', start, end, p, function(err, rows) {
        if(!err) z.group(dst, rows, ['time', 'card', 'status']);
      });
  };


  // put data (a point)
  // pvs = {time: [], card: [], status: []}
  var put = function(pvs, p) {
    console.log('[storage:put] '+pvs.time[0]+' -> '+_.last(pvs.time)+' .'+p);
    create(pvs.time[0], _.last(pvs.time));
    for(var i=0; i<pvs.time.length; i++)
      db.run('INSERT INTO '+table(pvs.time[i])+'(point, time, card, status) VALUES (?, ?, ?, ?)', p, pvs.time[i], pvs.card[i], pvs.status[i]);
  };



  // status description
  o.status = function() {
    console.log('[storage.status]');
    return status;
  };


  // clear data
  o.clear = function(start, end, fn) {
    console.log('[storage.clear]');
    db.serialize(function() {
      clear(Math.max(start, c.start), end);
      db.run('VACUUM', fn);
    });
  };


  // count data
  // rs = {point: {start, end}}
  o.count = function(rs, fn) {
    console.log('[storage.count]');
    db.serialize(function() {
      var vs = {};
      for(var p in rs)
        count(vs[p] = vs[p] || {}, Math.max(rs[p].start, c.start), rs[p].end, p);
      db.run('PRAGMA no_op', function() {
        if(fn) fn(vs);
      });
    });
  };


  // get data
  // rs = {point: {start, end}}
  o.get = function(rs, fn) {
    console.log('[storage.get]');
    db.serialize(function() {
      var vs = {};
      for(var p in rs)
        get(vs[p] = vs[p] || {}, Math.max(rs[p].start, c.start), rs[p].end, p);
      db.run('PRAGMA no_op', function() {
        if(fn) fn(vs);
      });
    });
  };


  // put data
  // vs = {point:{time: [], card: [], status: []}}
  o.put = function(vs, fn) {
    console.log('[storage.put]');
    db.serialize(function() {
      for(var p in vs)
        if(vs[p].time && vs[p].time.length>0) put(vs[p], p);
      db.run('PRAGMA no_op', function() {
        if(fn) fn();
      });
    });
  };


  // add data with check (one row)
  // pv = {time, card, point, status}
  o.add = function(pv, fn) {
    db.serialize(function() {
      create(pv.time, pv.time);
      var tab = table(pv.time);
      console.log('[storage.add] .'+pv.point+' t'+pv.time+' '+pv.card+' :'+pv.status);
      db.get('SELECT COUNT(*) FROM '+tab+' WHERE card=?', pv.card, function(err, row) {
        pv.status = pv.status!=='e'? ( err || row['COUNT(*)']<c.ndup? 'v' : 'i' ) : 'e';
        db.run('INSERT INTO '+tab+'(point, time, card, status) VALUES (?, ?, ?, ?)', pv.point, pv.time, pv.card, pv.status);
        if(fn) fn(status[pv.status]);
      });
    });
  };


  // close module
  o.close = db.close;



  // prepare
  if(!c.start) c.start = _.now();

  // ready!
  console.log('storage ready!');
  return o;
};
