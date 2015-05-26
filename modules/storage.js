// @wolfram77


// required modules
var EventEmitter = require('events').EventEmitter;
var sqlite3 = require('sqlite3').verbose();


// initialize
console.log('pi-snax-storage');
var event = new EventEmitter();
var db = new sqlite3.Database('storage.db');
module.exports = event;



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
var getOne = function(arr, table, start, end) {
  db.all('SELECT * FROM '+table+' WHERE time>=? AND time<=? ORDER BY ASC', start, end, function(err, rows) {
    if(rows.length > 0) arr.push.apply(arr, rows);
  });
};


// add data (one record)
var addOne = function(val, fn) {
  var table = dateTable(val.time);
  db.run('INSERT INTO '+table+'(card, point, time) VALUES (?, ?, ?)', val.card, val.point, val.time, function(err) {
    if(err !== null) fn(err, val);
  });
};


// create date tables
var dateCreate = function(start, end) {
  for(var t=new Date(start.getTime()); t<=end; t.setDate(t.getDate()+1)) {
    db.run('CREATE TABLE IF NOT EXISTS '+dateTable(t)+'(card INT PRIMARY KEY, point INTEGER, time DATETIME)');
  }
};



// remove data from storage
event.on('remove', function(start, end, fn) {
  for(var t=new Date(start.getTime()); t<=end; t.setDate(t.getDate()+1))
    removeOne(dateTable(t), start, end);
  if(typeof fn !== 'undefined') fn();
});


// get data from storage
event.on('get', function(start, end, fn) {
  var ans = [];
  for(var t=new Date(start.getTime()); t<=end; t.setDate(t.getDate()+1))
    getOne(ans, dateTable(t), start, end);
  if(typeof fn !== 'undefined') fn(ans);
});


// add data to storage
event.on('add', function(vals, fn) {
  fn = fn || function() {};
  db.serialize(function() {
    dateCreate(vals[0].time, vals[vals.length-1].time);
    for(var i=0; i<vals.length; i++)
      addOne(vals[i], fn);
  });
});


// cleanup
event.on('close', function() {
  db.close();
});
