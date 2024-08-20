const getTokenFromHeader = (req) =>{
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return false;
    }
    return authHeader.substring(7);
}
module.exports = getTokenFromHeader;