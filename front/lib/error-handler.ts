import { NextResponse } from "next/server";

export enum AppErrorType {
    DATABASE = "DATABASE_ERROR",
    OPENAI = "OPENAI_ERROR",
    AUTH = "AUTH_ERROR",
    BILLING = "BILLING_ERROR",
    USAGE_LIMIT = "USAGE_LIMIT_EXCEEDED",
    VALIDATION = "VALIDATION_ERROR",
    INTERNAL = "INTERNAL_SERVER_ERROR",
}

export interface AppErrorResponse {
    error: string;
    type: AppErrorType;
    details?: string;
    limitReached?: boolean;
    remaining?: number;
    total?: number;
}

export function handleApiError(error: any, type: AppErrorType = AppErrorType.INTERNAL) {
    // Only log full error details on the server
    console.error(`[API ERROR] Type: ${type}`, {
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });

    const statusMap: Record<AppErrorType, number> = {
        [AppErrorType.DATABASE]: 500,
        [AppErrorType.OPENAI]: 502,
        [AppErrorType.AUTH]: 401,
        [AppErrorType.BILLING]: 400,
        [AppErrorType.USAGE_LIMIT]: 402,
        [AppErrorType.VALIDATION]: 400,
        [AppErrorType.INTERNAL]: 500,
    };

    const userMessageMap: Record<AppErrorType, string> = {
        [AppErrorType.DATABASE]: "Error de conexión con la base de datos",
        [AppErrorType.OPENAI]: "Error al procesar la respuesta con el motor de IA",
        [AppErrorType.AUTH]: "Sesión no válida o expirada",
        [AppErrorType.BILLING]: "Error al procesar el pago o la suscripción",
        [AppErrorType.USAGE_LIMIT]: "Límite de consultas alcanzado",
        [AppErrorType.VALIDATION]: "Datos de entrada no válidos",
        [AppErrorType.INTERNAL]: "Ocurrió un error interno en el servidor",
    };

    return NextResponse.json(
        {
            error: userMessageMap[type],
            type: type,
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: statusMap[type] || 500 }
    );
}

export function validatedMethod(req: Request, allowed: string[]) {
    if (!allowed.includes(req.method)) {
        return NextResponse.json({ error: `Método ${req.method} no permitido` }, { status: 405 });
    }
    return null;
}
