const mongoose = require("mongoose");
const messsageModel = require("./messageModel");

const chatSchema = new mongoose.Schema(
  {
    roomExternalId: {
      type: String,
      require: true,
      unique: true,
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
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

chatSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user1",
    select: "firstName lastName email photo",
  });
  this.populate({
    path: "user2",
    select: "firstName lastName email photo",
  });
  this.populate({
    path: "lastSeenMessage1",
  });
  this.populate({
    path: "lastSeenMessage2",
  });
  this.populate({
    path: "lastDeliveredMessage1",
  });
  this.populate({
    path: "lastDeliveredMessage2",
  });
  this.populate({
    path: "lastSentMessage1",
  });
  this.populate({
    path: "lastSentMessage2",
  });
  next();
});
const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
