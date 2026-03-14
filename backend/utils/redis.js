import { createClient } from "redis";
import { env } from "./env.js";

const redis = createClient({ url: env.REDIS_URL });

redis.on("error", (error) => {
    console.error("Redis client error:", error);
});

let redisConnectionPromise;

export async function ensureRedisConnection() {
    if (redis.isOpen) {
        return;
    }

    if (!redisConnectionPromise) {
        redisConnectionPromise = redis.connect().catch((error) => {
            redisConnectionPromise = undefined;
            throw error;
        });
    }

    await redisConnectionPromise;
}

export { redis };
