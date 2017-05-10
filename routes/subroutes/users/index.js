var express = require('express');
var router = express.Router(),
    path = require('path'),
    models = require('../../../models/'),
    async = require('async'),
    mongoose = require('mongoose'),
    session = require('client-sessions');
module.exports = router;
router.post('/save', function(req, res, next) {
    var newData = req.body,
        un = req.body.name;
    console.log('body', req.body, 'sesh', un);
    console.log('inventory:', JSON.stringify(req.body.equip));
    mongoose.model('User').update({ 'name': un }, newData, function(err, usr) {
        mongoose.model('User').findOne({ 'name': un }, function(err, usr) {
            console.log('tried to find user we just saved. Result is', usr, 'err is', err);
            // console.log('current cell of user:',usr.currentLevel.loc)
            req.session.user = usr;
            res.send(true);
        });
    });
});
router.post('/new', function(req, res, next) {
    //record new user
    console.log('NEW USER DATA-----:', req.body)
    var un = req.body.user,
        pwd = req.body.password,
        prof = parseInt(req.body.prof) || 1;
    mongoose.model('User').findOne({ 'name': un }, function(err, user) {
        if (!user) {

            //this user does not exist yet, so okay to go ahead and record their un and pwd then make a new user!
            var salt = mongoose.model('User').generateSalt();
            var newUser = {
                name: un,
                pts: 0,
                tracks: [],
                salt: salt,
                pass: mongoose.model('User').encryptPassword(pwd, salt),
            }
            console.log(newUser);
            mongoose.model('User').create(newUser);
            res.send('saved!')

        } else {
            res.send('DUPLICATE');
        }
    });
});
router.get('/nameOkay/:name', function(req, res, next) {
    mongoose.model('User').find({ 'name': req.params.name }, function(err, user) {
        if (!user.length) {
            //this user does not exist yet, so 
            //go ahead and record their un and pwd
            res.send('okay');
        } else {
            res.send('bad');
        }
    });
});
router.post('/login', function(req, res, next) {
    //notice how there are TWO routes that go to /login. This is OKAY, as long as they're different request types (the other one's GET, this is POST)
    mongoose.model('User').findOne({ 'name': req.body.name }, function(err, usr) {
        console.log('USER FROM LOGIN:', usr);
        if (err || !usr || usr === null) {
            //most likely, this user doesn't exist.
            res.send('no');
        } else if (usr.correctPassword(req.body.pwd)) {
            //woohoo! correct user!
            //important note here: we must set all this session stuff, etc BEFORE
            //we send the response. As soon as we send the response, the server considers us "done"!
            req.session.user = usr;
            res.send('yes');
        } else {
            res.send('no');
        }
    });
});
router.get('/check', function(req, res, next) {
    console.log('checking login', req.session);
    if (req.session.user) {
        res.send(req.session.user);
    } else {
        res.send('no');
    }
});
router.get('/logout', function(req, res, next) {
    /*this function logs out the user. It has no confirmation stuff because
    1) this is on the backend
    2) this assumes the user has ALREADY said "yes", and
    3) logging out doesn't actually really require any credentials (it's logging IN that needs em!)
    */
    console.log('usr sez bai');
    req.session.reset();
    res.send('logged');
});
router.post('/createGame', function(req, res, next) {
    if (!req.session || !req.session.user || req.session.user.name != req.body.user) {
        //auth err
        res.send('err');
    } else {
        var salt = mongoose.model('Race').generateSalt();
        var newRace = {
            track: req.body.track,
            pass: req.body.pass ? mongoose.model('Race').encryptPassword(req.body.pass, salt) : null,
            salt: req.body.pass ? salt : null,
            protected: req.body.protected,
            players: req.body.players,
            maxPlayers: req.body.maxPlayers,
            name: req.body.name,
            id: Math.floor(Math.random() * 9999999).toString(32)
        };
        mongoose.model('Race').create(newRace, function(err, resp) {
            if (err) {
                res.send('err');
            } else {
                //game created successfully. Now need to push this to user model and update front-end
                mongoose.model('User').findOne({ name: req.session.user.name }, function(err, usr) {
                    usr.activeGames.push(newRace.id);
                    req.session.user.activeGames = usr.activeGames;
                    usr.save(function(uerr, ur) {
                        if (uerr) {
                            res.send('err')
                        } else {
                            res.send(ur);
                        }
                    });
                });
            }
        });
    }
})
router.post('/joinGame',function(req,res,next){
    if (!req.session || !req.session.user || req.session.user.name != req.body.user) {
        //auth err
        res.send('err');
    }
    mongoose.model('Race').findOne({id:req.body.id},function(err,gm){
        if(err){
            res.send('err')
        }else{
            if(gm.maxPlayers && gm.players.length==gm.maxPlayers){
                //game full!
                res.send('full');
            }else{
                gm.players.push(req.session.user);
                gm.save(function(){
                    mongoose.model('User').findOne({name:req.session.user},function(uer,ures){
                        ures.push(gm.id);
                        ures.save(function(){
                            res.send('okay');
                        })
                    })
                })
            }
        }
    })
});
router.post('/startGame',function(req,res,next){
    if (!req.session || !req.session.user || req.session.user.name != req.body.user) {
        //auth err
        res.send('err');
    }
    mongoose.model('Race').findOne({id:req.body.id},function(err,gm){
        if(err){
            res.send('err')
        }else{
            //this is no longer in the list of joinable games
            gm.remove(function(){

            });
        }
    })
});
router.get('/allGames',function(req,res,next){
    mongoose.model('Race').find({},function(err,resp){
        if(err){
            res.send('err');
        }else{
            res.send(resp);
        }
    })
})