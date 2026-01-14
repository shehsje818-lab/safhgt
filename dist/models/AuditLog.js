import mongoose from 'mongoose';
const auditLogSchema = new mongoose.Schema({
    action: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    targetType: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
    ipAddress: { type: String }
});
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
