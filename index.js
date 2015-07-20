// @wolfram77
// INDEX - main program
// http - /, /api/*


// required modules
var express = require('express');
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose();
var _ = require('lodash');



// load config
var config = require('./modules/config')('data/config.json');
var cv = config.get();
var c = cv.index;

// init express, database
var app = express();
app.use(bodyParser.urlencoded({'extended': true}));
app.use(bodyParser.json());
var db = new sqlite3.Database(c.db);

// load parts
if(c.dev) var reader = require('./modules/reader')(cv.reader);
var tap = require('./modules/tap')(cv.tap, db);
var group = require('./modules/group')(cv.group, tap);
var z = require('./modules/zed')();



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



// reader.card interface
app.all('/api/reader/card', function(req, res) {
  var p = z.httpreq(req);
  if(!p.card) { res.json('err'); return; }
  if(c.dev) reader.card(parseFloat(p.card), parseFloat(p.cbits));
  res.json('ok');
});


// reader.action interface
app.all('/api/reader/action', function(req, res) {
  var p = z.httpreq(req);
  if(!p.act) { res.json('err'); return; }
  if(c.dev) reader.action(p.act, p.dur);
  res.json('ok');
});



// tap.statusinfo interface
app.all('/api/tap/statusinfo', function(req, res) {
  res.json(tap.statusinfo());
});

// tap.clear interface
app.all('/api/tap/clear', function(req, res) {
  var p = req.body;
  if(!p) { res.json('err'); return; }
  tap.clear(p.start, p.end, function() {
    res.json('ok');
  });
});

// tap.count interface
app.all('/api/tap/count', function(req, res) {
  var p = req.body;
  if(!p) { res.json('err'); return; }
  tap.count(p, function(fres) {
    res.json(fres);
  });
});

// tap.get interface
app.all('/api/tap/get', function(req, res) {
  var p = req.body;
  if(!p) { res.json('err'); return; }
  tap.get(p, function(vs) {
    res.json(vs);
  });
});

// tap.put interface
app.all('/api/tap/put', function(req, res) {
  var p = req.body;
  if(!p) { res.json('err'); return; }
  tap.put(p, function() {
    res.json('ok');
  });
});

// tap.add interface
app.all('/api/tap/add', function(req, res) {
  var p = req.body;
  if(!p) { res.json('err'); return; }
  tap.add(p, function(status) {
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
  console.log(cv.group.point+' ready!');
  if(c.dev) reader.action('beep', 2000);
});



// handle card
if(c.dev) reader.on('card', function(cbits, card, status) {
  tap.add(cv.group.point, _.now(), card, status, function(status) {
    reader.action(status);
  });
});



// cleanup
process.on('SIGINT', function() {
  if(c.dev) reader.close();
  server.close();
  group.close();
  db.close();
});
