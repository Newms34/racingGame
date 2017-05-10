var mongoose = require('mongoose');
var trackSchema = new mongoose.Schema({
    cells:[{
        x:Number,
        y:Number,
        next:String,
        cellType:Number
    }],
    width:Number,
    height:Number,
    name:String,
    desc:String,
    id:String
}, { collection: 'track' });

mongoose.model('Track', trackSchema);
