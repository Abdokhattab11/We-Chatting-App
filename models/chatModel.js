const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        roomExternalId: {
            type: String,
            require: true,
            unique: true
        },
        user1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "chat must have a userOne"],
        },
        user2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "chat must have a userOne"],
        },
        // messages: [mongoose.Schema.Types.ObjectId],
        lastSendMessageTime: Date,
        lastSeenMessage1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },
        lastDeliveredMessage1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },
        lastSentMessage1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },
        lastSeenMessage2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },
        lastDeliveredMessage2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },
        lastSentMessage2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null
        },
        blocked: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {timestamps: true}
);

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;