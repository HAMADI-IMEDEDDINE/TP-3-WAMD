import mongoose from 'mongoose';
import { ApiError } from './errorHandler.js';

/**
 * Rejects malformed MongoDB ObjectIds with 400 Bad Request before a query is
 * executed. A syntactically valid but unknown id reaches the controller and
 * produces 404 Not Found.
 */
export function validateObjectId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new ApiError(400, 'INVALID_ID', 'Invalid product id.'));
  }

  return next();
}
