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
