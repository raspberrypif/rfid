// @wolfram77


// required modules
var Gpio = require('onoff').Gpio;


// config
var ctimeout = 100;


// connections
var pdata0 = new Gpio(14, 'in', 'falling');
var pdata1 = new Gpio(15, 'in', 'falling');
// var pgreen = 18
// var pred = 23
// var pbeep = 24
// var phold = 25
// var pcard = 8


// initialize
var card = 0
var cbits = 0



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


// card read code
console.log('pi-snax-reader');
setInterval(function() {
  if(cbits > 0) setTimeout(function() {
    console.log('['+cbits+'] - '+card);
    card = cbits = 0;
  }, ctimeout);
}, ctimeout);


// cleanup
process.on('SIGINT', function() {
  pdata0.unexport();
  pdata1.unexport();
  process.exit();
});
