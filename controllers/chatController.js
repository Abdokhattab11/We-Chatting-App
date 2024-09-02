const express = require("express");
const chatService = require("../services/chatService");

const chatRouter = express.Router();

chatRouter.route("/")
    .get().post().put();

module.exports = chatRouter();