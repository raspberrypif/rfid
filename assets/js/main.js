// @wolfram77


// init
var app = angular.module('app', []);
var o = {
  'point': '',
  'used': [],
  'data': {},
  'date': null,
  'chart': null,
};



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
    else $http.post(o.url, req).success(function(res) {
      o.set(res);
    });
  };

  // save
  o.save = function(gap) {
    if(gap) setInterval(o.save, gap);
    else $http.post(o.url, o.get());
  };
}]);



// json controller
app.controller('jsonCtrl', ['$scope', '$http', function($scope, $http) {
  var o = $scope;

  // init
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
    else $http.post(o.url, req).success(function(res) {
      o.set(res);
    });
  };

  // save
  o.save = function(gap) {
    if(gap) setInterval(o.save, gap);
    else $http.post(o.url, o.get());
  };
}]);



// chart controller
app.controller('chartCtrl', ['$scope', '$http', function($scope, $http) {
  var o = $scope;
  var urlpoints = '/api/group/points';
  var urldata = '/api/storage/get';

  // time to day
  var day = function(t) {
    var d = new Date(t.getTime());
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // load points
  var loadpoints = function(url, start) {
    o.points = {};
    o.data = {};
    o.sel = {};
    $http.post(url, {}).success(function(res) {
      for(var i=0; i<res.length; i++) {
        o.points[res[i]] = {'start': start, 'end': 0};
        o.data[res[i]] = {'vld': [], 'inv': []};
        o.sel[res[i]] = true;
      }
    });
  };

  // request data
  var reqdata = function(pds, end) {
    var preq = {};
    for(var p in pds)
      preq[p] = {'start': pds[p].end+1, 'end': end};
    return preq;
  };

  // load data
  var loaddata = function(url, end, fn) {
    $http.post(url, {'req': reqdata(o.points, end)}).success(function(res) {
      console.log('loaddata[res]:'+JSON.stringify(res));
      for(var p in res) {
        var d = o.data[p];
        Array.prototype.push.apply(d.vld, res[p].vld);
        Array.prototype.push.apply(d.inv, res[p].inv);
        o.points[p].end = Math.max(o.points[p].end || 0, d.vld[d.vld.length-1][0] || 0, d.inv[d.inv.length-1][0] || 0);
      }
      console.log('loaddata[o.points]:'+JSON.stringify(o.points));
      if(fn) fn(o.data);
    });
  };

  // generate cumulative data
  var cumulate = function(avs) {
    var m = [], n = 1;
    while(true) {
      var min = 0, mini = 0;
      for(var i=0; i<avs.length; i++) {
        if(avs[i].length === 0) continue;
        if(!min || avs[i][0][0]<min) {
          min = avs[i][0][0];
          mini = i;
        }
      }
      if(!min) break;
      var v = [min, n]
      m.push(v);
      avs[mini].shift();
      n++;
    }
    return m;
  };

  // get chart data
  var chartdata = function(sel) {
    var avs = [];
    for(var p in o.data)
      if(sel[p]) avs.push(o.data[p].vld.slice(0));
    var vld = cumulate(avs);
    avs = [];
    for(var p in o.data)
      if(sel[p]) avs.push(o.data[p].inv.slice(0));
    var inv = cumulate(avs);
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


// init tooltip
var itooltip = function() {
  $('[is]').each(function() {
    $(this).attr('data-tooltip', $(this).attr('is'));
  });
  $('[is]').tooltip();
};


// init datepicker
var idatepicker = function() {
  $('.datepicker').pickadate({
    selectMonths: true, // Creates a dropdown to control month
    selectYears: 15 // Creates a dropdown of 15 years to control year
  });
};


// init modal
var imodal = function() {
  $('.modal-trigger').leanModal();
};


// init point
var ipoint = function() {
  $.get('/api/group/point', function(data) {
    document.title = data;
    $('#title').html(data);
    o.point = data;
  });
};



// on ready
$(document).ready(function() {
  itooltip();
  idatepicker();
  imodal();
  ipoint();
});
