const asyncHandler = require("express-async-handler");
const createToken = require("../utils/jwtUtils");
const AppError = require("../utils/CustomError");
const crypto = require("crypto");
const sharp = require("sharp");
const jwt = require("jsonwebtoken");
const sendEmail = require("./../utils/email");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const User = require("../models/userModel");
// create general code for activation or resetting password
const createCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedCode = cryptoEncryption(code);
  return [code, hashedCode];
};
// use crypto lib to encrypt password token any thing else
const cryptoEncryption = (objective) => {
  return crypto.createHash("sha256").update(objective).digest("hex");
};
//used for signing user up
const createActivationTokenAndCode = (user) => {
  const [activationCode, hashedCode] = createCode();
  //3- generate activation Token
  const activationToken = `${user.email + activationCode}`;
  const hashedActivationToken = cryptoEncryption(activationToken);

  //5 save token and code to user
  user.activationCode = hashedCode;
  user.activationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  user.activationToken = hashedActivationToken;
  return [activationCode, hashedActivationToken];
};

const sendingActivationEmail = async (user, activationCode) => {
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
};
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
  // const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
  // const hashedCode = crypto
  //   .createHash("sha256")
  //   .update(activationCode)
  //   .digest("hex");
  // const [activationCode, hashedCode] = createCode();
  // //3- generate activation Token
  // const activationToken = `${user.email + activationCode}`;
  // const hashedActivationToken = crypto
  //   .createHash("sha256")
  //   .update(activationToken)
  //   .digest("hex");

  // //5 save token and code to user
  // user.activationCode = hashedCode;
  // user.activationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  // user.activationToken = hashedActivationToken;
  //2-3 generate activation Token and code
  const [activationCode, hashedActivationToken] =
    createActivationTokenAndCode(user);
  await user.save();
  // //4- send email to user
  sendingActivationEmail(user, activationCode);
  // //4- send email to user
  // const message = `hi ${user.firstName} \n
  // your activation code is valid for (10 min) \n
  // ${activationCode}\n`;
  // try {
  //   await sendEmail({
  //     email: user.email,
  //     subject: "activation code is valid for (10 min)",
  //     message,
  //   });
  // } catch (err) {
  //   user.activationCode = undefined;
  //   user.activationCodeExpires = undefined;
  //   user.activationToken = undefined;
  //   console.log(err);
  //   await user.save();
  //   return next(
  //     new AppError(
  //       500,
  //       "there is a problem when sending email please try again"
  //     )
  //   );
  // }

  //5-send response
  res.status(201).json({
    success: true,
    activationToken: hashedActivationToken,
  });
});

exports.activateEmail = asyncHandler(async (req, res, next) => {
  const { activationToken } = req.params;
  const { activationCode } = req.body;
  const hashActivationCode = cryptoEncryption(activationCode);
  const user = await User.findOne({
    activationToken: activationToken,
  });
  if (!user) {
    return next(new AppError(404, "user not found or token expired"));
  }

  if (
    user.activationCode != hashActivationCode ||
    user.activationCodeExpires < Date.now()
  ) {
    return next(new AppError(400, "code is incorrect or expired"));
  }
  user.activated = true;
  user.activationCode = undefined;
  user.activationCodeExpires = undefined;
  user.activationToken = undefined;
  await user.save();
  res.status(200).json({
    success: true,
    message: "email has been activated successfully, please login",
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

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email });
  //1 -check user found in database or not
  if (!user) {
    return next(new AppError(404, "no such user with that email"));
  }
  //2-check password is correct
  const match = await user.correctPassword(password, user.password);
  if (!match) {
    return next(new AppError(400, "email or password incorrect"));
  }
  if (!user.activated) {
    const [activationCode, hashedActivationToken] =
      createActivationTokenAndCode(user);
    await user.save();
    // //4- send email to user
    sendingActivationEmail(user, activationCode);
    res.status(200).json({
      success: true,
      activationToken: hashedActivationToken,
    });
  } else {
    //3-generate token and send it to client
    const token = createToken(user._id);
    //4- send cookie to client
    res.cookie(`token`, token, {
      httpOnly: true,
      maxAge: 90 * 24 * 60 * 60 * 1000, //90 days
    });
    res.status(200).json({
      success: true,
      user,
      token,
    });
  }
});

exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  // console.log(req.cookies);
  if (
    //sent in header
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // sent in cookies
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies) {
    token = req.cookies.token;
  }
  //else if put your code here for redis
  if (!token) {
    return next(
      new AppError(
        401,
        "you are not logged in please login to access this route"
      )
    );
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log(err, "invalidated token");
    return next(new AppError(401, "Invalid token"));
  }
  const user = await User.findById(decoded.userId);
  if (!user) {
    return next(new AppError(401, "user belong to that token does not exist"));
  }

  if (user.passwordChangedAt) {
    const passChangedAtTimeStamp = parseInt(
      user.passwordChangedAt.getTime() / 1000,
      10
    );
    if (passChangedAtTimeStamp > decoded.iat) {
      return next(new AppError(401, "password is changed please login again"));
    }
  }
  req.user = user; // for letting user to use protected routes
  next();
});

exports.resendActivationCode = asyncHandler(async (req, res, next) => {
  const { activationToken } = req.params;
  const user = await User.findOne({ activationToken: activationToken });
  if (!user) {
    return next(new AppError(401, "user belong to that token does not exist"));
  }
  const [activationCode, hashActivationCode] = createCode();
  user.activationCode = hashActivationCode;
  user.activationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();
  sendingActivationEmail(user, activationCode);
  res.status(200).json({
    success: true,
    message: "code sent, please check your mail box",
  });
});

exports.forgetPassword = asyncHandler(async (req, res, next) => {
  // check if user found with this email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError(404, "no user found with this email"));
  }
  // generate random code used one time only
  const [resetCode, hashedCode] = createCode();

  // save code to user
  user.passwordResetCode = hashedCode;
  user.passwordResetCodeExpires = Date.now() + 10 * 60 * 1000;
  const verificationToken = `${user.email}+${user.passwordResetCode}`;
  const passwordResetVerificationToken = cryptoEncryption(verificationToken);
  user.passwordResetVerificationToken = passwordResetVerificationToken;
  await user.save();

  const message = `hi ${user.firstName} \n
  your password reset code is valid for (10 min) \n
  ${resetCode}\n
  if you did not request for password reset please ignore this email`;
  console.log(message);

  try {
    await sendEmail({
      email: user.email,
      subject: "password reset code",
      message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpires = undefined;
    passwordResetVerificationToken = undefined;
    await user.save();
    return next("there is a problem when sending email please try again", 500);
  }

  res.status(200).json({
    success: true,
    message: "reset code is sent to your email",
    passwordResetVerificationToken: passwordResetVerificationToken,
  });
});

exports.verifyResetPasswordCode = asyncHandler(async (req, res, next) => {
  const { verificationCode } = req.body;
  const { passwordResetVerificationToken } = req.params;
  const hashedCode = cryptoEncryption(verificationCode);

  const user = await User.findOne({
    passwordResetVerificationToken: passwordResetVerificationToken,
  });
  if (!user) {
    return next(new AppError(400, "no user founded with reset token"));
  }

  if (
    user.passwordResetCode != hashedCode ||
    user.passwordResetCodeExpires < Date.now()
  ) {
    return next(new AppError(400, "invalid or expired code"));
  }
  if (!user.activated) {
    user.activated = true;
    user.activationCode = undefined;
    user.activationCodeExpires = undefined;
    user.activationToken = undefined;
    await user.save();
  }
  const resetToken = `${user.email}+${passwordResetVerificationToken}`;
  const passwordResetToken = cryptoEncryption(resetToken);
  user.passwordResetCodeVerified = true;
  user.passwordResetToken = passwordResetToken;
  user.passwordResetCode = undefined;
  user.passwordResetCodeExpires = undefined;
  user.passwordResetVerificationToken = undefined;
  await user.save();
  res.status(200).json({
    success: true,
    message: "code verified",
    passwordResetToken: passwordResetToken,
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;
  console.log(newPassword);
  const user = await User.findOne({
    passwordResetToken: resetToken,
    passwordResetCodeVerified: true,
  });
  if (!user) {
    return next(new AppError(400, "now user founded with that token"));
  }
  user.password = newPassword;
  user.passwordResetCodeVerified = undefined;
  user.passwordResetToken = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();
  res.status(200).json({
    success: true,
    message: "password reset successfully,please login",
  });
});

exports.logOut = asyncHandler(async (req, res, next) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "logout successfully",
  });
});
