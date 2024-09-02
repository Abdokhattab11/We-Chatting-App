const express = require("express");
const messageService = require("../services/messageService");
const { protect } = require("../services/authService");

const messageRouter = express.Router();

messageRouter.route("/").post(protect, messageService.createMessage);

messageRouter.route("/:chatId").get(protect, messageService.getAllMessages);
module.exports = messageRouter;
