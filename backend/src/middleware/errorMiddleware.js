const errorHandler = (err, req, res, next) => {
  // If the status code is still 200, force it to 500 (Internal Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error("🔥 Error caught by Global Handler:", err.message);
  
  res.status(statusCode).json({
    message: err.message,
    // Only show the stack trace in development mode for security
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };
