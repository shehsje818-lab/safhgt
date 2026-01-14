import mongoose from 'mongoose';
export var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["PENDING"] = "pending";
    ApplicationStatus["APPROVED"] = "approved";
    ApplicationStatus["DECLINED"] = "declined";
})(ApplicationStatus || (ApplicationStatus = {}));
export var PositionType;
(function (PositionType) {
    PositionType["JUNIOR_HELPER"] = "junior-helper";
    PositionType["HELPER"] = "helper";
    PositionType["DUNGEON_CARRIER"] = "dungeon-carrier";
    PositionType["SLAYER_CARRIER"] = "slayer-carrier";
})(PositionType || (PositionType = {}));
const applicationSchema = new mongoose.Schema({
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
export const Application = mongoose.model('Application', applicationSchema);
