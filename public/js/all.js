var socket = io();
var app = angular.module('raceApp',[]);
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
				name:$scope.name
			};
			if($scope.pwd){
				newGame.pass = $scope.pwd;
			}
			$http.post('/user/createGame',newGame).then(function(resp){
				if(resp.data=='err'){
					bootbox.alert('Error creating game. Sorry!')
				}else{
					bootbox.alert('Game created!');
					//everything okay. redirect us to the main page so we can play
					window.location.href='./';
				}
			})
		}
	}
})
app.controller('edit-cont', function($scope, pathFact, userFact) {
    $scope.w = 10;
    $scope.h = 10;
    $scope.rows = [];
    $scope.path = [];
    userFact.chkLog().then(function(r) {
        if (r == 'no') {
            window.location.href = './login.html'
        }else{
            $scope.user = r;
        }
    })
    $scope.startMade = false;
    $scope.roadTypes = [{
        num: 1,
        lbl: 'normal',
        symb: ' ',
        desc: 'Normal roads are, well, normal. They just let you drive right on past!'
    }, {
        num: 2,
        lbl: 'boost',
        symb: '\u25B6',
        desc: 'Boosts give you a little extra bit of speed, but take a while to respawn!'
    }, {
        num: 3,
        lbl: 'random',
        symb: '\uFFFD',
        desc: 'A mixed bag! Random blocks can either help you or hinder you!'
    }, {
        num: 4,
        lbl: 'slow',
        symb: '\u2592',
        desc: 'Be careful of these! Hitting slow blocks not only lowers your speed, but also removes it temporarily for other racers!'
    }]
    $scope.drawCells = function() {
        $scope.rows = [];
        $scope.path = [];
        for (var i = 0; i < $scope.h; i++) {
            var newRow = {
                cells: []
            }
            for (var j = 0; j < $scope.w; j++) {
                newRow.cells.push({
                    x: j,
                    y: i,
                    cellType: 0
                });
            }
            $scope.rows.push(newRow);
        }
        $scope.startMade = false;
    };
    $scope.pathDone = false;
    $scope.drawCells();
    $scope.processCell = function(c, e) {
        if (e.which == 1) {
            if (!$scope.startMade) {
                $scope.startMade = true;
                c.cellType = 1;
                $scope.path.push({ x: c.x, y: c.y })
            } else {
                var prevCell = $scope.path[$scope.path.length - 1];
                if (!c.cellType && !$scope.pathDone) {
                    //cell's not active, and path is not closed
                    // We now search to see if the above previous cell is either above, left of, right of, or below our current pick
                    if ((Math.abs(prevCell.x - c.x) == 1 && prevCell.y == c.y) || (Math.abs(prevCell.y - c.y) == 1 && prevCell.x == c.x)) {
                        console.log('cell adjacent to prev cell')
                        c.cellType = 1;
                        $scope.path.push({ x: c.x, y: c.y });
                        //now we check to see if the path is closed.
                        //if it is, we accept no more until the last cell is deleted
                        if (pathFact.checkEnd(c, prevCell, $scope.path)) {
                            console.log('path auto-closed')
                            $scope.pathDone = true;
                        }
                    } else {
                        //do nothing
                    }
                } else {
                    if (c.x == prevCell.x && c.y == prevCell.y) {
                        $scope.path.pop();
                        c.cellType = 0;
                        $scope.pathDone = false;
                        if (!$scope.path.length) {
                            $scope.startMade = false;
                        }
                    }
                }
            }
        } else if (e.which == 3 && c.cellType) {
            $scope.pickCellType = true;
            $scope.cellBeingEdited = c;
            $scope.$digest();
            $scope.drawCells();
        }
    };
    $scope.pickRoadType = function(n) {
        $scope.cellBeingEdited.cellType = n;
        $scope.cellBeingEdited = null;
        $scope.pickCellType = false;
    }
    $scope.save = function() {
        if (!$scope.name || !$scope.desc) {
            bootbox.alert('Please give your track a name and description!')
            return false;
        }
        bootbox.confirm('Are you sure you want to save this track?', function(resp) {
            if (resp && resp != null) {
                pathFact.prepareForSave($scope.name, $scope.desc, $scope.path, $scope.rows, $scope.w, $scope.h).then(function(r) {
                    if (r) {
                        $scope.path = [];
                        $scope.pathDone = false;
                        $scope.cellBeingEdited = null;
                    };
                });
            }
        })
    }
    $scope.getCellRads = function(c) {
        var bef, aft;
        for (var i = 0; i < $scope.path.length; i++) {
            if ($scope.path[i].x == c.x && $scope.path[i].y == c.y) {
                //found the cell!
                //now determine before and after
                if (i && i < $scope.path.length - 1) {
                    bef = $scope.path[i - 1];
                    aft = $scope.path[i + 1];
                } else if (i) {
                    bef = $scope.path[i - 1];
                    aft = $scope.path[0];
                } else {
                    bef = $scope.path[$scope.path.length - 1];
                    aft = $scope.path[i + 1];
                }
                console.log('bef', bef, 'aft', aft, 'curr', $scope.path[i])
                if (bef.x < c.x && bef.y == c.y) {
                    //from left
                    if (aft.y < c.y && aft.x == c.x) {
                        return '0 0 100% 0'
                    } else if (aft.y > c.y && aft.x == c.x) {
                        return '0 100% 0 0'
                    } else {
                        return '0 0 0 0'
                    }

                } else if (bef.x > c.x && bef.y == c.y) {
                    //from right
                    if (aft.y < c.y && aft.x == c.x) {
                        return '0 0 0 100%';
                    } else if (aft.y > c.y && aft.x == c.x) {
                        return '100% 0 0 0'
                    } else {
                        return '0 0 0 0'
                    }
                } else if (bef.y < c.y && bef.x == c.x) {
                    //from top
                    if (aft.x < c.x && aft.y == c.y) {
                        return '0 0 100% 0'
                    } else if (aft.x > c.x && aft.y == c.y) {
                        return '0 0 0 100%'
                    } else {
                        return '0 0 0 0'
                    }
                } else if (bef.y > c.y && bef.x == c.x) {
                    //from bottom
                    if (aft.x < c.x && aft.y == c.y) {
                        return '0 100% 0 0'
                    } else if (aft.x > c.x && $scope.path[i + 1].y == c.y) {
                        return '100% 0 0 0'
                    } else {
                        return '0 0 0 0'
                    }
                }
            }
        }
    }
})

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
app.controller('log-con', function($scope, $http, $q, $timeout, $window, userFact) {
    $scope.hazLogd = false;
    $scope.musOn = true;
    $scope.user = {
        prof: '0'
    }
    $scope.newUsr = function() {
        //eventually we need to CHECK to see if this user is already taken!
        //for now, we assume not
        if ($scope.regForm.pwd.$viewValue != $scope.regForm.pwdTwo.$viewValue) {
            bootbox.alert('Your passwords don&rsquo;t match!', function() {

            });
        } else {
            var userInf = {
                user: $scope.regForm.username.$viewValue,
                password: $scope.regForm.pwd.$viewValue,
                prof: $scope.user.prof + 1
            };
            console.log('userInf', userInf)
            $http.post('/user/new', userInf).then(function(res) {
                if (res.data == 'saved!') {
                    $scope.login(true);
                }
            });
        }
    };
    $scope.passMatch = true;
    $scope.passStr = 0;
    $scope.isNew = false;
    $scope.checkPwdStr = function() {
        if ($scope.regForm.pwd.$viewValue) {

            $scope.passStr = userFact.checkPwdStr($scope.regForm.pwd.$viewValue);
        }
        console.log('pwd strength', $scope.passStr);
    };
    $scope.checkPwds = function() {
        $scope.passMatch = userFact.checkPwdMatch($scope.regForm.pwd.$viewValue, $scope.regForm.pwdTwo.$viewValue);
    };
    $scope.dupName = false;
    $scope.nameCheck = function() {
        var name = $scope.regForm.username.$viewValue;
        console.log('userFact', userFact.checkName, 'name', name);
        userFact.checkName(name).then(function(resp) {
            $scope.dupName = resp;
        });
    };
    $scope.login = function(n) {
        if (n) {
            //new user. logging them in after we've registered
            userFact.login({
                name: $scope.regForm.username.$viewValue,
                pwd: $scope.regForm.pwd.$viewValue
            }).then(function(lRes) {
                //response back from factory (and thus backend)
                //Did login succeed?
                if (lRes) {
                    $scope.hazLogd = true;
                    $scope.getNews();
                } else {
                    bootbox.alert('Either your username or password is not correct!')
                }
            });
        } else {
            userFact.login({
                name: $scope.logForm.username.$viewValue,
                pwd: $scope.logForm.pwd.$viewValue
            }).then(function(lRes) {
                //response back from factory (and thus backend)
                //Did login succeed?
                if (lRes) {
                    $scope.hazLogd = true;
                    $scope.getNews();
                } else {
                    bootbox.alert('Either your username or password is not correct!');
                }
            });
        }
    };
    $scope.play = function() {
        $window.location.href = ('./');
    };
    $scope.passInf = function() {
        bootbox.alert('<h3>Password Strength</h3><hr/>Here are a few things to include for a stronger password:<ul><li>A lowercase letter</li><li>An uppercase letter</li><li>A number</li><li>A non alpha-numeric symbol (something like "@" or "$")</li></ul>Longer passwords are also generally better!');
    };
    $scope.checkPwdStr = function() {
        if ($scope.regForm.pwd.$viewValue) {

            $scope.passStr = userFact.checkPwdStr($scope.regForm.pwd.$viewValue);
        }
        console.log('pwd strength', $scope.passStr);
    };
    $scope.upd = [];
    $scope.parseInt = parseInt; //we're exposing this on the front end so that we can do stuff like <div>{{parseInt(someNum)}}</div>
});

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
app.factory('pathFact', function($http) {
    var buildTrack = function(data){
        //here we build and return the array for the track's ng-repeat
        var targ = document.querySelector('#race-field');
        var finalArray = [];
        var newRow = [];
        for (var i=0; i<data.cells.length;i++){
            newRow.push(data.cells[i]);
            if (newRow.length==data.width){
                finalArray.push(newRow);
                newRow = [];
            }
        }
        return finalArray;
    };
    return {
        checkEnd: function(curr, prev, cells) {
            for (var i = 0; i < cells.length; i++) {
                console.log('examing cells\nCurrent: ', curr, '\nprev: ', prev, '\ncell: ', cells[i])
                if (((Math.abs(curr.x - cells[i].x) == 1 && curr.y == cells[i].y) || (Math.abs(curr.y - cells[i].y) == 1 && curr.x == cells[i].x)) && (cells[i].x != prev.x || cells[i].y != prev.y)) {
                    return true;
                }
            }
            return false;
        },
        prepareForSave: function(name,desc,path,cells, w, h) {
        	var newTrack = {
        		name:name,
        		desc:desc,
        		width:w,
        		height:h,
        		id:Math.floor(Math.random()*999999999).toString(32),
        		cells:[]
        	}
            for (var i = 0; i < w; i++) {
            	for (var j = 0; j < h; j++) {
            		var newCell = {
            			x:i,
            			y:j,
            			next:null,
            			cellType:cells[j].cells[i].cellType
            		}
            		//now we scan thru paths to see if this cell is in the path
            		for (var k=0;k<path.length;k++){
            			if(path[k].x ==i && path[k].y==j){
            				console.log('foundpathcell')
            				if(path[k+1]){
            					newCell.next = path[k+1].x + '-'+path[k+1].y;
            				}else{
            					newCell.next = path[0].x+ '-'+path[0].y
            				}
            			}
            		}
            		newTrack.cells.push(newCell)
            	}
            }
            console.log('NEW TRACK',newTrack)
            return $http.post('/track/new',newTrack).then(function(r){
            	if(r.data=='err'){
            		bootbox.alert('There was a problem saving the track '+name+'! Sorry!');
                    return false;
            	}else{
            		bootbox.alert('Track '+name+' has been saved!');
                    return true;
            	}
            })
        },
        getTrack:function(id){
            return $http.get('/track/get/'+id).then(function(r){
                if(r.data=='err'){
                    bootbox.alert('There was a problem retrieving the track '+name+'!');
                    return false;
                }else{
                    return buildTrack(r.data);
                }
            })
        }
    };
});

app.controller('race-cont',function($scope,userFact){
	userFact.chkLog().then(function(r){
		if(r=='no'){
			window.location.href='./login';
		}else{
			$scope.user=r;
		}
	});
})
app.factory('userFact', function($http) {
    return {
        chkLog:function(){
            return $http.get('/user/check').then(function(resp){
            	return resp.data;
            })
        },
        checkPwdStr: function(pwd) {
            console.log('password:', pwd)
            var alphCap = new RegExp('[A-Z]', 'g');
            var alphLow = new RegExp('[a-z]', 'g');
            var nums = new RegExp('[0-9]', 'g');
            var weirds = new RegExp('\\W', 'g');
            var pwdStr = 0;
            if (pwd.search(alphCap) != -1) {
                pwdStr++;
            }
            if (pwd.search(alphLow) != -1) {
                pwdStr++;
            }
            if (pwd.search(nums) != -1) {
                pwdStr++;
            }
            if (pwd.search(weirds) != -1) {
                pwdStr++;
            }
            var len = pwd.length;
            if (len > 16) {
                pwdStr += 6
            } else if (len > 11) {
                pwdStr += 4;
            } else if (len > 6) {
                pwdStr += 2
            }
            return pwdStr;
        },
        checkPwdMatch: function(one, two) {
            if (one == two) {
                return true;
            }
            return false;
        },
        checkName: function(name) {
            console.log('NAME TO BACKEND', name)
                //note that below we're returning the ENTIRE http.get (the
                //asynchronous call). This allows us to use promisey things
                //like '.then()' on it in the controller.
            return $http.get('/user/nameOkay/' + name).then(function(nameRes) {
                console.log('NAME RESPONSE:', nameRes.data)
                if (nameRes.data == 'okay') {
                    return false
                } else {
                    return true;
                }
            })
        },
        login: function(creds) {
            console.log('credentials in factory', creds);
            return $http.post('/user/login', creds).then(function(logRes) {
                console.log('response from backend:', logRes)
                if (logRes.data == 'yes') {
                    return true;
                } else {
                    return false;
                }
            })
        },
        checkLogin: function() {
            return $http.get('/user/chkLog').then(function(chkLog) {
                console.log('CHECKLOG RESULTS', chkLog)
                return chkLog.data;
            })
        },
        getTrackBlurbs:function(){
            return $http.get('/track/getBlurbs').then(function(r){
                return r.data;
            })
        }
    };
});
