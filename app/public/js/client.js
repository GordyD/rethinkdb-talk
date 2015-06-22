var app = angular.module('realtimeTalkApp', [
  'btford.socket-io'
]);

app.factory('socket', function (socketFactory) {
  return socketFactory();
});

app.controller('MainCtrl', function ($scope, socket) {

  socket.on('assign-character', function (character) {
    console.log('Assign', character);
    $scope.character = character;
  });

  socket.on('initial-leaderboard', function (leaderboard) {
    console.log(leaderboard);
    $scope.leaderboard = leaderboard;
  });

  socket.on('update-leaderboard', function (leaderboardChange) {
    for(var i = 0; i < $scope.leaderboard.length; i++) {
      if ($scope.leaderboard[i].id === leaderboardChange.old_val.id) {
        $scope.leaderboard[i] = leaderboardChange.new_val;
        break;
      }
    }
  });

  $scope.powerUp = function() {
    $scope.character.maxStrength++;
    socket.emit('power-up', $scope.character);
  };
});