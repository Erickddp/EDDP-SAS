import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY || "";

export const stripe = new Stripe(stripeKey, {
    apiVersion: "2026-02-25.clover" as any,
    typescript: true,
});
