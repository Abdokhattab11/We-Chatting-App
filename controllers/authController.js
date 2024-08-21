const express = require("express");
const {
  signUp,
  uploadProfileImg,
  resizeProfileImg,
  activateEmail,
} = require("../services/authService");
const { signUpValidator } = require("../utils/validators/authValidators");
const router = express.Router();

router.post(
  "/signup",
  uploadProfileImg,
  resizeProfileImg,
  signUpValidator,
  signUp
);
router.patch("/activateAccount/:activationToken", activateEmail);
module.exports = router;
