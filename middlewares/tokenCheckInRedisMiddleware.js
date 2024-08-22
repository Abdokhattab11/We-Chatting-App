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


    const id = await redisClient.get(token);
    if (!id) {
        next(new CustomError(401, "Token Not Exist In Redis"));
        return;
    }
    req.cachedToken = token;
    // Add new Attribute to Req to save the token
    next();
}

module.exports = tokenCheckInRedisMiddleware;