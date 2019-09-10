app.controller('join-cont', function($scope, $http, userFact) {
    $scope.getGames = function() {
        socket.emit('getGames',{x:null});
    };
    userFact.chkLog().then(function(r) {
        if (r == 'no') {
            window.location.href = './login';
        } else {
            $scope.user = r;
            //now we need to get all tracks
            $scope.getGames();
        }
    });
    $scope.getRemSlots = function(gm) {
        return new Array(gm.maxPlayers - gm.players.length);
    };
    socket.on('allGames',function(gm){
    	console.log('games',gm.all)
    	$scope.games = gm.all;
    	$scope.$digest();
    })
    $scope.joinGame = function(gm) {
        bootbox.dialog({
            title: 'Join Game',
            message: gm.protected ? "This game is protected. Please enter the password if you wish to join<br/><input id='gamepwd'>" : "Are you sure you want to join this game?",
            buttons: {
                confirm: {
                    label: 'Join',
                    className: 'btn-success',
                    callback: function() {
                        socket.emit('attemptJoin', {
                            game: gm,
                            pwd: gm.protected ? $('#gamepwd').val() : null,
                            user:$scope.user.name
                        })
                    }
                },
                cancel: {
                    label: 'Cancel',
                    className: 'btn-danger'
                }
            }
        });
    }
})
