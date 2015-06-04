// @wolfram77
// CONFIG - maintains config for all other modules
// () - get, set, load, save, loadnow, savenow, close


// required modules
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var fs = require('fs');



// initialize
module.exports = function(file) {
  var o = new EventEmitter();

  // config value
  var val = {};


  // get config
  o.get = function() {
    return val;
  };


  // set config
  o.set = function(v) {
    _.assign(val, v);
  };


  // load config
  o.load = function(fn) {
    fs.readFile(file, function(err, data) {
      if(err) throw err;
      _.assign(val, JSON.parse(data));
      if(fn) fn(val);
    });
  };


  // save config
  o.save = function(fn) {
    fs.writeFile(file, JSON.stringify(val), function(err) {
      if(err) throw err;
      if(fn) fn();
    });
  };


  // load config (now)
  o.loadnow = function() {
    _.assign(val, JSON.parse(fs.readFileSync(file)));
    return val;
  };


  // save config (now)
  o.savenow = function() {
    fs.writeFileSync(file, JSON.stringify(val));
  };


  // close module
  o.close = o.savenow;



  // load config now
  o.loadnow();

  // ready!
  console.log('config ready!');
  return o;
};
