// @wolfram77


// required modules
var _ = require('lodash');
var express = require('express');
var config = require('./modules/config.js')('data/config.json');
var reader = require('./modules/reader.js')(config.val.reader);
var storage = require('./modules/storage.js')(config.val.storage);


// initialize
var app = express();
var c = config.val.index;
reader.on('card', function(cbits, card) {
  storage.emit('put', [{'time': new Date(), 'point': 0, 'card': card}], function(inv) {
    console.log(JSON.stringify(inv));
    if(inv.length > 0) { reader.emit('beep'); console.log('invalid!'); }
  });
});


// main page
app.get('/', function(req, res) {
  res.sendFile(__dirname+'/assets/index.html');
});


// config get interface
app.get('/api/config', function(req, res) {
  res.json(config.val);
});


// config put interface
app.post('/api/config', function(req, res) {
  res.json(config.val);
});


// reader.green interface
app.all('/api/reader/green', function(req, res) {
  reader.emit('green');
  res.send('0');
});


// reader.beep interface
app.all('/api/reader/beep', function(req, res) {
  reader.emit('beep');
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
  reader.close();
  storage.close();
});
