// @wolfram77
// CONFIG - maintains config for all other modules
// () - get, set, load, save, loadnow, savenow, close
// .. - t = time, d = duration, g = gap, dev = device


// required modules
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var fs = require('fs');



// initialize
module.exports = function(file) {
  var o = new EventEmitter();

  // value
  var val = {};



  // get
  o.get = function() {
    console.log('[config.get]');
    return val;
  };


  // set
  o.set = function(v) {
    console.log('[config.set]');
    _.assign(val, v);
  };


  // load
  o.load = function(fn) {
    fs.readFile(file, function(err, data) {
      _.assign(val, JSON.parse(data));
      console.log('[config.load]');
      if(fn) fn(val);
    });
  };


  // save
  o.save = function(fn) {
    fs.writeFile(file, JSON.stringify(val), function(err) {
      console.log('[config.save]');
      if(fn) fn();
    });
  };


  // load (now)
  o.loadnow = function() {
    _.assign(val, JSON.parse(fs.readFileSync(file)));
    console.log('[config.loadnow]');
    return val;
  };


  // save (now)
  o.savenow = function() {
    fs.writeFileSync(file, JSON.stringify(val));
     console.log('[config.savenow]');
  };


  // close module
  o.close = function() {
    o.savenow();
    console.log('[config.close]');
  };



  // prepare
  o.loadnow();
  setInterval(o.save, val.gsave);

  // ready!
  console.log('config ready!');
  return o;
};
