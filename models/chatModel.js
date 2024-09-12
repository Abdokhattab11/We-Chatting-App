const mongoose = require("mongoose");
const messsageModel = require('./messageModel');

const chatSchema = new mongoose.Schema(
    {
        roomExternalId: {
            type: String,
            require: true,
        },
        user1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "chat must have a userOne"],
        },
        user2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "chat must have a userTwo"],
        },

        messages: [messsageModel.schema],
        lastSentMessage: {type: messsageModel.schema, default: null},

        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {timestamps: true}
);

chatSchema.pre('save', function (next) {
    if (this.messages.length > 0) {
        this.lastSentMessage = this.messages[this.messages.length - 1];
    }
    next();
})

chatSchema.pre(/^find/, function (next) {
    this.populate({
        path: "user1",
        select: "firstName lastName email photo",
    });
    this.populate({
        path: "user2",
        select: "firstName lastName email photo",
    });
    this.populate('lastSentMessage')
    next();
});
const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
