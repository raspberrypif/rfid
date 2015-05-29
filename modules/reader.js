// @wolfram77


// required modules
var EventEmitter = require('events').EventEmitter;
var Gpio = require('onoff').Gpio;


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
var card = 0, cbits = 0, c = {};
var o = new EventEmitter();
module.exports = function(config) {
  c = config;


  // get card value
  var cardValue = function() {
    console.log('reader.card['+cbits+'] - '+card);
    if(cbits >= c.minbits) o.emit('card', cbits, card);
    card = cbits = 0;
  };


  // card read code
  setInterval(function() {
    if(cbits > 0) setTimeout(cardValue, c.ctimeout);
  }, c.ctimeout);


  // return
  return o;
};



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



// handle green request
o.green = function(dur) {
  pgreen.writeSync(0);
  setTimeout(function() {
    pgreen.writeSync(1);
  }, dur || c.greendur);
};


// handle beep request
o.beep = function(dur) {
  pbeep.writeSync(0);
  setTimeout(function() {
    pbeep.writeSync(1);
  }, dur || c.beepdur);
};


// close module
o.close = function() {
  pdata0.unexport();
  pdata1.unexport();
};



// event handlers
o.on('green', o.green);
o.on('beep', o.beep);
