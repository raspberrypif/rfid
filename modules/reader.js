// @wolfram77


// required modules
var EventEmitter = require('events').EventEmitter;
var Gpio = require('onoff').Gpio;


// config
var greendur = 1000;
var beepdur = 2000;
var ctimeout = 100;
var minbits = 8;


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
console.log('pi-snax-reader');
var card = 0, cbits = 0;
var o = new EventEmitter();
module.exports = o;



// handle card data0 low
pdata0.watch(function(err, val) {
  card <<= 1;
  cbits += 1;
});


// handle card data1 low
pdata1.watch(function(err, val) {
  card = (card << 1) | 1;
  cbits += 1;
});


// get card value
var cardValue = function() {
  console.log('reader.card['+cbits+'] - '+card);
  if(cbits >= minbits) o.emit('card', cbits, card);
  card = cbits = 0;
};


// card read code
setInterval(function() {
  if(cbits > 0) setTimeout(cardValue, ctimeout);
}, ctimeout);



// handle green request
o.green = function(dur) {
  pgreen.writeSync(0);
  setTimeout(function() {
    pgreen.writeSync(1);
  }, dur || greendur);
};


// handle beep request
o.beep = function(dur) {
  pbeep.writeSync(0);
  setTimeout(function() {
    pbeep.writeSync(1);
  }, dur || beepdur);
};


// close module
o.close = function() {
  pdata0.unexport();
  pdata1.unexport();
};



// event handlers
event.on('green', o.green);
event.on('beep', o.beep);
