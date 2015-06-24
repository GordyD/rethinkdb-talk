/**
 * Dependencies
 */
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var config = require('config');
var Promise = require('bluebird');
var r = require('rethinkdb');
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var conn = null, characters = null;

/**
 * Set up express server
 */
app.set('view engine', 'jade');
app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
  res.render('index');
});

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

/**
 * Promise chain to set up RethinkDB connection
 * and socket
 */
r.connect(config.rethinkdb)
.then(storeConnection)
.then(resetStatuses)
.then(wireUpSockets);

function storeConnection(newConn) {
  conn = newConn;
}

function resetStatuses() {
  return r.table('characters').update({ status: 'inactive' }).run(conn)
}

function loadCharacters() {
  return r.table('characters').orderBy(r.desc('maxStrength')).run(conn)
  .then(function(cursor) {
    return cursor.toArray();
  });
}

function wireUpSockets(foo,bar) {
  /**
   * Change feed for leaderboard
   */
  r
  .table('characters')
  .orderBy({index: r.desc('maxStrength')})
  .limit(10)
  .changes()
  .run(conn, function(err, cursor) {
    if (err) {
      console.error(err);
    } else {
      cursor.each(function(err, changes) {
        console.log(changes);
        io.emit('update-leaderboard', changes);
      });
    }
  });

  io.on('connection', function (socket) {
    console.log(' [.] New user!');
    var assignedId = null;

    socket.on('disconnect', function() {
      if (assignedId !== null) {
        console.log(' [.] Disconnected User');
        r
        .table('characters')
        .get(assignedId)
        .update({status: 'inactive'})
        .run(conn);
      }
    });

    socket.on('power-up', function (data) {
      console.log(' [.] Power up', data.name);
      var change = (Math.floor(Math.random() * 3) + 1);

      r
      .table('characters')
      .filter({id: data.id})
      .update({ maxStrength: r.row('maxStrength').add(change) })
      .run(conn);
    });

    socket.on('attack', function (data) {
      console.log(' [.] Attack', data.name);
      var change = (Math.floor(Math.random() * 4) + 1);

      r
      .table('characters')
      .filter({id: data.id})
      .update({ damage: r.row('damage').add(change) })
      .run(conn);
    });

    socket.on('heal', function (data) {
      console.log(' [.] Heal', data.name);
      data.damage = (data.damage < 2) ? 0 : data.damage - 2;

      r
      .table('characters')
      .filter({id: data.id})
      .update({damage: data.damage})
      .run(conn);
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