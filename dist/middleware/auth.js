import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User.js';
import { config } from '../config/config.js';
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        req.userId = decoded.userId;
        // Fetch and attach user to request
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};
export const requireRole = (...roles) => {
    return async (req, res, next) => {
        try {
            if (!req.user && !req.userId) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const userId = req.user?._id || req.userId;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            if (!roles.includes(user.role)) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    requiredRoles: roles,
                    userRole: user.role
                });
            }
            req.user = user;
            next();
        }
        catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    };
};
export const isAdminOrHigher = (req, res, next) => {
    const adminRoles = [UserRole.ADMIN, UserRole.MAIN_ADMIN, UserRole.OWNER];
    return requireRole(...adminRoles)(req, res, next);
};
export const isMainAdminOrOwner = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    if (req.user.role !== UserRole.MAIN_ADMIN && req.user.role !== UserRole.OWNER) {
        return res.status(403).json({
            error: 'Insufficient permissions',
            requiredRoles: [UserRole.MAIN_ADMIN, UserRole.OWNER],
            userRole: req.user.role
        });
    }
    next();
};
