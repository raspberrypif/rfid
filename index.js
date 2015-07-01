// @wolfram77
// INDEX - main program
// http - clear, get, put, add


// required modules
var express = require('express');
var bodyParser = require('body-parser');
var _ = require('lodash');



// init config
var config = require('./modules/config')('data/config.json');
var cv = config.get();
var c = cv.index;

// init parts
if(c.dev) var reader = require('./modules/reader')(cv.reader);
var storage = require('./modules/storage')(cv.storage);
var group = require('./modules/group')(cv.group, storage);


// init express
var app = express();


// handle form, json request
app.use(bodyParser.urlencoded({'extended': true}));
app.use(bodyParser.json());


// index page
app.all('/', function(req, res) {
  res.sendFile(__dirname+'/assets/index.html');
});


// config.get interface
app.all('/api/config/get', function(req, res) {
  res.json(config.get());
});


// config.set interface
app.all('/api/config/set', function(req, res) {
  var p = req.body;
  if(!p) { res.send('err'); return; }
  config.set(p);
  res.send('ok');
});



// reader.action interface
app.all('/api/reader/action', function(req, res) {
  var p = _.assign({}, req.body, req.query);
  if(!p.act) { res.send('err'); return; }
  if(c.dev) reader.action(p.act, p.dur);
  res.send('ok');
});



// storage.status interface
app.all('/api/storage/status', function(req, res) {
  res.send(storage.status);
});


// storage.clear interface
app.all('/api/storage/clear', function(req, res) {
  var p = req.body;
  if(!p) { res.send('err'); return; }
  storage.clear(p.start, p.end, function() {
    res.send('ok');
  });
});


// storage.get interface
app.all('/api/storage/get', function(req, res) {
  var p = req.body;
  if(!p) { res.send('err'); return; }
  storage.get(p.rs, function(vs) {
    res.send(vs);
  });
});


// storage.put interface
app.all('/api/storage/put', function(req, res) {
  var p = req.body;
  if(!p) { res.send('err'); return; }
  storage.put(p.vs, function() {
    res.send('ok');
  });
});



// group.point interface
app.all('/api/group/point', function(req, res) {
  res.json(group.point());
});


// group.points interface
app.all('/api/group/points', function(req, res) {
  res.send(group.points());
});


// group.get interface
app.all('/api/group/get', function(req, res) {
  var p = req.body;
  if(!p) { res.send('err'); return; }
  res.send(group.get(p.ps));
});


// group.set interface
app.all('/api/group/set', function(req, res) {
  var p = req.body;
  if(!p) { res.send('err'); return; }
  group.set(p.pds);
  res.send('ok');
});


// group.clear interface
app.all('/api/group/clear', function(req, res) {
  var p = req.body;
  if(!p) { res.send('err'); return; }
  group.clear(p.ps);
  res.send('ok');
});


// group.card interface
app.all('/api/group/card', function(req, res) {
  var p = req.body;
  if(!p) { res.send('err'); return; }
  group.card(p.time, p.card, function(valid) {
    res.send({'valid': valid});
  });
});


// group.sync interface
app.all('/api/group/sync', function(req, res) {
  group.sync(function(es) {
    res.send({'es': es});
  });
});



// static directory
app.use(express.static(__dirname+'/assets'));

// invalid request
app.use(function(req, res, next){
  res.status(404);
  console.log('BAD REQ: '+req.url);
  if(req.accepts('html')) res.sendFile(__dirname+'/assets/404.html');
  else res.send({'error': 'not found'});
});



// start server
var server = app.listen(c.port, function() {
  console.log('ready!');
  if(c.dev) reader.action('beep', 2000);
});



// handle card
if(c.dev) reader.on('card', function(cbits, card, status) {
  console.log('['+cbits+'] : '+card+' | '+status);
  storage.add(_.now(), card, cv.group.point, status, function(status) {
    c.count++;
    reader.action(status);
    console.log(status);
  });
});



// cleanup
process.on('SIGINT', function() {
  if(c.dev) reader.close();
  storage.close();
  server.close();
  group.close();
});
