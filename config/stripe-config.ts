// Unbottl Stripe Configuration
// Add this to your app's config folder

export const STRIPE_CONFIG = {
  // API Keys (use environment variables in production)
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51Sqr5R05hN1XfEY0KpUyXQQI2mGmVgCDBmoGKIerD4tIPxUOTsNaE7LqHkLWYo9vs8uiiZJqKFLtbxTiBJPo7CHp00uzIEZyxC',
  
  // Price IDs for subscriptions
  prices: {
    starter: 'price_1SwFoa05hN1XfEY0xq4lxyjN',    // $19.99/mo - 1 location
    pro: 'price_1SwFqA05hN1XfEY0n0o6EEvt',        // $39.99/mo - up to 5 locations
    business: 'price_1SwFqc05hN1XfEY0M0qMlRje',   // $69.99/mo - up to 10 locations
    additionalLocation: 'price_1SwFr605hN1XfEY0BGGuy33f', // $9.99/mo per location
  },

  // Plan details
  plans: {
    free: {
      name: 'Free',
      price: 0,
      locationLimit: 1,
      beverageLimit: 50,
      features: [
        'Up to 50 beverages',
        '1 location',
        'Basic AI chat',
        'Manual entry',
      ],
    },
    starter: {
      name: 'Starter',
      price: 19.99,
      priceId: 'price_1SwFoa05hN1XfEY0xq4lxyjN',
      locationLimit: 1,
      beverageLimit: Infinity,
      features: [
        'Unlimited beverages',
        '1 location',
        'AI sommelier & mixologist',
        'Label scanning',
        'Food pairing recommendations',
        'QR code menus',
      ],
    },
    pro: {
      name: 'Pro',
      price: 39.99,
      priceId: 'price_1SwFqA05hN1XfEY0n0o6EEvt',
      locationLimit: 5,
      beverageLimit: Infinity,
      features: [
        'Everything in Starter',
        'Up to 5 locations',
        'Multi-location management',
        'Inventory transfers',
        'Advanced analytics',
      ],
    },
    business: {
      name: 'Business',
      price: 69.99,
      priceId: 'price_1SwFqc05hN1XfEY0M0qMlRje',
      locationLimit: 10,
      beverageLimit: Infinity,
      features: [
        'Everything in Pro',
        'Up to 10 locations',
        'Add more locations at $9.99/mo each',
        'Priority support',
        'Custom integrations',
        'API access',
      ],
    },
  },
};

// Helper function to get plan by price ID
export function getPlanByPriceId(priceId: string) {
  const plans = STRIPE_CONFIG.plans;
  for (const [key, plan] of Object.entries(plans)) {
    if ('priceId' in plan && plan.priceId === priceId) {
      return { key, ...plan };
    }
  }
  return null;
}

// Helper function to calculate total price with addon locations
export function calculateTotalPrice(planKey: string, addonLocations: number = 0) {
  const plan = STRIPE_CONFIG.plans[planKey as keyof typeof STRIPE_CONFIG.plans];
  if (!plan || !('price' in plan)) return 0;
  
  const basePrice = plan.price;
  const addonPrice = planKey === 'business' ? addonLocations * 9.99 : 0;
  
  return basePrice + addonPrice;
}
