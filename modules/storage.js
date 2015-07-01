// @wolfram77
// STORAGE - maintains info about card swipes
// db - dd_mm_yyyy - time, point, card, stat
// () - clear, get, put, add


// required modules
var EventEmitter = require('events').EventEmitter;
var sqlite3 = require('sqlite3').verbose();
var _ = require('lodash');
var z = require('./zed')();



// initialize
module.exports = function(c) {
  var o = new EventEmitter();

  // init
  var db = new sqlite3.Database(c.file);
  var daymillis = 86400000;



  // table name
  var table = function(t) {
    var d = new Date(t);
    return 'date_'+d.getDate()+'_'+(d.getMonth()+1)+'_'+d.getFullYear();
  };


  // create tables
  var create = function(start, end) {
    console.log('[storage:create] '+new Date(start)+' -> '+new Date(end));
    for(var d=start; d<=end; d+=daymillis)
      db.run('CREATE TABLE IF NOT EXISTS '+table(d)+'(time INTEGER, card INTEGER, point TEXT, status TEXT)');
  };


  // clear data
  var clear = function(start, end) {
    console.log('[storage:clear] '+new Date(start)+' -> '+new Date(end));
    for(var d=start; d<=end; d+=daymillis) {
      var tab = table(d);
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
    // console.log('[storage:get]');
    // console.log('[storage:get] '+new Date(start)+' -> '+new Date(end)+' . '+p);
    for(var d=start; d<=end; d+=daymillis) {
      db.all('SELECT * FROM '+table(d)+' WHERE time>=? AND time<=? AND point=? ORDER BY time ASC', start, end, p, function(err, rows) {
        // console.log(rows);
        if(!err) z.group(dst, rows, ['time', 'card', 'status']);
      });
    }
  };


  // put data (a point)
  // pvs = {time: [], card: [], status: []}
  var put = function(pvs, p) {
    console.log('[storage:put] . '+p);
    create(pvs.time[0], _.last(pvs.time));
    for(var i=0; i<pvs.time.length; i++)
      db.run('INSERT INTO '+table(pvs.time[i])+'(time, card, point, status) VALUES, (?, ?, ?, ?)', pvs.time[i], pvs.card[i], p, pvs.status[i]);
  };


  // add (one row)
  // r = {time, card, point, status}
  var add = function(r, fn) {
    var tab = table(r.time);
    console.log('[storage:add] '+JSON.stringify(r));
    db.get('SELECT COUNT(*) FROM '+tab+' WHERE card=?', r.card, function(err, row) {
      r.status = r.status!=='e'? ( err || row['COUNT(*)']<c.ndup? 'v' : 'i' ) : 'e';
      put({'time': [r.time], 'card': [r.card], 'status': [r.status]}, r.point);
      if(fn) fn(o.status[r.status]);
    });
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
  o.add = function(time, card, point, status, fn) {
    console.log('[storage.add]');
    add({'time': time, 'card': card, 'point': point, 'status': status}, fn);
  };


  // close module
  o.close = db.close;



  // ready!
  if(c.start === 0) c.start = _.now();
  console.log('storage ready!');
  return o;
};
