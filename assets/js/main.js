// @wolfram77


// init
var app = angular.module('app', []);
var point = '';
var chart = {};



// value controller
app.controller('valueCtrl', ['$scope', function($scope) {
  var o = $scope;
  o.value = 0;

  // load value
  o.load = function(url, req) {
    $http.post(url, req).success(function(data) {
      o.value = data;
    });
  };

  // set value
  o.set = function(val)   {
    o.value = val;
  };

  // get value
  o.get = function() {
    return o.value;
  };

  // is value?
  o.is = function(val) {
    return o.value === val;
  };
}]);


// list controller
app.controller('listCtrl', ['$scope', '$http', function($scope, $http) {
  var o = $scope;
  o.value = 0;

  // load list
  o.load = function(url, req) {
    $http.post(url, req).success(function(data) {
      o.value = data;
    });
  };

  // set item
  o.set = function(i, val) {
    o.value[i] = val;
  };

  // get item
  o.get = function(i) {
    return o.value[i];
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


// init point info
var ipoint = function() {
  $.getJSON('/api/group/point', {}, function(data) {
    point = data.point;
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
var chartload = function() {

};



// on ready
$(document).ready(function() {
  itooltip();
  idatepicker();
  ipoint();
  ichart();
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
