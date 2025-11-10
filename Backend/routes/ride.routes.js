const express = require("express");
const router = express.Router();
const { body, query } = require("express-validator");
const rideController = require("../controller/ride.controller");
const authMiddleware = require("../middlewares/authMidlleware");

router.post("/create", authMiddleware.authUser, rideController.createRide);

router.get("/get-fare", authMiddleware.authUser, rideController.getFare);

router.post(
  "/confirm",
  authMiddleware.authCaptain,
  body("rideId").isMongoId().withMessage("Invalid ride id"),
  rideController.confirmRide
);

router.get(
  "/start-ride",
  authMiddleware.authCaptain,

  rideController.startRide
);

router.post(
  "/end-ride",
  authMiddleware.authCaptain,
  body("rideId").isMongoId().withMessage("Invalid ride id"),
  rideController.endRide
);

router.get(
  "/captainEvent",
  authMiddleware.authCaptain,
  rideController.getAllCaptainEvents
);

router.get(
  "/userRides",
  authMiddleware.authUser,
  rideController.getAllUserRides
);

router.post(
  "/startEventRide",
  authMiddleware.authCaptain,
  rideController.startEventRide
);

router.post(
  "/makePaymentForRide",
  // authMiddleware.authUser,
  rideController.makePayments
);
module.exports = router;
