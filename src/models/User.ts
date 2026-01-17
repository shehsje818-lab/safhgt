import mongoose from 'mongoose';

export enum UserRole {
  DEFAULT = 'default',
  JUNIOR_HELPER = 'junior_helper',
  HELPER = 'helper',
  MODERATOR = 'moderator',
  SR_MODERATOR = 'sr_moderator',
  ADMIN = 'admin',
  MAIN_ADMIN = 'main_admin',
  OWNER = 'owner'
}

export interface IUser extends mongoose.Document {
  discordId: string;
  username: string;
  email?: string;
  avatar: string;
  role: UserRole;
  joinedAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  discordId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, default: null },
  avatar: { type: String, default: '' },
  role: { 
    type: String, 
    enum: Object.values(UserRole),
    default: UserRole.DEFAULT 
  },
  joinedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const User = mongoose.model<IUser>('User', userSchema);
