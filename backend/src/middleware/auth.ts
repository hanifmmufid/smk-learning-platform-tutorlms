import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/jwt';

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid token',
      });
    }

    // Attach user data to request
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Authentication failed',
    });
  }
};

// Role-based middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden - Insufficient permissions',
      });
    }

    next();
  };
};
