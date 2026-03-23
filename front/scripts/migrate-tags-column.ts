import "./load-env"; // Current dir is scripts/
import { query } from "../lib/db";

async function runMigration() {
    console.log("🛠 Checking for 'tags' column in 'conversations' table...");
    try {
        await query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name='conversations' AND column_name='tags') THEN
                    ALTER TABLE conversations ADD COLUMN tags TEXT[];
                    RAISE NOTICE 'Added tags column to conversations table';
                ELSE
                    RAISE NOTICE 'tags column already exists';
                END IF;
            END $$;
        `);
        console.log("✅ Migration successful (or already applied).");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
