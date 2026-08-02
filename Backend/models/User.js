import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    name:{ type: "String", required: true, trim: true },
    email: { type: "String", required: true, unique: true, trim: true },
    password: { type: "String", required: true, minlength: 6 },
    phone: { type: "String", required: true, minlength: 10 },
    role: { type: String, enum: ["user", "admin", "owner"], default: "user" }
}, {
    timestamps: true
})

const User = mongoose.models.user || mongoose.model('User', UserSchema)

export default User;