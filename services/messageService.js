const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const CustomError = require("../utils/CustomError");
const handlerFactory = require("./handlerFactory");
exports.createMessage = asyncHandler(async (req, res, next) => {
  const { receiver, chatChannel, content } = req.body;

  try {
    const message = await Message.create({
      sender: req.user._id,
      receiver: receiver,
      chatChannel: chatChannel,
      content: content,
    });
    res.status(201).json({ success: true, message });
  } catch (e) {
    return next(new CustomError(400, e.message));
  }
});

exports.getAllMessages = handlerFactory.getAll(Message, "Message");
