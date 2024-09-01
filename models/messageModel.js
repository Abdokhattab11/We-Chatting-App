const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "a message must have a sender"],
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "a message must have a receiver"],
        },
        content: {type: String, required: [true, "a message must have content"]},
        isSeen: {type: Boolean, default: false},
        /**
         * TODO : Change Default values of isDelivered & isSent to false
         * */
        isDelivered: Boolean,
        isSent: Boolean,
        sentAt: {type: Date},
    },
    {timestamps: true}
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
