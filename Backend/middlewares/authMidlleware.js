const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const userModel = require("../models/user.model");
const blackListModel = require("../models/blacklistToken.model");
const captainModel = require("../models/captain.model");

module.exports.authUser = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const isBlacklisted = await blackListModel.findOne({ token: token });

    if (isBlacklisted) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded._id)

        req.user = user;

        return next();

    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
}


module.exports.authCaptain = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "ok Unauthorized" });
    }
    const isBlackListd = await blackListModel.findOne({ token });

    if (isBlackListd) {
        return res.status(401).json({ message: "expired Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const captain = await captainModel.findById(decoded._id);
        if (!captain) {
            throw new Error("Captain not found");
        }
        req.token = token;
        req.captain = captain;
        return next();
    } catch (e) {
        res.status(401).json({ message: "ok2Unauthorized" });
    }


}