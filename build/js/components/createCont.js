app.controller('create-cont',function($scope,userFact,$http){
	$scope.trackBlurbs = [];
	userFact.chkLog().then(function(r){
		if(r=='no'){
			window.location.href='./login';
		}else{
			$scope.user=r;
			//now we need to get all tracks
			userFact.getTrackBlurbs().then(function(tb){
				$scope.trackBlurbs=tb;
				$scope.trackPick = $scope.trackBlurbs[0].id;
			})
		}
	});
	$scope.maxNum = 0;
	$scope.makeGame =  function(){
		if(($scope.pwd && $scope.pwd!=$scope.pwdDup)||!$scope.name||!$scope.name.length){
			bootbox.alert("It looks like there's a problem with your submission. Please check to make sure you've included a name, and that both password fields (if included) are the same!");
			return false;
		}else{
			var newGame = {
				user:$scope.user.name,
				track:$scope.trackPick,
				protected:!!$scope.pwd, 
				players:[$scope.user.name],
				maxPlayers:$scope.maxNum,
				name:$scope.name,
				id:Math.floor(Math.random()*9999999).toString(32)
			};
			if($scope.pwd){
				newGame.pass = $scope.pwd;
			}
			socket.emit('newGame',newGame);
		}
	}
})