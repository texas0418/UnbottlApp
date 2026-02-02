import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

const PRICE_TO_PLAN: Record<string, { type: string; locationLimit: number }> = {
  'price_1SwFoa05hN1XfEY0xq4lxyjN': { type: 'starter', locationLimit: 1 },
  'price_1SwFqA05hN1XfEY0n0o6EEvt': { type: 'pro', locationLimit: 5 },
  'price_1SwFqc05hN1XfEY0M0qMlRje': { type: 'business', locationLimit: 10 },
};

const ADDON_PRICE_ID = 'price_1SwFr605hN1XfEY0BGGuy33f';

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    return new Response('Missing signature or webhook secret', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const { data: existingEvent } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('id', event.id)
      .single();

    if (existingEvent) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('stripe_events').insert({ id: event.id, type: event.type });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const restaurantId = session.metadata?.restaurant_id;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      if (restaurantId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        let planType = 'free';
        let locationLimit = 1;
        let addonLocations = 0;

        for (const item of subscription.items.data) {
          const priceId = item.price.id;
          if (priceId === ADDON_PRICE_ID) {
            addonLocations = item.quantity || 0;
          } else if (PRICE_TO_PLAN[priceId]) {
            planType = PRICE_TO_PLAN[priceId].type;
            locationLimit = PRICE_TO_PLAN[priceId].locationLimit;
          }
        }

        await supabase.from('subscriptions').upsert({
          restaurant_id: restaurantId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan_type: planType,
          location_limit: locationLimit,
          addon_locations: addonLocations,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }, { onConflict: 'restaurant_id' });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});
