import "./load-env";
import { query } from "../lib/db";

async function runMigration() {
    console.log("🛠 Creating 'user_preferences' table...");
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS user_preferences (
                user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                expertise_level TEXT DEFAULT 'principiante',
                preferred_tone TEXT DEFAULT 'explicativo',
                industry_context TEXT,
                additional_context TEXT,
                is_profile_complete BOOLEAN DEFAULT FALSE,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log("✅ Table created or already existed.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
