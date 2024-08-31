const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    userOne: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "chat must have a userOne"],
    },
    userTwo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "chat must have a userOne"],
    },
    // messages: [mongoose.Schema.Types.ObjectId],
    lastSendMessageTime: Date,
    lastSeenMessageOne: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastDeliveredMessageOne: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastSentMessageOne: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastSeenMessageTwo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastDeliveredMessageTwo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    lastSentMessageTwo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    blocked: Boolean,
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
