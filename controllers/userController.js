const express = require("express");
const userService = require("../services/userService");

const userRouter = express.Router();

userRouter.route("/")
    .get(userService.getUserInfo)
    .put(userService.updateUserInfo)
    .delete(userService.deleteUser);

module.exports = userRouter;