const asyncHandler = require("express-async-handler");
const createToken = require("../utils/jwtUtils");
const User = require("../models/userModel");
exports.signUp = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;
  const user = await User.create({
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
  });
  const token = createToken(user._id);
  res.status(201).json({
    success: true,
    user,
    token: token,
  });
});
