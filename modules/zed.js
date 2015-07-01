// @wolfram77
// ZED - general purpose functions
// () - push, group, httpbody, async


// required modules
var _ = require('lodash');



// initialize
module.exports = function() {
  var o = {};



  // push items from source array
  o.push = function(dst, src) {
    Array.prototype.push.apply(dst, src);
  };


  // group properties as array
  o.group = function(dst, src, ps) {
    _.forEach(ps, function(p) {
      o.push(dst[p] = dst[p] || [], _.pluck(src, p));
    });
    return dst;
  };


  // get http response body
  o.httpbody = function(res, fn) {
    var data = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      data += chunk;
    });
    res.on('end', function() {
      if(fn) fn(data);
    });
  };


  // execute a function asynchronously
  o.async = function(t, ifn, args, gap, fn) {
    var r = ifn.apply(t, args);
    if(r.args !== undefined) setTimeout(function() {
        o.async(t, ifn, r.args, gap, fn);
    }, gap || 25);
    else if(fn) fn(r.ret);
  };



  // ready!
  return o;
};
