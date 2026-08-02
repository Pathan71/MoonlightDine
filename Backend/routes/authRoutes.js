import express, { Router } from "express"
import { getUser, loginUser, registerUser } from "../controllers/authController.js"
import { protect } from "../middleware/auth.js"

const authRouter = Router()

authRouter.post("/register", registerUser)
authRouter.post("/login", loginUser)
authRouter.get("/me", protect, getUser)

export default authRouter;