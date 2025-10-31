import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateBMIAdvice(bmi) {
    const API_KEY = process.env.GOOGLE_API_KEY;
    if (!API_KEY) {
        throw new Error("GOOGLE_API_KEY environment variable is not set.");
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
        const prompt = `Given a BMI of ${bmi}, provide a detailed health analysis specifically for a vegetarian diet in the following JSON format:
        {
            "bmi_category": "Underweight/Normal/Overweight/Obese",
            "health_implications": "A concise explanation of what this BMI means for health, considering a vegetarian lifestyle (150-200 words)",
            "diet_plan": {
                "recommended_foods": ["specific vegetarian food with brief benefit (e.g., 'Lentils - high in protein')", "another food...", "etc.", at least 5 items],
                "foods_to_avoid": ["specific vegetarian-unfriendly food with reason (e.g., 'Processed veggie burgers - high in sodium')", "another food...", "etc.", at least 3 items]
            },
            "exercise_plan": ["specific exercise suggestion with duration/frequency (e.g., '30 min brisk walking, 5 days/week')", "another exercise...", "etc.", exactly 3 items],
            "lifestyle_changes": ["specific actionable tip (e.g., 'Drink 8 glasses of water daily')", "another tip...", "etc.", exactly 3 items]
        }
        Guidelines:
        - Base the bmi_category strictly on standard ranges: Underweight (<18.5), Normal (18.5-24.9), Overweight (25-29.9), Obese (≥30).
        - Tailor all recommendations to a vegetarian diet, avoiding meat-based suggestions.
        - Provide practical, concise advice suitable for daily life.
        - Return only the JSON object with no additional text or explanations outside the structure.`;

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
        throw new Error(`Error generating BMI advice: ${error.message}`);
    }
}