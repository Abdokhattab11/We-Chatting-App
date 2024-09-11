const mongoose = require("mongoose");
const messsageModel = require("./messageModel");

const chatSchema = new mongoose.Schema(
  {
    roomExternalId: {
      type: String,
      require: true,
      //  unique: true,
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

    lastSendMessageTime: Date,
    lastSeenMessage1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastDeliveredMessage1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastSentMessage1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastSeenMessage2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastDeliveredMessage2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    lastSentMessage2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    blocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
