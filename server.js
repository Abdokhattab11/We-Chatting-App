const mongoose = require("mongoose");
const app = require("./app");

const {createServer} = require('node:http');
const server = createServer(app);
const io = require('./socket')(server);

require("dotenv").config();
const redisClient = require("./services/redisService");

// Connect To Redis Client
redisClient
    .connect()
    .then((r) => {
        console.log("Redis Server is connected");
    })
    .catch((err) => {
        console.log("Error Connecting to Redis", err);
    });

mongoose
    .connect(process.env.DB_URL)
    .then(() => {
        console.log("Database connected successfully");
    })
    .catch((err) => {
        console.log("Database connection failed");
        console.log(err);
    });

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});

