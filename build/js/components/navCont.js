app.controller('nav-cont',function($scope,userFact,$window){
	$scope.navButs = [{
		text:'Map Editor',
		url:'edit'
	},{
		text:'Create a Race',
		url:'create'
	},{
		text:'Join a Race',
		url:'join'
	}];
	$scope.getLoc = function(loc){
		return window.location.href.slice(window.location.href.lastIndexOf('/')+1) == loc;
	}
	$(window).scrollTop(0)
	$scope.getLoc();
})