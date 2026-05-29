const sendSuccess = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data
  });
};

const sendError = (res, statusCode, message, errorDetails = null) => {
  const response = {
    success: false,
    error: message
  };
  
  if (errorDetails && process.env.NODE_ENV !== 'production') {
    response.details = errorDetails;
  }
  
  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError
};
