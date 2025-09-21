const userModel = require('../models/user.model');


module.exports.createUser=async({FirstName,LastName,Email,pasword})=>{
    console.log(FirstName);
    if(!FirstName|| !Email || !pasword){
        throw new Error("all feilds are required..");
    }
    
    const user=userModel.create({
        FullName:{
            FirstName,
            LastName
        },
        Email,
        pasword
    })
    return user;
}