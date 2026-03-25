import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/session";
import { getSubscriptionByUserId } from "@/lib/user-storage";
import { handleApiError, AppErrorType } from "@/lib/error-handler";

export async function GET() {
    if (process.env.SKIP_BUILD_STATIC_GENERATION === 'true') {
        return NextResponse.json({
            plan: "gratis",
            status: "none",
            usage: { current: 0, total: 3, remaining: 3 }
        });
    }

    try {
        const session = await getSession();
        if (!session) {
            return handleApiError(new Error("No autorizado"), AppErrorType.AUTH);
        }

        const subscription = await getSubscriptionByUserId(session.id);
        
        // This logic matches your business requirements (3 daily for free, 150 for pro)
        const isPro = subscription?.plan_type === "pro" && subscription?.status === "active";
        const limit = isPro ? 150 : 3;
        const currentUsage = subscription?.current_period_usage || 0;

        return NextResponse.json({
            plan: subscription?.plan_type || "gratis",
            status: subscription?.status || "none",
            usage: {
                current: currentUsage,
                total: limit,
                remaining: Math.max(0, limit - currentUsage)
            },
            subscriptionDetails: subscription ? {
                currentPeriodEnd: subscription.current_period_end
            } : null
        });
    } catch (error: any) {
        console.error("[BILLING STATUS ERROR]", error);
        return handleApiError(error, AppErrorType.INTERNAL);
    }
}
