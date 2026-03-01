import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyCJpbp_43zutxRp0xQyQ9YPxcX8pIHFr_k";

const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });
        const result = await model.generateContent("Hello, world!");
        const response = await result.response;
        const text = response.text();
        console.log("Success! Response:");
        console.log(text);
    } catch (error) {
        console.error("Error from API:", error);
    }
}

run();
