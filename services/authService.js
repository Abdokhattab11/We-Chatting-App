const asyncHandler = require("express-async-handler");
const createToken = require("../utils/jwtUtils");
const AppError = require("../utils/CustomError");
const crypto = require("crypto");
const sharp = require("sharp");
const sendEmail = require("./../utils/email");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const User = require("../models/userModel");
exports.signUp = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password, photo } = req.body;
  const profileImg = `${process.env.BASE_URL}/views/images/userProfiles/${photo}`;
  //1- create user in data base
  const user = await User.create({
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
    photo: profileImg,
  });
  //2- generate activation code
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = crypto
    .createHash("sha256")
    .update(activationCode)
    .digest("hex");
  const activationToken = `${user.email + activationCode}`;
  const hashedActivationToken = crypto
    .createHash("sha256")
    .update(activationToken)
    .digest("hex");

  // save code to user
  user.activationCode = hashedCode;
  user.activationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  user.activationToken = hashedActivationToken;

  await user.save();
  //4- send email to user
  const message = `hi ${user.firstName} \n
  your activation code is valid for (10 min) \n
  ${activationCode}\n`;
  try {
    await sendEmail({
      email: user.email,
      subject: "activation code is valid for (10 min)",
      message,
    });
  } catch (err) {
    user.activationCode = undefined;
    user.activationCodeExpires = undefined;
    user.activationToken = undefined;
    console.log(err);
    await user.save();
    return next(
      new AppError(
        500,
        "there is a problem when sending email please try again"
      )
    );
  }

  //3- generate activation Token
  res.status(201).json({
    success: true,
    activationToken: hashedActivationToken,
  });
});

exports.activateEmail = asyncHandler(async (req, res, next) => {
  const { activationToken } = req.params;
  const { activationCode } = req.body;
  const hashActivationCode = crypto
    .createHash("sha256")
    .update(activationCode)
    .digest("hex");
  const user = await User.findOne({
    activationToken: activationToken,

    activationCode: hashActivationCode,
    activationCodeExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError(400, "user not found or token expired"));
  }
  user.activated = true;
  user.activationCode = undefined;
  user.activationCodeExpires = undefined;
  user.activationToken = undefined;
  await user.save();
  res.status(200).json({
    success: true,
    message: "email has been activated",
  });
});

exports.uploadProfileImg = uploadSingleImage("photo");
exports.resizeProfileImg = asyncHandler(async (req, res, next) => {
  //console.log(req.file.photo);
  if (req.file) {
    // console.log("req.files", req.files.imageCover[0]);
    const profileImg = `user-${Math.round(Math.random() * 1e9)}-${Date.now()}-profile.jpeg`;
    await sharp(req.file.buffer)
      .resize(300, 300)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`views/images/userProfiles/${profileImg}`);
    req.body.photo = profileImg;
  }
  next();
});
