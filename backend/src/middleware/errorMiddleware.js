import { errorResponse } from '../utils/apiResponse.js';

export const errorHandler = (err, req, res, next) => {
  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'Uploaded image exceeds maximum size limit (10MB)', null, 400);
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return errorResponse(res, 'Too many images uploaded in single batch (max 10)', null, 400);
    }
    return errorResponse(res, `Upload error: ${err.message}`, null, 400);
  }

  // File type validation error
  if (err.message && err.message.includes('Invalid image file format')) {
    return errorResponse(res, err.message, null, 400);
  }

  // Mongoose CastError (malformed ObjectId / identifier) — never leak internals
  if (err.name === 'CastError') {
    return errorResponse(res, 'Invalid identifier format', null, 400);
  }

  // Mongoose validation errors (messages are our own, safe to echo)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return errorResponse(res, 'Validation Error', messages.join(', '), 400);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return errorResponse(res, `Duplicate entry for ${field}`, `An entry with this ${field} already exists`, 409);
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  if (statusCode < 500) {
    // Intentional client errors (e.g. notFound) keep their descriptive message
    return errorResponse(res, err.message || 'Request failed', null, statusCode);
  }

  // Unknown/internal errors: log everything server-side, never leak internals
  console.error('[Error Handler]', err.name || 'Error', err.message, '\n', err.stack || '');
  return errorResponse(res, 'Internal Server Error', null, statusCode);
};

export const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
