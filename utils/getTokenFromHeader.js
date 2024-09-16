const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || req.cookies.token;
  if (!authHeader) {
    return false;
  }
  if (req.headers.authorization) {
    return authHeader.split(" ")[1];
  } else {
    return authHeader;
  }
};
module.exports = getTokenFromHeader;
