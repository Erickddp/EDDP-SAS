import { query, getClient } from "../lib/db";
import crypto from "crypto";

// Cargar variables de entorno locales si existen, o fallback al proceso
import * as dotenv from 'dotenv';
dotenv.config();

async function testSubscription() {
    console.log("=== INICIANDO PRUEBA DE WEBHOOK (SIMULACIÓN DE PAGO) ===");
    
    try {
        // 1. Obtener usuario de prueba
        const { rows } = await query("SELECT id, email FROM users ORDER BY created_at DESC LIMIT 1", []);
        if (rows.length === 0) {
            throw new Error("No hay usuarios en la base de datos para probar");
        }
        const testUser = rows[0];
        console.log(`👤 Usuario seleccionado: ${testUser.email} (ID: ${testUser.id})`);

        // 2. Construir el payload de Stripe
        // Nota: Asegúrate de que este archivo .env esté recargado o usa la variable definida
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_L6e6deaAsYBTIUS7e0T2ZBjK2XJoek1g";
        const payload = JSON.stringify({
            id: 'evt_test_webhook_' + Date.now(),
            object: 'event',
            type: 'checkout.session.completed',
            data: {
                object: {
                    client_reference_id: testUser.id,
                    subscription: 'sub_test_payment_123'
                }
            }
        });

        // Generar firma de Stripe (Signature)
        const timestamp = Math.floor(Date.now() / 1000);
        const payloadToSign = `${timestamp}.${payload}`;
        const signature = crypto.createHmac('sha256', webhookSecret).update(payloadToSign).digest('hex');
        const header = `t=${timestamp},v1=${signature}`;

        console.log("🚀 Enviando Webhook firmado a http://localhost:3000/api/billing/webhook...");
        
        // 3. Enviar HTTP Request al servidor de desarrollo local
        const res = await fetch("http://localhost:3000/api/billing/webhook", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "stripe-signature": header
            },
            body: payload
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("❌ Falló el Webhook:", res.status, errorText);
            process.exit(1);
        }
        
        console.log("✅ Webhook respondido con 200 OK");
        console.log("⏳ Esperando 1 segundo para sincronización de BD...");
            
        // 4. Verificar base de datos
        // Darle tiempo para la transacción BD en la API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { rows: subRows } = await query(
            `SELECT plan_type, status, current_period_end FROM subscriptions WHERE user_id = $1 LIMIT 1`,
            [testUser.id]
        );
        
        if (subRows.length > 0 && subRows[0].plan_type === 'pro') {
            console.log(`🎉 ÉXITO: El usuario ahora es PRO`);
            console.log(`   🔸 Estado: ${subRows[0].status}`);
            console.log(`   🔸 Expiración: ${subRows[0].current_period_end}`);
        } else {
            console.error("❌ FALLO: El plan del usuario no se actualizó", subRows[0]);
        }
    } catch (error) {
        console.error("❌ Ocurrió un error en el script:", error);
    } finally {
        process.exit(0);
    }
}

testSubscription();
