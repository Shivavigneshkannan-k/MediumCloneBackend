const errorHandler = (err,req,res,next)=>{
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const _message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message: _message
    })
}

module.exports = errorHandler;