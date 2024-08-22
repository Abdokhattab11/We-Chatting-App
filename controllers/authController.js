const express = require("express");
const {
  signUp,
  uploadProfileImg,
  resizeProfileImg,
  activateEmail,
  login,
} = require("../services/authService");
const {
  signUpValidator,
  loginValidator,
} = require("../utils/validators/authValidators");
const router = express.Router();

router.post(
  "/signup",
  uploadProfileImg,
  resizeProfileImg,
  signUpValidator,
  signUp
);
router.post("/login", loginValidator, login);
router.patch("/activateAccount/:activationToken", activateEmail);
module.exports = router;
