const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const captainModel = require('../models/captain.model');
const userModel = require('../models/user.model');
const { sendMessageToSocketId } = require('../socket');

async function getFare(pickup, destination, event) {

    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    const distanceTime = await mapService.getDistanceTime(pickup, destination);
    if (event === "false") {

        const baseFare = {
            auto: 20,
            car: 25,
            moto: 15
        };

        const perKmRate = {
            auto: 6,
            car: 10,
            moto: 2
        };

        const perMinuteRate = {
            auto: 0.6,
            car: 1,
            moto: 0.3
        };
       
        const fare = {
            auto: Math.round(baseFare.auto + ((distanceTime.distance.value / 1000) * perKmRate.auto) + ((distanceTime.duration.value / 60) * perMinuteRate.auto)),
            car: Math.round(baseFare.car + ((distanceTime.distance.value / 1000) * perKmRate.car) + ((distanceTime.duration.value / 60) * perMinuteRate.car)),
            moto: Math.round(baseFare.moto + ((distanceTime.distance.value / 1000) * perKmRate.moto) + ((distanceTime.duration.value / 60) * perMinuteRate.moto))
        };
      
        return fare;
    } else {
        console.log("event-fare-calculation");
        const baseFare = 300;
        const perKmRate = 10;
        const perMinuteRate = 3;
        const fare = Math.round(baseFare + ((distanceTime.distance.value / 1000) * perKmRate) + ((distanceTime.duration.value / 60) * perMinuteRate));
        return fare;
    }

    

}

module.exports.getFare = getFare;


function getOtp(num) {
    function generateOtp(num) {
        const otp = crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
        return otp;
    }
    return generateOtp(num);
}

module.exports.getAllCaptainEvent=async(captainId)=>{
    if (!captainId) {
        throw new Error('Captain id is required');
    }

    try {
        const rides = await rideModel.find({
            captain: captainId,
            eventDateTime: { $ne: null },
            status: 'accepted'
        }).populate('user').populate('captain').select('+otp');

        console.log("ride-service");
        console.log("data", rides);
        return rides;
    } catch (err) {
        console.error("Error fetching rides:", err);
        throw err;
    }
}

module.exports.getAllCaptainRides = async (captainId) => {
    if (!captainId) {
        throw new Error('Captain id is required');
    }
    try {
        // Fetch both normal and event rides where this captain is assigned.
        const rides = await rideModel.find({
            captain: captainId
        }).sort({ createdAt: -1 }).populate('user').populate('captain').select('+otp');
        return rides;
    } catch (err) {
        console.error('Error fetching captain rides:', err);
        throw err;
    }
}


module.exports.createRide = async ({
    user, pickup, destination, vehicleType
}) => {
    if (!user || !pickup || !destination || !vehicleType) {
        console.log(user, pickup, destination, vehicleType);
        throw new Error('All fields are required');
    }
    const event = "false";
    console.log(pickup,destination);
    const fare = await getFare(pickup, destination, event);

    const ride = rideModel.create({
        user,
        pickup,
        destination,
        otp: getOtp(6),
        fare: fare[vehicleType]
    })

    return ride;
}

module.exports.createEventRide = async ({
    user, eventPickup, eventDestination, eventTime,specialRequest
}) => {
    if (!user || !eventPickup || !eventDestination ) {
        console.log(user, eventPickup,eventDestination);
        throw new Error('All fields are required');
    }
    const event = true;
    const fare = await getFare(eventPickup, eventDestination, event);

    const ride = rideModel.create({
        user,
        pickup: eventPickup,
        destination: eventDestination,
        otp: getOtp(6),
        fare: fare,
        eventDateTime: eventTime,
        specialRequest: specialRequest
    })

    return ride;
}

module.exports.getAllUserRides = async (userId) => {
    if (!userId) {
        throw new Error('User id is required');
    }

    try {
        const rides = await rideModel.find({
            user: userId
        }).populate('user').populate('captain').select('+otp');

        console.log("ride-service");
        console.log("data", rides);
        return rides;
    } catch (err) {
        console.error("Error fetching rides:", err);
        throw err;
    }
}

module.exports.confirmRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    // Atomic update: only accept if currently pending
    const updated = await rideModel.findOneAndUpdate(
        { _id: rideId, status: 'pending' },
        { status: 'accepted', captain },
        { new: true }
    ).populate('user').populate('captain').select('+otp');

    if (!updated) {
        throw new Error('Ride already accepted');
    }

    console.log('ride-confirmed-service', updated);
    return updated;
};

module.exports.startRide = async ({ rideId, otp}) => {
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'accepted') {
        throw new Error('Ride not accepted');
    }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }
    console.log("OTP matched");
    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'ongoing'
    })
    console.log("ride-started-service", ride);
    return ride;
}

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride not ongoing');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'completed'
    })

    return ride;
}


module.exports.startEventRide = async ({ eventId, captainId, userId }) => {
    if (!eventId || !captainId || !userId) {
        throw new Error('eventId, captainId and userId are required');
    }

    const captain = await captainModel.findById(captainId);
    const user = await userModel.findById(userId);
    if (!captain) throw new Error('Captain not found');
    if (!user) throw new Error('User not found');

    const ride = await rideModel.findById(eventId).populate('user').populate('captain').select('+otp');
    if (!ride) throw new Error('Event ride not found');
    if (!ride.eventDateTime) throw new Error('Ride is not marked as an event ride');

    // const updatePayload = {
    //     // Assign captain if not already set
    //     captain: ride.captain ? ride.captain._id : captain._id,
    //     status: 'ongoing',
    //     captainSocketId: captain.socketId || null,
    //     userSocketId: user.socketId || null
    // };

    // const updatedRide = await rideModel.findByIdAndUpdate(eventId, updatePayload, { new: true })
    //     .populate('user').populate('captain').select('+otp');

    // Emit start notification to both parties if socket IDs available
    try {
        if (captain.socketId) {
            sendMessageToSocketId(captain.socketId, { event: 'event-ride-started', data: ride });
        }
        if (user.socketId) {
            sendMessageToSocketId(user.socketId, { event: 'event-ride-started', data: ride });
        }
    } catch (err) {
        console.error('Error emitting event-ride-started:', err.message);
    }

    return ride;
};

