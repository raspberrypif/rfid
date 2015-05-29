// @wolfram77


// config
var geturl = '/api/storage/get';
var getdur = 5000;



// on ready
$(document).ready(function() {

  // tooltip
  $('[is]').each(function() {
    $(this).attr('data-tooltip', $(this).attr('is'));
  });
  $('[is]').tooltip();


  // create chart
  var c = $('#chart').highcharts('StockChart', {
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


  var getdata = function(start, end) {
    $.getJSON(geturl, {
      'type': '',
      'start': start,
      'end': end
    }, function(data) {
      c.series[0].setData();
    });
  };
  setInterval(function() {
    $.getJSON(geturl, {
      'type': '',
      'start': new Date()
    }, function() {});
  }, getdur);
      $.each(names, function (i, name) {
        $.getJSON('http://www.highcharts.com/samples/data/jsonp.php?filename=' + name.toLowerCase() + '-c.json&callback=?',    function (data) {
          seriesOptions[i] = {
            'name': name,
            'data': data
          };

          // As we're loading the data asynchronously, we don't know what order it will arrive. So
          // we keep a counter and create the chart when all the data is loaded.
          seriesCounter += 1;
          if (seriesCounter === names.length) {
            createChart();
          }
        });
      });
  });


});
