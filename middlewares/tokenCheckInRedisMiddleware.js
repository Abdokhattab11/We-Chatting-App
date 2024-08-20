const redisClient = require('../services/redisService')
const getTokenFromHeader = require('../utils/getTokenFromHeader');

const tokenCheckInRedisMiddleware = async (req, res, next) => {
    if (req.path === "/api/v1/auth/login" || req.path === "/api/v1/auth/register") {
        next();
        return;
    }

    const token = getTokenFromHeader(req);

    if (!token) {
        next(new Error("Authorization Header Missing"));
    }
    const tokenCheck = await redisClient.get(token);
    if (!tokenCheck) {
        next(new Error("Unauthenticated"));
    }
    next();
}

module.exports = tokenCheckInRedisMiddleware;