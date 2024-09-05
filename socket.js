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

        socket.on('is_user_online', async (userId) => {
            const socketId = await redisClient.get(userId);
            if (socketId) {
                socket.emit('user_is_online', userId);
            } else {
                socket.emit('user_is_offline', userId);
            }
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
            
            // let room = await roomModel.findOne({user1: senderId, user2: receiverId});

            // Create room data
            if (roomId) {
                console.log(`Chat Room Already Exist Between user ${senderId} & ${receiverId}`)
            } else {
                console.log(`Chat Room Created Between user ${senderId} & ${receiverId}`);
                room = await roomModel.create({
                    user1: senderId,
                    user2: receiverId,
                });
            }
            // const roomId = room._id.toString();

            // Make The Other User To Create the Room
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

            // Send Back To The Client Room information
            receiverSocket.emit('room_created', room);
            socket.emit('room_created', room);

        });
        socket.on('message', async (messageData) => {
            // We Need Content and roomId

            const {senderId, receiverId, roomId, content} = messageData;

            /**
             * TODO: Do we really needs to fetch room first ?
             *
             * Abdo : We Don't need to fetch room every time we send a message
             * Because We make front-end sync with back-end when it's signed in
             * And then any change happen in the front-end will be sent to the socket and vice-versa
             * So Both are sync so we don't need to fetch the room Every time
             *
             * We Just need to save the message in the database
             * */

            const room = await roomModel.findById(roomId);

            // Create & Save Message into Database
            const message = new messageModel({
                sender: senderId,
                receiver: receiverId,
                content: content,
                sentAt: Date.now()
            });

            // Send Message Data to all
            io.to(roomId).emit('message', messageData);
            /**
             * isSent will be handled from front-end side as well
             * */
            // message.isSent = true;

            // Append This Message to roomId
            room.messages.push(message);
            await room.save();

            /**
             * TODO : Client must Handle Delivered state and Seen from this side
             * DETAILS : GAD will emit delivered or seen state, then i will listen to this event
             * and once they are emitted we will update database states
             * */

        });

        socket.on('message_is_sent', async () => {
        });
        socket.on('message_is_delivered', async () => {
        });
        socket.on('message_is_seen', async () => {
        });

        socket.on('disconnect', async () => {
            console.log(`Socket ${socket.id} is disconnected to the server`);
            try {
                await redisClient.del(socket.userId)
            } catch (err) {
                console.log("Error Occurs While Deleting the socket from cache")
            }
            socket.emit('user_is_offline', userId);
        })
    });
    return io;
}

