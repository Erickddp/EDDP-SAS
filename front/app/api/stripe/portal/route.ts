import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { getSession } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { getSubscriptionByUserId } from "@/lib/user-storage";
import { handleApiError, AppErrorType, validatedMethod } from "@/lib/error-handler";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "http://localhost:3000";

export async function POST(req: Request) {
    const methodError = validatedMethod(req, ["POST"]);
    if (methodError) return methodError;

    if (process.env.SKIP_BUILD_STATIC_GENERATION === 'true') {
        return NextResponse.json({ url: `${APP_URL}/dashboard/billing` });
    }

    try {
        const session = await getSession();
        if (!session) {
            return handleApiError(new Error("No autorizado"), AppErrorType.AUTH);
        }

        const subscription = await getSubscriptionByUserId(session.id);
        
        if (!subscription || !subscription.stripe_customer_id) {
            return NextResponse.json(
                { error: "No tienes una suscripción activa con Stripe." },
                { status: 400 }
            );
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: subscription.stripe_customer_id,
            return_url: `${APP_URL}/dashboard/billing`,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error: any) {
        return handleApiError(error, AppErrorType.INTERNAL);
    }
}
