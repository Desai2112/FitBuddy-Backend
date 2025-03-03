import { generateBMIAdvice } from '../Utils/BMIResponse.js';
import { recipeGeneration } from '../Utils/RecipeGeneration.js';

export const generateBMIResponse = async (req, res) => {
    try {
        const { height, weight } = req.body;

        // Validate required fields
        if (!height || !weight) {
            return res.status(400).json({
                message: "Height and weight are required",
                success: false
            });
        }

        // Validate input types and ranges
        if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
            return res.status(400).json({
                message: "Invalid height or weight values",
                success: false
            });
        }

        // Calculate BMI
        const bmi = (weight / ((height / 100) * (height / 100))).toFixed(2);

        // Get AI-generated advice
        const aiAdvice = await generateBMIAdvice(bmi);

        res.status(200).json({
            message: "BMI analysis completed successfully",
            data: {
                bmi,
                analysis: aiAdvice
            },
            success: true
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
            success: false
        });
    }
};

export const generateRecipe = async (req, res) => {
    try {
        const { ingredients } = req.body;

        // Validate required fields
        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({
                message: "Ingredients array is required and cannot be empty",
                success: false
            });
        }

        // Validate each ingredient is a non-empty string
        if (!ingredients.every(item => typeof item === 'string' && item.trim().length > 0)) {
            return res.status(400).json({
                message: "All ingredients must be non-empty strings",
                success: false
            });
        }

        // Clean ingredients array - trim whitespace and remove duplicates
        const cleanedIngredients = [...new Set(ingredients.map(item => item.trim()))];

        // Generate recipe suggestions
        const recipeData = await recipeGeneration(cleanedIngredients);

        res.status(200).json({
            message: "Recipe suggestions generated successfully",
            data: recipeData,
            success: true
        });

    } catch (error) {
        res.status(500).json({
            message: "Internal server error",
            error: error.message,
            success: false
        });
    }
};
