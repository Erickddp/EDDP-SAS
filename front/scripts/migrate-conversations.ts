import "./load-env";
import { query } from "../lib/db";

async function migrateConversations() {
    console.log("🚀 Starting Conversations Migration...");

    try {
        // 1. Conversations Table
        console.log("Creating 'conversations' table...");
        await query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                mode TEXT NOT NULL,
                detail_level TEXT NOT NULL,
                archived BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // 2. Messages Table
        console.log("Creating 'messages' table...");
        await query(`
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT REFERENCES conversations(id) ON DELETE CASCADE,
                role TEXT NOT NULL,
                content JSONB NOT NULL,
                sources JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `);

        // 3. Add Index for faster lookup
        await query(`CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id)`);

        console.log("✅ Conversations migration completed successfully!");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrateConversations();
