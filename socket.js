const socketIo = require("socket.io");

const messageModel = require("./models/messageModel");
const roomModel = require("./models/chatModel");
const redisClient = require("./services/redisService");
require("./Logger");
const winston = require("winston");
const {getOnlyOneUserFromChat} = require('./utils/getOnlyOneUser');

const log = winston.loggers.add("logger");

const connectedUsers = new Set();

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
        socket.on("connect_user", async (userId) => {
            log.info(`User ${userId} Is Connected To socket ${socket.id}`);
            connectedUsers.add(userId);
            socket.userId = userId;
            try {
                await redisClient.set(userId, socket.id);
            } catch (e) {
                log.error(
                    `Error : Setting UserId to the connected Socket in Redis Causing Error {userId:${userId}, socketId:${socket.id}`
                );
                socket.emit(
                    "connect_user_error",
                    "Internal Server Error occurs While Connecting User, Please Reconnect User"
                );
            }

            const rooms = await roomModel.find({
                $or: [{user1: userId}, {user2: userId}],
            });

            for (const room of rooms) {
                let start = 0,
                    end = room.messages.length - 1;
                let ans = end;
                while (start < end) {
                    let mid = Math.floor((start + end) / 2);
                    if (room.messages[mid].isDelivered) start = mid + 1;
                    else {
                        end = mid;
                        ans = mid;
                    }
                }
                // Will be replaced with a for loop starts from ans to the end of the array
                for (let i = ans; i < room.messages.length && ans !== -1; i++) {
                    const message = room.messages[i];
                    if (userId === message.receiver.toString() && !message.isDelivered) {
                        message.isDelivered = true;
                        const senderId = message.sender.toString();
                        const roomId = room._id.toString();

                        const senderSocketId = await redisClient.get(senderId);
                        const senderSocket = io.sockets.sockets.get(senderSocketId);
                        if (!senderSocket) {

                            log.warn(`User ${senderId} Who Send Message Is Not Connected`);
                            continue;
                        }
                        senderSocket.emit("message_delivered", {
                            roomId,
                            ...message.toObject(),
                        });
                    }
                }
                await room.save();
            }
            io.emit("update_online_users", Array.from(connectedUsers));
        });

        socket.on("join_create_room", async (creatorInfo) => {
            const {senderId, receiverId, roomId} = creatorInfo;
            let room;

            if (roomId) {
                log.info(`Chat Room Already Exist Between user ${senderId} & ${receiverId}`);
                room = await roomModel.findById(roomId).populate("user1 user2");
            } else {
                log.info(`Chat Room Created Between user ${senderId} & ${receiverId}`);
                room = new roomModel({
                    user1: senderId,
                    user2: receiverId,
                });
                await (await room.save()).populate("user1 user2");
            }
            let start = 0,
                end = room.messages.length - 1;
            let ans = end;
            while (start < end) {
                let mid = Math.floor((start + end) / 2);
                if (room.messages[mid].isSeen) start = mid + 1;
                else {
                    end = mid;
                    ans = mid;
                }
            }
            for (let i = ans; i < room.messages.length && ans !== -1; i++) {
                const message = room.messages[i];
                if (message.receiver.toString() === senderId && !message.isSeen) {
                    message.isSeen = true;
                    const senderSocketId = await redisClient.get(
                        message.sender.toString()
                    );
                    const senderSocket = io.sockets.sockets.get(senderSocketId);
                    senderSocket.emit("message_seen", {roomId, ...message.toObject()});
                }
            }
            await room.save();
            socket.join(roomId);
            const responseRoom = room.toObject();

            if (receiverId === responseRoom.user1._id) responseRoom.user = room.user1;
            else responseRoom.user = room.user2;

            delete responseRoom.user1;
            delete responseRoom.user2;

            socket.emit("room_created", responseRoom);
        });
        socket.on("message", async (messageData) => {
            const {senderId, receiverId, roomId, content} = messageData;

            const room = await roomModel.findById(roomId);

            const message = new messageModel({
                sender: senderId,
                receiver: receiverId,
                content: content,
                sentAt: Date.now(),
            });

            message.isSent = true;
            room.messages.push(message);
            await room.save();

            try {
                const receiverSocketId = await redisClient.get(receiverId);
                const receiverSocket = io.sockets.sockets.get(receiverSocketId);
                const toBeSentRoom = getOnlyOneUserFromChat(room, receiverId);
                receiverSocket.emit("message", {toBeSentRoom, ...message.toObject()});
            } catch (e) {
                log.error(`Receiver Is Not Connected with ID :  ${receiverId}`);
            }
            try {
                // To Make Front End Sync with us
                const senderSocketId = await redisClient.get(senderId);
                const senderSocket = io.sockets.sockets.get(senderSocketId);
                senderSocket.emit("message_is_saved", {
                    roomId,
                    ...message.toObject(),
                });
            } catch (e) {
                log.error(`Sender If Not Connected With Id : ${senderId}`);
            }
        });
        socket.on("message_delivered", async (messageData) => {
            const {senderId, roomId, messageId} = messageData;
            const room = await roomModel.findById(roomId);

            const messageIndex = room.messages.findIndex(
                (message) => message._id.toString() === messageId.toString()
            );
            try {
                room.messages[messageIndex].isDelivered = true;
            } catch (e) {
                log.error(`Message with this ID ${messageId} is not found`);
            }
            await room.save();
            try {
                const senderSocketId = await redisClient.get(senderId);
                const senderSocket = io.sockets.sockets.get(senderSocketId);
                senderSocket.emit("message_delivered", {
                    roomId,
                    ...room.messages[messageIndex].toObject(),
                });
            } catch (e) {
                log.error(`Sender Is Not Connected ${senderId}`);
            }
        });
        socket.on("is_receiver_connected_to_room", async (data) => {
            // This event will be emitted after is_delivered
            const {receiverId, roomId, messageId} = data;
            const room = io.sockets.adapter.rooms.get(roomId);
            const receiverSocketId = await redisClient.get(receiverId);

            if (room) {
                const socketIdsInRoom = Array.from(room);
                if (socketIdsInRoom.includes(receiverSocketId)) {
                    // The socket with the specified ID is connected to the room
                    // Make The Message seen
                    const room = await roomModel.findById(roomId);
                    const messageIndex = room.messages.findIndex(
                        (message) => message._id.toString() === messageId.toString()
                    );
                    if (messageIndex !== -1) room.messages[messageIndex].isSeen = true;
                    await room.save();
                    socket.emit("message_seen", {
                        roomId,
                        ...room.messages[messageIndex].toObject(),
                    });
                } else {
                    // The socket with the specified ID is not connected to the room
                }
            }
        });
        socket.on("im_typing", async (data) => {
            const {senderId, receiverId, roomId} = data;

            const receiverSocketId = await redisClient.get(receiverId);
            const receiverSocket = io.sockets.sockets.get(receiverSocketId);

            if (!receiverSocket) {
                log.warn(`Is Typing Warn, The other User Is Not Connected`);
                return;
            }
            receiverSocket.emit("is_typing", roomId);
        });
        socket.on("disconnect", async () => {
            if (!socket.userId) return;
            try {
                await redisClient.del(socket.userId);
                log.info(
                    `User ${socket.userId} Is Disconnected From socket ${socket.id}`
                );
            } catch (e) {
                log.error(
                    `Error Occurs when Deleting user socket : {userId:${socket.userId}, socketId:${socket.id}`
                );
            }
            connectedUsers.delete(socket.userId);
            socket.broadcast.emit("update_online_users", Array.from(connectedUsers));
            // io.emit('update_online_users', Array.from(connectedUsers));
        });
    });
    return io;
};
