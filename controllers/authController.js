const asyncHandler = require("express-async-handler");
const createToken = require("../utils/jwtUtils");
const User = require("../models/userModel");
const redisClient = require("../services/redisService");

exports.signUp = asyncHandler(async (req, res, next) => {

    const {firstName, lastName, email, password} = req.body;

    const user = await User.create({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
    });

    const token = createToken(user._id);

    //-------------------------
    // Adding The Generated Token to Redis Cache with user._id
    await redisClient.set(token, user._id.toString());
    console.log("Token Added To Redis Cache : " + user._id.toString());
    //-------------------------

    res.status(201).json({
        success: true,
        user,
        token: token,
    });
});
