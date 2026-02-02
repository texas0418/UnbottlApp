import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const PRICES: Record<string, string> = {
      starter: 'price_1SwFoa05hN1XfEY0xq4lxyjN',
      pro: 'price_1SwFqA05hN1XfEY0n0o6EEvt',
      business: 'price_1SwFqc05hN1XfEY0M0qMlRje',
      additionalLocation: 'price_1SwFr605hN1XfEY0BGGuy33f',
    };

    const body = await req.json();
    const { restaurant_id, plan, addon_locations = 0 } = body;

    if (!restaurant_id || !plan || !PRICES[plan]) {
      throw new Error('Invalid request parameters');
    }

    // Fetch restaurant using REST API directly
    const restaurantRes = await fetch(
      `${supabaseUrl}/rest/v1/restaurants?id=eq.${restaurant_id}&select=*,subscriptions(*)`,
      {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    if (!restaurantRes.ok) {
      throw new Error('Failed to fetch restaurant');
    }

    const restaurants = await restaurantRes.json();
    const restaurant = restaurants[0];

    if (!restaurant) {
      throw new Error('Restaurant not found');
    }

    let customerId = restaurant.subscriptions?.[0]?.stripe_customer_id;

    // Create Stripe customer if needed
    if (!customerId) {
      const customerRes = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          name: restaurant.name,
          ...(restaurant.email && { email: restaurant.email }),
          'metadata[restaurant_id]': restaurant_id,
        }),
      });

      if (!customerRes.ok) {
        const err = await customerRes.text();
        throw new Error(`Stripe customer error: ${err}`);
      }

      const customer = await customerRes.json();
      customerId = customer.id;
    }

    // Use web-based success/cancel URLs
    const baseUrl = 'https://unbottl.com';
    
    // Build checkout session params
    const sessionParams = new URLSearchParams({
      customer: customerId,
      mode: 'subscription',
      'payment_method_types[0]': 'card',
      'line_items[0][price]': PRICES[plan],
      'line_items[0][quantity]': '1',
      success_url: `${baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription-cancel`,
      'subscription_data[trial_period_days]': '14',
      'subscription_data[metadata][restaurant_id]': restaurant_id,
      'subscription_data[metadata][plan]': plan,
      'metadata[restaurant_id]': restaurant_id,
      'metadata[plan]': plan,
      allow_promotion_codes: 'true',
    });

    if (plan === 'business' && addon_locations > 0) {
      sessionParams.append('line_items[1][price]', PRICES.additionalLocation);
      sessionParams.append('line_items[1][quantity]', addon_locations.toString());
    }

    const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: sessionParams,
    });

    if (!sessionRes.ok) {
      const err = await sessionRes.text();
      throw new Error(`Stripe session error: ${err}`);
    }

    const session = await sessionRes.json();

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Checkout error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
