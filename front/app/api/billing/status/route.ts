import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSubscriptionByUserId } from "@/lib/user-storage";
import { query } from "@/lib/db";
import { PLAN_LIMITS } from "@/lib/saas-constants";
import { handleApiError, AppErrorType, validatedMethod } from "@/lib/error-handler";

export async function GET(req: Request) {
    const methodError = validatedMethod(req, ["GET"]);
    if (methodError) return methodError;

    try {
        const session = await getSession();
        if (!session) {
            return handleApiError(new Error("No autorizado"), AppErrorType.AUTH);
        }

        console.log(`[Billing Status] Fetching status for user: ${session.id}`);
        const subscription = await getSubscriptionByUserId(session.id);
        
        // Get current usage
        const { rows: usageRows } = await query(
            `SELECT current_month_count FROM user_usage_counters WHERE user_id = $1`,
            [session.id]
        );
        const currentUsage = usageRows[0]?.current_month_count || 0;

        const now = new Date();
        const isPeriodValid = !subscription?.current_period_end || new Date(subscription.current_period_end) > now;
        const isStatusValid = subscription?.status === 'active' || subscription?.status === 'trialing';
        
        const effectivePlan = (isStatusValid && isPeriodValid) ? (subscription?.plan_type || "gratis") : "gratis";
        const limit = PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS]?.maxQueriesPerMonth || 10;

        return NextResponse.json({
            plan: effectivePlan,
            status: subscription?.status || "none",
            usage: {
                current: currentUsage,
                total: limit,
                remaining: Math.max(0, limit - currentUsage)
            },
            subscriptionDetails: subscription ? {
                id: subscription.id,
                currentPeriodEnd: subscription.current_period_end,
                provider: subscription.provider
            } : null,
            professionalProfile: session.professionalProfile || "entrepreneur"
        });

    } catch (error: any) {
        return handleApiError(error, AppErrorType.DATABASE);
    }
}
