// module definition
var web = angular.module('web', []);


// include helper
$(document).ready(function() {
  // replace every elem with value
  $('module').each(function(i) {
    var o = $(this);
    $('elem[module="'+o.attr('id')+'"]').replaceWith(o.html());
  });
  // remove all modules
  $('module').remove();
  // bootstrap angularjs
  angular.bootstrap(document, ['web']);
  // enable tooltip
  $('[title]').tooltip({'placement': 'bottom'});
  // sign in helper
  $('#sign-in').submit(function() {
    $.post('api/signin', $(this).serialize(), function(data) {
      if(data.status !== 'ok') {
        $('#sign-in .btn').removeClass('btn-primary');
        $('#sign-in .btn').addClass('btn-danger');
        return false;
      }
      $('#sign-in .btn').removeClass('btn-danger');
      $('#sign-in .btn').addClass('btn-primary');
      window.location = '/rfid/';
    });
  });
});


// menu controller
web.controller('menuCtrl', ['$scope', function($scope) {

  // initialize
  var o = $scope;
  o.value = 0;

  // set menu
  o.set = function(val) {
    o.value = val;
  };

  // get current menu
  o.get = function() {
    return o.value;
  };

  // check if menu is given value
  o.is = function(val) {
    return o.value === val;
  };
}]);


// account controller
web.controller('accountCtrl', ['$scope', function($scope) {

  // initialize
  var o = $scope;
  o.employee = null;

  // get current menu
  o.get = function() {
    var signin = $.cookie('signin');
    if(!signin) return;
    $.post('api/signin', {'action': 'employee'}, function(data) {
       if(data.status === 'ok') o.employee = data.employee;
    });
  };
}]);


// counter controller
web.controller('counterCtrl', ['$scope', '$http', function($scope, $http) {

  // initialize
  var o = $scope;
  o.swipes = {};
  o.validSwipes = 0;
  o.invalidSwipes = 0;

  // initialize
  o.init = function() {
    o.updateSwipes();
    setInterval(o.updateSwipes, 1000);
  };

  // date
  o.date = function() {
    return new Date();
  };

  // update swipes
  o.updateSwipes = function() {
    $http.get('/rfid/api/counter').success(function(data) {
      o.swipes = data;
      var len = o.swipes.length;
      var valid = 0;
      for(var i=0; i<len; i++) {
        if(o.swipes[i].status !== "err") valid++;
        o.swipes[i].time = moment(o.swipes[i].time).fromNow();
      }
      o.invalidSwipes = len - valid;
      o.validSwipes = valid;
    });
  };
}]);
