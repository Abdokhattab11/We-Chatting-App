const socketIo = require('socket.io');

const userModel = require("./models/userModel");
const messageModel = require("./models/messageModel")
const roomModel = require("./models/chatModel");
const redisClient = require('./services/redisService');
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
            await redisClient.set(userId, socket.id);
        });
        socket.on('join_create_room', async (creatorInfo) => {

            const {senderId, receiverId} = creatorInfo;

            const user1 = await userModel.findById(senderId);
            const user2 = await userModel.findById(receiverId);

            // check if there's a room between these two users
            let room = await roomModel.findOne({user1: user1, user2: user2});

            // Create room data
            if (room) {
                console.log(`Chat Room Already Exist Between user ${senderId} & ${receiverId}`)
            } else {
                console.log(`Chat Room Created Between user ${senderId} & ${receiverId}`);
                room = new roomModel({
                    roomExternalId: uuid(),
                    user1: user1._id,
                    user2: user2._id,
                });
            }
            const roomId = room.roomExternalId;

            // Make The Other User To Create the Room
            socket.join(roomId);
            const receiverSocketId = await redisClient.get(receiverId);
            io.sockets.sockets.get(receiverSocketId).join(roomId);

            await room.save();

            // Send Back To The Client Room information
            socket.emit('room_created', room);

        });
        socket.on('message', async (messageData) => {
            // We Need Content and roomId
            
            const senderUser = await userModel.findById(messageData.senderId);
            const receiverUser = await userModel.findById(messageData.receiverId);
            const room = await roomModel.find({roomExternalId: roomId});

            // Create & Save Message into Database
            const message = new messageModel({
                sender: senderUser,
                receiver: receiverUser,
                content: messageDate.content,
                sentAt: Date.now
            });

            // Send Message Data to all

            io.to(messageData.roomId).emit('message', messageData);

            // If Message Send to the database -> mark sent as true
            message.isSent = true;
            // Append This Message to roomId
            room.messages.push(message);
            await room.save();

            /**
             * TODO : Client must Handle Delivered state and Seen from this side
             * DETAILS : GAD will emit delivered or seen state, then i will listen to this event
             * and once they are emitted we will update database states
             * */

        })
        socket.on('check_room', (roomId) => {
            // Get the set of sockets connected to the room
            const room = io.sockets.adapter.rooms.get(roomId);

            if (room && room.has(socket.id)) {
                console.log(`Socket ${socket.id} is connected to room ${roomId}`);
                socket.emit('room_status', {roomId, status: 'connected'});
            } else {
                console.log(`Socket ${socket.id} is NOT connected to room ${roomId}`);
                socket.emit('room_status', {roomId, status: 'not connected'});
            }
        });
        socket.on('join_room', () => {
        })

        socket.on('disconnect', async () => {
            console.log(`Socket ${socket.id} is disconnected to the server`);
            try {
                await redisClient.del(socket.userId)
            } catch (err) {
                console.log("Error Occurs While Deleting the socket from cache")
            }
        })
    });
    return io;
}

