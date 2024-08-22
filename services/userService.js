const asyncHandler = require("express-async-handler");
const redisClient = require("../services/redisService");

const userModel = require("../models/userModel");
const CustomError = require("../utils/CustomError");

exports.getUserInfo = asyncHandler(async (req, res, next) => {

    const userId = await redisClient.get(req.cachedToken);
    const user = await userModel.findById(userId);

    if (!user) {
        next(new CustomError(404, "User Not Found"));
        return;
    }

    res.status(200).json({
        success: true,
        user,
    });
});

exports.updateUserInfo = asyncHandler(async (req, res, next) => {
    const userId = redisClient.get(req.cachedToken);
    const user = await userModel.findByIdAndUpdate(userId, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        user,
    });

});

exports.deleteUser = asyncHandler(async (req, res, next) => {
    const userId = redisClient.get(req.cachedToken);
    const user = await userModel.findByIdAndDelete(userId);
    res.status(200).json({
        success: true,
        user,
    });
});
