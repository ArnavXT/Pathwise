const { generateQuiz } = require('../services/aiService');

const apiKey = process.env.OPENROUTER_API_KEY || "";

const fs = require('fs');

async function test() {
    console.log("Testing generateQuiz...");
    try {
        const quiz = await generateQuiz(apiKey, "Mars", "Learn about the planet's history and formation");
        fs.writeFileSync('test_output.json', JSON.stringify(quiz, null, 2));
        console.log("Wrote to test_output.json");
    } catch (e) {
        console.error("TEST ERROR:", e);
    }
}
test();
