import Redis from "ioredis";
import crypto from "crypto";

const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || "";

// Lazy initialization for Redis to avoid connection errors if not available
let redisInstance: Redis | null = null;
let connectionFailed = false;

export function getRedis() {
    if (connectionFailed) return null;
    if (!REDIS_URL) {
        if (!redisInstance) {
            console.warn("[REDIS] No configurado (REDIS_URL faltante) - Modo Bypass activado.");
            connectionFailed = true;
        }
        return null;
    }

    if (!redisInstance) {
        try {
            redisInstance = new Redis(REDIS_URL, {
                maxRetriesPerRequest: 0, // No reintentos infinitos para evitar bloqueos
                connectTimeout: 1000,    // Timeouts agresivos para no degradar el chat
                enableOfflineQueue: false, // No encolar si está offline
            });

            redisInstance.on("error", (err) => {
                // Solo loguear una vez para no saturar la consola
                if (!connectionFailed) {
                    console.warn(`[REDIS] Error de conexión: ${err.message}. Modo Bypass activado.`);
                    connectionFailed = true;
                }
            });
        } catch (e) {
            console.warn("[REDIS] Excepción al inicializar cliente. Avanzando sin caché.");
            connectionFailed = true;
            return null;
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
    try {
        const redis = getRedis();
        if (!redis) return null;

        const key = generateCacheKey(query, profile);
        const cached = await redis.get(key);
        if (cached) {
            console.log(`[CACHE HIT] Found response for: "${query.substring(0, 30)}..."`);
            return JSON.parse(cached);
        }
    } catch (e) {
        // Fail-open: no lanzamos error al usuario
    }
    return null;
}

/**
 * Saves a response to the semantic cache.
 */
export async function setCachedResponse(query: string, response: any, profile: string = "general", ttl: number = 3600 * 24) {
    try {
        const redis = getRedis();
        if (!redis) return;

        const key = generateCacheKey(query, profile);
        await redis.set(key, JSON.stringify(response), "EX", ttl);
        console.log(`[CACHE SET] Response saved for: "${query.substring(0, 30)}..."`);
    } catch (e) {
        // Silencioso para no romper la experiencia
    }
}

/**
 * Basic IP-based Rate Limiter (Fixed Window)
 */
export async function isRateLimited(ip: string, limit: number = 5, windowSeconds: number = 60): Promise<boolean> {
    try {
        const redis = getRedis();
        if (!redis) return false; // Fail-open for UX

        const key = `ratelimit:ip:${ip}`;
        const current = await redis.incr(key);
        if (current === 1) {
            await redis.expire(key, windowSeconds);
        }
        
        if (current > limit) {
            console.warn(`[RATE LIMIT] IP ${ip} excedió límite (${current}/${limit})`);
            return true;
        }
    } catch (e) {
        // Si Redis falla, permitimos la consulta para no bloquear usuarios legítimos
    }
    return false;
}
