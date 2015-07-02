// @wolfram77
// STORAGE - maintains info about card swipes
// db - dd_mm_yyyy - time, point, card, status
// () - clear, get, put, add


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



  // table name
  var table = function(t) {
    var d = new Date(t);
    return 'date_'+d.getDate()+'_'+(d.getMonth()+1)+'_'+d.getFullYear();
  };


  // create tables
  var create = function(start, end) {
    console.log('[storage:create] '+start+' -> '+end);
    for(var d=z.day(start); d<=new Date(end); d.setDate(d.getDate()+1)) {
      db.run('CREATE TABLE IF NOT EXISTS '+table(d.getTime())+'(time INTEGER, card INTEGER, point TEXT, status TEXT)');
    }
  };


  // clear data
  var clear = function(start, end) {
    console.log('[storage:clear] '+start+' -> '+end);
    for(var d=z.day(start); d<=new Date(end); d.setDate(d.getDate()+1)) {
      var tab = table(d.getTime());
      db.run('DELETE FROM '+tab+' WHERE time>=? AND time<=?', start, end, function() {
        db.get('SELECT COUNT(*) FROM '+tab, function(err, row) {
          if(row['COUNT(*)'] === 0) db.run('DROP TABLE IF EXISTS '+tab);
        });
      });
    }
  };


  // get data (a point)
  // dst = {time: [], card: [], status: []}
  var get = function(dst, start, end, p) {
    console.log('[storage:get] '+start+' -> '+end+' .'+p);
    for(var d=z.day(start); d<=new Date(end); d.setDate(d.getDate()+1)) {
      console.log('[storage:get|for] '+d);
      db.all('SELECT * FROM '+table(d.getTime())+' WHERE time>=? AND time<=? AND point=? ORDER BY time ASC', start, end, p, function(err, rows) {
        if(!err) z.group(dst, rows, ['time', 'card', 'status']);
      });
    }
  };


  // put data (a point)
  // pvs = {time: [], card: [], status: []}
  var put = function(pvs, p) {
    console.log('[storage:put] .'+p);
    create(pvs.time[0], _.last(pvs.time));
    for(var i=0; i<pvs.time.length; i++)
      db.run('INSERT INTO '+table(pvs.time[i])+'(time, card, point, status) VALUES (?, ?, ?, ?)', pvs.time[i], pvs.card[i], p, pvs.status[i]);
  };



  // status description
  o.status = {
    'e': 'error',
    'v': 'valid',
    'i': 'invalid'
  };



  // clear data
  o.clear = function(start, end, fn) {
    console.log('[storage.clear]');
    db.serialize(function() {
      clear(Math.max(start, c.start), end);
      db.run('VACUUM', fn);
    });
  };


  // get data
  // rs = {point: {start, end}}
  o.get = function(rs, fn) {
    console.log('[storage.get]');
    var vs = {};
    db.serialize(function() {
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
        put(vs[p], p);
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
      console.log('[storage.add] '+JSON.stringify(pv));
      db.get('SELECT COUNT(*) FROM '+tab+' WHERE card=?', pv.card, function(err, row) {
        pv.status = pv.status!=='e'? ( err || row['COUNT(*)']<c.ndup? 'v' : 'i' ) : 'e';
        db.run('INSERT INTO '+tab+'(time, card, point, status) VALUES (?, ?, ?, ?)', pv.time, pv.card, pv.point, pv.status);
        if(fn) fn(o.status[pv.status]);
      });
    });
  };


  // close module
  o.close = db.close;



  // prepare
  if(c.start === 0) c.start = _.now();

  // ready!
  console.log('storage ready!');
  return o;
};
