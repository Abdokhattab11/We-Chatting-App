const express = require("express");
const {
  signUp,
  uploadProfileImg,
  resizeProfileImg,
  activateEmail,
  login,
  resendActivationCode,
  forgetPassword,
  verifyResetPasswordCode,
  resetPassword,
  logOut,
} = require("../services/authService");
const {
  signUpValidator,
  loginValidator,
  resetPasswordValidator,
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
router.post("/resendActivationCode/:activationToken", resendActivationCode);
router.post("/forgetPassword", forgetPassword);
router.patch(
  "/passwordResetVerification/:passwordResetVerificationToken",
  verifyResetPasswordCode
);
router.patch(
  "/resetPassword/:resetToken",
  resetPasswordValidator,
  resetPassword
);
router.post("/logout", logOut);

module.exports = router;
