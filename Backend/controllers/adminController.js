import express from "express"
// import { AuthRequest } from "../middleware/auth.js"
import Restaurant from "../models/Restaurant.js"
import User from "../models/User.js"
import Booking from "../models/Booking.js"

// Get all restaurant from admin managment
export const getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({}).populate("owner", "name email phone").sort({created: -1})

        res.json(restaurants)
    } 
    catch (err) {
        console.error(err)
        res.status(400).json({message: err.message})   
    }
}

// Approve/Reject a restaurant profile
export const approveRestaurants = async (req, res) => {
    try {
        const {status} = req.body;
        if(!status || !["approved", "rejected", "pending"].includes(status)) {
            return res.status(400).json({message: "Please provide a valid approval status"})
        }

        const restaurant = await Restaurant.findById(res.params.id)
        if(!restaurant) {
            return res.status(404).json({message: "Restaurant profile not found"})
        }

        restaurant.status = status;
        await restaurant.save()
        res.json(restaurant);
    } 
    catch (err) {
        console.error(err)
        res.status(400).json({message: err.message})   
    }
}

// Get system statistics
export const getAdminStats = async (req, res) => {
    try {
        const totalUser = await User.countDocuments({role: "user"})
        const totalOwners = await User.countDocuments({role: "owner"})
        const totalBookings = await Booking.countDocuments({})
        const totalRestaurants = await Restaurant.countDocuments({})

        // Get lastest 10 bookings
        const latestBookings = await Booking.find({}).populate("user", "name email").populate("restaurant", "name").sort({created: -1}).limit(10)

        res.json({
            users: {
                totalUser,
                totalOwners,
                total: totalUser + totalOwners
            },
            restaurants: {
                total: totalRestaurants,
            },
            bookings: {
                total: totalBookings,
            },
            latestBookings
        })
    } 
    catch (err) {
        console.error(err)
        res.status(400).json({message: err.message})   
    }
}