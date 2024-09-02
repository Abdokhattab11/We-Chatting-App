const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");

exports.createChat = asyncHandler(async (req, res, next) => {
  const { roomExternalId, user2 } = req.body;
  const chat = await Chat.create({
    roomExternalId: roomExternalId,
    user1: req.user._id,
    user2: user2,
  });
  res.status(201).json({ success: true, chat });
});

exports.getChat = asyncHandler(async (req, res, next) => {
  const { chatId } = req.params;
  const chat = await Chat.findById(chatId);
  res.status(200).json({ success: true, chat });
});
