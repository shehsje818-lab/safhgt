import { Router, Response } from 'express';
import { User, UserRole } from '../models/User.js';
import { AuthRequest, authenticateToken, isMainAdminOrOwner } from '../middleware/auth.js';
import { AuditLog } from '../models/AuditLog.js';
import { Application } from '../models/Application.js';
import mongoose from 'mongoose';

const router = Router();

// Get all users (admin only)
router.get('/users', authenticateToken, isMainAdminOrOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const skip = ((page as number) - 1) * (limit as number);

    const query: any = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-__v')
      .sort({ joinedAt: -1 })
      .skip(skip)
      .limit(limit as number);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / (limit as number))
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user role (main admin/owner only)
router.put('/users/:id/role', authenticateToken, isMainAdminOrOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    const userId = req.params.id;

    if (!role || !Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create audit log
    await AuditLog.create({
      action: 'USER_ROLE_UPDATED',
      userId: req.user?._id,
      targetId: user._id,
      targetType: 'User',
      details: { newRole: role }
    });

    res.json({
      id: user._id,
      username: user.username,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Get dashboard stats
router.get('/dashboard/stats', authenticateToken, isMainAdminOrOwner, async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalUsers,
      usersByRole: Object.fromEntries(
        usersByRole.map((item: any) => [item._id, item.count])
      )
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get audit logs
router.get('/audit-logs', authenticateToken, isMainAdminOrOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { action, page = 1, limit = 50 } = req.query;
    const skip = ((page as number) - 1) * (limit as number);

    const query: any = {};
    if (action) query.action = action;

    const logs = await AuditLog.find(query)
      .populate('userId', 'username')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit as number);

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / (limit as number))
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Update document in database (generic)
router.put('/db/update/:collection/:id', authenticateToken, isMainAdminOrOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { collection, id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    let updated;
    if (collection === 'users') {
      updated = await User.findByIdAndUpdate(id, updates, { new: true });
    } else if (collection === 'applications') {
      updated = await Application.findByIdAndUpdate(id, updates, { new: true });
    } else if (collection === 'auditLogs') {
      updated = await AuditLog.findByIdAndUpdate(id, updates, { new: true });
    } else {
      return res.status(400).json({ error: 'Invalid collection' });
    }

    if (!updated) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Log the update
    await AuditLog.create({
      action: 'DOCUMENT_UPDATED',
      userId: req.user?._id,
      targetId: id,
      targetType: collection,
      details: { updates }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Delete document from database
router.delete('/db/delete/:collection/:id', authenticateToken, isMainAdminOrOwner, async (req: AuthRequest, res: Response) => {
  try {
    const { collection, id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid document ID' });
    }

    let deleted;
    if (collection === 'users') {
      deleted = await User.findByIdAndDelete(id);
    } else if (collection === 'applications') {
      deleted = await Application.findByIdAndDelete(id);
    } else if (collection === 'auditLogs') {
      deleted = await AuditLog.findByIdAndDelete(id);
    } else {
      return res.status(400).json({ error: 'Invalid collection' });
    }

    if (!deleted) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Log the deletion
    await AuditLog.create({
      action: 'DOCUMENT_DELETED',
      userId: req.user?._id,
      targetId: id,
      targetType: collection,
      details: { deletedDocument: deleted }
    });

    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
