// @wolfram77


// init
var app = angular.module('app', []);
var dev = {
  'point': '',
  'used': [],
  'data': {},
  'date': null,
  'chart': null,
};



// value controller
app.controller('valCtrl', ['$scope', '$http', function($scope, $http) {
  var o = $scope;
  o.value = {};

  // load value
  o.load = function(url, req) {
    $http.post(url, req).success(function(data) {
      o.value = data;
    });
  };

  // set value
  o.set = function(i, v)   {
    if(typeof v === 'undefined') o.value = i;
    else o.value[i] = v;
  };

  // get value
  o.get = function(i) {
    return (typeof i === 'undefined')? o.value : o.value[i];
  };

  // is value?
  o.is = function(i, v) {
    return (typeof v === 'undefined')? o.value === i : o.value[i] === v;
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


// init config
var iconfig = function() {
  var container = document.getElementById('config-json');
  var options = {
    mode: 'tree',
    modes: ['code', 'form', 'text', 'tree', 'view'],
    error: function (err) {
      alert(err.toString());
    }
  };
  var json = {};
  var editor = new JSONEditor(container, options, json);
};


// init point
var ipoint = function() {
  $.get('/api/group/point', function(data) {
    document.title = data;
    $('#title').html(data);
    dev.point = data;
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
  iconfig();
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
