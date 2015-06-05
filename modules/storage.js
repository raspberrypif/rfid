// @wolfram77
// STORAGE - maintains info about card swipes
// db - <date>_<state> (date = dd_mm_yyyy) (state = vld | inv) - time, point, card
// () - clear, get, put, add


// required modules
var EventEmitter = require('events').EventEmitter;
var sqlite3 = require('sqlite3').verbose();
var _ = require('lodash');



// initialize
module.exports = function(c) {
  var o = new EventEmitter();

  // init
  var db = new sqlite3.Database(c.file);
  var daymillis = 86400000;


  // table name (time, state)
  var table = function(t, s) {
    var d = new Date(t);
    return 'date_'+d.getDate()+'_'+(d.getMonth()+1)+'_'+d.getFullYear()+(s? '_'+s:'');
  };


  // create tables
  var create = function(start, end) {
    for(var d=new Date(start); d<=new Date(end); d.setDate(d.getDate()+1)) {
      db.run('CREATE TABLE IF NOT EXISTS '+table(d.getTime(), 'vld')+'(time INTEGER, point TEXT, card INTEGER)');
      db.run('CREATE TABLE IF NOT EXISTS '+table(d.getTime(), 'inv')+'(time INTEGER, point TEXT, card INTEGER)');
    }
  };


  // clear tables (drop)
  var clear = function(start, end) {
    for(var d=new Date(start); d<=new Date(end); d.setDate(d.getDate()+1)) {
      db.run('DROP TABLE IF EXISTS '+table(d.getTime(), 'vld'));
      db.run('DROP TABLE IF EXISTS '+table(d.getTime(), 'inv'));
    }
  };


  // convert from rows format
  // psvs = [[time, card]]
  var fromrows = function(rows, psvs) {
    for(var i=0; i<rows.length; i++)
      psvs.push([rows[i].time, rows[i].card]);
    return psvs;
  };


  // get data (one point & state)
  // psvs = [[time, card]]
  var getone = function(start, end, p, s, psvs) {
    for(var d=new Date(start); d<=new Date(end); d.setDate(d.getDate()+1)) {
      db.all('SELECT * FROM '+table(d.getTime(), s)+' WHERE time>=? AND time<=? AND point=? ORDER BY ASC', start, end, p, function(err, rows) {
        if(!err) fromrows(rows, psvs);
      });
    }
  };


  // put data (one point & state)
  // psvs = [[time, card]]
  var putone = function(psvs, p, s) {
    create(psvs[0][0], psvs[psvs.length-1][0]);
    for(var i=0; i<psvs.length; i++)
      db.run('INSERT INTO '+table(psvs[i][0], s)+'(time, point, card) VALUES, (?, ?, ?)', psvs[i][0], p, psvs[i][1]);
  };


  // add validate (one row)
  var addvalidate = function(r, fn) {
    db.get('SELECT COUNT(*) FROM '+table(r.time, 'vld')+' WHERE card=?', r.card, function(err, row) {
      if(err || row['COUNT(*)'] < c.repeat) fn(true);
      else fn(false);
    });
  };



  // clear data
  o.clear = function(start, end, fn) {
    db.serialize(function() {
      delete(start, end);
      db.run('VACUUM', fn);
    });
  };


  // get data
  // req = {point:{start, end}}
  o.get = function(req, fn) {
    var pvs = {};
    db.serialize(function() {
      for(var p in req) {
        pvs[p] = {'vld':[], 'inv':[]};
        getone(req[p].start, req[p].end, p, 'vld', pvs[p].vld);
        getone(req[p].start, req[p].end, p, 'inv', pvs[p].inv);
      }
      db.run('PRAGMA no_op', function() {
        if(fn) fn(pvs);
      });
    });
  };


  // put data
  // pvs = {point:{state:[[time, card]]}}
  o.put = function(pvs, fn) {
    db.serialize(function() {
      for(var p in pvs) {
        putone(pvs.vld, p, 'vld');
        putone(pvs.inv, p, 'inv');
      }
      db.run('PRAGMA no_op', function() {
        if(fn) fn();
      });
    });
  };


  // add data with check (one row)
  // r = {time, point, card}
  o.add = function(r, fn) {
    addvalidate(r, function(valid) {
      var tab = table(r.time, valid? 'vld' : 'inv');
      db.run('INSERT INTO '+tab+'(time, point, card) VALUES (?, ?, ?)', r.time, r.point, r.card, function() {
        if(fn) fn(valid);
      });
    });
  };


  // close module
  o.close = db.close;



  // ready!
  console.log('storage ready!');
  return o;
};
