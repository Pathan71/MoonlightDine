import mongoose, { Schema } from "mongoose";
import crypto from "crypto"

const BookingSchema = new mongoose.Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    guests: { type: String, required: true, min: 1 },
    occasion: { type: String, trim: true },
    specialRequests: { type: String, trim: true },
    status: { type: String, enum: ["confirmed", "cancelled", "completed"], default: "confirmed" },
    bookingId: { type: String, unique: true },
}, {
    timestamps: true
})

BookingSchema.pre('save', function() {
    if(!this.bookingId) {
        this.bookingId = `GR-${crypto.randomBytes(4).toString("hex").toUpperCase()}`
    }
})

const Booking = mongoose.models.user || mongoose.model('Booking', BookingSchema)

export default Booking