const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access API key from command line arg or process.env
const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || process.argv[2];

if (!apiKey) {
    console.error("Please provide GEMINI_API_KEY in .env or as argument");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Dummy init to get client, actually we need the model manager

        // The SDK might not expose listModels directly on the main class in all versions
        // Let's try to interpret how to list models. 
        // Actually, typically we use the model manager if available, or just try to generate with the specific model to see if it errors with "not found".

        // Attempt 1: Check if there is a listModels method on the client or model manager (depends on version)
        // Looking at documentation, it's usually `genAI.getGenerativeModel` directly. 
        // There isn't a simple "list models" in the high level client always visible.
        // However, we can use the `check-model` approach or raw REST call.

        console.log("Checking specifically for 'gemini-2.5-flash'...");
        try {
            const specificModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            const result = await specificModel.generateContent("Hello");
            console.log("SUCCESS: gemini-2.5-flash IS available.");
            console.log("Response:", result.response.text());
        } catch (e) {
            console.log("FAILED: gemini-2.5-flash is likely NOT available or request failed.");
            console.log("Error:", e.message);
        }

        console.log("\nChecking for 'gemini-2.0-flash-exp'...");
        try {
            const model2 = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
            await model2.generateContent("Hello");
            console.log("SUCCESS: gemini-2.0-flash-exp IS available.");
        } catch (e) {
            console.log("FAILED: gemini-2.0-flash-exp error:", e.message);
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
