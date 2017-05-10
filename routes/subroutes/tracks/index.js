var express = require('express');
var router = express.Router(),
    path = require('path'),
    models = require('../../../models/'),
    async = require('async'),
    mongoose = require('mongoose'),
    session = require('client-sessions');
module.exports = router;
router.get('/id/:id', function(req, res, next) {
    mongoose.model('Track').findOne({ id: req.params.id }, function(err, trk) {
        if (err || !trk) {
            res.send('err');
        } else {
            res.send(trk);
        }
    })
})
router.post('/new', function(req, res, next) {
    if (!req.session || !req.session.user || req.session.user.tracks.indexOf(req.params.id) >-1) {
        res.send('err');
    } else {
        mongoose.model('Track').findOne({ id: req.body.id }, function(err, trk) {
            if (err || trk) {
                res.send('err');
            } else {
                mongoose.model('Track').create(req.body);
                mongoose.model('User').findOne({ name: req.session.user.name }, function(err, trkUser) {
                    trkUser.tracks.push(req.body.id);
                    trkUser.save();
                    req.session.user.tracks = trkUser.tracks;
                    res.send('done');
                });
            }
        })
    }
});
router.get('/del/:id', function(req, res, next) {
    if (!req.session || !req.session.user || req.session.user.tracks.indexOf(req.params.id) < 0) {
        res.send('err');
    } else {
        mongoose.model('Track').findOne({ id: req.params.id }, function(err, trk) {
            if (err || !trk) {
                res.send('err');
            } else {
                trk.remove(function() {
                    mongoose.model('User').findOne({ name: req.session.user.name }, function(err, trkuser) {
                        trkUser.tracks.splice(trkUser.tracks.indexOf(req.params.id), 1);
                        trkUser.save();
                        req.session.user.tracks = trkUser.tracks;
                        res.send('done');
                    });
                });
            }
        })
    }
})
router.get('/getBlurbs',function(req,res,next){
    mongoose.model('Track').find({},function(err,tracks){
        if(err){
            res.send(err);
        }else{
            var trackBlurbs = [];
            tracks.forEach(function(trk){
                trackBlurbs.push({
                    name:trk.name,
                    desc:trk.desc,
                    id:trk.id
                })
            })
            res.send(trackBlurbs);
        }
    })
})