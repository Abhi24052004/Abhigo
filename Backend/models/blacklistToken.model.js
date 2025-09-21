const mong=require("mongoose");

const blackListShema=new mong.Schema({
    token:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires:"1h"
    }
});

const blackListmodel=mong.model("blackListShema",blackListShema);
module.exports=blackListmodel;