import { Router } from 'express';
import { Application, ApplicationStatus } from '../models/Application.js';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticateToken, isMainAdminOrOwner } from '../middleware/auth.js';
const router = Router();
// Submit application
router.post('/submit', authenticateToken, async (req, res) => {
    try {
        const { position, formData } = req.body;
        const userId = req.userId;
        if (!position || !formData) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Check if user already has pending application for this position
        const existing = await Application.findOne({
            userId,
            position,
            status: ApplicationStatus.PENDING
        });
        if (existing) {
            return res.status(400).json({ error: 'You already have a pending application for this position' });
        }
        const application = new Application({
            userId,
            position,
            formData,
            status: ApplicationStatus.PENDING
        });
        await application.save();
        // Create audit log
        await AuditLog.create({
            action: 'APPLICATION_SUBMITTED',
            userId,
            targetId: application._id,
            targetType: 'Application',
            details: { position }
        });
        res.status(201).json({
            id: application._id,
            position: application.position,
            status: application.status,
            submittedAt: application.submittedAt
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to submit application' });
    }
});
// Get user's applications
router.get('/my-applications', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;
        const applications = await Application.find({ userId })
            .sort({ submittedAt: -1 });
        res.json(applications.map((app) => ({
            id: app._id,
            position: app.position,
            status: app.status,
            submittedAt: app.submittedAt,
            reviewedAt: app.reviewedAt,
            reviewNotes: app.reviewNotes
        })));
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});
// Get all applications (admin only)
router.get('/all', authenticateToken, isMainAdminOrOwner, async (req, res) => {
    try {
        const { status, position, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;
        const query = {};
        if (status)
            query.status = status;
        if (position)
            query.position = position;
        const applications = await Application.find(query)
            .populate('userId', 'username email avatar discordId')
            .populate('reviewedBy', 'username')
            .sort({ submittedAt: -1 })
            .skip(skip)
            .limit(limit);
        const total = await Application.countDocuments(query);
        res.json({
            applications,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
});
// Review application (admin only)
router.put('/:id/review', authenticateToken, isMainAdminOrOwner, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const applicationId = req.params.id;
        if (!status || ![ApplicationStatus.APPROVED, ApplicationStatus.DECLINED].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const application = await Application.findByIdAndUpdate(applicationId, {
            status,
            reviewedAt: new Date(),
            reviewedBy: req.user?._id,
            reviewNotes: notes || undefined
        }, { new: true }).populate('userId');
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        // Create audit log
        await AuditLog.create({
            action: 'APPLICATION_REVIEWED',
            userId: req.user?._id,
            targetId: application._id,
            targetType: 'Application',
            details: {
                position: application.position,
                status,
                notes
            }
        });
        res.json({
            id: application._id,
            position: application.position,
            status: application.status,
            reviewedAt: application.reviewedAt,
            reviewNotes: application.reviewNotes
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to review application' });
    }
});
// Get application details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('userId', 'username email avatar discordId')
            .populate('reviewedBy', 'username');
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }
        // Check if user is owner or admin
        const isOwner = application.userId._id.toString() === req.userId;
        const user = await User.findById(req.userId);
        const isAdmin = ['admin', 'main_admin', 'owner'].includes(user?.role || '');
        if (!isOwner && !isAdmin) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(application);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch application' });
    }
});
export default router;
