const redis = require("redis");

const client = redis.createClient({
  URL: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

module.exports = client;
