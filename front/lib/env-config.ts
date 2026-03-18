/**
 * Environment Configuration Validation
 * Centralized verification of critical environment variables for Production.
 */

const getEnv = (key: string, defaultValue?: string, required = true): string => {
    const value = process.env[key] || defaultValue;
    if (required && !value) {
        // In production, we want to fail fast if critical config is missing
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`CRITICAL CONFIG ERROR: Missing required environment variable: ${key}`);
        } else {
            console.warn(`⚠️ Warning: Missing environment variable: ${key}. Using default or null.`);
        }
    }
    return value || '';
};

export const CONFIG = {
    DATABASE_URL: getEnv('DATABASE_URL'),
    OPENAI_API_KEY: getEnv('OPENAI_API_KEY'),
    OPENAI_MODEL: getEnv('OPENAI_MODEL', 'gpt-4o-mini', false),
    SESSION_SECRET: getEnv('SESSION_SECRET', process.env.NODE_ENV === 'production' ? '' : 'dev-secret-key-change-me'),
    NODE_ENV: process.env.NODE_ENV || 'development',
    STRIPE_WEBHOOK_SECRET: getEnv('STRIPE_WEBHOOK_SECRET', '', false), // Optional for now
    NEXT_PUBLIC_APP_URL: getEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000', false),
};

// Validation for Production
export function validateConfig() {
    const critical = ['DATABASE_URL', 'OPENAI_API_KEY', 'SESSION_SECRET'];
    const missing = critical.filter(key => !(CONFIG as any)[key]);
    
    if (missing.length > 0 && CONFIG.NODE_ENV === 'production') {
        throw new Error(`\n❌ FAILED TO START: Missing critical configuration:\n${missing.join('\n')}\n`);
    }
    
    console.log(`✅ Config validated for ${CONFIG.NODE_ENV} environment.`);
}
