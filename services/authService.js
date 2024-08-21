const express = require("express");
const { signUp } = require("../controllers/authController");
const { signUpValidator } = require("../utils/validators/authValidators");
const router = express.Router();

router.post("/signup", signUpValidator, signUp);

module.exports = router;
