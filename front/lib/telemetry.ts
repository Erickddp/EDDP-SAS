/**
 * Structural Telemetry and APM Layer
 */

interface TelemetryEvent {
    operation: string;
    durationMs: number;
    metadata?: Record<string, any>;
    status: "success" | "error" | "slow";
}

const PERFORMANCE_THRESHOLDS: Record<string, number> = {
    "vectorization": 1500,
    "postgresql_retrieval": 2000,
    "llm_generation": 8000,
    "embedding": 1000,
};

export async function measureOperation<T>(
    operation: string,
    execute: () => Promise<T>,
    metadata?: Record<string, any>
): Promise<T> {
    const start = Date.now();
    try {
        const result = await execute();
        const duration = Date.now() - start;
        
        logTelemetry({
            operation,
            durationMs: duration,
            status: duration > (PERFORMANCE_THRESHOLDS[operation] || 5000) ? "slow" : "success",
            metadata
        });
        
        return result;
    } catch (error) {
        const duration = Date.now() - start;
        logTelemetry({
            operation,
            durationMs: duration,
            status: "error",
            metadata: { ...metadata, error: (error as Error).message }
        });
        throw error;
    }
}

function logTelemetry(event: TelemetryEvent) {
    const { operation, durationMs, status, metadata } = event;
    const timestamp = new Date().toISOString();
    
    let color = "\x1b[32m"; // green
    if (status === "slow") color = "\x1b[33m"; // yellow
    if (status === "error") color = "\x1b[31m"; // red

    const reset = "\x1b[0m";

    console.log(`${color}[TELEMETRY] ${timestamp} | OP: ${operation.padEnd(20)} | DUR: ${durationMs.toString().padStart(5)}ms | STATUS: ${status.toUpperCase()}${reset}`);

    if (status === "slow") {
        console.warn(`[PERF ALERT] ${operation} took ${durationMs}ms which exceeds threshold of ${PERFORMANCE_THRESHOLDS[operation] || 5000}ms.`);
    }

    if (status === "error") {
        console.error(`[SYS ALERT] ${operation} failed after ${durationMs}ms. Metadata:`, metadata);
    }
    
    // Future: Push to Sentry/Datadog here
    // monitoring.track(operation, durationMs, status, metadata);
}
