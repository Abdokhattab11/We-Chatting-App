const redisClient = require('../services/redisService')
const getTokenFromHeader = require('../utils/getTokenFromHeader');
const CustomError = require("../utils/CustomError");

const tokenCheckInRedisMiddleware = async (req, res, next) => {
    if (req.path === "/api/v1/auth/login" || req.path === "/api/v1/auth/signup") {
        next();
        return;
    }

    const token = getTokenFromHeader(req);

    if (!token) {
        next(new CustomError(401, "Authorization Header Missing"));
        return;
    }

    try {
        await redisClient.get(token);
    } catch (err) {
        next(new CustomError(401, "Token Not Found in Redis"));
    }
    req.cachedToken = token;
    // Add new Attribute to Req to save the token
    next();
}

module.exports = tokenCheckInRedisMiddleware;