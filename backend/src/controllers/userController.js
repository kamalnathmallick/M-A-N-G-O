import { successResponse, errorResponse } from '../utils/apiResponse.js';

const publicUser = (user) => ({
  id: user.id || user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  location: user.location
});

/** GET /api/users and GET /api/users/me — auth-protected, returns { user }. */
export const getCurrentUser = async (req, res, next) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Not authorized', null, 401);
    }
    return successResponse(res, { user: publicUser(req.user) }, 'User retrieved');
  } catch (error) {
    next(error);
  }
};
