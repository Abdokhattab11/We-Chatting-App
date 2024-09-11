const socketIo = require('socket.io');

const messageModel = require("./models/messageModel")
const roomModel = require("./models/chatModel");
const redisClient = require('./services/redisService');
const userModel = require('./models/userModel');
const uuid = require('./utils/uuid')


module.exports = (server) => {

    const io = socketIo(server, {
        cors: {
            origin: true,
            credentials: true, //access-control-allow-credentials:true
            optionSuccessStatus: 200,
        }
    });

    io.on("connection", (socket) => {
        // 1. Handle user authentication
        console.log(`Socket ${socket.id} is connected to the server`);

        socket.on('connect_user', async (userId) => {
            console.log(`User of id ${userId} Is connected to this socket`);
            // 1. Make this socket belong to this userId
            socket.userId = userId;
            // Make this user online
            await redisClient.set(userId, socket.id);
            // Make All Undelivered Messages -> delivered
            const rooms = await roomModel.find({
                $or: [
                    {user1: userId},
                    {user2: userId}
                ]
            });
            for (const room of rooms) {
                for (const message of room.messages) {
                    if (userId === message.receiver.toString() && !message.isDelivered) {
                        message.isDelivered = true;
                        const senderId = message.sender.toString();
                        const roomId = room._id.toString();
                        const senderSocketId = await redisClient.get(senderId);
                        const senderSocket = io.sockets.sockets.get(senderSocketId);
                        if (senderSocket) {
                            senderSocket.emit('message_delivered', {roomId, ...message.toObject()});
                        }
                    }
                }
                await room.save();
            }
        });

        socket.on('join_create_room', async (creatorInfo) => {

            const {senderId, receiverId, roomId} = creatorInfo;
            let room;

            if (roomId) {
                console.log(`Chat Room Already Exist Between user ${senderId} & ${receiverId}`)
                room = await roomModel.findById(roomId);
            } else {
                console.log(`Chat Room Created Between user ${senderId} & ${receiverId}`);
                room = await roomModel.create({
                    user1: senderId,
                    user2: receiverId,
                });
            }
            console.log(room);
            for (const message of room.messages) {
                if (message.receiver.toString() === senderId && !message.isSeen) {
                    message.isSeen = true;
                    await room.save();
                    const senderSocketId = await redisClient.get(message.sender.toString());
                    const senderSocket = io.sockets.sockets.get(senderSocketId);
                    senderSocket.emit("message_seen", {roomId, ...message.toObject()})
                }
            }
            socket.join(roomId);
            socket.emit('room_created', room);
        });
        socket.on('message', async (messageData) => {

            const {senderId, receiverId, roomId, content} = messageData;

            const room = await roomModel.findById(roomId);

            const message = new messageModel({
                sender: senderId,
                receiver: receiverId,
                content: content,
                sentAt: Date.now()
            });

            message.isSent = true;
            room.messages.push(message);
            await room.save();

            try {
                const receiverSocketId = await redisClient.get(receiverId);
                const receiverSocket = io.sockets.sockets.get(receiverSocketId);
                receiverSocket.emit('message', {roomId, ...message.toObject()});
            } catch (e) {
                console.log(`Receiver Is Not Connected with ID :  ${receiverId}`)
            }
            try {
                // To Make Front End Sync with us
                const senderSocketId = await redisClient.get(senderId);
                const senderSocket = io.sockets.sockets.get(senderSocketId);
                senderSocket.emit('message_is_saved', {roomId, ...message.toObject()})
            } catch (e) {
                console.log(`Sender If Not Connected With Id : ${senderId}`);
            }
        });
        socket.on('message_delivered', async (messageData) => {
            const {senderId, roomId, messageId} = messageData;
            const room = await roomModel.findById(roomId);

            const messageIndex = room.messages.findIndex(message => message._id.toString() === messageId.toString());
            try {
                room.messages[messageIndex].isDelivered = true;
            } catch (e) {
                console.log(`Message with this ID ${messageId} is not found`);
            }
            await room.save();
            try {
                const senderSocketId = await redisClient.get(senderId);
                const senderSocket = io.sockets.sockets.get(senderSocketId);
                senderSocket.emit('message_delivered', {roomId, ...room.messages[messageIndex].toObject()});
            } catch (e) {
                console.log(`Sender Is Not Connected ${senderId}`);
            }
        });
        socket.on('is_receiver_connected_to_room', async (data) => {
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
                    const messageIndex = room.messages.findIndex(message => message._id.toString() === messageId.toString());
                    if (messageIndex !== -1)
                        room.messages[messageIndex].isSeen = true;
                    await room.save();
                    socket.emit("message_seen", {roomId, ...room.messages[messageIndex].toObject()})
                } else {
                    // The socket with the specified ID is not connected to the room
                }
            }
        })

        socket.on('disconnect', async () => {
            console.log(`Socket ${socket.id} is disconnected to the server`);
            try {
                await redisClient.del(socket.userId)
            } catch (err) {
                console.log("Error Occurs While Deleting the socket from cache")
            }
            socket.emit('user_is_offline', socket.userId);
        })
    });
    return io;
}

