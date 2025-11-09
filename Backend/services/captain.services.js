const mong=require('mongoose');
const captainModel=require('../models/captain.model');

module.exports.createCaptain=async({fullname,email,password,status,vehicle,location})=>{
    if( !email || !password || !vehicle || !location){
        throw new Error("all feilds are required..");
    }
    const hashedpassword=await captainModel.hashPassword(password);
    const captain=await captainModel.create({
        fullname:{
            firstname:fullname.firstname,
            lastname:fullname.lastname
        },
        email,
        password:hashedpassword,
        status,
        vehicle:{
            color:vehicle.color,
            plate:vehicle.plate,
            capacity:vehicle.capacity,
            vehicleType:vehicle.vehicleType
        },
        location:{
            ltd:location.ltd,
            lng:location.lng
        }
    })
    return captain;
}

module.exports.getCaptainByEmail = async (email) => {
    if (!email) throw new Error('Email required');
    const captain = await captainModel.findOne({ email });
    return captain;
}

module.exports.updateCaptainPassword = async ({ captainId, hashedPassword }) => {
    if (!captainId || !hashedPassword) throw new Error('captainId and hashedPassword required');
    const captain = await captainModel.findByIdAndUpdate(
        captainId,
        { password: hashedPassword },
        { new: true }
    );
    return captain;
}


