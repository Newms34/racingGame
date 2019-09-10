var express = require('express'),
    http = require('http'),
    app = express(),
    routes = require('./routes'),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    compression = require('compression'),
    bcrypt = require('bcrypt');
app.use(compression());
app.use(session({
    secret: 'ea augusta est et carissima',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));
app.use(cookieParser('ea augusta est et carissima'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'views')));
app.use('/', routes);
var server = http.Server(app);
var io = require('socket.io')(server);
var games = [];
io.on('connection', function(socket) {
    socket.on('newGame', function(gameObj) {
        console.log('new Game submitted')
        if (gameObj.protected && gameObj.pass) {
            //game is protected
            gameObj.salt = bcrypt.genSaltSync(10);
            gameObj.pass = bcrypt.hashSync(gameObj.pass, gameObj.salt)
        }
        games.push(gameObj);
        io.emit('allGames', {all:games});
    });
    socket.on('getGames',function(r){
        io.emit('allGames',{all:games})
    })
    socket.on('attemptJoin',function(gm){
        if(!gm.protected || (gm.game.protected && gm.pwd && bcrypt.compareSync(gm.pwd, gm.game.pass))){
            //game is protected and password is correct OR game is not protected
            socket.join(gm.game.id);
            gm.game.players.push(gm.user);
            io.sockets.in(gm.game.id).emit('userJoined',gm.game);//let everyone know a user joined
        }
    })
});
server.listen(process.env.PORT || 8080);
server.on('error', function(err) {
    console.log('Oh no! Err:', err)
});
server.on('listening', function(lst) {
    console.log('Server is listening!')
});
server.on('request', function(req) {
    console.log(req.body);
})

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log('Client (probly) err:', err)
    res.send('Error!' + err)
});
