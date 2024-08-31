const asyncHandler = require("express-async-handler");
const redisClient = require("../services/redisService");

const userModel = require("../models/userModel");
const CustomError = require("../utils/CustomError");

/**
 * @desc Get user info
 * @param name
 * @param id
 * @returns String
 * */
exports.getUserInfo = asyncHandler(async (req, res, next) => {

    const userId = await redisClient.get(req.cachedToken);
    const user = await userModel.findById(userId);
    if (!user) {
        next(new CustomError(404, "User Not Found"));
        return;
    }
    const getUserObj = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        photo: user.photo,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }

    res.status(200).json({
        success: true,
        getUserObj,
    });
});

exports.updateUserInfo = asyncHandler(async (req, res, next) => {
    const userId = await redisClient.get(req.cachedToken);
    const user = await userModel.findByIdAndUpdate(userId, req.body, {
        new: true,
        runValidators: true,
    });
    const getUserObj = {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        photo: user.photo,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };

    res.status(200).json({
        success: true,
        getUserObj,
    });

});

exports.deleteUser = asyncHandler(async (req, res, next) => {
    const userId = await redisClient.get(req.cachedToken);
    await userModel.findByIdAndDelete(userId);
    res.status(200).json({
        success: true
    });
});
