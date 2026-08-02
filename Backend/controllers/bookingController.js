import Booking from "../models/Booking.js";
import Restaurant from "../models/Restaurant.js";


// Create a new booking
export const createBooking = async (req, res) => {
    try {
        const {restaurantId, date, time, guests, occasion, specialRequests} = req.body;

        if(!restaurantId || !date || !time || !guests) {
            return res.status(400).json({message: "Please provide all required reservation details."})
        }

        // check if restaurant exists
        const restaurant = await Restaurant.findById(restaurantId)
        if(!restaurant) {
            return res.status(404).json({message: "Restaurant not found"})
        }

        // Verify restaurant is approved
        if(restaurant.status !== "approved") {
            return res.status(400).json({message: "Reservation are not open for this restaurant yet."})
        }

        // Verify seat availability
        const requestGuests = Number(guests)
        const existingBookings = await Booking.find({
            restaurant: restaurantId,
            date: new Date(date),
            time, 
            status: "confirmed"
        })

        const bookedSeats = existingBookings.reduce((sum, b) => sum + b.guests, 0)
        const totalSeats = restaurant.totalSeats || 20;
        const availableSeats = totalSeats - bookedSeats;

        if(requestGuests > availableSeats) {
            res.status(400).json({
                message: `Unable to resever. Only ${availableSeats} seats are available for this time slot.`
            })
        }
        
        const booking = await Booking.create({
            user: req.user?._id,
            restaurant: restaurantId,
            date: new Date(date),
            time, 
            guests: Number(guests),
            occasion,
            specialRequests,
            status: "confirmed"
        })

        // Populate restaurant info before returning
        const populatedBooking = await booking.populate("restaurant", "name location image address");
        res.status(201).json(populatedBooking)
    } 
    catch (err) {
        console.error(err)    
        res.status(400).json({message: err.message})
    }
}

// Get logged in user booking
export const getMyBooking = async (req, res) => {
    try {
        const bookings = await Booking.find({user: req.user?._id}).populate("restaurant", "name location image address slug").sort({date: -1, time: -1})  

        res.json(bookings)
    } 
    catch (err) {
        console.error(err)    
        res.status(400).json({message: err.message})
    }
}

// Booking Cancel
export const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
        if(!booking){
            return res.status(404).json({message: "Booking not found"})
        }

        // Verify user owns the booking
        if(booking.user.toString() !== req.user?._id.toString()) {
            return res.status(401).json({message: "Not authorized to cancel this booking"})
        }
        booking.status = "cancelled"
        await booking.save()

        const populatedBooking = await booking.populate("restaurant", "name location image address");
        res.status(201).json(populatedBooking)
    } 
    catch (err) {
        console.error(err)    
        res.status(400).json({message: err.message})
    }
}