// @wolfram77
// INDEX - main program
// http - clear, get, put, add


// required modules
var express = require('express');
var bodyParser = require('body-parser');
var z = require('./modules/zed')();
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
  var p = z.httpreq(req);
  if(!p) { res.json('err'); return; }
  config.set(p);
  res.json('ok');
});


// config.load interface
app.all('/api/config/load', function(req, res) {
  config.load(function(val) {
    res.json(val);
  });
});


// config.save interface
app.all('/api/config/save', function(req, res) {
  config.save(function() {
    res.json('ok');
  });
});


// reader.action interface
app.all('/api/reader/action', function(req, res) {
  var p = z.httpreq(req);
  if(!p.act) { res.json('err'); return; }
  if(c.dev) reader.action(p.act, p.dur);
  res.json('ok');
});



// storage.status interface
app.all('/api/storage/status', function(req, res) {
  res.json(storage.status);
});


// storage.clear interface
app.all('/api/storage/clear', function(req, res) {
  var p = req.body;
  if(!p) { res.json('err'); return; }
  storage.clear(p.start, p.end, function() {
    res.json('ok');
  });
});


// storage.get interface
app.all('/api/storage/get', function(req, res) {
  var p = req.body;
  if(!p) { res.json('err'); return; }
  storage.get(p, function(vs) {
    res.json(vs);
  });
});


// storage.put interface
app.all('/api/storage/put', function(req, res) {
  var p = req.body;
  if(!p) { res.json('err'); return; }
  storage.put(p, function() {
    res.json('ok');
  });
});


// storage.add interface
app.all('/api/storage/add', function(req, res) {
  var p = req.body;
  if(!p) { res.json('err'); return; }
  storage.add(p, function(status) {
    res.json(status);
  });
});



// group.point interface
app.all('/api/group/point', function(req, res) {
  res.json(group.point());
});


// group.points interface
app.all('/api/group/points', function(req, res) {
  res.json(group.points());
});


// group.get interface
app.all('/api/group/get', function(req, res) {
  var p = req.body;
  if(!p) { res.json('err'); return; }
  res.json(group.get(p));
});


// group.set interface
app.all('/api/group/set', function(req, res) {
  var p = req.body;
  if(!p) { res.json('err'); return; }
  group.set(p);
  res.json('ok');
});


// group.clear interface
app.all('/api/group/clear', function(req, res) {
  var p = req.body;
  if(!p) { res.json('err'); return; }
  group.clear(p);
  res.json('ok');
});


// group.sync interface
app.all('/api/group/sync', function(req, res) {
  group.sync(function(es) {
    res.json(es);
  });
});



// static directory
app.use(express.static(__dirname+'/assets'));

// invalid request
app.use(function(req, res, next){
  res.status(404);
  console.log('BAD REQ: '+req.url);
  if(req.accepts('html')) res.sendFile(__dirname+'/assets/404.html');
  else res.json('err');
});



// start server
var server = app.listen(c.port, function() {
  console.log('ready!');
  if(c.dev) reader.action('beep', 2000);
});



// handle card
if(c.dev) reader.on('card', function(cbits, card, status) {
  console.log('['+cbits+'] : '+card+' | '+status);
  storage.add({'time': _.now(), 'card': card, 'point': cv.group.point, 'status': status}, function(status) {
    reader.action(status);
    c.count++;
  });
});



// cleanup
process.on('SIGINT', function() {
  if(c.dev) reader.close();
  storage.close();
  server.close();
  group.close();
});
