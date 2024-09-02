const express = require("express");
const chatService = require("../services/chatService");
const { protect } = require("../services/authService");

const chatRouter = express.Router();

chatRouter.route("/").post(protect, chatService.createChat);

chatRouter.route("/:chatId").get(protect, chatService.getChat);
module.exports = chatRouter;
