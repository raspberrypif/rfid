// @wolfram77


// required modules
var EventEmitter = require('events').EventEmitter;
var sqlite3 = require('sqlite3').verbose();


// config
var file = 'data/storage.db';
var repeat = 1;


// initialize
console.log('pi-snax-storage');
var o = new EventEmitter();
var db = new sqlite3.Database(file);
module.exports = o;



// get date table name
var dateTable = function(t) {
  return 'date_'+t.getDate()+'_'+(t.getMonth()+1)+'_'+t.getFullYear();
};


// remove data (one table)
var removeOne = function(table, start, end) {
  db.serialize(function() {
    db.run('DELETE FROM '+table+' WHERE time>=? AND time<=?', start, end);
    db.get('SELECT * FROM '+table, function(err, row) {
      if(typeof row === 'undefined') db.run('DROP TABLE '+table);
    });
  });
};


// get data (one table)
var getOne = function(table, start, end, arr) {
  db.all('SELECT * FROM '+table+' WHERE time>=? AND time<=? ORDER BY ASC', start, end, function(err, rows) {
    if(rows.length > 0) arr.push.apply(arr, rows);
  });
};


// add data (one record)
var addOne = function(val, arr) {
  var table = dateTable(val.time);
  db.get('SELECT COUNT(*) FROM '+table+' WHERE card=?', val.card, function(err, row) {
    if(row <= repeat) db.run('INSERT INTO '+table+'(card, point, time) VALUES (?, ?, ?)', val.card, val.point, val.time);
    else arr.push(val);
  });
};


// create date tables
var dateCreate = function(start, end) {
  for(var t=new Date(start.getTime()); t<=end; t.setDate(t.getDate()+1)) {
    db.run('CREATE TABLE IF NOT EXISTS '+dateTable(t)+'(card INTEGER, point INTEGER, time DATETIME)');
  }
};



// remove data from storage
o.remove = function(start, end, fn) {
  db.serialize(function() {
    for(var t=new Date(start.getTime()); t<=end; t.setDate(t.getDate()+1))
      removeOne(dateTable(t), start, end);
    db.run('VACUUM');
  });
  if(typeof fn !== 'undefined') fn();
};
event.on('remove', o.remove);


// get data from storage
o.get = function(start, end, fn) {
  var ans = [];
  for(var t=new Date(start.getTime()); t<=end; t.setDate(t.getDate()+1))
    getOne(dateTable(t), start, end, ans);
  if(typeof fn !== 'undefined') fn(ans);
};
event.on('get', o.get);


// add data to storage
o.add = function(vals, fn) {
  var ans = [];
  fn = fn || function(arr) {};
  db.serialize(function() {
    dateCreate(vals[0].time, vals[vals.length-1].time);
    for(var i=0; i<vals.length; i++)
      addOne(vals[i], ans);
  });
};
event.on('add', function(vals, fn) {
});


// close module
o.close = db.close;


// 
