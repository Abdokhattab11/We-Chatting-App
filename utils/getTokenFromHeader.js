const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || req.cookies.token;
  if (!authHeader) {
    return false;
  }
  if (req.headers.authorization) {
    return authHeader.substring(7);
  } else {
    return authHeader;
  }
};
module.exports = getTokenFromHeader;
