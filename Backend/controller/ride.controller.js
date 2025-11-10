const rideService = require("../services/ride.service");
const { validationResult } = require("express-validator");
const mapService = require("../services/maps.service");
const { sendMessageToSocketId, broadcastExcept } = require("../socket");
const rideModel = require("../models/ride.model");

module.exports.createRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  if (req.body.isEvent === false) {
    const { userId, pickup, destination, vehicleType, isEvent, eventTime } =
      req.body;

    try {
      const ride = await rideService.createRide({
        user: userId,
        pickup,
        destination,
        vehicleType,
      });
      res.status(201).json(ride);

      const pickupCoordinates = await mapService.getAddressCoordinate(pickup);

      console.log("pickupCoordinates", pickupCoordinates);

      const captainsInRadius = await mapService.getCaptainsInTheRadius(
        pickupCoordinates.ltd,
        pickupCoordinates.lng,
        5
      );

      ride.otp = "";

      const rideWithUser = await rideModel
        .findOne({ _id: ride._id })
        .populate("user");
      const details = { ...rideWithUser._doc, vehicleType: vehicleType };

      console.log("captain-found", captainsInRadius);

      captainsInRadius.map((captain) => {
        // console.log("run", captain);

        sendMessageToSocketId(captain.socketId, {
          event: "new-ride",
          data: details,
        });
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: err.message });
    }
  } else {
    const {
      userId,
      eventPickup,
      eventDestination,
      isEvent,
      eventTime,
      specialRequest,
    } = req.body;

    try {
      const ride = await rideService.createEventRide({
        user: userId,
        eventPickup,
        eventDestination,
        eventTime,
        specialRequest,
      });
      res.status(201).json(ride);

      const pickupCoordinates = await mapService.getAddressCoordinate(
        eventPickup
      );

      console.log("pickupCoordinates", pickupCoordinates);

      const captainsInRadius = await mapService.getCaptainsInTheRadius(
        pickupCoordinates.ltd,
        pickupCoordinates.lng,
        5
      );

      ride.otp = "";

      const rideWithUser = await rideModel
        .findOne({ _id: ride._id })
        .populate("user");

      console.log("captain-found", captainsInRadius);

      captainsInRadius.map((captain) => {
        sendMessageToSocketId(captain.socketId, {
          event: "new-ride",
          data: rideWithUser,
        });
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports.getFare = async (req, res) => {
  // const errors = validationResult(req);

  // if (!errors.isEmpty()) {
  //     return res.status(400).json({ errors: errors.array() });
  // }

  const val = req.query.isEvent === "true";
  console.log(val);
  if (!val) {
    console.log("hey-fare");
    const { pickup, destination, isEvent } = req.query;

    try {
      const fare = await rideService.getFare(pickup, destination, isEvent);
      return res.status(200).json(fare);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  } else {
    console.log("event-fare");
    const { eventPickup, eventDestination, isEvent } = req.query;

    try {
      const fare = await rideService.getFare(
        eventPickup,
        eventDestination,
        isEvent
      );
      console.log("fare", fare);
      return res.status(200).json(fare);
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
};

module.exports.confirmRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, captainId } = req.body;

  try {
    const ride = await rideService.confirmRide({ rideId, captain: captainId });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-confirmed",
      data: ride,
    });
    const captainSocketId = ride.captain?.socketId;
    broadcastExcept(captainSocketId, {
      event: "ride-claimed",
      data: { rideId: ride._id, captainId: ride.captain?._id },
    });

    return res.status(200).json(ride);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports.startRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, otp } = req.query;
  console.log("chalu he   ", rideId, otp);
  try {
    const ride = await rideService.startRide({ rideId, otp });

    console.log("ride-started", ride);

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-started",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.getAllCaptainEvents = async (req, res) => {
  const { captainId } = req.query;
  try {
    const rides = await rideService.getAllCaptainEvent(captainId);
    console.log(rides);
    return res.status(200).json(rides);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.getAllCaptainRides = async (req, res) => {
    const { captainId } = req.query;
    try {
        const rides = await rideService.getAllCaptainRides(captainId);
        return res.status(200).json(rides);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

module.exports.getAllUserRides = async (req, res) => {
  const { userId } = req.query;
  try {
    const rides = await rideService.getAllUserRides(userId);
    // console.log(rides);
    return res.status(200).json(rides);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.endRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.endRide({ rideId, captain: req.captain });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-ended",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.startEventRide = async (req, res) => {
  try {
    const { eventId, captainId, userId } = req.body;
    if (!eventId || !captainId || !userId) {
      return res
        .status(400)
        .json({ message: "eventId, captainId and userId are required" });
    }

    const ride = await rideService.startEventRide({
      eventId,
      captainId,
      userId,
    });

    // Service already emits notifications; just return the updated ride
    return res.status(200).json(ride);
  } catch (err) {
    console.error("startEventRide controller error:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

module.exports.makePayments = async (req, res) => {
  try {
    const { rideId } = req.body;
    const { paymentmode, paymentID } = req.body;
    console.log(req.body);

    if (!paymentmode || !["cash", "online"].includes(paymentmode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing payment mode",
      });
    }

    if (paymentmode === "online" && !paymentID) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required for online payments",
      });
    }

    const updatedRide = await rideService.paymentsforride({
      rideId,
      paymentmode,
      paymentID,
    });

    if (!updatedRide) {
      return res.status(404).json({
        success: false,
        message: "Ride not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment information updated successfully",
      ride: updatedRide,
    });
  } catch (error) {
    console.error("Error updating payment info:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
