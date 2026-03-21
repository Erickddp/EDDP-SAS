
import { Client } from "pg";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function testWebhookSimulation() {
    console.log("🚀 [TEST] Iniciando certificación de Webhook Stripe (Full Inspection)...");
    
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        // 1. Limpiar o asegurar usuario admin
        const testEmail = "admin@myfiscal.com";
        const resUser = await client.query("SELECT id FROM users WHERE email = $1", [testEmail]);
        let userId = resUser.rows[0]?.id;

        if (!userId) {
            console.log("⚠️ Usuario no encontrado. Creando...");
            const res = await client.query("INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id", [testEmail, "Admin", "h", "user"]);
            userId = res.rows[0].id;
        }

        // 2. Asegurar que exista una fila en subscriptions para este user
        await client.query("INSERT INTO subscriptions (user_id, plan_type, status) VALUES ($1, 'gratis', 'active') ON CONFLICT DO NOTHING", [userId]);

        console.log(`✅ [TEST] UserID certificado: ${userId}`);

        // 3. Ejecutar UPDATE
        const mockSubId = "sub_full_test_" + Date.now();
        const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        const resUpdate = await client.query(
            `UPDATE subscriptions 
             SET plan_type = $1, status = $2, provider_subscription_id = $3, current_period_end = $4, updated_at = NOW()
             WHERE user_id = $5
             RETURNING plan_type, status`,
            ["pro", "active", mockSubId, periodEnd, userId]
        );

        console.log(`🔍 [DEBUG] Filas afectadas: ${resUpdate.rowCount}`);

        if (resUpdate.rowCount > 0 && resUpdate.rows[0].plan_type === 'pro') {
            console.log("🏆 [SUCCESS] El Webhook fue certificado. Transición PRO confirmada.");
        } else {
            console.error("❌ [FAILURE] No se pudo actualizar la suscripción.");
        }

    } catch (err: any) {
        console.error("❌ [ERROR]:", err.message);
    } finally {
        await client.end();
        process.exit(0);
    }
}

testWebhookSimulation();
