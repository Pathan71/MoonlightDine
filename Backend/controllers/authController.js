import User from "../models/User.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { protect } from "../middleware/auth.js";

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" })
}

// Register a new User
export const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please enter all required fields" })
        }

        const userExists = await User.findOne({ email })
        if (userExists) {
            return res.status(400).json({ message: "User already exists" })
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create User
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role,
        })

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                token: generateToken(user._id)
            })
        } else {
            res.status(400).json({ message: "Invalid user data" })
        }
    }
    catch (err) {
        console.log(err)
        return res.status(404).json({ message: err.message })
    }
}

// Authenticate a user & get token
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" })
        }

        // Check for User
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" })
        }

        // check password matches
        const isMatch = await bcrypt.compare(password, user.password || "")
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" })
        }

        res.status(200).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id.toString())
        })
    }
    catch (err) {
        console.log(err)
        return res.status(404).json({ message: err.message })
    }
}

// Get User Profile & Private
export const getUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Not Authorized" })
        }
        res.json(req.user)
    }
    catch (err) {
        console.log(err)
        return res.status(404).json({ message: err.message })
    }
} 