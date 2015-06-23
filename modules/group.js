// @wolfram77
// GROUP - maintains info sharing with multiple devices
// () - green, beep, tellvld, tellinv, close


// required modules
var EventEmitter = require('events').EventEmitter;
var http = require('http');
var _ = require('lodash');



// initialize
module.exports = function(c, config, storage) {
  var o = new EventEmitter();

  // init
  var qsync = [], esync = [];



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


  // get request (for storage)
  var getreq  = function() {
    var req = {}, now = _.now();
    for(var p in c.points)
      req[p] = {'start': c.points[p].tsync+1, 'end': now};
    return req;
  };


  // update sync time
  var updatetsync = function(pvs) {
    for(var p in pvs) {
      var vld = 0, inv = 0;
      var len = pvs[p].vld.length;
      if(len > 0) vld = pvs[p].vld[len-1][0];
      var len = pvs[p].inv.length;
      if(len > 0) inv = pvs[p].inv[len-1][0];
      c.points[p].tsync = _.max([c.points[p].tsync || 0, vld, inv]);
    }
  };


  // force sync (one point)
  var syncone = function(p, fn) {
    var sreqd = JSON.stringify(getreq());
    var options = {
      'method': 'GET',
      'path': '/api/storage/get',
      'host': c.points[p].host,
      'port': c.points[p].port,
      'headers': {
        'Content-Type': 'application/json',
        'Content-Length': sreqd.length
      }
    };
    var req = http.request(options, function(res) {
      resbody(res, function(sresd) {
        var resd = JSON.parse(sresd);
        updatetsync(resd);
        storage.put(resd, function() {
          if(fn) fn(true);
        });
      });
    });
    req.on('error', function(err) {
      if(fn) fn(false, err);
    });
    req.write(sreqd);
    req.end();
  };


  // sync loop
  // ps = points, es = errors, sel = do selectively
  var syncloop = function(ps, es, sel, fn) {
    var p = '';
    while(true) {
      if(ps.length === 0) {
        if(fn) fn(es);
        return;
      }
      p = ps.shift();
      pv = c.points[p];
      if(!sel || pv.tsync+pv.gsync > _.now()) break;
    }
    syncone(p, function(ok, err) {
      if(!ok) es.push([p, err]);
      process.nextTick(function() {
        syncloop(ps, es, sel, fn);
      });
    });
  };


  // run sync in background
  var syncrun = function() {
    setInterval(function() {
      esync.length = 0;
    }, c.derr);
    for(var p in c.points) {
      setInterval(function() {
        if(_.indexOf(qsync, p) < 0) qsync.push(p);
        if(qsync.length === 1) syncloop(qsync, esync, true);
      }, c.points[p].gsync);
    }
  };



  // get name of this
  o.point = function() {
    return c.point;
  };


  // get names of points (including self)
  // ret = [name]
  o.points = function() {
    var ps = _.keys(c.points);
    ps.push(c.point);
    return ps;
  };


  // get point details
  // ret = {name:{host, port}}, ps = [name]
  o.get = function(ps) {
    return _.pick(c.points, ps);
  };


  // set point details
  // pds = {name:{host, port}}
  o.set = function(pds) {
    var now = _.now();
    for(var p in pds)
      c.points[p] = _.assign(c.points[p] || {'tsync': 0}, pds[p]);
    config.save();
  };


  // clear point
  // ps = [name]
  o.clear = function(ps) {
    for(var i=0; i<ps.length; i++)
      delete c.points[ps[i]];
    config.save();
  };


  // save card data
  o.card = function(time, card, fn) {
    storage.add({'time': time, 'point': c.point, 'card': card}, fn);
    c.tsync = time;
  };


  // sync data
  o.sync = function(fn) {
    var ps = _.keys(c.points), es = [];
    syncloop(ps, es, false, fn);
  };



  // sync in background



  // ready!
  console.log('group ready!');
  return o;
};
