import "./load-env";
import { query } from "../lib/db";

async function migrate() {
    console.log("🚀 Starting SaaS Infrastructure Migration...");

    try {
        // Ensure pgcrypto for UUIDs
        console.log("Ensuring pgcrypto extension...");
        await query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

        // 1. Users Table
        console.log("Creating 'users' table...");
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT,
                avatar_url TEXT,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // 2. Subscriptions Table
        console.log("Creating 'subscriptions' table...");
        await query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                plan_type TEXT NOT NULL DEFAULT 'gratis',
                status TEXT NOT NULL DEFAULT 'active',
                current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                current_period_end TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + interval '1 month'),
                stripe_customer_id TEXT UNIQUE,
                stripe_subscription_id TEXT UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // 3. Usage Logs Table
        console.log("Creating 'usage_logs' table...");
        await query(`
            CREATE TABLE IF NOT EXISTS usage_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id),
                ip_address TEXT,
                conversation_id TEXT NOT NULL,
                prompt_tokens INTEGER,
                completion_tokens INTEGER,
                model_version TEXT,
                execution_time_ms INTEGER,
                status TEXT,
                error_message TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // 4. Usage Counters Table
        console.log("Creating 'user_usage_counters' table...");
        await query(`
            CREATE TABLE IF NOT EXISTS user_usage_counters (
                user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                current_month_count INTEGER DEFAULT 0,
                last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        console.log("✅ Migration completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrate();
