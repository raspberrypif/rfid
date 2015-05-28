// @wolfram77


// required modules
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');


// initialize
console.log('pi-snax-config');
var o = new EventEmitter();
module.exports = function(file) {
  o.file = file;
  o.load();
  return o;
};



// load config data
o.load = function() {
  o.val = JSON.parse(fs.readFileSync(o.file));
};


// save config data
o.save = function() {
  fs.writeFileSync(o.file, JSON.stringify(o.val));
};


// close module
o.close = o.save;



// load config data (async)
o.on('load', function() {
  fs.readFile(o.file, function(err, data) {
    o.val = JSON.parse(data);
  });
});


// save config data (async)
o.on('save', function() {
  fs.writeFile(o.file, JSON.stringify(o.val), function(err) {
    if(err) throw err;
  });
});
