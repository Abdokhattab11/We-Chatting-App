const asyncHandler = require("express-async-handler");
const redisClient = require('./redisService')
const chatModel = require("../models/chatModel");

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

    res.status(200).json({
        status: "Success",
        chats
    })
});

exports.getChatById = asyncHandler(async (req, res, next) => {
    // First Make Sure the chat User Is Requesting Belong to this user
    const token = req.cookies.token;
    const userId = await redisClient.get(token);
    const chatId = req.params.chatId;

    const chat = await chatModel.findById(chatId);

    res.status(200).json({
        status: "success",
        chat
    })

});