import express from "express"
import Restaurant from "../models/Restaurant.js"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import Booking from "../models/Booking.js"

// Get All Restaurant
export const getRestaurants = async (req, res) => {
    try {
        const { search, cuisine, priceRange, rating, location, sort } = req.query;

        // Build query object
        const queryObj = { status: "approved" }
        if (search) {
            queryObj.$or = [
                { name: { $regex: search, $options: "i" } },
                // { cuisine: { $regex: search, $options: "i" } },
                { tags: { $elemMatch: { $regex: search, $options: "i" } } },
                { location: { $regex: search, $options: "i" } },
            ]
        }

        // if(cuisine) {
        //     queryObj.cuisine = {
        //         $regex: cuisine,
        //         $options: "i"
        //     }
        // }

        if (priceRange) {
            const prices = Array.isArray(priceRange) ? priceRange.map(Number) : [Number(priceRange)]
            queryObj.priceRange = { $in: prices }
        }
        if (rating) {
            queryObj.rating = { $gte: parseFloat(rating) };
        }
        if (location) {
            queryObj.location = { $regex: location, $options: "i" }
        }

        // Sorting
        let sortOption = { createdAt: -1 }
        if (sort === "rating") {
            sortOption = { rating: -1 }
        } else if (sort === "price_low") {
            sortOption = { priceRange: 1 }
        } else if (sort === "price_high") {
            sortOption = { priceRange: -1 }
        }

        const restaurant = await Restaurant.find(queryObj).sort(sortOption)
        res.json(restaurant)
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ message: err.message })
    }
}

// Get Features of Restaurant
export const getFeaturedRestaurants = async (req, res) => {
    try {
        const featured = await Restaurant.find({
            status: "approved",
            $or: [{ featured: true }, { exclusive: true }]
        }).limit(6)

        res.json(featured)
    }
    catch (err) {
        console.error("Get Feaatured Restaurants Error", err)
        res.status(500).json({ message: "Sever Error" })
    }
}

// Get Restaurant By Slug
export const getRestaurantsBySlug = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ slug: req.params.slug })
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" })
        }

        // If not approved, verify authorization (owner or admin)
        if (restaurant.status !== "approved") {
            let isAuthorized = false
            if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
                try {
                    const token = req.headers.authorization.split(" ")[1]
                    const decoded = jwt.verify(token, process.env.JWT_SECRET)

                    const user = await User.findById(decoded.id)

                    if (user && (user.role === "admin" || (user.role === "owner" && restaurant.owner.toString() === user._id.toString()))) {
                        isAuthorized = true
                    }
                } catch (err) {
                    // Ignore token verify error
                }
            }
            if (!isAuthorized) {
                return res.status(404).json({ message: "Restaurant not found or pending approval" })
            }
        }
        res.json(restaurant)
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ message: err.message })
    }
}

// Get dynamic seat availability for slots
export const getRestaurantAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: "Please provide a date" })
        }

        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" })
        }

        const bookingDate = new Date(date)

        // Get all acgtive bookings on this date for restaurant
        const bookings = await Booking.find({
            restaurant: restaurant._id,
            date: bookingDate,
            status: "confirmed"
        })

        // Map slots to available capacities
        const availability = restaurant.availableSlots.map((slot) => {
            const bookSeats = bookings.filter((b) => b.time === slot).reduce((sum, b) => sum + b.guests, 0)

            const totalSeats = restaurant.totalSeats || 20;
            const availableSeats = Math.max(0, totalSeats - bookSeats);

            return { time: slot, availableSeats, isAvailable: availableSeats > 0 }
        })
        res.json(availability)
    }
    catch (err) {
        console.error(err)
        res.status(500).json({ message: err.message })
    }
}
