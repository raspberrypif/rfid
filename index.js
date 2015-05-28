// @wolfram77


// required modules
var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var config = require('./modules/config.js')('data/config.json');
// var reader = require('./modules/reader.js');
// var storage = require('./modules/storage.js');


// config



// initialize
var app = express();
var db = new sqlite3.Database('data/storage.db');
/*
reader.on('card', function(cbits, card) {
  storage.emit('add', [{'time': new Date(), 'point': 0, 'card': card}], function(err, val) {
    reader.emit('beep');
    console.log(err);
  });
});
*/


// main page
app.get('/', function(req, res) {
  res.sendFile(__dirname+'/assets/index.html');
});


// config interface
app.get('/api/config', function(req, res) {
  res.json(config.val);
});


// reader.green interface
app.all('/api/reader/green', function(req, res) {
  // reader.emit('green');
  res.send('0');
});


// reader.beep interface
app.all('/api/reader/beep', function(req, res) {
  // reader.emit('beep');
  res.send('0');
});


// static directory
app.use(express.static(__dirname+'/assets'));


// start server
var server = app.listen(80, function() {
  console.log('pi-snax');
  db.get('SELECT COUNT(*) FROM temp', function(err, row) {
    console.log(JSON.stringify(row));
  });
});



// cleanup
process.on('SIGINT', function() {
  server.close();
  // reader.emit('close');
  // storage.emit('close');
});
