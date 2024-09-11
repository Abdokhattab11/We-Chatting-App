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
    // chatChannel: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Chat",
    //   required: [true, "a message must belong to a chat channel"],
    // },
    content: { type: String, required: [true, "a message must have content"] },
    isSeen: { type: Boolean, default: false },
    isDelivered: Boolean,
    isSent: Boolean,
    sentAt: { type: Date },
  },
  { timestamps: true }
);

// messageSchema.pre("save", function (next) {
//   this.sentAt = Date.now();
//   next();
// });
messageSchema.pre(/^find/, function (next) {
  this.populate({
    path: "sender",
    select: "firstName lastName email photo ",
  });
  this.populate({
    path: "receiver",
    select: "firstName lastName email photo ",
  });

  next();
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
