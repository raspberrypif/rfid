// @wolfram77


// required modules
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');


// initialize
console.log('pi-snax-config');
var o = new EventEmitter(), file = '';
module.exports = function(cfile) {
  file = cfile;
  o.load();
  return o;
};



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
