import mongoose, { Schema } from "mongoose";

const RestaurantSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true },
    cuisine: { type: String, required: true, trim: true },
    priceRange: { type: Number, enum: [1, 2, 3, 4 ], required: true },
    rating: { type: Number, default:5.0, min:1, max:5 },
    reviewCount: { type: Number, default: 0 },
    location: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    image: { type: String, default: "" },
    chef: { type: String, required: true },
    tags: [{ type: String }],
    availableSlots: [{ type: String }],
    featured: { type: Boolean, default: false },
    exclusive: { type: Boolean, default: false },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    totalSeats: { type: Number, default: 20 },
}, {
    timestamps: true
})

const Restaurant = mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema)

export default Restaurant 