import { Router } from 'express';
import { createProfile, stopVisibilityDoc,getProfile, getUserHistory, uploadDocument } from '../Controllers/userProfile.controller.js';
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

// Update the route to handle multiple files
router.post('/create', upload.array('pdf', 10), createProfile);
router.post('/doc/stop', stopVisibilityDoc);
router.get('/', getProfile);
router.get('/history/:userId', getUserHistory);
router.post('/adddoc',upload.array('pdf',10),uploadDocument);


export default router;
