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
        .sort({lastSendMessageTime: -1})
        .select("_id user1 user2 lastSendMessageTime")
        .lean();

    /**
     * TODO : To Do return last Sent message in the response
     * TODO : return the number of unseen messages for every chat
     * */

    for (const chat of chats) {
        delete chat.lastSeenMessage1;
        delete chat.lastDeliveredMessage1;
        delete chat.lastSentMessage1;
        delete chat.lastSeenMessage2;
        delete chat.lastDeliveredMessage2;
        delete chat.lastSentMessage2;
        if (chat.user1._id.toString() === userId) {
            chat.user = chat.user2;
        } else {
            chat.user = chat.user1;
        }
        delete chat.user1;
        delete chat.user2;
    }

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

    if (!chat) {
        res.status(404).json({
            status: "Not Found"
        })
    }

    res.status(200).json({
        status: "success",
        chat
    })


});