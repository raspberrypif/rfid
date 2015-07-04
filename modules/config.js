// @wolfram77
// CONFIG - maintains config for all modules
// () - get, set, load, save, loadnow, savenow, close
// .. - t = time, d = duration, g = gap, n = number, m = min, dev = device


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
    console.log('[config.load]');
    fs.readFile(file, function(err, data) {
      if(err) throw err;
      _.assign(val, JSON.parse(data));
      if(fn) fn(val);
    });
  };


  // save
  o.save = function(fn) {
    console.log('[config.save]');
    fs.writeFile(file, JSON.stringify(val), function(err) {
      if(err) throw err;
      if(fn) fn();
    });
  };


  // load (now)
  o.loadnow = function() {
    console.log('[config.loadnow]');
    _.assign(val, JSON.parse(fs.readFileSync(file)));
    return val;
  };


  // save (now)
  o.savenow = function() {
    console.log('[config.savenow]');
    fs.writeFileSync(file, JSON.stringify(val));
  };


  // close module
  o.close = function() {
    console.log('[config.close]');
    o.savenow();
  };



  // prepare
  o.loadnow();
  setInterval(o.save, val.gsave);

  // ready!
  console.log('[config] ready!');
  return o;
};
