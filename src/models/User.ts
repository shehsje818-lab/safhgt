import mongoose from 'mongoose';

export enum UserRole {
  DEFAULT = 'default',
  BETA_TESTER = 'beta_tester',
  JUNIOR_HELPER = 'junior_helper',
  HELPER = 'helper',
  MODERATOR = 'moderator',
  SR_MODERATOR = 'sr_moderator',
  DEPUTY = 'deputy',
  ADMIN = 'admin',
  MAIN_ADMIN = 'main_admin',
  OWNER = 'owner'
}

export const roleColors: Record<UserRole, string> = {
  [UserRole.DEFAULT]: '#808080',
  [UserRole.BETA_TESTER]: '#FF1493',
  [UserRole.JUNIOR_HELPER]: '#0000FF',
  [UserRole.HELPER]: '#87CEEB',
  [UserRole.MODERATOR]: '#00AA00',
  [UserRole.SR_MODERATOR]: '#FFFF00',
  [UserRole.DEPUTY]: '#FF0000',
  [UserRole.ADMIN]: '#FF0000',
  [UserRole.MAIN_ADMIN]: '#FF0000',
  [UserRole.OWNER]: '#FF0000'
};

export interface IUser extends mongoose.Document {
  discordId: string;
  username: string;
  nickname?: string;
  email?: string;
  avatar: string;
  role: UserRole;
  joinedAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>({
  discordId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  nickname: { type: String, default: null },
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
