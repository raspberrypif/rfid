// @wolfram77
// GROUP - maintains info sharing with multiple devices
// () - point, points, get, set, clear, sync


// required modules
var EventEmitter = require('events').EventEmitter;
var http = require('http');
var z = require('./zed')();
var _ = require('lodash');



// initialize
module.exports = function(c, tap) {
  var o = new EventEmitter();

  // init
  var psync = [], esync = [];


  // get request data for tap
  var reqd  = function() {
    var r = {}, now = _.now();
    console.log('[group:reqd] t'+now);
    for(var p in c.points)
      r[p] = {'start': c.points[p].tsync+1, 'end': now};
    return r;
  };


  // update sync time
  var updatetsync = function(vs) {
    console.log('[group:updatetsync]');
    for(var p in vs)
      if(vs[p].time && vs[p].time.length>0) c.points[p].tsync = _.last(vs[p].time);
  };


  // request options
  var reqopt = function(p, len) {
    console.log('[group:reqopt] .'+p+' ('+len+')');
    return {
      'method': 'GET',
      'path': '/api/tap/get',
      'host': c.points[p].host,
      'port': c.points[p].port,
      'headers': {
        'Content-Type': 'application/json',
        'Content-Length': len
      }
    };
  };


  // sync (one point)
  var sync = function(p, fn) {
    console.log('[group:sync] .'+p);
    var sreq = JSON.stringify(reqd());
    var options = reqopt(p, sreq.length);
    var req = http.request(options, function(res) {
      z.httpbody(res, function(sres) {
        console.log('[group:sync] .'+p+' ok');
        var resd = JSON.parse(sres);
        updatetsync(resd);
        tap.put(resd, function() {
          if(fn) fn(true);
        });
      });
    });
    req.on('error', function(err) {
      console.log('[group:sync] .'+p+' err');
      if(fn) fn(false, err);
    });
    req.write(sreq);
    req.end();
  };


  // get next point to sync
  var nextsync = function(ps, all) {
    console.log('[group:nextsync] .('+ps.length+')');
    if(all) return ps[0];
    while(ps.length > 0) {
      var v = c.points[ps[0]];
      if(v.tsync+v.gsync < _.now()) return ps[0];
      ps.shift();
    }
  };


  // sync loop
  // ps = points, es = errors, all = do all
  var syncloop = function(ps, es, all, fn) {
    console.log('[group:syncloop]');
    var p = nextsync(ps, all);
    if(!p) {
      if(fn) fn(es);
      return;
    }
    sync(p, function(ok, err) {
      ps.shift();
      if(!ok) es.push([p, err]);
      process.nextTick(function() {
        syncloop(ps, es, all, fn);
      });
    });
  };


  // add point to sync list in intervals
  var syncadd = function(p) {
    console.log('[group:syncadd] .'+p);
    setInterval(function() {
      if(_.indexOf(psync, p) < 0) {
        psync.push(p);
        if(psync.length === 1) syncloop(psync, esync, false);
      }
    }, c.points[p].gsync);
  };


  // run sync in background
  var syncrun = function() {
    console.log('[group:syncrun]');
    setInterval(function() {
      esync.length = 0;
    }, c.derr);
    for(var p in c.points)
      syncadd(p);
  };



  // get name of this
  o.point = function() {
    console.log('[group.point]');
    return c.point;
  };


  // get names of points (including self)
  // ret = [name]
  o.points = function() {
    console.log('[group.points]');
    var ps = _.keys(c.points);
    ps.push(c.point);
    return ps;
  };


  // get point details
  // ret = {name:{host, port}}, ps = [name]
  o.get = function(ps) {
    console.log('[group.get]');
    return _.pick(c.points, ps);
  };


  // set point details
  // pds = {name:{host, port}}
  o.set = function(pds) {
    console.log('[group.set]');
    var now = _.now();
    for(var p in pds)
      c.points[p] = _.assign(c.points[p] || {'tsync': 0}, pds[p]);
  };


  // clear point
  // ps = [name]
  o.clear = function(ps) {
    console.log('[group.clear]');
    for(var i=0; i<ps.length; i++)
      delete c.points[ps[i]];
  };


  // sync data
  o.sync = function(fn) {
    console.log('[group.sync]');
    var ps = _.keys(c.points), es = [];
    syncloop(ps, es, true, fn);
  };



  // sync in background
  syncrun();


  // ready!
  console.log('[group] ready!');
  return o;
};
