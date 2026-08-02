import Restaurant from "../models/Restaurant.js"
import Booking from "../models/Booking.js"
import { v2 as cloudinary } from "cloudinary"

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = (Buffer) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "QuickDine" }, (error, result) => {
            if (error) return reject (error);
            if (!result) return reject(new Error("Upload failed"))
            resolve(result)
        })
        stream.end(Buffer)
    })
}

// Get owner's restaurant
export const getOwnerRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user?._id })
        if (!restaurant) {
            return res.status(200).json(null)
        }
        res.json(restaurant)
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ message: err.message })
    }
}

// Create Owner's restaurant
export const createOwnerRestaurant = async (req, res) => {
    try {
        const existing = await Restaurant.findOne({ owner: req.user?._id })
        if (existing) {
            return res.status(400).json({ message: "You already have a restaurant registered" })
        }

        const { name, description, cuisine, priceRange, location, address, chef, tags, availableSlots, totalSeats } = req.body;

        if (!name || !description || !cuisine || !priceRange || !location || !address || !chef) {
            return res.status(400).json({ message: "Please provide all required fields" })
        }

        // Generate slug from name
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

        const slugExists = await Restaurant.findOne({ slug })
        if (slugExists) {
            return res.status(400).json({ message: "A restaurant with this name already exists." })
        }

        // Handle Image
        const imageUrl = result.secure_url;
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer)
            imageUrl = result.upload;
        }

        // Setup parsed tags and slots
        const parsedTags = typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : tags || []
        const parsedSlots = typeof availableSlots === "string" ? availableSlots.split(",").map((s) => s.trim()) : availableSlots || ["17:00", "18:00", "19:00", "20:00", "21:00"];
        

        const restaurant = await Restaurant.create({
            name,
            slug,
            description,
            cuisine,
            priceRange: Number(priceRange),
            location,
            address,
            chef,
            image: imageUrl,
            tags: parsedTags,
            availableSlots: parsedSlots,
            totalSeats: totalSeats ? Number(totalSeats) : 0,
            owner: req.user?._id,
            status: "pending"
        })
        res.status(200).json(restaurant)
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ message: err.message })
    }
}

// Update owner's restaurant
export const updateOwnerRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user?._id })
        if (!restaurant) {
            return res.status(400).json({ message: "Restaurant profile not found" })
        }

        const { name, description, cuisine, priceRange, location, address, chef, tags, availableSlots, totalSeats } = req.body;

        if (name) restaurant.name = name;
        if (description) restaurant.description = description;
        if (cuisine) restaurant.cuisine = cuisine;
        if (priceRange) restaurant.priceRange = Number(priceRange);
        if (location) restaurant.location = location;
        if (address) restaurant.address = address;
        if (chef) restaurant.chef = chef;
        if (totalSeats) restaurant.totalSeats = totalSeats;

        if (tags) {
            restaurant.tags = typeof tags === "string" ? tags.split(",").map(t => t.trim()) : tags;
        }

        if (availableSlots) {
            restaurant.availableSlots = typeof availableSlots === "string" ? availableSlots.split(",").map(s => s.trim()) : availableSlots;
        }

        // Handle Image
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer)
            restaurant = result.secure_url;
        }
        const updated = await restaurant.save()
        res.json(updated)
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ message: err.message })
    }
}

// Get bookings for owner's restaurant
export const getOwnerBookings = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user?._id })
        if (!restaurant) {
            return res.status(200).json(restaurant)
        }

        const bookings = await Booking.find({ restaurant: restaurant._id }).populate("user", "name email phone").sort({ date: -1, time: -1 })

        res.json(bookings)
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ message: err.message })
    }
}

// Update status of a booking
export const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !["confirmed", "cancelled", "completed"].includes(status)) {
            return res.status(400).json({ message: "Please enter a valid booking status" })
        }

        const booking = await Booking.findById(req.params.id)
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" })
        }

        // Verify booking belongs to the owner's restaurant
        const restaurant = await Restaurant.findById(booking.restaurant)
        if (!restaurant || restaurant.owner.toString() !== req.user?._id.toString()) {
            return res.status(401).json({ message: "Not authorized to manage this booking" })
        }

        booking.status = status;
        await booking.save();
        res.json(booking)
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ message: err.message })
    }
}
