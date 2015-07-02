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
    var status = _.indexOf(c.card.types, cbits)<0? 'e' : 'o';
    console.log('[reader:cardval] ('+cbits+') '+card+' : '+status);
    if(cbits < c.card.mbits) o.action('err');
    else o.emit('card', cbits, card, status);
    card = cbits = 0;
  };


  // card read code
  var cardread = function(val) {
    if(cbits === 0) setTimeout(cardval, c.card.dread);
    card = card*2 + val;
    cbits++;
  };


  // temporarily set a pin to a value
  var setval = function(pin, val, dur) {
    pin.writeSync(val);
    if(dur) setTimeout(function() { pin.writeSync(1-val); }, dur);
  };


  // toggle a pin for a given duration
  var toggleval = function(pin, val, dur, step) {
    if(dur <= 0) return;
    setval(pin, val, step/2);
    setTimeout(function() { toggleval(pin, val, dur-step, step); }, step);
  };



  // handle data0 & data1
  pdata0.watch(function() { cardread(0); });
  pdata1.watch(function() { cardread(1); });



  // perform action
  o.action = function(act, dur) {
    console.log('[reader.action] '+act+' ('+dur+')');
    switch(act) {
      case 'green':
        setval(pgreen, 0, dur || c.action.dgreen);
        break;
      case 'beep':
        setval(pbeep, 0, dur || c.action.dbeep);
      case 'valid':
        setval(pgreen, 0, dur || c.action.dvld);
        break;
      case 'error':
        setval(pbeep, 0, dur || c.action.derr);
        break;
      case 'invalid':
        toggleval(pbeep, 0, dur || c.action.dinv, c.action.dbeep);
        break;
    }
  };


  // close module
  o.close = function() {
    console.log('[reader.close]');
    pdata0.unexport();
    pdata1.unexport();
    pgreen.unexport();
    pbeep.unexport();
  };



  // ready!
  console.log('reader ready!');
  return o;
};
