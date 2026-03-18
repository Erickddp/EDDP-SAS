import { NextResponse } from "next/server";
import { updateSubscription } from "@/lib/user-storage";
import { handleApiError, AppErrorType, validatedMethod } from "@/lib/error-handler";

export async function POST(req: Request) {
    const methodError = validatedMethod(req, ["POST"]);
    if (methodError) return methodError;

    try {
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return handleApiError(new Error("Payload JSON inválido"), AppErrorType.VALIDATION);
        }
        
        const { type, userId, plan, status, providerSubscriptionId } = body;

        if (!type || !userId) {
            return handleApiError(new Error("Faltan campos críticos en el webhook"), AppErrorType.VALIDATION);
        }

        console.log(`[Billing Webhook] Processing event: ${type} for user: ${userId}`);

        if (type === "checkout.session.completed" || type === "invoice.paid") {
            const currentPeriodEnd = new Date();
            currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

            await updateSubscription(userId, {
                plan_type: plan || 'basic',
                status: "active",
                current_period_start: new Date(),
                current_period_end: currentPeriodEnd,
                provider: "stripe",
                provider_subscription_id: providerSubscriptionId || `sim_${Date.now()}`,
                updated_at: new Date()
            });

            console.log(`[Billing Webhook] SUCCESS: Plan ${plan} activated for user ${userId}`);
        }

        if (type === "customer.subscription.deleted" || type === "customer.subscription.updated") {
            await updateSubscription(userId, {
                status: status || "canceled",
                updated_at: new Date()
            });
            console.log(`[Billing Webhook] UPDATE: Status changed to ${status} for user ${userId}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        return handleApiError(error, AppErrorType.BILLING);
    }
}
