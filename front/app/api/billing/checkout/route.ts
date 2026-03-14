import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { PlanType } from "@/lib/saas-constants";
import { handleApiError, AppErrorType, validatedMethod } from "@/lib/error-handler";

export async function POST(req: Request) {
    const methodError = validatedMethod(req, ["POST"]);
    if (methodError) return methodError;

    try {
        const session = await getSession();
        if (!session) {
            return handleApiError(new Error("No autorizado"), AppErrorType.AUTH);
        }

        let body;
        try {
            body = await req.json();
        } catch (e) {
            return handleApiError(new Error("Payload JSON inválido"), AppErrorType.VALIDATION);
        }

        const { plan } = body as { plan: PlanType };

        if (!plan || plan === 'gratis') {
            return handleApiError(new Error("Plan inválido o no seleccionable"), AppErrorType.VALIDATION);
        }

        console.log(`[Billing Checkout] Creating session for user: ${session.id}, plan: ${plan}`);

        // SIMULATED FLOW for Demo/Development
        const successUrl = new URL("/chat?payment=success", req.url).toString();
        const simulatedCheckoutUrl = successUrl;

        return NextResponse.json({ 
            url: simulatedCheckoutUrl,
            message: "Simulated checkout redirect."
        });
    } catch (error: any) {
        return handleApiError(error, AppErrorType.BILLING);
    }
}
