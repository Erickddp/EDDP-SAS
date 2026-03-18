import { query } from "./db";

export interface UsageMetric {
    userId?: string;
    conversationId: string;
    promptTokens: number;
    completionTokens: number;
    model: string;
    durationMs: number;
    status: 'success' | 'error';
    errorMessage?: string;
    ipAddress?: string;
}

export async function logUsage(metric: UsageMetric) {
    try {
        await query(
            `INSERT INTO usage_logs 
            (user_id, conversation_id, prompt_tokens, completion_tokens, model_version, execution_time_ms, status, error_message, ip_address)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
                metric.userId || null,
                metric.conversationId,
                metric.promptTokens,
                metric.completionTokens,
                metric.model,
                metric.durationMs,
                metric.status,
                metric.errorMessage || null,
                metric.ipAddress || null
            ]
        );
    } catch (error) {
        console.error("Failed to log usage:", error);
    }
}

export async function logError(context: string, error: any) {
    console.error(`[TELEMETRY] Error in ${context}:`, error);
    // Potential extension: send to Sentry or similar service
}
