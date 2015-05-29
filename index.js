// @wolfram77


// required modules
var _ = require('lodash');
var express = require('express');
var bodyParser = require('body-parser');
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
  var p = req.body;
  _.assign(config.val, p.val);
  res.send('ok');
});



// reader.green interface
app.all('/api/reader/green', function(req, res) {
  var p = req.body;
  reader.green(p.dur);
  res.send('ok');
});


// reader.beep interface
app.all('/api/reader/beep', function(req, res) {
  var p = req.body;
  reader.beep(p.dur);
  res.send('ok');
});


// reader.tellvld interface
app.all('/api/reader/tellvld', function(req, res) {
  reader.tellvld();
  res.send('ok');
});


// reader.tellinv interface
app.all('/api/reader/tellinv', function(req, res) {
  reader.tellinv();
  res.send('ok');
});



// storage.clear interface
app.all('/api/storage/clear', function(req, res) {
  var p = req.body;
  storage.clear(p.type, p.start, p.end, function() {
    res.send('ok');
  });
});


// storage.get interface
app.all('/api/storage/get', function(req, res) {
  var p = req.body;
  storage.get(p.type, p.start, p.end, function(vals) {
    res.send(vals);
  });
});


// storage.put interface
app.all('/api/storage/put', function(req, res) {
  var p = req.body;
  storage.put(p.vals, function(inv) {
    res.send(inv);
  });
});



// static directory
app.use(express.static(__dirname+'/assets'));

// invalid request
app.use(function(req, res, next){
  res.status(404);
  if(req.accepts('html')) res.sendFile(__dirname+'/assets/404.html');
  else res.send({'error': 'not found'});
});



// start server
var server = app.listen(80, function() {
  console.log('pi-rfid ready!');
});



// cleanup
process.on('SIGINT', function() {
  server.close();
  reader.close();
  storage.close();
});
