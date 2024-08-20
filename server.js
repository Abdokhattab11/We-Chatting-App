const mongoose = require('mongoose')

require('dotenv').config()
const redisClient = require('./services/redisService')

// Connect To Redis Client
redisClient.connect().then(r => {
    console.log("Redis Server is connected")
}).catch(() => {
    console.log("Error Connecting to Redis")
})

mongoose.connect(process.env.DB_URL)
    .then(() => {
        console.log("Database connected successfully");
    }).catch((err) => {
    console.log("Database connection failed");
    console.log(err);
})

app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
})