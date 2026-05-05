const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'data.json');

const defaultData = {
    users: {
        dev1: {
            xp: 0,
            earned_badges: [],
            quizzes_taken: [],
            course_title: '',
            roadmap: [],
            generated_content: {}, // Maps module name to content string
            knowledge_gaps: [],
            strengths: [],
            gap_recommendation: ''
        }
    }
};

function readDB() {
    if (!fs.existsSync(DB_PATH)) {
        writeDB(defaultData);
        return defaultData;
    }
    try {
        const data = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        console.error("Error reading DB:", e);
        return defaultData;
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.error("Error writing DB:", e);
    }
}

module.exports = { readDB, writeDB, defaultData };
