import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { CONFIG } from "@/lib/env-config";

export async function GET() {
    const startTime = Date.now();
    const checks: Record<string, any> = {
        timestamp: new Date().toISOString(),
        env: CONFIG.NODE_ENV,
    };

    try {
        // 1. Check Database
        const dbStart = Date.now();
        await query("SELECT 1");
        checks.database = {
            status: "ok",
            latencyMs: Date.now() - dbStart
        };

        // 2. Check OpenAI Configuration
        checks.openai = {
            status: CONFIG.OPENAI_API_KEY ? "configured" : "missing",
            model: CONFIG.OPENAI_MODEL
        };

        // 3. Check Session Secret
        checks.session = {
            status: CONFIG.SESSION_SECRET ? "configured" : "missing",
            isFallback: CONFIG.SESSION_SECRET === 'dev-secret-key-change-me' && CONFIG.NODE_ENV === 'production'
        };

        const status = (checks.database.status === "ok" && CONFIG.OPENAI_API_KEY) ? 200 : 503;

        return NextResponse.json({
            status: status === 200 ? "healthy" : "degraded",
            checks,
            uptimeMs: Date.now() - startTime
        }, { status });

    } catch (error: any) {
        return NextResponse.json({
            status: "unhealthy",
            error: error.message,
            checks
        }, { status: 500 });
    }
}
