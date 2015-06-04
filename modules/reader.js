// @wolfram77
// READER - controls wiegand rfid reader, and receives data from it
// e - card; () - green, beep, tellvld, tellinv, close


// required modules
var EventEmitter = require('events').EventEmitter;
var Gpio = require('onoff').Gpio;



// initialize
module.exports = function(c) {
  var o = new EventEmitter();

  // init
  var card = 0, cbits = 0;


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


  // get card value
  var cardValue = function() {
    if(cbits >= c.minbits) o.emit('card', cbits, card);
    card = cbits = 0;
  };


  // card read code
  setInterval(function() {
    if(cbits > 0) setTimeout(cardValue, c.ctimeout);
  }, c.ctimeout);



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


  // tell valid
  o.tellvld = function() {
    o.green(c.vlddur);
    o.beep(c.vlddur);
  };


  // tell invalid
  o.tellinv = function() {
    var t = c.invdur;
    var fn = function() {
      o.beep(c.vlddur/2);
      t -= c.vlddur;
      if(t > 0) setTimeout(fn, c.vlddur);
    };
    fn();
  };


  // close module
  o.close = function() {
    pdata0.unexport();
    pdata1.unexport();
    pgreen.unexport();
    pbeep.unexport();
  };



  // ready!
  console.log('reader ready!');
  return o;
};
