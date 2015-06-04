// @wolfram77


// required modules
var EventEmitter = require('events').EventEmitter;
var sqlite3 = require('sqlite3').verbose();
var _ = require('lodash');



// initialize
module.exports = function(c) {
  var o = new EventEmitter();

  // init
  var db = new sqlite3.Database(c.file);


  // table name (date, state)
  var table = function(d, s) {
    return 'date_'+d.getDate()+'_'+(d.getMonth()+1)+'_'+d.getFullYear()+(s? '_'+s:'');
  };


  // table exists?
  var exists = function(tab, fn) {
    db.get('SELECT COUNT(*) FROM sqlite_master WHERE type=? AND name=?', 'table', tab, function(err, row) {
      if(row['COUNT(*)'] === 1 && fn) fn();
    });
  };


  // create tables
  var create = function(start, end) {
    for(var d=new Date(start.getTime()); d<=end; d.setDate(d.getDate()+1)) {
      db.run('CREATE TABLE IF NOT EXISTS '+table(d, 'vld')+'(time DATETIME, point TEXT, card INTEGER)');
      db.run('CREATE TABLE IF NOT EXISTS '+table(d, 'inv')+'(time DATETIME, point TEXT, card INTEGER)');
    }
  };


  // delete tables
  var delete = function(start, end) {
    for(var d=new Date(start.getTime()); d<=end; d.setDate(d.getDate()+1)) {
      db.run('DROP TABLE IF EXISTS '+table(d, 'vld'));
      db.run('DROP TABLE IF EXISTS '+table(d, 'inv'));
    }
  };


  // convert from rows format
  var fromrows = function(rows, res) {
    for(var i=0; i<rows.length; i++)
      res.push([rows[i].time.getTime(), rows[i].card]);
    return res;
  };


  // get data (one point & state)
  var getone = function(start, end, p, s, res) {
    for(var d=new Date(start.getTime()); d<=end; d.setDate(d.getDate()+1)) {
      db.all('SELECT * FROM '+table(d, s)+' WHERE time>=? AND time<=? AND point=? ORDER BY ASC', start, end, p, function(err, rows) {
        if(!err) fromrows(rows, res);
      });
    }
  };


  // convert to rows format
  var torows = function(vals, p, res) {
    for(var i=0; i<vals.length; i++)
      res.push({'time': new Date(vals[i][0]), 'point': p, 'card': vals[i][1]});
    return res;
  };


  // put data (one point & state)
  var putone = function(vals, p, s) {
    var rows = torows(vals, p, []);
    create(rows[0].time, rows[rows.length-1].time);
    for(var i=0; i<rows.length; i++)
      db.run('INSERT INTO '+table(rows[i].time, s)+'(time, point, card) VALUES, (?, ?, ?)', rows[i].time, rows[i].point, rows[i].card);
  };


  // add validate (one record)
  var addvalidate = function(time, card, fn) {
    db.get('SELECT COUNT(*) FROM '+table(time, 'vld')+' WHERE card=?', card, function(err, row) {
      if(err || row['COUNT(*)'] < c.repeat) fn(true);
      else fn(false);
    });
  };



  // delete data
  o.delete = function(start, end, fn) {
    db.serialize(function() {
      delete(start, end);
      db.run('VACUUM', fn);
    });
  };


  // get data from storage
  o.get = function(req, fn) {
    var res = {};
    db.serialize(function() {
      for(var p in req) {
        var pv = req[p], rpv = {};
        for(var s in pv) {
          var sv = pv[s], rsv = [];
          getone(sv.start, sv.end, p, s, rsv);
          rpv[s] = rsv;
        }
        res[p] = rpv;
      }
      db.run('PRAGMA no_op', function() {
        if(fn) fn(res);
      });
    });
  };


  // put data to storage
  o.put = function(vals, fn) {
    db.serialize(function() {
      for(var p in vals) {
        var pv = vals[p];
        for(var s in pv)
          putone(pv[s], p, s);
      }
      db.run('PRAGMA no_op', function() {
        if(fn) fn();
      });
    });
  };


  // add data with check (one row)
  o.add = function(time, point, card, fn) {
    addvalidate(time, card, function(valid) {
      var tab = table(time, valid? 'vld' : 'inv');
      db.run('INSERT INTO '+tab+'(time, point, card) VALUES (?, ?, ?)', time, point, card);
      if(fn) fn(valid);
    });
  };


  // close module
  o.close = db.close;



  // ready!
  console.log('storage ready!');
  return o;
};
