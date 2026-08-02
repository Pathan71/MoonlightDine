import express from "express"
import jwt from "jsonwebtoken"
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1]

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await User.findById(decoded.id).select("-password")
            if(!user) {
               return res.status(401).json({message: "Not authorized, user not found"})
            }

            req.user = user;
            next()
        } 
        catch (err) {
            console.log("Auth Middleware Error:", err)
            return res.status(500).json({message: "Not authorized, token failed"})
        }
    }

    if(!token) {
        return res.status(401).json({message: "Not authorized, no token"})
    }
}

// For a Admin
export const adminOnly = (req, res, next) => {
    if(req.user && req.user.role == "admin") {
        next()
    }
    else {
        return res.status(403).json({message: "Access denied, admin role required"})
    }
}

// For a Owner
export const ownerOnly = (req, res, next) => {
    if(req.user && (req.user.role == "owner" || req.user.role == "admin")) {
        next()
    }
    else {
        return res.status(403).json({message: "Access denied, admin role required"})
    }
}