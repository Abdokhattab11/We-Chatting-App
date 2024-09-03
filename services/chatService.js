const asyncHandler = require("express-async-handler");
const redisClient = require('./redisService')
const chatModel = require("../models/chatModel");

exports.getChat = asyncHandler(async (req, res, next) => {
    const {chatId} = req.params;
    const chat = await Chat.findById(chatId);
    res.status(200).json({success: true, chat});
});

/**
 * Description : get all chats of logged in user
 * */
exports.getAllChats = asyncHandler(async (req, res, next) => {
    const token = req.cookies.token;
    const userId = await redisClient.get(token);

    /**
     * TODO: This Query Needed To Be optimized
     * */

    const chats = await chatModel
        .find({$or: [{user1: userId}, {user2: userId}]})
        .sort({lastSendMessageTime: -1});

    req.status(200).json({
        status: "Success",
        chats
    })
})