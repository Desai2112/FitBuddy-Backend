import express from 'express';
import {
    register,
    verifyOTP,
    login,
    logout,
    getProfileById,
    getDoctors
} from '../controllers/auth.controller.js';
// import { isAuthenticated } from '../middleware/auth.middleware.js';

const router = express.Router();

// Authentication routes
router.post('/register', register);
router.post('/verify', verifyOTP);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', getProfileById);
router.get('/doctors', getDoctors);

export default router; 