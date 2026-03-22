import Redis from "ioredis";
import crypto from "crypto";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Lazy initialization for Redis to avoid connection errors if not available
let redisInstance: Redis | null = null;

export function getRedis() {
    if (!redisInstance) {
        try {
            redisInstance = new Redis(REDIS_URL, {
                maxRetriesPerRequest: 1,
                connectTimeout: 2000,
            });
            redisInstance.on("error", (err) => console.warn("Redis Error:", err.message));
        } catch (e) {
            console.warn("Could not connect to Redis, caching disabled.");
        }
    }
    return redisInstance;
}

/**
 * Generates a semantic cache key based on the query and user profile.
 */
export function generateCacheKey(query: string, profile: string = "general"): string {
    const normalized = query.toLowerCase().trim().replace(/\s+/g, " ");
    const hash = crypto.createHash("sha256").update(`${normalized}:${profile}`).digest("hex");
    return `rag_cache:${hash}`;
}

/**
 * Attempts to retrieve a cached response.
 */
export async function getCachedResponse(query: string, profile: string = "general"): Promise<any | null> {
    const redis = getRedis();
    if (!redis) return null;

    try {
        const key = generateCacheKey(query, profile);
        const cached = await redis.get(key);
        if (cached) {
            console.log(`[CACHE HIT] Found response for: "${query.substring(0, 30)}..."`);
            return JSON.parse(cached);
        }
    } catch (e) {
        console.warn("Cache read error:", e);
    }
    return null;
}

/**
 * Saves a response to the semantic cache.
 */
export async function setCachedResponse(query: string, response: any, profile: string = "general", ttl: number = 3600 * 24) {
    const redis = getRedis();
    if (!redis) return;

    try {
        const key = generateCacheKey(query, profile);
        await redis.set(key, JSON.stringify(response), "EX", ttl);
        console.log(`[CACHE SET] Response saved for: "${query.substring(0, 30)}..."`);
    } catch (e) {
        console.warn("Cache write error:", e);
    }
}
/**
 * Basic IP-based Rate Limiter (Fixed Window)
 */
export async function isRateLimited(ip: string, limit: number = 5, windowSeconds: number = 60): Promise<boolean> {
    const redis = getRedis();
    if (!redis) return false; // Fail-open for UX, though ideally should be fail-closed for security

    const key = `ratelimit:ip:${ip}`;
    try {
        const current = await redis.incr(key);
        if (current === 1) {
            await redis.expire(key, windowSeconds);
        }
        
        if (current > limit) {
            console.warn(`[RATE LIMIT] IP ${ip} exceeded limit (${current}/${limit})`);
            return true;
        }
    } catch (e) {
        console.warn("Rate limit check error:", e);
    }
    return false;
}
