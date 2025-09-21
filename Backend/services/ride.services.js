const rideModel = require('../models/ride.model');

module.exports.createRide=async({user,pickup,destination,fare,otp})=>{
    if(!user || !pickup || !destination || !fare || !otp){
        throw new Error("all feilds are required..");
    }
    const ride=await rideModel.create({
        user,
        pickup,
        destination,
        fare,
        otp
    })
    return ride;
}