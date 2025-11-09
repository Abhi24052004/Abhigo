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

module.exports.updateUser = async (req, res, next) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const { FullName, Email } = req.body;
        const FirstName = FullName?.FirstName;
        const LastName = FullName?.LastName;
        const updated = await userService.updateUser({ userId, FirstName, LastName, Email });
        return res.status(200).json({ user: updated });
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}

module.exports.findByEmail = async (req, res, next) => {
    try {
        const email = req.query.email || req.query.Email;
        if (!email) return res.status(400).json({ message: 'email query required' });
        const user = await userService.getUserByEmail(email);
        if (!user) return res.status(404).json({ message: 'No user exists with this email' });
        // Return minimal public profile
        const payload = { _id: user._id, Email: user.Email, FullName: user.FullName };
        return res.status(200).json(payload);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}

module.exports.updatePassword = async (req, res, next) => {
    try {
        const { userId, pasword } = req.body || {};
        if (!userId || !pasword) return res.status(400).json({ message: 'userId and pasword required' });
        const hashed = await userModel.hashPassword(pasword);
        const user = await userService.updateUserPassword({ userId, hashedPassword: hashed });
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.status(200).json({ message: 'Password updated' });
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
}
