// @wolfram77


// initialize app
var app = angular.module('app', []);
var z = {};



// get day from datetime
z.day = function(d) {
  var day = new Date(d.getTime());
  day.setHours(0, 0, 0, 0);
  return day;
};


// push items from source array
z.push = function(dst, src) {
  Array.prototype.push.apply(dst, src);
};


// push arrays in object
z.pushobj = function(dst, src) {
  for(var p in src)
    z.push(dst[p], src[p]);
};


// take min value of multiple arrays
var takemin = function(vs) {
  var mv = vs[0][0], mi = 0;
  for(var i=1; i<vs.length; i++) {
    if(mv !== undefined && mv > vs[i][0]) continue;
    mv = vs[i][0];
    mi = i;
  }
  return vs[mi].shift();
};


// merge asc order arrays
var merge = function(dst, srcs) {
  while((e = takemin(srcs)) !== undefined)
    dst.splice(_.sortedLastIndex(dst, e), 0, e);
};



// initialize tooltip
var itooltip = function() {
  $('[is]').each(function() {
    $(this).attr('data-tooltip', $(this).attr('is'));
  });
  $('[is]').tooltip();
};


// initialize datepicker
var idatepicker = function() {
  $('.datepicker').pickadate({
    'selectMonths': true, // Creates a dropdown to control month
    'selectYears': 15 // Creates a dropdown of 15 years to control year
  });
};


// initialize modal
var imodal = function() {
  $('.modal-trigger').leanModal();
};


// initialize point
var ipoint = function() {
  $.get('/api/group/point', function(res) {
    document.title = res;
    $('#title').html(res);
  });
};



// on ready
$(document).ready(function() {
  itooltip();
  idatepicker();
  imodal();
  ipoint();
});



// value controller
app.controller('valCtrl', ['$scope', '$http', function($scope, $http) {
  var o = $scope;

  // set
  o.set = function(v)   {
    o.value = v;
  };

  // get value
  o.get = function() {
    return o.value;
  };

  // is?
  o.is = function(v) {
    return o.value === v;
  };

  // load
  o.load = function(req, gap) {
    if(gap) setInterval(function() { o.load(req); }, gap);
    $http.post(o.url, req).success(function(res) {
      o.set(res);
    });
  };

  // save
  o.save = function(gap) {
    if(gap) setInterval(o.save, gap);
    $http.post(o.url, o.get());
  };
}]);



// json controller
app.controller('jsonCtrl', ['$scope', '$http', function($scope, $http) {
  var o = $scope;

  // initialize
  o.init = function(id) {
    var e = document.getElementById(id);
    var options = {
      'mode': 'tree',
      'modes': ['code', 'form', 'text', 'tree', 'view'],
      'error': function (err) { alert(err.toString()); }
    };
    o.editor = new JSONEditor(e, options, {});
  };

  // set
  o.set = function(v) {
    o.editor.set(v);
  };

  // get
  o.get = function() {
    return o.editor.get();
  };

  // load
  o.load = function(req, gap) {
    if(gap) setInterval(function() { o.load(req); }, gap);
    $http.post(o.url, req).success(function(res) {
      o.set(res);
    });
  };

  // save
  o.save = function(gap) {
    if(gap) setInterval(o.save, gap);
    $http.post(o.url, o.get());
  };
}]);



// tap link controller
app.controller('tapLinkCtrl', ['$scope', '$http', function($scope, $http) {
  var o = $scope; // (sel)
  var upoints = '/api/group/points';
  var ucount = '/api/tap/count';
  var udata = '/api/tap/get';


  // default date range
  var defrange = function() {
    var d = new Date();
    o.start = d.getTime();
    d.setDate(d.getDate()+1);
    o.end = d.getTime();
    o.startstr = (new Date(o.start)).toDateString();
    o.endstr = (new Date(o.end)).toDateString();
  };


  // initialize
  var init = function(id, fn) {
    defrange();
    o.status = {'i': true, 'v': true, 'e': true};
    $http.post(upoints, {}).success(function(ps) {
      o.points = {};
      o.point = _.last(ps);
      _.forEach(ps, function(p) {
        o.points[p] = true;
      });
      if(fn) fn(ps);
    });
    Highcharts.setOptions({ 'global': { 'useUTC': false } });
    $('#'+id).highcharts('StockChart', {
      'tooltip': { 'pointFormat': '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>' },
      'series': [ { 'name': 'taps', 'data': [] } ],
      'xAxis': { 'ordinal': false },
      'yAxis': { 'min': 0 }
    });
    o.chart = $('#'+id).highcharts();
  };


  // reset (on date change)
  var reset = function(start) {
    o.has = {};
    o.count = {};
    o.data = {};
    for(var p in o.points) {
      o.has[p] = {'start': start, 'end': start};
      o.count[p] = {'i': 0, 'v': 0, 'e': 0};
      o.data[p] = {'time': [], 'card': [], 'status': []};
    }
    o.tcount = {'i': 0, 'v': 0, 'e': 0};
  };


  // request for data
  var dreq = function(end) {
    var req = {};
    for(var p in o.has)
      req[p] = {'start': o.has[p].end+1, 'end': end};
    return req;
  };


  // load tap data
  var loadtap = function(end, fn) {
    $http.post(udata, dreq(end)).success(function(res) {
      for(var p in res) {
        z.pushobj(o.data[p], res[p]);
        if(res[p].time && res[p].time.length>0) o.has[p].end = _.last(res[p].time);
      }
      if(fn) fn(res);
    });
  };


  // load tap count
  var loadcount = function(end, fn) {
    $http.post(ucount, dreq(end)).success(function(res) {
      console.log(JSON.stringify(res));
      for(var p in res) {
        o.count[p].v += res[p].v || 0;
        o.count[p].i += res[p].i || 0;
        o.count[p].e += res[p].e || 0;
      }
      o.tcount = {'i': 0, 'v': 0, 'e': 0};
      for(var p in o.count) {
        if(!o.points[p]) continue;
        o.tcount.i += o.count[p].i;
        o.tcount.v += o.count[p].v;
        o.tcount.e += o.count[p].e;
      }
      if(fn) fn(res);
    });
  };


  // take min value from sources
  var mintake = function(s) {
    var mv = null, mi = 0;
    for(var i=0; i<s.length; i++) {
      if(!s[i] || s[i].length===0) continue;
      if(mv===null || s[i][0]<mv) {
        mv = s[i][0];
        mi = i;
      }
    }
    if(mv !== null) s[mi].shift();
    return mv;
  };


  // chartize data
  var chartize = function(dst, src, step, gap, fn) {
    for(var i=0; i<step; i++) {
      var t = mintake(src);
      if(t === null) {
        if(fn) fn(dst);
        return;
      }
      var v = [t, dst.length+1];
      dst.push(v);
    }
    setTimeout(function() { chartize(dst, src, step, gap, fn); }, gap);
  };


  // keep matches
  var keepmatch = function(val, ref, mtch) {
    var res = [];
    for(var i=0; i<val.length; i++)
      if(mtch[ref[i]]) res.push(val[i]);
    return res;
  };


  // init
  o.init = function(id) {
    init(id, function() {
      o.refresh();
    });
  };


  // refresh
  o.refresh = function() {
    console.log('refresh()');
    o.start = (new Date(Date.parse(o.startstr))).getTime();
    o.end = (new Date(Date.parse(o.endstr))).getTime();
    console.log(o.start+' -> '+o.end);
    reset(o.start);
  };


  // load
  o.load = function(gap) {
    if(gap) setInterval(o.load, gap);
    else loadcount(o.end, function() {
      loadtap(o.end, function() {
        var src = [];
        for(var p in o.data)
          if(o.points[p]) src.push(keepmatch(o.data[p].time, o.data[p].status, o.status));
        o.draw = [];
        chartize(o.draw, src, 200, 25, function() {
          console.log('draw.length = '+o.draw.length);
          o.chart.series[0].setData(o.draw);
        });
      });
    });
  };
}]);

