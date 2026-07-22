# UnbottlApp — Project Context Document

**Last Updated:** February 7, 2026
**Developer:** Simon
**Repository:** https://github.com/texas0418/UnbottlApp
**Bundle ID:** com.unbottl.app

---

## What Is Unbottl?

Unbottl is a comprehensive wine and beverage management platform that serves two distinct audiences: **restaurants/hospitality businesses** and **consumers/enthusiasts**. The platform consists of a React Native mobile app (iOS), a marketing website, and web-based dashboards for both restaurant owners and consumers.

The core idea is that restaurants use Unbottl to manage their beverage programs and generate QR code menus, while consumers use it to discover, save, and remember great drinks — creating a connected ecosystem between venues and guests.

---

## Platform Components

### 1. Mobile App (iOS — React Native/Expo)

The primary product. A cross-platform mobile app built with React Native and Expo, currently targeting iOS with App Store submission in progress.

**Restaurant-Facing Features:**
- Wine catalog management with full CRUD operations (wines, spirits, beers, cocktails, non-alcoholic beverages)
- AI-powered wine label scanner that extracts details from photos
- AI sommelier chatbot for personalized recommendations and food pairings
- AI menu import — import beverage menus from photos
- QR code menu generation for contactless digital menus
- Inventory tracking with stock levels and low-stock alerts
- Analytics dashboard (sales by category, popular items, revenue trends)
- Multi-location support
- CSV bulk import for large beverage lists
- Tasting journal for personal notes

**Consumer/Guest-Facing Features:**
- Save favorite wines, beers, spirits, and cocktails
- Personal tasting notes with ratings
- Restaurant visit history tracking
- Scan QR codes at restaurants to browse digital menus
- AI sommelier for personalized recommendations
- Food pairing suggestions
- Beverage profile and statistics
- Sync across devices via web portal

### 2. Website (Static HTML/CSS/JS)

A marketing and functional website hosted separately from the app. Includes:
- Landing page with app download links (App Store badge)
- Restaurant login portal (`restaurant-dashboard.html`) with Supabase authentication
- Full restaurant dashboard (`dashboard/index.html`) — a single-page application for managing inventory, QR codes, analytics, locations, team members, CSV imports, and settings
- Guest login portal (`guest-portal.html`) with Supabase authentication
- Guest dashboard (`guest/index.html`) showing favorites, visited restaurants, tasting notes, and settings
- Public-facing QR menu page (`menu.html`) — what guests see when they scan a restaurant's QR code
- Privacy policy and terms of service pages
- Subscription success page

The website uses Cormorant Garamond for headings, a purple gradient color scheme, and elegant SVG line icons throughout.

### 3. Supabase Backend

All data is managed through Supabase (project ID: `lonkvybmzhnizvxsyztf`).

**Authentication:** Supabase Auth handles sign-up, sign-in, password reset, and session management for both the mobile app and web dashboards. Restaurant owners and consumers use the same authentication system.

**Database Tables:**
- `restaurants` — id, name, owner_email, description, phone, website, created_at
- `wines` — id, user_id, name, producer, type, region, country, vintage, price, tasting_notes, in_stock
- `spirits` — id, user_id, name, brand, type, abv, price, description, in_stock
- `beers` — id, user_id, name, brewery, style, abv, price, description, in_stock
- `cocktails` — id, user_id, name, base_spirit, ingredients, price, description, is_available
- `non_alcoholic` — id, user_id, name, type, price, description, in_stock
- `locations` — id, restaurant_id, name, address
- `team_members` — id, restaurant_id, name, email, role, status
- `favorite_wines` — user_id, wine_id
- `favorite_beers` — user_id, beer_id
- `favorite_spirits` — user_id, spirit_id
- `favorite_cocktails` — user_id, cocktail_id
- `restaurant_visits` — user_id, restaurant_id, visited_at, visit_count
- `tasting_notes` — user_id, beverage_name, notes, rating, created_at

---

## Tech Stack

### Mobile App
- **React Native** — Cross-platform mobile framework
- **Expo SDK 54** — Development platform and build tools
- **Expo Router** — File-based navigation
- **TypeScript** — Type-safe development
- **React Query** — Server state management
- **Zustand** — Client state management
- **Lucide Icons** — Icon set
- **OpenAI GPT-4o** — Powers AI sommelier, tasting notes generation, label scanning, and menu import

### Backend & Services
- **Supabase** — Authentication, database (PostgreSQL), and data management
- **OpenAI API** — AI features (GPT-4o model)

### Build & Deployment
- **EAS Build** — Cloud builds via Expo Application Services
- **EAS Submit** — App Store Connect uploads
- **TestFlight** — Beta testing distribution
- **GitHub** — Version control (repo: `texas0418/UnbottlApp`)

### Environment Variables
```
EXPO_PUBLIC_OPENAI_API_KEY=<OpenAI API key>
EXPO_PUBLIC_SUPABASE_URL=https://lonkvybmzhnizvxsyztf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon public key>
```

These are configured as EAS secrets for production builds.

---

## Project Structure

```
UnbottlApp/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab-based navigation
│   │   ├── (home)/        # Home tab
│   │   ├── catalog/       # Wine catalog tab
│   │   ├── menu/          # Menu management tab
│   │   ├── journal/       # Wine journal tab
│   │   └── settings/      # Settings tab
│   ├── wine/              # Wine detail screens
│   ├── beverage/          # Beverage screens
│   ├── menu-import.tsx    # AI menu import screen
│   ├── sommelier-chat.tsx # AI sommelier chat
│   └── ...
├── assets/                # Images and fonts
├── components/            # Reusable React components
├── constants/             # App constants and theme
├── contexts/              # React contexts for state
├── services/              # API and service layer
│   ├── ai-toolkit.ts      # AI service integrations (OpenAI)
│   └── supabase.ts        # Supabase client configuration
├── mocks/                 # Mock data for development
├── types/                 # TypeScript type definitions
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
├── package.json           # Dependencies
└── tsconfig.json          # TypeScript config
```

---

## iOS Permissions

Configured in `app.json`:
- **Camera** — Wine label scanning and menu import
- **Photo Library** — Selecting images for scanning
- **Location** — Finding nearby restaurants/wine shops
- **Notifications** — Low stock alerts and reminders

---

## Current Status

### Completed
- Full mobile app with all core features functional
- OpenAI GPT-4o integrated for AI sommelier, tasting notes generation, label scanning, and menu import
- Supabase authentication and database fully configured
- Restaurant dashboard (web) with full inventory management, QR code generation, analytics, team management, and CSV import
- Guest dashboard (web) with favorites, visit history, and tasting notes
- Marketing website with app download links
- Privacy policy and terms of service
- Multiple successful TestFlight builds deployed (internal and external testing)
- External TestFlight testing groups configured with Apple Beta App Review approval
- Critical bugs fixed: AI sommelier JavaScript errors, menu import screen layout cutoff, debug alerts removed from production code

### In Progress / Next Steps
- Full App Store submission and public release
- Gathering user feedback from external TestFlight testers
- Ongoing bug fixes and UI polish based on tester feedback

---

## Development Workflow

### Local Development
```bash
cd ~/UnbottlApp
npx expo start        # Start Metro bundler
# Press 'i' for iOS simulator
```

### Building for TestFlight / App Store
```bash
# 1. Increment build number in ios/ folder
cd ios && agvtool new-version -all <NEW_BUILD_NUMBER> && cd ..

# 2. Build production binary
eas build --platform ios --profile production

# 3. Submit to App Store Connect
eas submit --platform ios --latest

# 4. In App Store Connect → TestFlight, add the new build to testing groups
```

### Important Build Notes
- When a native `ios/` folder exists, `app.json` build numbers are ignored — you must update the build number using `agvtool` in the `ios/` folder
- The project path must not contain spaces (e.g., use `~/UnbottlApp`, not `~/My Documents/Apps/UnbottlApp`)
- Metro bundler must be running for development builds
- `react-native-worklets` was removed as it requires New Architecture which is disabled

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `Cannot read property 'join' of undefined` | Use null-safe patterns: `(array \|\| []).map()` or `array?.join(', ') ?? ''` |
| Build number not incrementing in App Store Connect | Update via `agvtool` in `ios/` folder, not `app.json` |
| Metro bundler "No JavaScript" error | Run `npx expo start` before building/running from Xcode |
| Path with spaces breaks Xcode builds | Move project to a path without spaces |
| Debug alerts showing in TestFlight builds | Remove all `Alert.alert()` debug calls from production code |
| Supabase `Identifier already declared` error on web | Rename `supabase` variable to `supabaseClient` to avoid conflicts with the SDK global |

---

## App Store Listing Information

**App Name:** Unbottl
**Subtitle:** Wine & Beverage Manager
**Category:** Food & Drink (Primary), Lifestyle or Business (Secondary)
**Price:** Free

**App Store Description (Restaurant focus):**
Discover the smarter way to manage your beverage collection and elevate every tasting experience with Unbottl — your personal AI-powered drink companion. Manage your entire collection of wines, spirits, beers, cocktails, and non-alcoholic drinks. Get AI-powered sommelier recommendations, scan labels for instant recognition, generate QR code menus, and track inventory across multiple locations.

**App Store Description (Consumer focus):**
Never forget a great drink again. Save, rate, and remember every wine, cocktail, beer, and spirit you love. Scan QR codes at restaurants to browse digital menus. Get personalized AI recommendations and food pairings. Track visited restaurants, view favorites, and access your tasting notes from the app or web.

---

## Website Files Reference

The website is a separate static HTML/CSS/JS project (not part of the React Native repo). Key files:

- `index.html` — Landing page
- `restaurant-dashboard.html` — Restaurant login
- `dashboard/index.html` — Restaurant dashboard SPA
- `guest-portal.html` — Consumer login
- `guest/index.html` — Consumer dashboard
- `menu.html` — Public QR menu view
- `privacy-policy.html` — Privacy policy
- `terms-of-service.html` — Terms of service
- `subscription-success.html` — Post-subscription page
- `css/styles.css` — Global styles

All dashboard files require the Supabase anon key to be set in the JavaScript configuration.

---

## Key Contacts & Accounts

- **Apple Developer Account:** Required for App Store submission ($99/year)
- **Expo Account:** Used for EAS Build and EAS Submit
- **Supabase Project:** `lonkvybmzhnizvxsyztf`
- **OpenAI Account:** API key for AI features (set spending limits)
- **GitHub:** `texas0418/UnbottlApp`
- **TestFlight Public Link:** `https://testflight.apple.com/join/2bz8wu1F`
