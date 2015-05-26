// @wolfram77


// required modules
var EventEmitter = require('events').EventEmitter;
var Gpio = require('onoff').Gpio;


// config
var ctimeout = 100;


// connections
var pdata0 = new Gpio(14, 'in', 'falling');
var pdata1 = new Gpio(15, 'in', 'falling');
var pgreen = new Gpio(18, 'out');
var pbeep = new Gpio(24, 'out');
pgreen.writeSync(1);
pbeep.writeSync(1);
// var pred = 23
// var phold = 25
// var pcard = 8


// initialize
var card = 0
var cbits = 0
var event = new EventEmitter();
module.exports = event;



// handle card data0 low
pdata0.watch(function(err, val) {
  card <<= 1
  cbits += 1
});


// handle card data1 low
pdata1.watch(function(err, val) {
  card = (card << 1) | 1
  cbits += 1
});


// handle beep request
event.on('beep', function(dur) {
  pbeep.writeSync(0);
  setTimeout(function() {
    pbeep.writeSync(1);
  }, dur || 2000);
});


// card read code
console.log('pi-snax-reader');
setInterval(function() {
  if(cbits > 0) setTimeout(function() {
    console.log('['+cbits+'] - '+card);
    event.emit('card', cbits, card);
    card = cbits = 0;
  }, ctimeout);
}, ctimeout);


// cleanup
event.on('close', function() {
  pdata0.unexport();
  pdata1.unexport();
});
