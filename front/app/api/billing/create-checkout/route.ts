import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role === "guest") {
            return NextResponse.json({ error: "Debes estar registrado para suscribirte" }, { status: 401 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        // Create Checkout Session
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: process.env.STRIPE_PRO_PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${baseUrl}/chat?payment=success`,
            cancel_url: `${baseUrl}/chat?payment=cancel`,
            client_reference_id: session.id,
            customer_email: session.email,
            metadata: {
                userId: session.id,
                plan: "pro"
            }
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.error("[STRIPE CHECKOUT] Error:", error.message);
        return NextResponse.json({ error: "Error al crear sesión de pago" }, { status: 500 });
    }
}
