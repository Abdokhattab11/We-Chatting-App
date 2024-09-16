const express = require("express");
const userService = require("../services/userService");
const {
  protect,
  uploadProfileImg,
  resizeProfileImg,
} = require("../services/authService");

const userRouter = express.Router();

userRouter
  .route("/")
  .get(protect, userService.getUserInfo)
  .put(protect, uploadProfileImg, resizeProfileImg, userService.updateUserInfo)
  .delete(protect, userService.deleteUser);

userRouter.route("/search/").get(userService.searchForUsersByName);

module.exports = userRouter;
