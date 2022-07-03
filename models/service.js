const mongoose = require('mongoose');

const serviceSchema = mongoose.Schema({
    name : {
        type: String,
        required : true
    },
    description : {
        type: String,
        default : ''
    },
    icon : {
        type: String,
        required : true
    },
    dateCreated : {
        type: Date,
        default: Date.now
    }
})

serviceSchema.virtual('id').get(function(){
    return this._id.toHexString();
});
  
serviceSchema.set('toJSON',{
    virtuals:true,
});
  
exports.Service = mongoose.model('Service', serviceSchema);