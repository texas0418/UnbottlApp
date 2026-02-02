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

const PRICES: Record<string, string> = {
  starter: 'price_1SwFoa05hN1XfEY0xq4lxyjN',
  pro: 'price_1SwFqA05hN1XfEY0n0o6EEvt',
  business: 'price_1SwFqc05hN1XfEY0M0qMlRje',
  additionalLocation: 'price_1SwFr605hN1XfEY0BGGuy33f',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { restaurant_id, plan, addon_locations = 0 } = await req.json();

    if (!restaurant_id || !plan || !PRICES[plan]) {
      throw new Error('Missing required fields');
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('*, subscriptions(*)')
      .eq('id', restaurant_id)
      .single();

    if (!restaurant) throw new Error('Restaurant not found');

    let customerId = restaurant.subscriptions?.[0]?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: restaurant.email,
        name: restaurant.name,
        metadata: { restaurant_id },
      });
      customerId = customer.id;
    }

    const lineItems: Array<{price: string, quantity: number}> = [{ price: PRICES[plan], quantity: 1 }];
    if (plan === 'business' && addon_locations > 0) {
      lineItems.push({ price: PRICES.additionalLocation, quantity: addon_locations });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: 'unbottl://subscription/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'unbottl://subscription/cancel',
      subscription_data: {
        trial_period_days: 14,
        metadata: { restaurant_id, plan, addon_locations: addon_locations.toString() },
      },
      metadata: { restaurant_id, plan },
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
