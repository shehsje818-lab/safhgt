import mongoose from 'mongoose';
export var UserRole;
(function (UserRole) {
    UserRole["DEFAULT"] = "default";
    UserRole["JUNIOR_HELPER"] = "junior_helper";
    UserRole["HELPER"] = "helper";
    UserRole["MODERATOR"] = "moderator";
    UserRole["SR_MODERATOR"] = "sr_moderator";
    UserRole["ADMIN"] = "admin";
    UserRole["MAIN_ADMIN"] = "main_admin";
    UserRole["OWNER"] = "owner";
})(UserRole || (UserRole = {}));
const userSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String, default: '' },
    role: {
        type: String,
        enum: Object.values(UserRole),
        default: UserRole.DEFAULT
    },
    joinedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
export const User = mongoose.model('User', userSchema);
