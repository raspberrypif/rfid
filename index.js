// @wolfram77


// required modules
var express = require('express');
// var reader = require('./modules/reader.js');
var storage = require('./modules/storage.js');


// config



// initialize
var app = express();
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


// beep interface
app.get('/api/beep', function(req, res) {
  // reader.emit('beep');
  res.send('0');
});


// static directory
app.use(express.static(__dirname+'/assets'));


// start server
var server = app.listen(80, function() {
  console.log('pi-snax');
});



// cleanup
process.on('SIGINT', function() {
  server.close();
  // reader.emit('close');
  storage.emit('close');
});
