import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { updateSubscription } from "@/lib/user-storage";
import { headers } from "next/headers";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("stripe-signature") as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ""
        );
    } catch (err: any) {
        console.error(`[STRIPE WEBHOOK] Verification failed: ${err.message}`);
        return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
    }

    // Handle event types
    switch (event.type) {
        case "checkout.session.completed":
            const session = event.data.object as any;
            const userId = session.client_reference_id || session.metadata?.userId;
            
            if (userId) {
                console.log(`[STRIPE WEBHOOK] Updating subscription for UserID=${userId} to PRO`);
                await updateSubscription(userId, {
                    plan_type: "pro",
                    status: "active",
                    stripe_subscription_id: session.subscription as string,
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                });
            }
            break;
            
        case "invoice.payment_succeeded":
            // Renew subscription logic here...
            break;
            
        case "customer.subscription.deleted":
            // Handle cancellation...
            break;
            
        default:
            console.log(`[STRIPE WEBHOOK] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
