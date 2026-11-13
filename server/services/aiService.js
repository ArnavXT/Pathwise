const axios = require('axios');

const GEMINI_MODEL = "gemini-2.5-flash";
const OPENROUTER_CONTENT_MODEL = "qwen/qwen3.6-plus:free";
const OPENROUTER_TEST_MODEL = "qwen/qwen3.6-plus:free";

/**
 * Smart LLM caller: automatically detects key type (Gemini vs OpenRouter)
 * Supports Gemini keys (AQ... / AIzaSy...) and OpenRouter keys (sk-or-... / sk-...)
 */
async function callLLM(apiKey, prompt, modelOverride = null, temperature = 0.4, maxTokens = 4000, jsonMode = false) {
    const key = (apiKey || process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY || '').trim();
    if (!key) throw new Error("API Key is missing. Please set GEMINI_API_KEY or OPENROUTER_API_KEY.");

    // Detect if key is Gemini (starts with AQ., AIzaSy, or any non-sk key)
    const isGemini = key.startsWith("AQ.") || key.startsWith("AIzaSy") || (!key.startsWith("sk-") && !key.startsWith("sk-or-"));

    if (isGemini) {
        const model = modelOverride || GEMINI_MODEL;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const payload = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature,
                maxOutputTokens: maxTokens,
                ...(jsonMode ? { responseMimeType: "application/json" } : {})
            }
        };

        try {
            const res = await axios.post(url, payload, {
                headers: { "Content-Type": "application/json" },
                timeout: 60000
            });
            return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        } catch (e) {
            console.error(`[Gemini API Error] (${model}):`, e.response?.data || e.message);
            return null;
        }
    } else {
        // OpenRouter fallback
        const model = modelOverride || OPENROUTER_CONTENT_MODEL;
        const url = "https://openrouter.ai/api/v1/chat/completions";
        const headers = {
            "Authorization": `Bearer ${key}`,
            "Content-Type": "application/json"
        };
        const payload = {
            model,
            messages: [{ role: "user", content: prompt }],
            temperature,
            max_tokens: maxTokens
        };

        try {
            const res = await axios.post(url, payload, { headers, timeout: 60000 });
            return res.data?.choices?.[0]?.message?.content || null;
        } catch (e) {
            console.error(`[OpenRouter API Error] (${model}):`, e.response?.data || e.message);
            return null;
        }
    }
}

function extractJSON(text) {
    if (!text) return null;

    let processed = text.trim();
    
    // Remove markdown code fences if present (```json ... ```)
    if (processed.startsWith("```")) {
        processed = processed.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
    }

    try {
        return JSON.parse(processed);
    } catch (_) {
        // Fallback: extract outermost `{...}` or `[...]`
        const objMatch = processed.match(/\{[\s\S]*\}/);
        const arrMatch = processed.match(/\[[\s\S]*\]/);
        
        let extracted = processed;
        if (objMatch && arrMatch) {
           extracted = objMatch[0].length > arrMatch[0].length ? objMatch[0] : arrMatch[0];
        } else if (objMatch) {
           extracted = objMatch[0];
        } else if (arrMatch) {
           extracted = arrMatch[0];
        }

        try {
            return JSON.parse(extracted);
        } catch (e) {
            console.error("[extractJSON Failure]: JSON.parse failed on extracted string:", extracted.substring(0, 100) + "...");
            return null;
        }
    }
}

async function getLlmRoadmap(apiKey, topic) {
    const prompt = `Create a 6-step learning roadmap for: "${topic}". Return ONLY a valid JSON array of 6 strings. No extra text.`;
    const raw = await callLLM(apiKey, prompt, null, 0.3, 2000, true);
    const result = extractJSON(raw);
    return Array.isArray(result) ? result : [];
}

async function getContent(apiKey, topic, subtopic) {
    const prompt = `Write a concise tutorial for "${subtopic}" in "${topic}". Use Markdown. Include abstract concepts, bullet points, and code if relevant. Maximum 400 words.`;
    const res = await callLLM(apiKey, prompt, null, 0.4, 4000, false);
    return res || "Error generating content.";
}

async function generateQuiz(apiKey, topic, subtopic) {
    const prompt = `You are creating an immersive, scenario-based quiz for "${subtopic}" in the course "${topic}".
Make questions feel like real-world challenges — use storytelling, practical scenarios, debugging situations, thought experiments. NOT dry textbook questions.

Return ONLY a valid JSON object:
{
  "scenario": "2-3 sentence immersive mission scenario setting the stage for all questions.",
  "questions": [
    {
      "question": "Engaging scenario-based question?",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "correct": "A",
      "explanation": "2-3 sentence explanation of WHY this answer is correct, what concept it tests, and a practical tip the student should remember.",
      "correct_insight": "1 sentence deeper insight or real-world application for students who got it right."
    }
  ]
}

Rules: exactly 5 questions, correct is just A/B/C/D, options start with A./B./C./D., mix conceptual+applied+analytical, progressively harder.`;

    const raw = await callLLM(apiKey, prompt, null, 0.6, 8192, true);
    let result = extractJSON(raw);
    
    // Auto-fix if LLM wrapped it inside a root "quiz" key
    if (result && result.quiz && Array.isArray(result.quiz.questions)) {
        result = result.quiz;
    }

    if (result && typeof result === 'object' && Array.isArray(result.questions)) {
        return { scenario: result.scenario || "", questions: result.questions.slice(0, 5) };
    }
    
    if (Array.isArray(result)) {
        return { scenario: "", questions: result.slice(0, 5) };
    }
    
    console.error(`[generateQuiz Parse Failure]: Could not find 'questions' array in JSON object.`);
    return { scenario: "", questions: [] };
}

async function analyzeKnowledgeGaps(apiKey, allResults) {
    if (!allResults || allResults.length === 0) {
        return { gaps: [], strengths: [], recommendation: "Take some quizzes first." };
    }
    const prompt = `Analyze this student's quiz performance and identify knowledge gaps and strengths.
Quiz History: ${JSON.stringify(allResults, null, 2)}
Return ONLY a valid JSON object:
{"gaps": ["weak subtopics (score < 60%)"], "strengths": ["strong subtopics (score > 80%)"], "recommendation": "2-3 sentence personalized study tip"}`;

    const raw = await callLLM(apiKey, prompt, null, 0.3, 2000, true);
    const result = extractJSON(raw);
    return (result && typeof result === 'object' && result.gaps) ? result : { gaps: [], strengths: [], recommendation: "Unable to analyze." };
}

async function adaptRoadmapModule(apiKey, topic, subtopic, failedQuestions) {
    const questionsText = failedQuestions.map(q => q.question).join(', ');
    const prompt = `The student struggled with some concepts in "${subtopic}" for the course "${topic}".
Failed questions: ${questionsText}

Provide a short, specific module name to add to the roadmap. Focus on the core foundational concepts they missed.
Return ONLY JSON: {"new_module": "Module Name"}`;

    const raw = await callLLM(apiKey, prompt, null, 0.4, 1000, true);
    const res = extractJSON(raw);
    if (res && typeof res === 'object' && res.new_module) {
        return res.new_module;
    }
    return `Review: ${subtopic} Foundational Concepts`;
}

module.exports = {
    getLlmRoadmap,
    getContent,
    generateQuiz,
    analyzeKnowledgeGaps,
    adaptRoadmapModule
};
