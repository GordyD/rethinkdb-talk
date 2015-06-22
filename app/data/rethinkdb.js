var r = require('rethinkdb');
r
.connect( {host: 'localhost', port: 28015})
.then(function(conn){
  return createDb(conn)
  .then(createTable(conn))
  .then(insertData(conn))
  .then(createIndex(conn))
  .then(function() {
    console.log('Complete!');
    return conn.close();
  });
})
.error(function(err) {
  console.log('Something went wrong!', err);
});


function createDb(conn) {
  console.log('Create database...');
  return r
    .dbCreate('dragonball')
    .run(conn);
}

function createTable(conn) {
  return function() {
    console.log('Create table...');
    return r
    .db('dragonball')
    .tableCreate('characters')
    .run(conn);
  };
}

function createIndex(conn) {
  return function() {
    return r
    .db('dragonball')
    .table('characters')
    .indexCreate('maxStrength')
    .run(conn);
  };
}

function insertData(conn) {
  return function() {
    console.log('Insert data...');
    return r
    .db('dragonball')
    .table('characters')
    .insert([
      {name: 'Goku', species: ['Saiyan'], maxStrength: 1, created: r.now() },
      {name: 'Gohan', species: ['Human','Saiyan'], maxStrength: 2, created: r.now() },
      {name: 'Vegata', species: ['Saiyan'], maxStrength: 3, created: r.now() },
      {name: 'Piccolo', species: ['Nemek'], maxStrength: 4, created: r.now() },
      {name: 'Android 16', maxStrength: 5, created: r.now() },
      {name: 'Bulma', species: ['Human'], maxStrength: 6, created: r.now() },
      {name: 'Trunks', species: ['Human','Saiyan'], maxStrength: 7, created: r.now() }
    ])
    .run(conn);
  };
}