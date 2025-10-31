// src/routes/userRoute.ts
import express, { type Request, type Response, type NextFunction } from 'express';
import { register, signin } from '../controllers/auth/signUpSignIn';
import verifyToken from '../middleware/verifyToken.js';
import { requestOTP, resetPassword, verifyOTP } from '../controllers/auth/reset';


const router = express.Router();

// Route: Signup (create a new user + tenant)
router.post('/signup', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await register(req, res);
  } catch (err) {
    next(err);
  }
});

// Route: Signin
router.post('/signin', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await signin(req, res);
  } catch (err) {
    next(err);
  }
});

// Route: Add user (protected)

//router.post('/adduser', verifyToken, registerUser);

//router.post('/adduser-deleted-user', registerDeletedUser);





// OTP Routes
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

export default router;