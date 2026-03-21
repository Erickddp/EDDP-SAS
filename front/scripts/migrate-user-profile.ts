
import { query } from "../lib/db";

async function runMigration() {
    console.log("🚀 [MIGRATION] Agregando columna 'professional_profile' a la tabla 'users'...");
    try {
        await query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS professional_profile TEXT;
        `);
        console.log("✅ [SUCCESS] Columna agregada o ya existía.");
    } catch (e) {
        console.error("❌ [ERROR] Falló la migración:", e);
    } finally {
        process.exit(0);
    }
}

runMigration();
