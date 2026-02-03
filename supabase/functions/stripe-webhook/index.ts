import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }

    const body = await req.text();
    const event = JSON.parse(body);
    
    console.log('Received webhook event:', event.type);

    // Handle the event types we care about
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const restaurantId = session.metadata?.restaurant_id;
        const plan = session.metadata?.plan;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (restaurantId && subscriptionId) {
          // Create or update subscription in database
          const subscriptionData = {
            restaurant_id: restaurantId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_type: plan || 'starter',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          };

          const upsertRes = await fetch(
            `${supabaseUrl}/rest/v1/subscriptions`,
            {
              method: 'POST',
              headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates',
              },
              body: JSON.stringify(subscriptionData),
            }
          );

          if (!upsertRes.ok) {
            const err = await upsertRes.text();
            console.error('Failed to upsert subscription:', err);
          } else {
            console.log('Subscription created for restaurant:', restaurantId);
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;
        const status = subscription.status;
        const cancelAt = subscription.cancel_at;

        // Update subscription status
        const updateRes = await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${subscriptionId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              status: status === 'canceled' ? 'canceled' : status,
              cancel_at: cancelAt ? new Date(cancelAt * 1000).toISOString() : null,
            }),
          }
        );

        if (!updateRes.ok) {
          const err = await updateRes.text();
          console.error('Failed to update subscription:', err);
        } else {
          console.log('Subscription updated:', subscriptionId, status);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        // Update subscription status to past_due
        const updateRes = await fetch(
          `${supabaseUrl}/rest/v1/subscriptions?stripe_subscription_id=eq.${subscriptionId}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'past_due' }),
          }
        );

        if (!updateRes.ok) {
          console.error('Failed to update subscription to past_due');
        }
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    // Log the event for idempotency
    await fetch(
      `${supabaseUrl}/rest/v1/stripe_events`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=ignore-duplicates',
        },
        body: JSON.stringify({
          event_id: event.id,
          event_type: event.type,
          processed_at: new Date().toISOString(),
        }),
      }
    );

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook Error:', message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
