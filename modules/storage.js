// @wolfram77
// STORAGE - maintains info about card swipes
// db - <date>_<state> (date = dd_mm_yyyy) (state = vld | inv) - time, point, card
// () - clear, get, put, add


// required modules
var EventEmitter = require('events').EventEmitter;
var sqlite3 = require('sqlite3').verbose();
var _ = require('lodash');



// initialize
module.exports = function(c) {
  var o = new EventEmitter();

  // init
  var db = new sqlite3.Database(c.file);


  // table name (date, state)
  var table = function(d, s) {
    return 'date_'+d.getDate()+'_'+(d.getMonth()+1)+'_'+d.getFullYear()+(s? '_'+s:'');
  };


  // create tables
  var create = function(start, end) {
    for(var d=new Date(start.getTime()); d<=end; d.setDate(d.getDate()+1)) {
      db.run('CREATE TABLE IF NOT EXISTS '+table(d, 'vld')+'(time DATETIME, point TEXT, card INTEGER)');
      db.run('CREATE TABLE IF NOT EXISTS '+table(d, 'inv')+'(time DATETIME, point TEXT, card INTEGER)');
    }
  };


  // clear tables (drop)
  var clear = function(start, end) {
    for(var d=new Date(start.getTime()); d<=end; d.setDate(d.getDate()+1)) {
      db.run('DROP TABLE IF EXISTS '+table(d, 'vld'));
      db.run('DROP TABLE IF EXISTS '+table(d, 'inv'));
    }
  };


  // convert from rows format
  // res = [[time_millis, card]]
  var fromrows = function(rows, res) {
    for(var i=0; i<rows.length; i++)
      res.push([rows[i].time.getTime(), rows[i].card]);
    return res;
  };


  // convert to rows format
  // rows = [{time, point, card}]
  var torows = function(req, p, rows) {
    for(var i=0; i<req.length; i++)
      rows.push({'time': new Date(req[i][0]), 'point': p, 'card': req[i][1]});
    return rows;
  };


  // get data (one point & state)
  // res = [[time_millis, card]]
  var getone = function(start, end, p, s, res) {
    for(var d=new Date(start.getTime()); d<=end; d.setDate(d.getDate()+1)) {
      db.all('SELECT * FROM '+table(d, s)+' WHERE time>=? AND time<=? AND point=? ORDER BY ASC', start, end, p, function(err, rows) {
        if(!err) fromrows(rows, res);
      });
    }
  };


  // put data (one point & state)
  // req = [[time_millis, card]]
  var putone = function(req, p, s) {
    var rows = torows(req, p, []);
    create(rows[0].time, rows[rows.length-1].time);
    for(var i=0; i<rows.length; i++)
      db.run('INSERT INTO '+table(rows[i].time, s)+'(time, point, card) VALUES, (?, ?, ?)', rows[i].time, rows[i].point, rows[i].card);
  };


  // add validate (one record)
  var addvalidate = function(r, fn) {
    db.get('SELECT COUNT(*) FROM '+table(r.time, 'vld')+' WHERE card=?', r.card, function(err, row) {
      if(err || row['COUNT(*)'] < c.repeat) fn(true);
      else fn(false);
    });
  };



  // clear data
  o.clear = function(start, end, fn) {
    db.serialize(function() {
      delete(start, end);
      db.run('VACUUM', fn);
    });
  };


  // get data from storage
  // req = { point:{ state:{ start_millis, end_millis}}}
  o.get = function(req, fn) {
    var res = {};
    db.serialize(function() {
      for(var p in req) {
        var pv = req[p], rpv = {};
        for(var s in pv) {
          var sv = pv[s], rsv = [];
          getone(new Date(sv.start), new Date(sv.end), p, s, rsv);
          rpv[s] = rsv;
        }
        res[p] = rpv;
      }
      db.run('PRAGMA no_op', function() {
        if(fn) fn(res);
      });
    });
  };


  // put data to storage
  // req = { point:{ state:[[time_millis, card]]}}
  o.put = function(req, fn) {
    db.serialize(function() {
      for(var p in res) {
        var pv = req[p];
        for(var s in pv)
          putone(pv[s], p, s);
      }
      db.run('PRAGMA no_op', function() {
        if(fn) fn();
      });
    });
  };


  // add data with check (one row)
  // r = {time, point, card}
  o.add = function(r, fn) {
    addvalidate(r, function(valid) {
      var tab = table(r.time, valid? 'vld' : 'inv');
      db.run('INSERT INTO '+tab+'(time, point, card) VALUES (?, ?, ?)', r.time, r.point, r.card, function() {
        if(fn) fn(valid);
      });
    });
  };


  // close module
  o.close = db.close;



  // ready!
  console.log('storage ready!');
  return o;
};
