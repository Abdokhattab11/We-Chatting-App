const express = require("express");
const chatService = require("../services/chatService");
const {protect} = require("../services/authService");

const chatRouter = express.Router();

chatRouter.route("/").get(protect, chatService.getAllChats);
chatRouter.route("/:chatId").get(protect, chatService.getChatById);

module.exports = chatRouter;
