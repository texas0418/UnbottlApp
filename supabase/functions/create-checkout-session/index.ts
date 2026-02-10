// supabase/functions/create-checkout-session/index.ts
// Deploy with: supabase functions deploy create-checkout-session

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

// Price IDs from your Stripe dashboard (test mode)
const PRICE_IDS: Record<string, string> = {
  starter: "price_1SwFoa05hN1XfEY0xq4lxyjN",       // $19.99/mo
  pro: "price_1SwFqA05hN1XfEY0n0o6EEvt",            // $39.99/mo
  business: "price_1SwFqc05hN1XfEY0M0qMlRje",       // $69.99/mo
  additionalLocation: "price_1SwFr605hN1XfEY0BGGuy33f", // $9.99/mo add-on
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { restaurant_id, plan, addon_locations = 0 } = await req.json();

    // Validate inputs
    if (!restaurant_id || !plan) {
      return new Response(
        JSON.stringify({ error: "restaurant_id and plan are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: `Invalid plan: ${plan}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build line items
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 },
    ];

    // Add additional locations for business plan
    if (plan === "business" && addon_locations > 0) {
      line_items.push({
        price: PRICE_IDS.additionalLocation,
        quantity: addon_locations,
      });
    }

    // App deep link URLs — update these to match your app's URL scheme
    const SUCCESS_URL = "unbottlapp://subscription/success?session_id={CHECKOUT_SESSION_ID}";
    const CANCEL_URL = "unbottlapp://subscription/cancel";

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items,
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      allow_promotion_codes: true, // Enables UNBOTTL50 promo code at checkout
      metadata: {
        restaurant_id,
        plan,
        addon_locations: String(addon_locations),
      },
      subscription_data: {
        metadata: {
          restaurant_id,
          plan,
          addon_locations: String(addon_locations),
        },
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Checkout session error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
