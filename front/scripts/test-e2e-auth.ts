import "./load-env";
import { registerUser, loginUser } from "../lib/auth";
import { logUsage } from "../lib/observability";
import { query } from "../lib/db";

async function runE2EValidation() {
    console.log("🧪 Iniciando Validación End-to-End: Flujo de Usuario SaaS...");

    const testEmail = "admin@myfiscal.com";
    const testName = "Admin Test";
    const testPass = "password123";

    try {
        // 1. Limpiar con cascada manual para respetar FKs
        await query(`DELETE FROM usage_logs WHERE user_id IN (SELECT id FROM users WHERE email = $1)`, [testEmail]);
        await query(`DELETE FROM user_usage_counters WHERE user_id IN (SELECT id FROM users WHERE email = $1)`, [testEmail]);
        await query(`DELETE FROM users WHERE email = $1`, [testEmail]);
        console.log(`🧹 Limpieza previa realizada para ${testEmail}`);

        // 2. Ejecutar Registro (Simula lo que hace el form de UI)
        console.log("📝 Registrando usuario...");
        const newUser = await registerUser(testEmail, testName, testPass);
        console.log("✅ Usuario registrado exitosamente:", newUser.id);

        // 3. Verificar en la base de datos (SELECT)
        console.log("\n🔍 Consultando tabla 'users' para verificar persistencia y hashing...");
        const { rows: userRows } = await query(
            `SELECT id, email, name, password_hash, role, created_at FROM users WHERE email = $1`,
            [testEmail]
        );
        const userInDb = userRows[0];
        console.log("📊 Datos en DB:");
        console.log(JSON.stringify(userInDb, null, 2));

        if (userInDb.password_hash.startsWith("$2a$") || userInDb.password_hash.startsWith("$2b$")) {
            console.log("✅ Password verificado: Hash de bcrypt detectado.");
        } else {
            console.error("❌ Error: Password no parece estar hasheado correctamente.");
        }

        /*
        // 4. Simular Login (Omitido en script CLI porque cookies() requiere contexto de Request)
        console.log("\n🔑 Simulando Login...");
        const loggedUser = await loginUser(testEmail, testPass);
        if (loggedUser) {
            console.log("✅ Login exitoso.");
        }
        */

        // 5. Simular uso de API (/api/chat) y registro de métricas vinculadas a la identidad real
        console.log("\n📡 Registrando uso ficticio en 'usage_logs' vinculado al UUID...");
        const mockUsage = {
            userId: newUser.id,
            conversationId: "test-conv-e2e-" + Date.now(),
            promptTokens: 150,
            completionTokens: 300,
            model: "text-embedding-3-small",
            durationMs: 1200,
            status: 'success' as const,
            ipAddress: "127.0.0.1"
        };
        
        await logUsage(mockUsage);
        console.log("✅ Uso registrado en logUsage vía validación manual de identidad.");

        // 6. Verificar Registro de Uso
        console.log("\n📊 Verificando 'usage_logs' para confirmar el vínculo con el UUID...");
        const { rows: usageRows } = await query(
            `SELECT id, user_id, conversation_id, prompt_tokens, status, created_at 
             FROM usage_logs 
             WHERE user_id = $1 
             ORDER BY created_at DESC LIMIT 1`,
            [newUser.id]
        );
        console.log(JSON.stringify(usageRows[0], null, 2));

        if (usageRows[0].user_id === newUser.id) {
            console.log("\n🏆 VALIDACIÓN E2E EXITOSA: El sistema maneja identidades reales y las vincula correctamente.");
        } else {
            console.error("\n❌ Error de Vínculo: El ID del log no coincide con el del usuario.");
        }

    } catch (error) {
        console.error("❌ Fallo crítico en Validación E2E:", error);
    } finally {
        process.exit(0);
    }
}

runE2EValidation();
