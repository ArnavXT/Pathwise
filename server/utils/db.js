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

let redisClient = null;

function getRedisClient() {
    if (redisClient) return redisClient;
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

    if (url && token) {
        try {
            const { Redis } = require('@upstash/redis');
            redisClient = new Redis({ url, token });
            return redisClient;
        } catch (e) {
            console.error("Failed to initialize @upstash/redis client:", e.message);
        }
    }
    return null;
}

// In-memory fallback if filesystem is read-only and no Redis
let inMemoryData = null;

async function readDB() {
    const redis = getRedisClient();
    if (redis) {
        try {
            const data = await redis.get('pathwise_db');
            if (data) {
                return typeof data === 'string' ? JSON.parse(data) : data;
            }
            await redis.set('pathwise_db', defaultData);
            return defaultData;
        } catch (e) {
            console.error("Error reading from Redis:", e.message);
        }
    }

    try {
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.warn("Filesystem read failed, using memory fallback:", e.message);
    }

    if (!inMemoryData) {
        inMemoryData = JSON.parse(JSON.stringify(defaultData));
    }
    return inMemoryData;
}

async function writeDB(data) {
    const redis = getRedisClient();
    if (redis) {
        try {
            await redis.set('pathwise_db', data);
            return;
        } catch (e) {
            console.error("Error writing to Redis:", e.message);
        }
    }

    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
        return;
    } catch (e) {
        console.warn("Filesystem write failed (read-only environment), keeping in memory:", e.message);
        inMemoryData = data;
    }
}

module.exports = { readDB, writeDB, defaultData };
