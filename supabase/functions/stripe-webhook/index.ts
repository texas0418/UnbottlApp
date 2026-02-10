// supabase/functions/stripe-webhook/index.ts
// Deploy with: supabase functions deploy stripe-webhook --no-verify-jwt
//
// After deploying, add the webhook URL in Stripe Dashboard → Developers → Webhooks:
//   https://desocidpjwgxbuydwvwk.supabase.co/functions/v1/stripe-webhook
//
// Events to listen for:
//   - checkout.session.completed
//   - customer.subscription.updated
//   - customer.subscription.deleted
//   - invoice.payment_succeeded
//   - invoice.payment_failed

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

// Map plan names to location limits
const PLAN_LIMITS: Record<string, number> = {
  starter: 1,
  pro: 5,
  business: 10,
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log(`Processing event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const restaurantId = session.metadata?.restaurant_id;
        const plan = session.metadata?.plan || "starter";
        const addonLocations = parseInt(session.metadata?.addon_locations || "0");

        if (!restaurantId) {
          console.error("No restaurant_id in session metadata");
          break;
        }

        // Retrieve the subscription to get period details
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const { error } = await supabase.from("subscriptions").upsert(
          {
            restaurant_id: restaurantId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            plan_type: plan,
            location_limit: PLAN_LIMITS[plan] || 1,
            addon_locations: addonLocations,
            status: subscription.status === "trialing" ? "trialing" : "active",
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          },
          { onConflict: "restaurant_id" }
        );

        if (error) console.error("Upsert error:", error);
        else console.log(`Subscription created for restaurant ${restaurantId}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const restaurantId = subscription.metadata?.restaurant_id;

        if (!restaurantId) {
          console.error("No restaurant_id in subscription metadata");
          break;
        }

        const plan = subscription.metadata?.plan || "starter";
        const addonLocations = parseInt(
          subscription.metadata?.addon_locations || "0"
        );

        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan_type: plan,
            location_limit: PLAN_LIMITS[plan] || 1,
            addon_locations: addonLocations,
            status: subscription.status as string,
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq("restaurant_id", restaurantId);

        if (error) console.error("Update error:", error);
        else console.log(`Subscription updated for restaurant ${restaurantId}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const restaurantId = subscription.metadata?.restaurant_id;

        if (!restaurantId) break;

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            cancel_at_period_end: false,
          })
          .eq("restaurant_id", restaurantId);

        if (error) console.error("Delete error:", error);
        else console.log(`Subscription canceled for restaurant ${restaurantId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) console.error("Payment failed update error:", error);
        else console.log(`Payment failed for subscription ${subscriptionId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err: any) {
    console.error("Error processing webhook:", err);
    return new Response(`Webhook handler error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
