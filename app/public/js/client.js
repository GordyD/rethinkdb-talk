var app = angular.module('realtimeTalkApp', [
  'btford.socket-io'
]);

app.factory('socket', function (socketFactory) {
  return socketFactory();
});

app.controller('MainCtrl', function ($scope, socket) {

  socket.on('assign-character', function (character) {
    $scope.character = character;
  });

  socket.on('initial-leaderboard', function (leaderboard) {
    $scope.leaderboard = leaderboard;
  });

  socket.on('update-leaderboard', function (change) {
    if (change.new_val.id === $scope.character.id) {
      $scope.character = change.new_val;
    } 

    for(var i = 0; i < $scope.leaderboard.length; i++) {
      if ($scope.leaderboard[i].id === change.old_val.id) {
        $scope.leaderboard[i] = change.new_val;
        break;
      }
    }
  });

  $scope.powerUp = function() {
    socket.emit('power-up', $scope.character);
  };

  $scope.heal = function() {
    socket.emit('heal', $scope.character);
  };

  $scope.attack = function(other) {
    socket.emit('attack', other);
  };
});