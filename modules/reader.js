// @wolfram77
// READER - provides interface to rfid reader
// e - card; () - card, out, close


// required modules
var EventEmitter = require('events').EventEmitter;
var Gpio = require('onoff').Gpio;
var z = require('./zed')();
var _ = require('lodash');



// initialize
module.exports = function(c) {
  var o = new EventEmitter();


  // connections
  var pgreen = new Gpio(18, 'out');
  var pbeep = new Gpio(24, 'out');
  pgreen.writeSync(1);
  pbeep.writeSync(1);


  // check if in run duration
  var inrun = function() {
    var now = _.now();
    var d = z.date(now).getTime();
    return (d+c.drun.start)<=now && now<(d+c.drun.end);
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



  // indicate card
  o.card = function(cbits, card) {
    console.log('reader.card> ('+cbits+') '+card);
    if(!inrun() || cbits<c.card.mbits) o.out('error');
    else o.emit('card', cbits, card);
  };


  // produce output
  o.out = function(type, dur) {
    console.log('reader.out> %s (%d)', type, dur);
    switch(type) {
      case 'beep':
        setval(pbeep, 0, dur || c.out.dbeep);
        break;
      case 'green':
        setval(pgreen, 0, dur || c.out.dgreen);
        break;
      case 'valid':
        toggleval(pbeep, 0, dur || c.out.dvld, c.out.dbeep);
        toggleval(pgreen, 0, dur || c.out.dvld, c.out.dbeep);
        break;
      case 'invalid':
        toggleval(pbeep, 0, dur || c.out.dinv, c.out.dbeep);
        break;
      case 'error':
        setval(pbeep, 0, dur || c.out.derr);
        break;
    }
  };


  // close module
  o.close = function() {
    console.log('reader.close>');
    pgreen.unexport();
    pbeep.unexport();
  };



  // ready!
  console.log('reader> ready!');
  return o;
};
