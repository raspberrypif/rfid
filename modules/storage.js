// @wolfram77


// required modules
var EventEmitter = require('events').EventEmitter;
var sqlite3 = require('sqlite3').verbose();



// initialize
module.exports = function(c) {
  var o = new EventEmitter();

  // init
  var db = new sqlite3.Database(c.file);


  // table name
  var table = function(t) {
    return 'date_'+t.getDate()+'_'+(t.getMonth()+1)+'_'+t.getFullYear();
  };


  // table exists?
  var exists = function(tab, fn) {
    db.get('SELECT COUNT(*) FROM sqlite_master WHERE type=? AND name=?', 'table', tab, function(err, row) {
      if(row['COUNT(*)'] === 1 && fn) fn();
    });
  };


  // create tables
  var create = function(start, end) {
    for(var t=new Date(start.getTime()); t<=end; t.setDate(t.getDate()+1)) {
      var tab = table(t);
      db.run('CREATE TABLE IF NOT EXISTS '+tab+'(card INTEGER, point INTEGER, time DATETIME)');
      db.run('CREATE TABLE IF NOT EXISTS '+tab+'_inv(card INTEGER, point INTEGER, time DATETIME)');
    }
  };


  // clear data (one table)
  var clearone = function(tab, start, end) {
    exists(tab, function() {
      db.run('DELETE FROM '+tab+' WHERE time>=? AND time<=?', start, end);
      db.get('SELECT COUNT(*) FROM '+tab, function(err, row) {
        if(row['COUNT(*)'] === 0) db.run('DROP TABLE '+tab);
      });
    });
  };


  // get data (one table)
  var getone = function(tab, start, end, res) {
    db.all('SELECT * FROM '+tab+' WHERE time>=? AND time<=? ORDER BY ASC', start, end, function(err, rows) {
      if(!err) res.push.apply(res, rows);
    });
  };


  // put data (one record)
  var putone = function(v, inv) {
    var tab = table(v.time);
    db.get('SELECT COUNT(*) FROM '+tab+' WHERE card=?', v.card, function(err, row) {
      if(row['COUNT(*)'] >= c.repeat) {
        tab += '_inv';
        inv.push(v);
      }
      db.run('INSERT INTO '+tab+'(card, point, time) VALUES (?, ?, ?)', v.card, v.point, v.time);
    });
  };



  // clear data from storage
  o.clear = function(type, start, end, fn) {
    type = (type === 'inv')? '_inv' : '';
    db.serialize(function() {
      for(var t=new Date(start.getTime()); t<=end; t.setDate(t.getDate()+1))
        clearone(table(t)+type, start, end);
      db.run('VACUUM', fn);
    });
  };


  // get data from storage
  o.get = function(type, start, end, fn) {
    var vals = [];
    type = (type === 'inv')? '_inv' : '';
    db.serialize(function() {
      for(var t=new Date(start.getTime()); t<=end; t.setDate(t.getDate()+1))
        getone(table(t)+type, start, end, vals);
      db.run('PRAGMA no_op', function() {
        if(fn) fn(vals);
      });
    });
  };


  // put data to storage
  o.put = function(vals, fn) {
    var inv = [];
    db.serialize(function() {
      create(vals[0].time, vals[vals.length-1].time);
      for(var i=0; i<vals.length; i++)
        putone(vals[i], inv);
      db.run('PRAGMA no_op', function() {
        if(fn) fn(inv);
      });
    });
  };


  // close module
  o.close = db.close;



  // ready!
  console.log('storage ready!');
  return o;
};
