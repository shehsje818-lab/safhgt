import mongoose from 'mongoose';

export interface IAuditLog extends mongoose.Document {
  action: string;
  userId?: mongoose.Types.ObjectId;
  targetId?: mongoose.Types.ObjectId;
  targetType: string;
  details: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
}

const auditLogSchema = new mongoose.Schema<IAuditLog>({
  action: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetType: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String }
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
