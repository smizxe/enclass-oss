const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    // Use the API key from the environment
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("No GOOGLE_API_KEY found in environment variables.");
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        console.log("Fetching available models...");

        // We can fetch from the REST API directly since the SDK doesn't have a listModels method exposed in the same way
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();

        console.log("\n--- AVAILABLE GEMINI MODELS ---");
        const flashModels = data.models.filter(m => m.name.includes('flash') || m.name.includes('gemini'));

        flashModels.forEach(model => {
            console.log(`- ${model.name.replace('models/', '')}: ${model.description}`);
        });

        console.log("\nTotal models found:", flashModels.length);

    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

listModels();
