
import { query } from "../lib/db";

async function forceProForTester() {
    const testerUuid = "f40076a0-e349-4b7e-9b5c-a6a0f3788cf4";
    console.log(`🛠️ [SCRIPT] Forzando plan 'pro' para UUID: ${testerUuid}`);

    try {
        // 1. Verificar si el usuario existe (si no, fallar amablemente)
        const userRes = await query(`SELECT id FROM users WHERE id = $1`, [testerUuid]);
        if (userRes.rowCount === 0) {
            console.log(`⚠️  Usuario ${testerUuid} no existe en la tabla 'users'. Creándolo como admin...`);
            await query(
                `INSERT INTO users (id, email, name, role) 
                 VALUES ($1, 'tester@sasfiscal.com', 'Smoke Tester', 'admin')`,
                [testerUuid]
            );
        }

        // 2. Upsert Subscription (Manual check to avoid ON CONFLICT constraints issues)
        const subRes = await query(`SELECT id FROM subscriptions WHERE user_id = $1`, [testerUuid]);
        if (subRes.rowCount > 0) {
            console.log("Updating existing subscription...");
            await query(
                `UPDATE subscriptions SET plan_type = 'pro', status = 'active' WHERE user_id = $1`,
                [testerUuid]
            );
        } else {
            console.log("Creating new pro subscription...");
            await query(
                `INSERT INTO subscriptions (user_id, plan_type, status) VALUES ($1, 'pro', 'active')`,
                [testerUuid]
            );
        }

        // 3. Upsert Usage Counter
        const usageRes = await query(`SELECT user_id FROM user_usage_counters WHERE user_id = $1`, [testerUuid]);
        if (usageRes.rowCount > 0) {
            await query(`UPDATE user_usage_counters SET current_month_count = 0 WHERE user_id = $1`, [testerUuid]);
        } else {
            await query(`INSERT INTO user_usage_counters (user_id, current_month_count) VALUES ($1, 0)`, [testerUuid]);
        }

        console.log("✅ [SUCCESS] Tester ahora tiene plan PRO y contador en 0.");
    } catch (e) {
        console.error("❌ [ERROR] No se pudo actualizar el plan del tester:", e);
    } finally {
        process.exit(0);
    }
}

forceProForTester();
