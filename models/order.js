const mongoose = require('mongoose');

const orderSchema = mongoose.Schema({
    orderItems : [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'OrderItem',
        required : true
    }],
    teknisi : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    },
    detail : {
        type : String,
        required : true
    },
    city : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'City',
        required : true
    },
    alamat : {
        type : String,
        required : true
    },
    noHp : {
        type : Number,
        required : true
    },
    status : {
        type : String,
        required : true,
        default : 'menunggu'
    },
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    dateOrdered : {
        type : Date,
        default : Date.now
    }
})

orderSchema.virtual('id').get(function(){
    return this._id.toHexString();
  });
  
 orderSchema.set('toJSON',{
    virtuals:true,
  });

exports.Order = mongoose.model('Order', orderSchema);