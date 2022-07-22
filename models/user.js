const mongoose = require('mongoose');
const levels = ['user','admin','instalatir','teknisi'];
const isiPerusahaan = ['admin','instalatir','teknisi'];

const userSchema = mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    avatar : {
        type : String,
    },
    email :{
        type : String,
        required: true,
        unique:true
    },
    noHp : {
        type : Number,
        required : true
    },
    alamat : {
        type : String,
    },
    passwordHash : {
        type : String,
        required : true
    },
    city : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'City',
        required : true
    },
    perusahaan : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'Perusahaan',
        required : checkRole
    },
    role : {
        type: String,
        enum : levels,
        required : true,
        default : 'user'
    },
    cloudinary_id : {
        type: String
    }

});

userSchema.virtual('id').get(function(){
    return this._id.toHexString();
  });
  
 userSchema.set('toJSON',{
    virtuals:true,
  });

function checkRole() {
      if (isiPerusahaan.indexOf(this.role) > -1) {
          return true
      }
      return false
  }


exports.User = mongoose.model('User', userSchema);
exports.userSchema = userSchema;