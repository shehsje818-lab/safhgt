import mongoose from 'mongoose';

export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DECLINED = 'declined'
}

export enum PositionType {
  JUNIOR_HELPER = 'junior-helper',
  HELPER = 'helper',
  DUNGEON_CARRIER = 'dungeon-carrier',
  SLAYER_CARRIER = 'slayer-carrier'
}

export interface IApplication extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  position: PositionType;
  status: ApplicationStatus;
  formData: Record<string, any>;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
}

const applicationSchema = new mongoose.Schema<IApplication>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  position: { 
    type: String, 
    enum: Object.values(PositionType),
    required: true 
  },
  status: { 
    type: String, 
    enum: Object.values(ApplicationStatus),
    default: ApplicationStatus.PENDING 
  },
  formData: { type: mongoose.Schema.Types.Mixed, required: true },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: { type: String }
});

export const Application = mongoose.model<IApplication>('Application', applicationSchema);
