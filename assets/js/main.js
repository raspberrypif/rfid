// @wolfram77


// config
var loadurl = '/api/storage/get';
var loaddur = 5000;

/*
// init
var end = new Date(), start = new Date(end.getTime());
start.setMonth(end.getMonth()-1);


// count data within ranges
var rangeCount = function(vs, start, end, n) {
  var res = _.fill(Array(pts), 0), range = end-start;
  for(var i=0; i<vs.length; i++)
    res[Math.round(((vs[i]-start)/range)*n)]++;
  return res;
};


// get chart data
var chartData = function(vals, start, end, n) {
  var vs = _.pluck(vals, 'time');
  var c = rangeCount(vs, start, end, n);
  return _.zip(_.range(start, end, (end-start)/n), c);
};
*/

// on ready
$(document).ready(function() {

  // tooltip
  $('[is]').each(function() {
    $(this).attr('data-tooltip', $(this).attr('is'));
  });
  $('[is]').tooltip();

  // datepicker
  $('.datepicker').pickadate({
    selectMonths: true, // Creates a dropdown to control month
    selectYears: 15 // Creates a dropdown of 15 years to control year
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
});
