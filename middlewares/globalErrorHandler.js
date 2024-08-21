const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: err.status,
    message: err.message,
    Error: err,
    stack: err.stack,
  });
};
const sendErrorProduction = (err, res) => {
  res.status(err.statusCode).json({
    success: err.status,
    message: err.message,
  });
};

const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Something went wrong";
  if (process.env.NODE_ENV === "development") sendErrorDev(err, res);
  else {
    if (err.name === "JsonWebTokenError") err = handleInvalidSignature();
    sendErrorProduction(err, res);
  }
};

module.exports = globalErrorHandler;
