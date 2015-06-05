// @wolfram77
// FAMILY - maintains info sharing with multiple devices
// e - card; () - green, beep, tellvld, tellinv, close


// required modules
var EventEmitter = require('events').EventEmitter;
var http = require('http');
var _ = require('lodash');



// initialize
module.exports = function(c, config, storage) {
  var o = new EventEmitter();

  // init
  var options = {
    'method': 'POST',
    'path': '/api/family/sync'
    'headers': {
      'Content-Type': 'application/json',
      'Content-Length': 0
    }
  };



  // get response body
  var resbody = function(res, fn) {
    var ans = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      ans += chunk;
    });
    res.on('end', function() {
      if(fn) fn(ans);
    });
  };


  // update sync time
  var updatesynctime = function(pds) {
    for(var p in pds)
      if(!c.points[p] || (pds[p].synctime > c.points[p].synctime)) _.assign(c.points[p], pds[p]);
  };


  // get names of points
  // ps = [name]
  o.getnames = function() {
    var ps = [];
    for(var p in c.points)
      ps.push(p);
    return ps;
  };


  // get point details
  // pds = {name:{host, port}}, ps = [name]
  o.get = function(ps) {
    var pds = [];
    for(var i=0; i<ps.length; i++)
      pds[ps[i]] = c.points[ps[i]];
    return pds;
  };


  // set point details
  // pds = {name:{host, port}}
  o.set = function(pds) {
    var now = new Date().getTime();
    for(var p in pds) {
      if(!c.points[p]) c.points[p] = _.assign({'synctime': now}, pds[p]);
      else _.assign(c.points[p], pds[p]);
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


  // save data
  o.data = function(time, card) {
    storage.add(time, c.point, card);
    c.synctime = time;
  };


  // make sync
  // pds = {name:{synctime}}
  o.sync = function(pds, fn) {
    var req = {}, now = new Date().getTime();
    for(var p in pds)
      req[p] = {'start': pds[p].synctime+1, 'end': now};
    storage.get(req, function(pvs) {
      var res = {'status': _.pick(c.points, 'synctime'), 'data': pvs};
      if(fn) fn(res);
    });
  };


  // make sync request
  o.syncreq = function(p) {
    var req = JSON.stringify(_.pick(c.points, 'synctime'));
    _.assign(options, {
      'host': c.points[p].host,
      'port': c.points[p].port,
      'headers': {
        'Content-Length': data.length
      }
    });
    http.request(options, function(res) {
      resbody(res, function(resb) {
        var sres = JSON.parse(resb);

      });
    });
  };



  // prepare
  o.syncreq();


  // ready!
  console.log('family ready!');
  return o;
};
