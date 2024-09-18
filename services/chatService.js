const asyncHandler = require("express-async-handler");
const redisClient = require("./redisService");
const chatModel = require("../models/chatModel");

/**
 * Description : get all chats of logged in user
 * */
exports.getAllChats = asyncHandler(async (req, res, next) => {
    const token = req.cookies.token;
    const userId = await redisClient.get(token);

    let chats = await chatModel
        .find({$or: [{user1: userId}, {user2: userId}]})
        .sort({"lastSentMessage.createdAt": -1});

    const chatResponse = [];

    for (const chat of chats) {
        const chatObject = {};
        if (chat.user1._id.toString() === userId) {
            chatObject.user = chat.user2;
        } else {
            chatObject.user = chat.user1;
        }
        chatObject.lastSentMessage = chat.lastSentMessage;
        chatObject._id = chat._id.toString();
        chatObject.messages = chat.messages;
        chatObject.numberOfUnseenMessages = chat.numberOfUnseenMessages;

        chatResponse.push(chatObject);
    }

    res.status(200).json({
        status: "Success",
        chatResponse
    });
});

exports.getChatById = asyncHandler(async (req, res, next) => {
    // First Make Sure the chat User Is Requesting Belong to this user
    const token = req.cookies.token;
    const userId = await redisClient.get(token);
    const chatId = req.params.chatId;

    const chat = await chatModel.findById(chatId).lean();
    if (!chat) {
        res.status(404).json({
            status: "Not Found",
        });
    }

    if (chat.user1._id.toString() !== userId) {
        chat.user = chat.user1;
    } else {
        chat.user = chat.user1;
    }
    delete chat.user1;
    delete chat.user2;

    res.status(200).json({
        status: "Success",
        chats,
    });
});

exports.getChatById = asyncHandler(async (req, res, next) => {
    // First Make Sure the chat User Is Requesting Belong to this user
    const token = req.cookies.token;
    const userId = await redisClient.get(token);
    const chatId = req.params.chatId;

    const chat = await chatModel.findById(chatId).lean();
    if (!chat) {
        res.status(404).json({
            status: "Not Found",
        });
    }

    if (chat.user1._id.toString() !== userId) {
        chat.user = chat.user1;
    } else {
        chat.user = chat.user2;
    }
    delete chat.user1;
    delete chat.user2;
    delete chat.lastSentMessage;

    res.status(200).json({
        status: "success",
        chat,
    });
});
