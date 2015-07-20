// @wolfram77
// TEST - test program (reader only)


// required modules
var express = require('express');
var reader = require('./modules/reader')({
  "card": {
    "types": [26, 35],
    "dread": 200,
    "mbits": 8
  },
  "action": {
    "dvld": 400,
    "dinv": 1000,
    "derr": 400,
    "dbeep": 200,
    "dgreen": 200
  },
  "drun": {
    "start": 0,
    "end": 86400000
  }
});



// init express
var app = express();



// static directory
app.use(express.static(__dirname+'/assets'));

// invalid request
app.use(function(req, res, next){
  res.status(404);
  console.log('BAD REQ: '+req.url);
});



// start server
var server = app.listen(80, function() {
  console.log('ready!');
});



// handle card
reader.on('card', function(cbits, card, status) {
  console.log('['+cbits+'] : '+card+' | '+status);
});



// cleanup
process.on('SIGINT', function() {
  reader.close();
  server.close();
});
