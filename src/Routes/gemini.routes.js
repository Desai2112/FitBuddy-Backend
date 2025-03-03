import { Router } from "express";
import { generateBMIResponse, generateRecipe } from '../Controllers/gemini.controller.js';
import isAuthenticated from "../middleware/isAuthenticated.middleware.js";

const router = Router();

router.route('/bmi').post(isAuthenticated, generateBMIResponse);
router.route('/recipe').post(generateRecipe);

// Route for creating user profile
export default router;
