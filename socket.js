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
        });

        socket.on('join_create_room', async (creatorInfo) => {

            const {senderId, receiverId, roomId} = creatorInfo;

            /**
             * TODO : DO We Really Need to Fetch Room ?
             * As front-end has a sync state of the rooms the belong to the user when user sign-in
             *
             * Abdo : we don't need to fetch the data each time there's a request to join room,
             * we need to get roomId from the front-end, and if it's null -> then create a new room
             * And in both cases we will me two sockets join the room by it's id
             * */

            let room;
            // Create room data
            if (roomId) {
                console.log(`Chat Room Already Exist Between user ${senderId} & ${receiverId}`)
                room = await roomModel.findOne({user1: senderId, user2: receiverId});
            } else {
                console.log(`Chat Room Created Between user ${senderId} & ${receiverId}`);
                room = await roomModel.create({
                    user1: senderId,
                    user2: receiverId,
                });
            }

            socket.join(roomId);
            const receiverSocketId = await redisClient.get(receiverId);
            const receiverSocket = io.sockets.sockets.get(receiverSocketId);

            /**
             * TODO : Change room_created event name to a more realistic name
             * */

            socket.emit('room_created', room);

            // Handle if user is not connected to a socket
            if (!receiverSocket) {
                // Return to the connected socket room info only
                return;
            }

            // Else Make 2 sockets connect to the same room
            receiverSocket.join(roomId);

            /**
             * Front-end Need to update the view when this event happen
             * */
            receiverSocket.emit('room_created', room);
            socket.emit('room_created', room);

        });
        socket.on('message', async (messageData) => {
            // We Need Content and roomId

            /**
             * TODO : Create a unique collection when that stores the messages of the certain Chat
             * */

            const {senderId, receiverId, roomId, content} = messageData;

            const room = await roomModel.findById(roomId);

            // Create & Save Message into Database
            const message = new messageModel({
                sender: senderId,
                receiver: receiverId,
                content: content,
                sentAt: Date.now()
            });

            // Send Message Data to all
            io.to(roomId).emit('message', {roomId, ...message.toObject()});

            message.isSent = true;

            // Append This Message to roomId
            room.messages.push(message);
            await room.save();

            /**
             * TODO : Client must Handle Delivered state and Seen from this side
             * DETAILS : GAD will emit delivered or seen state, then i will listen to this event
             * and once they are emitted we will update database states
             * */
        });
        socket.on('message_delivered', async (messageData) => {
            const {receiverId, roomId, messageId} = messageData;
            const room = await roomModel.findById(roomId);

            const messageIndex = room.messages.findIndex(message => message._id.toString() === messageId.toString());
            try {
                room.messages[messageIndex].isDelivered = true;
                await room.save();
                const receiverSocketId = await redisClient.get(receiverId);
                const receiverSocket = io.sockets.sockets.get(receiverSocketId);
                receiverSocket.emit('message_delivered', {roomId, ...room.messages[messageIndex].toObject()})
            } catch (e) {
                console.log(`Message Index : ${messageIndex} Error`);
            }

        });
        socket.on('message_seen', async (messageData) => {
            const {roomId, messageId} = messageData;
            const room = await roomModel.findById(roomId);

            const messageIndex = room.messages.findIndex(message => message._id.toString() === messageId.toString());
            room.messages[messageIndex].isSeen = true;
            await room.save();
        });

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

