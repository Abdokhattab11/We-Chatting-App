const socketIo = require("socket.io");

const userModel = require("./models/userModel");
const roomModel = require("./models/chatModel");
const redisClient = require("./services/redisService");
const uuid = require("./utils/uuid");

module.exports = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: true,
      credentials: true, //access-control-allow-credentials:true
      optionSuccessStatus: 200,
    },
  });

  io.on("connection", (socket) => {
    // 1. Handle user authentication
    console.log(`Socket ${socket.id} is connected to the server`);

    socket.on("connect_user", async (userId) => {
      console.log(`User of id ${userId} Is connected to this socket`);
      // 1. Make this socket belong to this userId
      socket.userId = userId;
      await redisClient.set(userId, socket.id);
    });
    socket.on("create_room", async (creatorInfo) => {
      const { senderId, receiverId } = creatorInfo;

      const roomId = "1";

      const user1 = await userModel.findById(senderId);
      const user2 = await userModel.findById(receiverId);

      // Make User 1 Join Room
      socket.join(roomId);
      const receiverSocketId = await redisClient.get(receiverId);

      io.sockets.sockets.get(receiverSocketId).join(roomId);

      const roomDate = await roomModel.create({
        roomExternalId: roomId,
        user1: user1._id,
        user2: user2._id,
      });
      console.log(`Chat Room ID : ${roomId}`);
      console.log(`Chat Room Created Between user ${senderId} & ${receiverId}`);
    });
    socket.on("message", (messageData) => {
      console.log(messageData.roomId);
      console.log(messageData.content);
      io.to(messageData.roomId).emit("message", messageData);
    });
    socket.on("check_room", (roomId) => {
      // Get the set of sockets connected to the room
      const room = io.sockets.adapter.rooms.get(roomId);

      if (room && room.has(socket.id)) {
        console.log(`Socket ${socket.id} is connected to room ${roomId}`);
        socket.emit("room_status", { roomId, status: "connected" });
      } else {
        console.log(`Socket ${socket.id} is NOT connected to room ${roomId}`);
        socket.emit("room_status", { roomId, status: "not connected" });
      }
    });
    socket.on("join_room", () => {});

    socket.on("disconnect", async () => {
      console.log(`Socket ${socket.id} is disconnected to the server`);
      try {
        await redisClient.del(socket.userId);
      } catch (err) {
        console.log("Error Occurs While Deleting the socket from cache");
      }
    });
  });
  return io;
};
