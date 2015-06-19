// @wolfram77


// required modules
var express = require('express');
var bodyParser = require('body-parser');
var _ = require('lodash');



// init config
var config = require('./modules/config.js')('data/config.json');
var cv = config.get();
var c = cv.index;

// init parts
var reader = require('./modules/reader.js')(cv.reader);
var storage = require('./modules/storage.js')(cv.storage);
var group = require('./modules/group.js')(cv.group, config, storage);


// init express
var app = express();


// handle form, json request
app.use(bodyParser.urlencoded({'extended': false}));
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
  config.set(p.val);
  res.send('ok');
});



// reader.green interface
app.all('/api/reader/green', function(req, res) {
  var p = req.body;
  if(!p) { res.send('err'); return; }
  reader.green(p.dur);
  res.send('ok');
});


// reader.beep interface
app.all('/api/reader/beep', function(req, res) {
  var p = req.body;
  if(!p) { res.send('err'); return; }
  reader.beep(p.dur);
  res.send('ok');
});


// reader.res interface
app.all('/api/reader/res', function(req, res) {
  var p = req.body;
  if(!p) { res.send('err'); return; }
  reader.res(p.res);
  res.send('ok');
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
  storage.get(p.req, function(res) {
    res.send(res);
  });
});


// storage.put interface
app.all('/api/storage/put', function(req, res) {
  var p = req.body;
  if(!p) { res.send('err'); return; }
  storage.put(p.req, function() {
    res.send('ok');
  });
});



// group.point interface
app.all('/api/group/point', function(req, res) {
  res.send({'point': group.point()});
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
  if(req.accepts('html')) res.sendFile(__dirname+'/assets/404.html');
  else res.send({'error': 'not found'});
});



// start server
var server = app.listen(c.port, function() {
  console.log('ready!');
});



// handle card
reader.on('card', function(cbits, card) {
  console.log('['+cbits+'] : '+card);
  storage.add({'time': _.now(), 'point': 'A', 'card': card}, function(valid) {
    if(valid) { reader.res('vld'); console.log('valid'); }
    else { reader.res('inv'); console.log('invalid!'); }
  });
});



// cleanup
process.on('SIGINT', function() {
  server.close();
  reader.close();
  storage.close();
});
