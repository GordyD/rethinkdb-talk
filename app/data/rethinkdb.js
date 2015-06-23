var r = require('rethinkdb');
r
.connect( {host: 'localhost', port: 28015})
.then(function(conn){
  return dropDbIfExists(conn)
  .then(createDb(conn))
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


function dropDbIfExists(conn) {
  console.log('Drop DB database...');
  return r
    .dbDrop('dragonball')
    .run(conn);
}

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
    console.log('Create index for realtime ordering...');
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
      {name: 'Goku', species: ['Saiyan'], maxStrength: 10, damage: 0, status: 'inactive', image: 'images/character-profile-goku.jpg', created: r.now() },
      {name: 'Gohan', species: ['Human','Saiyan'], maxStrength: 10, damage: 0, status: 'inactive', image: 'images/character-profile-gohan.jpg', created: r.now() },
      {name: 'Vegata', species: ['Saiyan'], maxStrength: 10, damage: 0, status: 'inactive', image: 'images/character-profile-vegeta.jpg', created: r.now() },
      {name: 'Piccolo', species: ['Nemek'], maxStrength: 10, damage: 0, status: 'inactive', image: 'images/character-profile-piccolo.jpg', created: r.now() },
      {name: 'Bulma', species: ['Human'], maxStrength: 10, damage: 0, status: 'inactive', image: 'images/character-profile-bulma.jpg', created: r.now() },
      {name: 'Krillin', species: ['Human'], maxStrength: 10, damage: 0, status: 'inactive', image: 'images/character-profile-krillin.jpg', created: r.now() },
      {name: 'Chi Chi', species: ['Human'], maxStrength: 10, damage: 0, status: 'inactive', image: 'images/character-profile-chi-chi.jpg', created: r.now() },
      {name: 'Trunks', species: ['Human','Saiyan'], maxStrength: 10, damage: 0, status: 'inactive', image: 'images/character-profile-trunks.jpg', created: r.now() },
      {name: 'Cell', species: ['Human'], maxStrength: 10, damage: 0, status: 'inactive', image: 'images/character-profile-cell.jpg', created: r.now() },
      {name: 'Frieza', maxStrength: 10, damage: 0, status: 'inactive', image: 'images/character-profile-frieza.jpg', created: r.now() },
    ])
    .run(conn);
  };
}