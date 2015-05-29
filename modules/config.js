// @wolfram77


// required modules
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');



// initialize
module.exports = function(file) {
  var o = new EventEmitter();



  // load config data
  o.load = function() {
    o.val = JSON.parse(fs.readFileSync(file));
  };


  // save config data
  o.save = function() {
    fs.writeFileSync(file, JSON.stringify(o.val));
  };


  // close module
  o.close = o.save;



  // load config data (async)
  o.on('load', function() {
    fs.readFile(file, function(err, data) {
      o.val = JSON.parse(data);
    });
  });


  // save config data (async)
  o.on('save', function() {
    fs.writeFile(file, JSON.stringify(o.val), function(err) {
      if(err) throw err;
    });
  });



  // load config
  o.load();

  // ready!
  console.log('config ready!');
  return o;
};
