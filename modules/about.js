// @wolfram77
// ABOUT - maintains info about device
// () - id, team, all, load, save, close
// .. - t = time, d = duration, g = gap, n = number, m = min, dev = device


// required modules
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');



// initialize
module.exports = function(file) {
  var o = new EventEmitter();

  // init
  var c = {};



  // get or set id of device
  o.id = function(id) {
    console.log('about.id> %s', id);
    return c.id = id || c.id;
  };


  // get or set team (devices)
  o.team = function(team) {
    console.log('about.team> %j', team);
    for(var i in team) {
      if(team[i] === null) delete c.team[i];
      else _.merge(c.team[i], team[i]);
    }
    return c.team;
  };


  // get or set all infor
  o.all = function(all) {
    console.log('about.all> %j', all);
    if(all) _.merge(c, all);
    return c;
  };


  // load
  o.load = function(fn) {
    console.log('about.load>');
    fs.readFile(file, function(err, data) {
      _.merge(c, JSON.parse(data));
      if(fn) fn(c);
    });
  };


  // save
  o.save = function(fn) {
    console.log('about.save>');
    fs.writeFile(file, JSON.stringify(c), function(err) {
      if(fn) fn();
    });
  };


  // close module
  o.close = function() {
    console.log('about.close>');
    fs.writeFileSync(file, JSON.stringify(c));
  };



  // prepare
  _.merge(c, JSON.parse(fs.readFileSync(file)));
  setInterval(o.save, c.gsave);

  // ready!
  console.log('about> ready!');
  return o;
};
