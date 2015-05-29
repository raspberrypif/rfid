// @wolfram77


// required modules
var EventEmitter = require('events').EventEmitter;
var sqlite3 = require('sqlite3').verbose();
var _ = require('lodash');


// initialize
module.exports = function(c) {
  var o = new EventEmitter();

  // init database
  var db = new sqlite3.Database(c.file);



  // get date table name
  var table = function(t) {
    return 'date_'+t.getDate()+'_'+(t.getMonth()+1)+'_'+t.getFullYear();
  };


  // do domething if table exists
  var exists = function(tab, fn) {
    db.get('SELECT name FROM sqlite_master WHERE type=? AND name=?', 'table', tab, function(err, row) {
      if(typeof row !== 'undefined' && fn) fn();
    });
  };


  // create date tables
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
        inv.push(_.clone(v));
      }
      console.log(tab);
      db.run('INSERT INTO '+tab+'(card, point, time) VALUES (?, ?, ?)', v.card, v.point, v.time);
    });
  };



  // clear data from storage
  o.clear = function(type, start, end, fn) {
    type = (type === 'inv')? '_inv' : '';
    db.serialize(function() {
      for(var t=new Date(start.getTime()); t<=end; t.setDate(t.getDate()+1))
        clearone(table(t)+type, start, end);
      db.run('VACUUM');
    });
    if(fn) fn();
  };


  // get data from storage
  o.get = function(type, start, end, fn) {
    var vld = [];
    type = (type === 'inv')? '_inv' : '';
    for(var t=new Date(start.getTime()); t<=end; t.setDate(t.getDate()+1))
      getone(table(t)+type, start, end, vld);
    if(fn) fn(vld);
  };


  // put data to storage
  o.put = function(vals, fn) {
    var inv = [];
    db.serialize(function() {
      create(vals[0].time, vals[vals.length-1].time);
      for(var i=0; i<vals.length; i++)
        putone(vals[i], inv);
    });
    console.log('storage:'+JSON.stringify(inv));
    if(fn) fn(inv);
  };


  // close module
  o.close = db.close;



  // event handling
  o.on('clear', o.clear);
  o.on('get', o.get);
  o.on('put', o.put);



  // ready!
  console.log('storage ready!');
  return o;
};
