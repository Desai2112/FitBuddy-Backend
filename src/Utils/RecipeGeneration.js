import { GoogleGenerativeAI } from "@google/generative-ai";

export async function recipeGeneration(itemset) {
    const API_KEY = process.env.GOOGLE_API_KEY;
    if (!API_KEY) {
        throw new Error("GOOGLE_API_KEY environment variable is not set.");
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        const prompt = `Generate 3 creative and diverse meal suggestions that prominently feature the following ingredients: ${itemset.join(", ")}. 
        Include additional common ingredients as needed to make the recipes flavorful and complete and make sure the recipe must be veg. 
        Provide the response in the following JSON format:
        {
            "meals": [
                {
                    "meal": "Meal Name",
                    "ingredients": ["${itemset.join('", "')}", "additional ingredient 1", "additional ingredient 2"],
                    "instructions": "Step-by-step cooking instructions with clear, concise steps separated by periods.",
                    "prepTime": "X mins",
                    "cookTime": "Y mins",
                    "servings": Z,
                    "difficulty": "Easy/Medium/Hard",
                    "nutrition": {
                        "calories": "Approximate calories",
                        "protein": "Approximate protein in grams",
                        "carbs": "Approximate carbs in grams",
                        "fat": "Approximate fat in grams",
                        "fiber": "Approximate fiber in grams",
                        "sugar": "Approximate sugar in grams"
                    }
                }
            ]
        }
        Ensure each meal:
        - Uses all provided ingredients (${itemset.join(", ")}) as key components.
        - Has a variety of cooking methods (e.g., baking, frying, blending).
        - Includes estimated nutritional information even if approximate.
        - Returns exactly 3 meal suggestions with no additional text outside the JSON structure.`;

        const result = await model.generateContent(prompt);
        let aiResponse = result.response.text();

        // Extract JSON from markdown code blocks
        const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
            aiResponse = jsonMatch[1];
        }

        // Attempt to parse the extracted JSON
        try {
            return JSON.parse(aiResponse);
        } catch (jsonParseError) {
            // Clean the response more aggressively if parsing fails
            aiResponse = aiResponse.replace(/[\n\r]/g, '').replace(/```json/g, '').replace(/```/g, '');
            try {
                return JSON.parse(aiResponse);
            } catch (secondJsonParseError) {
                console.error("Second JSON parse error:", secondJsonParseError);
                throw new Error(`Invalid JSON response: ${secondJsonParseError.message}. Original response: ${result.response.text()}`);
            }
        }
    } catch (error) {
        throw new Error(`Error generating meal suggestions: ${error.message}`);
    }
}