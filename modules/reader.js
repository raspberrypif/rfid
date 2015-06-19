// @wolfram77
// READER - links to wiegand rfid reader
// e - card; () - action, close


// required modules
var EventEmitter = require('events').EventEmitter;
var Gpio = require('onoff').Gpio;
var _ = require('lodash');



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
  var cardval = function() {
    if(_.indexOf(c.card.types, cbits) < 0) o.action('err');
    else o.emit('card', cbits, card);
    card = cbits = 0;
  };


  // temporarily set a pin to low
  var setlow = function(pin, dur) {
    pin.writeSync(0);
    setTimeout(function() { pin.writeSync(1); }, dur);
  };


  // toggle from hi-lo and lo-hi for a given duratiom
  var togglelow = function(pin, dur, step) {
    if(dur <= 0) return;
    setlow(pin, step/2);
    setTimeout(function() { togglelow(pin, dur-step, step); }, step/2);
  };


  // card read code
  setInterval(function() {
    if(cbits > 0) setTimeout(cardval, c.card.dread);
  }, c.card.gread);



  // handle card data0 low
  pdata0.watch(function(err, val) {
    card = card*2;
    cbits++;
  });


  // handle card data1 low
  pdata1.watch(function(err, val) {
    card = card*2 + 1;
    cbits++;
  });



  // perform action
  o.action = function(act, dur) {
    var r = c.res;
    switch(act) {
      case 'green':
        setlow(pgreen, dur || c.action.dgreen);
        break;
      case 'beep':
        setlow(pbeep, dur || c.action.dbeep);
      case 'vld':
        setlow(pgreen, dur || c.action.dvld);
        break;
      case 'err':
        setlow(pbeep, dur || c.action.derr);
        break;
      case 'inv':
        togglelow(pbeep, dur || c.action.dinv, c.action.dbeep);
        break;
    }
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
