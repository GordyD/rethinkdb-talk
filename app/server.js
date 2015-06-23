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

  r.table('characters').orderBy({index: r.desc('maxStrength')}).changes()
  .run(conn, function(err, cursor) {
    if (err) {
      console.error(err);
    } else {
      cursor.each(function(err, changes) {
        io.emit('update-leaderboard', changes);
      });
    }
  });


  // When a new user connects to the application
  io.on('connection', function (socket) {
    console.log(' [.] New user!');
    var assignedId = null;

    socket.on('disconnect', function() {
      if (assignedId !== null) {
        console.log(' [.] Disconnected User');
        r.table('characters').get(assignedId).update({status: 'inactive'}).run(conn);
      }
    });

    socket.on('power-up', function (data) {
      console.log(' [.] Power up', data.name);
      data.maxStrength += (Math.floor(Math.random() * 3) + 1);
      r.table('characters').filter({id: data.id}).update(data).run(conn);
    });

    socket.on('attack', function (data) {
      console.log(' [.] Attack', data.name);
      data.damage += (Math.floor(Math.random() * 4) + 1);
      r.table('characters').filter({id: data.id}).update(data).run(conn);
    });

    socket.on('heal', function (data) {
      console.log(' [.] Heal', data.name);
      if (data.damage < 2) {
        data.damage = 0;
      } else {
        data.damage -= 2;
      }
      r.table('characters').filter({id: data.id}).update(data).run(conn);
    });

    loadCharacters()
    .then(sendInitialLeaderboard)
    .then(assignCharacter);

    function sendInitialLeaderboard(cs) {
      socket.emit('initial-leaderboard', cs.slice(0,10));
      return Promise.resolve(cs);
    }

    function assignCharacter(cs) {
      var len = cs.length, i = 0;
      for(i = 0; i < len; i++) {
        if (cs[i].status === 'inactive') {
          cs[i].status = 'active';
          assignedId = cs[i].id;
          break;
        }
      }

      if (assignedId === null) {
        socket.emit('assign-character', null);
        return Promise.resolve();
      }

      return r.table('characters').get(cs[i].id).update(cs[i]).run(conn)
      .then(function() {
        console.log(' [.] Assigned', cs[i].name);
        socket.emit('assign-character', cs[i]);
      });
    }
  });  
}