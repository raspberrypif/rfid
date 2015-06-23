// @wolfram77


// init
var app = angular.module('app', []);
var o = {
  'editor': null,
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


// init chart
var ichart = function() {
  chart = $('#chart').highcharts('StockChart', {
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


// load chart data
var chartdata = function(pvs, sel) {
  
};




// on ready
$(document).ready(function() {
  itooltip();
  idatepicker();
  imodal();
  ipoint();
  // ichart();
});


  /*
  // create chart
  var chart = $('#chart').highcharts('StockChart', {
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


  // load chart data
  var loadData = function(type, start, end) {
    var s = type==='inv'? 1 : 0;
    $.getJSON(loadurl, {
      'type': '',
      'start': start,
      'end': end
    }, function(data) {
      chart.series[s].setData(chartData(data));
    });
  };


  // refresh chart
  setInterval(function() {
    loadData('', );
  }, loaddur);
  */
