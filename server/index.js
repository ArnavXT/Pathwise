const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { readDB, writeDB } = require('./utils/db');
const { getLlmRoadmap, getContent, generateQuiz, analyzeKnowledgeGaps, adaptRoadmapModule } = require('./services/aiService');

dotenv.config({ path: path.join(__dirname, '..', '.env') }); // Load .env from root

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const DEV_PASSWORD = process.env.DEV_PASSWORD || "pathwise_dev_2024";

// Utility to get current user state (using a single 'dev1' user for now)
async function getUserState() {
    const db = await readDB();
    if (!db.users || !db.users.dev1) {
        if (!db.users) db.users = {};
        db.users.dev1 = {
            xp: 0,
            earned_badges: [],
            quizzes_taken: [],
            course_title: '',
            roadmap: [],
            generated_content: {},
            knowledge_gaps: [],
            strengths: [],
            gap_recommendation: ''
        };
    }
    return db.users.dev1;
}

async function saveUserState(state) {
    const db = await readDB();
    if (!db.users) db.users = {};
    db.users.dev1 = state;
    await writeDB(db);
}

// Dev Auth
app.post('/api/auth', (req, res) => {
    const { password } = req.body;
    if (password === DEV_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Invalid password" });
    }
});

// App State
app.get('/api/state', async (req, res) => {
    try {
        const state = await getUserState();
        res.json(state);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/state/reset', async (req, res) => {
    try {
        const state = await getUserState();
        Object.assign(state, {
            xp: 0,
            earned_badges: [],
            quizzes_taken: [],
            course_title: '',
            roadmap: [],
            generated_content: {},
            knowledge_gaps: [],
            strengths: [],
            gap_recommendation: ''
        });
        await saveUserState(state);
        res.json({ success: true, state });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Gamification Utils & Badges (Ported constants)
const XP_PER_MODULE = 100;
const XP_PER_QUIZ = 50;
const XP_BONUS_GOOD = 20;
const XP_BONUS_PERFECT = 50;

app.post('/api/course/generate', async (req, res) => {
    const { topic, apiKey } = req.body;
    const key = apiKey || process.env.OPENROUTER_API_KEY;
    if (!key) return res.status(400).json({ error: "Missing API Key" });

    try {
        const roadmap = await getLlmRoadmap(key, topic);
        if (roadmap && roadmap.length > 0) {
            const state = await getUserState();
            state.course_title = topic;
            state.roadmap = roadmap;
            state.generated_content = {};
            await saveUserState(state);
            res.json({ success: true, roadmap });
        } else {
            res.status(500).json({ error: "Failed to generate roadmap" });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/course/module', async (req, res) => {
    const { moduleName, apiKey } = req.body;
    const key = apiKey || process.env.OPENROUTER_API_KEY;
    try {
        const state = await getUserState();
        const content = await getContent(key, state.course_title, moduleName);
        state.generated_content[moduleName] = content;
        state.xp += XP_PER_MODULE;
        await saveUserState(state);
        res.json({ success: true, content, xp: state.xp });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/quiz/generate', async (req, res) => {
    const { moduleName, apiKey } = req.body;
    const key = apiKey || process.env.OPENROUTER_API_KEY;
    try {
        const state = await getUserState();
        const quiz = await generateQuiz(key, state.course_title, moduleName);
        res.json({ success: true, quiz });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/quiz/submit', async (req, res) => {
    const { moduleName, answers, questions, apiKey } = req.body;
    const key = apiKey || process.env.OPENROUTER_API_KEY;
    let correctCount = 0;
    const wrongTopics = [];

    questions.forEach((q, i) => {
        if (answers[i] === q.correct) {
            correctCount++;
        } else {
            wrongTopics.push(moduleName);
        }
    });

    const total = questions.length;
    const scorePct = Math.round((correctCount / total) * 100);
    let xpEarned = XP_PER_QUIZ;
    if (scorePct === 100) xpEarned += XP_BONUS_PERFECT;
    else if (scorePct >= 80) xpEarned += XP_BONUS_GOOD;

    const state = await getUserState();
    state.xp += xpEarned;
    state.quizzes_taken.push({
        topic: state.course_title,
        subtopic: moduleName,
        score: scorePct,
        wrong_topics: wrongTopics
    });

    // Handle Adaptive logic
    let analysis = null;
    let newModule = null;
    try {
        analysis = await analyzeKnowledgeGaps(key, state.quizzes_taken);
        if (analysis) {
            state.knowledge_gaps = analysis.gaps || [];
            state.strengths = analysis.strengths || [];
            state.gap_recommendation = analysis.recommendation || '';
        }

        const failedQuestions = questions.filter((q, i) => answers[i] !== q.correct);
        if (scorePct < 80 && failedQuestions.length > 0) {
            newModule = await adaptRoadmapModule(key, state.course_title, moduleName, failedQuestions);
            if (newModule) {
                const idx = state.roadmap.indexOf(moduleName);
                if (idx !== -1) {
                    state.roadmap.splice(idx + 1, 0, "🔄 Adaptive: " + newModule);
                } else {
                    state.roadmap.push("🔄 Adaptive: " + newModule);
                }
            }
        }
    } catch (e) {
        console.error("Adaptive logic error:", e);
    }

    await saveUserState(state);

    res.json({
        success: true,
        result: { score: scorePct, correct: correctCount, total, xp_earned: xpEarned },
        state,
        adaptedModule: newModule
    });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
