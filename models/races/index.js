var mongoose = require('mongoose'),
    crypto = require('crypto');
//we're just testing password encryption here!
var raceSchema = new mongoose.Schema({
    track:String,//track id
    pass:String,
    salt:String,
    protected:{type:Boolean,default:false},
    players:[String],
    maxPlayers:{type:Number,default:0},
    name:String,
    id:String,
    ongoing:{type:Boolean, default:false}//if ongoing, the race is either A) being run, or B) waiting for players to send their okay.
}, { collection: 'Race' });

var generateSalt = function() {
    return crypto.randomBytes(16).toString('base64');
};

var encryptPassword = function(plainText, salt) {
    console.log('PASSWORD', plainText, salt)
    var hash = crypto.createHash('sha1');
    hash.update(plainText);
    hash.update(salt);
    return hash.digest('hex');
};
raceSchema.statics.generateSalt = generateSalt;
raceSchema.statics.encryptPassword = encryptPassword;
raceSchema.methods.correctPassword = function(candidatePassword) {
    console.log('this users condiments:', this.salt, 'and their pwd:', this.pass)
    return encryptPassword(candidatePassword, this.salt) === this.pass;
};
mongoose.model('Race', raceSchema);
