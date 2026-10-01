/**
 * Standardized API Response Utilities
 */

export const successResponse = (res, data = {}, message = 'Operation successful', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

export const errorResponse = (res, message = 'An error occurred', error = null, statusCode = 500) => {
  const response = {
    success: false,
    message
  };

  if (error) {
    response.error = typeof error === 'string' ? error : error.message || 'Internal error';
  }

  return res.status(statusCode).json(response);
};
