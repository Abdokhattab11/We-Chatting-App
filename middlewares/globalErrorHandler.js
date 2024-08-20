const globalErrorHandler = (err, req, res, next)=>{
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong";
    const details = err.details || [];
    res.status(statusCode).json({
        message,
        details
    });
}

module.exports = globalErrorHandler;