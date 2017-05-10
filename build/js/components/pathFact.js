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
