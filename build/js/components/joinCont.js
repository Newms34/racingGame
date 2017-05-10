app.controller('join-cont',function($scope,$http,userFact){
	$scope.getGames = function(){
		$http.get('/user/allGames').then(function(r){
			if(r.data=='err'){
				bootbox.alert('There was an error retrieving current games!');
				return false;
			}else{
				$scope.games = r.data
			}
		})
	};
	userFact.chkLog().then(function(r){
		if(r=='no'){
			window.location.href='./login';
		}else{
			$scope.user=r;
			//now we need to get all tracks
			$scope.getGames();
		}
	});
	$scope.getRemSlots = function(gm){
		return new Array(gm.maxPlayers - gm.players.length);
	};
	$scope.joinGame = function(gm){
		if(gm.protected){
			bootbox.prompt('This game is protected! Please enter the password',function(resp){

			})
		}else{
			bootbox.confirm('Are you sure you want to join this game?',function(resp){

			})
		}
	}
})