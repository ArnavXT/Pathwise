const os = require('os');
const fs = require('fs');
const path = require('path');

const BUNDLED_DB_PATH = path.join(__dirname, '..', 'data', 'data.json');
const WRITABLE_DB_PATH = path.join(os.tmpdir(), 'pathwise_data.json');

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

// In-memory fallback
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

    // 1. Try writable temporary path (updated during runtime / resets)
    try {
        if (fs.existsSync(WRITABLE_DB_PATH)) {
            const data = fs.readFileSync(WRITABLE_DB_PATH, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.warn("Writable temp path read error:", e.message);
    }

    // 2. Try bundled initial file
    try {
        if (fs.existsSync(BUNDLED_DB_PATH)) {
            const data = fs.readFileSync(BUNDLED_DB_PATH, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.warn("Bundled path read error:", e.message);
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

    inMemoryData = data;

    // Write to writable temp directory (always works on Vercel serverless /tmp and locally)
    try {
        fs.writeFileSync(WRITABLE_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
        console.warn("Could not write to temp directory:", e.message);
    }

    // Also attempt writing to bundled location if writable (e.g. local development)
    try {
        fs.writeFileSync(BUNDLED_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (_) {
        // Silently ignore EROFS in read-only production environments
    }
}

module.exports = { readDB, writeDB, defaultData };
