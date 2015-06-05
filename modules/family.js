// @wolfram77
// FAMILY - maintains info sharing with multiple devices
// e - card; () - green, beep, tellvld, tellinv, close


// required modules
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');



// initialize
module.exports = function(c, config, storage) {
  var o = new EventEmitter();


  // get names of points
  // ps = [name]
  o.getnames = function() {
    var ps = [];
    for(var p in c.points)
      ps.push(p);
    return ps;
  };


  // get point details
  // pvs = [name:{host, port}], ps = [name]
  o.get = function(ps) {
    var pvs = [];
    for(var i=0; i<ps.length; i++)
      pvs[ps[i]] = c.points[ps[i]];
    return pvs;
  };


  // set point details
  // pvs = [name:{host, port}]
  o.set = function(pvs) {
    for(var p in pvs) {
      if(!c.points[p]) c.points[p] = _.assign({'synctime': new Date()}, pvs[p]);
      else _.assign(c.points[p], pvs[p]);
    }
    config.save();
  };


  // clear point
  // ps = [name]
  o.clear = function(ps) {
    for(var i=0; i<ps.length; i++)
      delete c.points[ps[i]];
    config.save();
  };


  // handle sync request
  // pvs = [name:{synctime}]
  o.sync = function(pvs, fn) {

  };



  // ready!
  console.log('family ready!');
  return o;
};
