const captainService = require('../services/captain.services');
const captainModel = require('../models/captain.model');
const blackListModel=require("../models/blacklistToken.model");

const { validationResult } = require('express-validator');

module.exports.registerCaptain=async(req,res,next)=>{
    const eror=validationResult(req);
    if(!eror.isEmpty()){
        console.log("k");
        return res.status(400).json({message:eror.array()});
    }
    const {fullname,email,password,status,vehicle,location}=req.body;
    try{
       
        const captain=await captainService.createCaptain({
            fullname,
            email,
            password,
            status,
            vehicle,
            location
        });
        
        const token=captain.generateAuthToken();
        res.status(201).json({captain,token})
    }catch(e){
      
        res.status(400).json({message:e.message});
    }
    
}

module.exports.loginCaptain=async( req,res,next)=>{
    const eror=validationResult(req);
    if(!eror.isEmpty()){
        return res.status(400).json({message:eror.array()});
    }
    const {email,password}=req.body;
    
    const captain=await captainModel.findOne({email}).select("+password");
    if(!captain){
        return res.status(401).json({message:"Invalid email or password"});
    }
    const isMatch=await captain.comparePassword(password);
    if(!isMatch){
        return res.status(401).json({message:"Invalid email or password"});
    }
    const token=captain.generateAuthToken();
    res.cookie("token",token);
    res.status(200).json({captain,token});
}

module.exports.getprofile=async(req,res,next)=>{    
    res.status(200).json(req.captain);
}

module.exports.logoutCaptain=async(req,res,next)=>{
    await blackListModel.create({token:req.token});
    console.log(req.token);
    res.clearCookie('token');
    res.status(200).json({message:"Logout successfully"});
}