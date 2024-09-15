const mongoose = require("mongoose");
const app = require("./app");

const {createServer} = require("node:http");
const server = createServer(app);
const io = require("./socket")(server);

require("dotenv").config();
const redisClient = require("./services/redisService");

require('./Logger')
const winston = require("winston");
const log = winston.loggers.add('logger')

// Connect To Redis Client
redisClient
    .connect()
    .then((r) => {
        log.info("Redis Server is connected");
    })
    .catch((err) => {
        log.error("Error Connecting to Redis", err);
    });

mongoose
    .connect(process.env.DB_URL)
    .then(
        () => {
            log.info("Database connected successfully");
        },
        {useNewUrlParser: true, useUnifiedTopology: true}
    )
    .catch((err) => {
        log.error(`Database connection failed: ${err}`);
    });

server.listen(3000, () => {
    log.info("Server is running on port 3000");
});
