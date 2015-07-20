// @wolfram77
// READER - links to wiegand rfid reader
// e - card; () - action, close


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
  o.card = function(card, cbits) {
    var status = _.indexOf(c.card.types, cbits)<0? 'e' : 'o';
    console.log('[reader.card] ('+cbits+') '+card+' :'+status);
    if(!inrun() || cbits<c.card.mbits) o.action('err');
    else o.emit('card', cbits, card, status);
  };


  // perform action
  o.action = function(act, dur) {
    console.log('[reader.action] '+act);
    switch(act) {
      case 'green':
        setval(pgreen, 0, dur || c.action.dgreen);
        break;
      case 'beep':
        setval(pbeep, 0, dur || c.action.dbeep);
        break;
      case 'valid':
        toggleval(pbeep, 0, dur || c.action.dvld, c.action.dbeep);
        toggleval(pgreen, 0, dur || c.action.dvld, c.action.dbeep);
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
    pgreen.unexport();
    pbeep.unexport();
  };



  // ready!
  console.log('[reader] ready!');
  return o;
};
