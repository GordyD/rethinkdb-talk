// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var config = require('config');
var r = require('rethinkdb');
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

// Port
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Templating
app.set('view engine', 'jade');

// Routing
app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
  res.render('index');
});

var conn = null;
var characters = null;

r.connect(config.rethinkdb)
.then(storeConnection)
.then(wireUpSockets);

function storeConnection(newConn) {
  conn = newConn;
  console.log(' [.] Db Connected.');
}

function loadCharacters() {
  return r.table('characters').orderBy(r.desc('maxStrength')).run(conn)
  .then(function(cursor) {
    return cursor.toArray();
  });
}

function wireUpSockets() {

  r.table('characters').orderBy({index: r.desc('maxStrength')}).limit(10)
  .changes()
  .run(conn, function(err, cursor) {
    if (err) {
      console.error(err);
    } else {
      cursor.each(function(err, changes) {
        io.emit('update-leaderboard', changes);
      });
    }
  });

  io.on('connection', function (socket) {
    console.log(' [.] New user!');

    loadCharacters().then(function(cs) {
      socket.emit('assign-character', getRandomCharacter(cs));
      socket.emit('initial-leaderboard', cs.slice(0,10));
    });

    socket.on('power-up', function (data) {
      r.table('characters').filter({id: data.id})
      .update(data)
      .run(conn);
    });
  });  
}

function getRandomCharacter(cs) {
  return cs[Math.floor(Math.random()*cs.length)];
}