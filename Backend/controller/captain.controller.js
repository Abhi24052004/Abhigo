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

module.exports.findByEmail = async (req, res, next) => {
    try {
        const email = req.query.email || req.query.Email;
        if (!email) return res.status(400).json({ message: 'email query required' });
        const captain = await captainService.getCaptainByEmail(email);
        if (!captain) return res.status(404).json({ message: 'No user exists with this email' });
        const payload = { _id: captain._id, email: captain.email, fullname: captain.fullname };
        return res.status(200).json(payload);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}

module.exports.updatePassword = async (req, res, next) => {
    try {
        const { captainId, password } = req.body || {};
        if (!captainId || !password) return res.status(400).json({ message: 'captainId and password required' });
        const hashed = await captainModel.hashPassword(password);
        const captain = await captainService.updateCaptainPassword({ captainId, hashedPassword: hashed });
        if (!captain) return res.status(404).json({ message: 'Captain not found' });
        return res.status(200).json({ message: 'Password updated' });
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}
