const userModel=require("../models/user.model");
const userService=require("../services/user.services");
const {validationResult}=require("express-validator");
const blackListModel=require("../models/blacklistToken.model");

module.exports.registerUser=async(req,res,next)=>{
    const eror=validationResult(req);
    if(!eror.isEmpty()){
        return res.status(400).json({errrors:eror.array()});
    }
    
        const {FullName,Email,pasword}=req.body;
        
        const hashedpaswrd= await userModel.hashPassword(pasword);
       
        const user=await userService.createUser({
            FirstName: FullName.FirstName,
            LastName: FullName.LastName,
            Email,
            pasword:hashedpaswrd
        });
        const token = user.generateAuthToken();
        
        res.status(201).json({user,token});
}
module.exports.loginUser=async(req,res,next)=>{
    const eror=validationResult(req);
    if(!eror.isEmpty()){
        return res.status(400).json({errrors:eror.array()});
    }
    
        const {Email,pasword}=req.body;
        
        const user=await userModel.findOne({Email}).select("+pasword");
        if(!user){
            return res.status(401).json({message:"Invalid email or password"});
        }
        const isMatch=await user.comparePassword(pasword);
        if(!isMatch){
            return res.status(401).json({message:"Invalid email or password"});
        }
        
        const token = user.generateAuthToken();
        res.cookie('token', token);
        
        res.status(200).json({user,token});
}
module.exports.getProfile= (req,res,next)=>{
    res.status(200).json(req.user);
}
module.exports.logoutUser=async (req,res,next)=>{
    console.log("second")
    const token=req.cookies.token || req.headers.authorization?.split(' ')[1];
    console.log(token);
    await blackListModel.create({token});
    res.clearCookie('token');
    res.status(200).json({message:"Logout successfully"});
}
