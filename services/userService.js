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
  const token = req.cookies.token;
  const userId = await redisClient.get(token);
  const user = await userModel
    .findById(userId)
    .select("_id firstName lastName photo email createdAt");
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
  const token = req.cookies.token;
  const userId = await redisClient.get(token);
  const body = req.body;
  console.log(body.photo);
  if (body.photo) {
    const profileImg = `${process.env.BASE_URL}/views/images/userProfiles/${req.body.photo}`;
    body.photo = profileImg;
  }

  const user = await userModel.findByIdAndUpdate(userId, body, {
    new: true,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

exports.searchForUsersByName = asyncHandler(async (req, res, next) => {
  const searchString = req.query.name;
  const users = await userModel
    .find({
      $or: [
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: searchString,
              options: "i", // case-insensitive
            },
          },
        },
      ],
    })
    .select("_id firstName lastName photo email createdAt");
  res.status(200).json({
    status: "success",
    users,
  });
});

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token;
  const userId = await redisClient.get(token);
  await redisClient.del(token);
  await userModel.findByIdAndDelete(userId);
  res.status(200).json({
    success: true,
  });
});
