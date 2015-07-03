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
    selectMonths: true, // Creates a dropdown to control month
    selectYears: 15 // Creates a dropdown of 15 years to control year
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
      mode: 'tree',
      modes: ['code', 'form', 'text', 'tree', 'view'],
      error: function (err) { alert(err.toString()); }
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


/*
// chart controller
app.controller('chartCtrl', ['$scope', '$http', function($scope, $http) {
  var o = $scope; // (sel)
  var upoints = '/api/group/points';
  var udata = '/api/storage/get';


  // initialize points
  // start = start time of chart
  var ipoints = function(start, fn) {
    o.has = {};
    o.data = {};
    $http.post(upoints, {}).success(function(res) {
      o.point = _.last(res);
      _.forEach(res, function(p) {
        o.has[p] = {'start': start, 'end': start};
        o.data[p] = [];
      });
      o.points = res;
      o.draw = [];
      if(fn) fn(res);
    });
  };


  // request for data
  // end = end time of chart
  var req = function(end) {
    var req = {};
    for(var p in o.has)
      req[p] = {'start': o.has[p].end+1, 'end': end};
    return req;
  };


  // load data
  // end = end time of chart
  var load = function(end, fn) {
    $http.post(udata, {'req': req(end)}).success(function(res) {
      for(var p in res) {
        z.pushobj(o.data[p], res[p]);
        if(res[p].time.length>0) o.has[p].end = _.last(o.res[p].time);
      }
      if(fn) fn(res);
    });
  };


  // get full chart data
  var chartdata = function() {
    var avs = [];
    for(var p in o.data)
      if(o.sel[p]) avs.push(o.data[p].slice(0));
    var vld = charteval(avs);
    avs = [];
    for(var p in o.data)
      if(o.sel[p]) avs.push(o.data[p].inv.slice(0));
    var inv = charteval(avs);
    return {'vld': vld, 'inv': inv};
  };


  // init chart
  var initchart = function(id) {
    o.chart = $('#'+id).highcharts('StockChart', {
      'tooltip': {
        'pointFormat': '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b> ({point.change}%)<br/>'
      },
      'series': [
        {
          'name': 'valid',
          'data': []
        },
        {
          'name': 'invalid',
          'data': []
        }
      ]
    });
  };

  // init
  o.init = function(id) {
    initchart(id);
    o.sel = {};
    o.datestr = (new Date()).toDateString();
    o.refresh(o.datestr);
  };

  // refresh
  o.refresh = function(dt) {
    var d = new Date(Date.parse(dt));
    o.start = day(d).getTime();
    d.setDate(d.getDate()+1);
    o.end = day(d).getTime()-1;
    loadpoints(urlpoints, o.start);
  };

  // load
  o.load = function(gap) {
    if(gap) setInterval(o.load, gap);
    else loaddata(urldata, o.end, function() {
      var ans = chartdata(o.sel);
      console.log('o.load[ans]:'+JSON.stringify(ans));
      console.log(o.chart);
      o.chart = $('#chart').highcharts();
      o.chart.series[0].setData(ans.vld);
      o.chart.series[1].setData(ans.inv);
    });
  };
}]);
*/
