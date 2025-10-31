"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/userRoute.ts
const express_1 = __importDefault(require("express"));
const signUpSignIn_1 = require("../controllers/auth/signUpSignIn");
const reset_1 = require("../controllers/auth/reset");
const router = express_1.default.Router();
// Route: Signup (create a new user + tenant)
router.post('/signup', async (req, res, next) => {
    try {
        await (0, signUpSignIn_1.register)(req, res);
    }
    catch (err) {
        next(err);
    }
});
// Route: Signin
router.post('/signin', async (req, res, next) => {
    try {
        await (0, signUpSignIn_1.signin)(req, res);
    }
    catch (err) {
        next(err);
    }
});
// Route: Add user (protected)
//router.post('/adduser', verifyToken, registerUser);
//router.post('/adduser-deleted-user', registerDeletedUser);
// OTP Routes
router.post('/request-otp', reset_1.requestOTP);
router.post('/verify-otp', reset_1.verifyOTP);
router.post('/reset-password', reset_1.resetPassword);
exports.default = router;
