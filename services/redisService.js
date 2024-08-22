const redis = require("redis");

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  username: process.env.REDIS_USERNAME,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

module.exports = client;
