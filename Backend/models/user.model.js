const mong=require("mongoose");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const { default: mongoose } = require("mongoose");

const userSchema = new mong.Schema({
    FullName:{
        FirstName:{
            type:String,
            required:true,
            minlength:[3,"FirstName must be of atleast 3 chars.."]
        },
        LastName:{
            type:String,
            required:true,
            minlength:[3,"LastName must be of atleast 3 chars.."]
        }
    },
    Email:{
        type:String,
        required:true,
        unique:true,
        minlength:[5,"email must of atleast 5 chars.."]
    },
    pasword:{
        type:String,
        select:false,
        required:true
    },
    socketId:{
        type:String 
    }
})

userSchema.methods.generateAuthToken = function () {
    const payload = {
        _id: this._id,
        loginAt: Date.now(), 
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
    return token;
}


userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.pasword);
}

userSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
}

const userModel = mongoose.model('user', userSchema);


module.exports = userModel;