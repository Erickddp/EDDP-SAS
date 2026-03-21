
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { query } from "../lib/db";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const API_URL = "http://localhost:3000/api/chat";
const TESTER_UUID = "f40076a0-e349-4b7e-9b5c-a6a0f3788cf4";

async function updateProfile(profile: string) {
    await query(`UPDATE users SET professional_profile = $1 WHERE id = $2`, [profile, TESTER_UUID]);
    console.log(`👤 [PROFILE] Usuario actualizado a: ${profile}`);
}

async function testProfiles() {
    const profiles = ["entrepreneur", "accountant"];
    const queryStr = "¿Qué pasa si no presento la declaración anual?";

    console.log(`🚀 [TEST] Comparando perfiles para la consulta: "${queryStr}"\n`);

    for (const profile of profiles) {
        await updateProfile(profile);
        console.log(`--- SIMULANDO PERFIL: ${profile.toUpperCase()} ---`);
        try {
            const response = await axios.post(API_URL, {
                message: queryStr,
                userId: TESTER_UUID,
                conversationId: `test-${profile}-${Date.now()}`,
                mode: "profesional",
                detailLevel: "detallada",
            }, {
                headers: { 
                    "x-test-bypass": process.env.SESSION_SECRET 
                }
            });


            const data = response.data;
            console.log(`✅ Respuesta recibida.`);
            console.log(`📝 Resumen (${profile}):\n   ${data.answer.summary}\n`);
            
            const exp = data.answer.explanation;
            console.log(`🔍 Análisis de Estilo:`);
            console.log(`   - Longitud: ${exp.length} caracteres`);
            console.log(`   - Contiene pasos/viñetas? ${exp.includes("-") || exp.includes("1.") ? "SÍ" : "NO"}`);
            const technicalTerms = ["fracción", "inciso", "sujeto", "objeto", "tasa"];
            const foundTechnical = technicalTerms.filter(t => exp.toLowerCase().includes(t));
            console.log(`   - Términos técnicos detectados: [${foundTechnical.join(", ")}]`);
            console.log(`   - Citas vinculadas: ${data._debug?.citationsCount || 0}`);
            console.log(`\n${"=".repeat(50)}\n`);
        } catch (e: any) {
            console.error(`❌ Error testing ${profile}:`, e.response?.data || e.message);
        }
    }
}


// We need a way to tell the API to use a specific profile for the test.
// Let's modify the route.ts briefly or use the DB. 
// Simpler: a small helper script to update DB before each call.
testProfiles();
