import express from 'express';
import { createPost, getPosts } from '../Controllers/communityPostController.js';
import isDoctor from '../middleware/isDoctor.middleware.js';
import isAuthenticated from '../middleware/isAuthenticated.middleware.js';

const router = express.Router();

// Route to create a new community post
router.post('/', isDoctor, createPost);

// Route to get all community posts
router.get('/', isAuthenticated, getPosts);

// Additional routes (update, delete) can be added here...

export default router; 