# Unbottl App - Complete Setup & Usage Guide

**Version 1.0.0**
**Last Updated: January 2026**

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [App Overview](#3-app-overview)
4. [For Users: Discovering Beverages](#4-for-users-discovering-beverages)
5. [For Restaurant Owners: Managing Your Menu](#5-for-restaurant-owners-managing-your-menu)
6. [Making the App Production-Ready](#6-making-the-app-production-ready)
7. [Deploying to App Stores](#7-deploying-to-app-stores)
8. [Troubleshooting](#8-troubleshooting)
9. [Feature Checklist](#9-feature-checklist)

---

## 1. Introduction

### What is Unbottl?

Unbottl is a comprehensive beverage management and discovery app designed for two audiences:

1. **Restaurant Owners & Managers** - Manage your wine, beer, cocktail, and beverage inventory
2. **Consumers** - Discover new drinks, keep a tasting journal, and get personalized recommendations

### Key Features

- **5 Beverage Categories**: Wine, Beer, Spirits, Cocktails, Non-Alcoholic
- **AI Sommelier**: Chat with an AI to get personalized recommendations
- **QR Code Menus**: Generate scannable menus for customers
- **Tasting Journal**: Record and rate your beverage experiences
- **Wine/Label Scanner**: Scan bottles to add them to your inventory
- **CSV Import**: Bulk import inventory from spreadsheets
- **Wishlist**: Save beverages to try later
- **Push Notifications**: Get alerts when favorites update
- **Dietary Filters**: Filter by vegan, organic, low-sulfite, gluten-free, etc.
- **Price Range Filters**: Filter by budget ($, $$, $$$)

---

## 2. Getting Started

### Prerequisites

Before you begin, ensure you have:

1. **Node.js** (version 18 or higher)
   - Install via nvm: https://github.com/nvm-sh/nvm
   
2. **Bun** (package manager)
   - Install: https://bun.sh/docs/installation
   - Or run: `curl -fsSL https://bun.sh/install | bash`

3. **A smartphone** with either:
   - **iOS**: Download "Expo Go" from App Store
   - **Android**: Download "Expo Go" from Google Play

### Step-by-Step Setup

#### Step 1: Get the Code

```bash
# Clone the repository (replace with your actual repo URL)
git clone <YOUR_GIT_URL>

# Navigate into the project folder
cd <YOUR_PROJECT_NAME>
```

#### Step 2: Install Dependencies

```bash
# Install all required packages
bun install
```

#### Step 3: Start the App

**Option A: Run in Web Browser (Quickest)**
```bash
bun run start-web
```
This opens a web preview in your browser. Good for quick testing.

**Option B: Run on Your Phone (Recommended)**
```bash
bun run start
```
This shows a QR code in your terminal. Scan it with:
- **iPhone**: Open Camera app, point at QR code
- **Android**: Open Expo Go app, tap "Scan QR code"

#### Step 4: Test the App

Once running, you should see the Unbottl home screen with:
- An AI Sommelier banner
- Quick action buttons (Scan Menu, Explore)
- Category cards (Wines, Beers, Spirits, Cocktails, Non-Alcoholic)
- Featured selections

---

## 3. App Overview

### Navigation Tabs

The app has 5 main tabs at the bottom:

| Tab | Icon | Purpose |
|-----|------|---------|
| **Home** | House | Dashboard with recommendations and quick actions |
| **Discover** | Compass | Browse all beverages with filters |
| **Scan** | Barcode | Scan menus, labels, or QR codes |
| **Journal** | Book | Your personal tasting notes |
| **Profile** | Person | Settings, account, and management tools |

### Understanding the Data

Currently, the app stores all data **locally on your device** using AsyncStorage. This means:

- Data persists when you close the app
- Data does NOT sync between devices
- Sample data is provided to get you started

---

## 4. For Users: Discovering Beverages

### 4.1 Setting Up Your Preferences

1. Open the app and tap the **gear icon** in the "For You" section
2. Or go to **Profile tab** > **Taste Preferences**
3. Select your preferences:
   - Preferred wine types (Red, White, Rosé, etc.)
   - Flavor profile (Body, Sweetness, Tannins, Acidity)
   - Price range comfort level
   - Dietary requirements

The app learns from your behavior and improves recommendations over time.

### 4.2 Browsing Beverages

1. Tap the **Discover** tab
2. Use filters at the top:
   - **Category chips**: Wine, Beer, Spirit, Cocktail, Non-Alcoholic
   - **Search bar**: Type to find specific items
   - **Price filters**: Filter by budget level
   - **Dietary tags**: Vegan, Organic, Low-Sulfite, Gluten-Free

3. Tap any beverage card to see full details

### 4.3 Using the AI Sommelier

1. From Home, tap the **AI Sommelier** banner
2. Type what you're in the mood for, like:
   - "I want something fruity and light"
   - "What pairs well with steak?"
   - "Recommend a cocktail for a date night"
3. The AI will suggest beverages based on your query and preferences

### 4.4 Keeping a Tasting Journal

1. Go to the **Journal** tab
2. Tap the **+** button to add an entry
3. Fill in:
   - **Beverage name** and type
   - **Rating** (1-5 stars)
   - **Tasting notes** (what you liked/disliked)
   - **Occasion** (dinner, celebration, etc.)
   - **Location** (restaurant name)
4. Your entries help the app learn your preferences

### 4.5 Building Your Wishlist

1. When viewing any beverage, tap the **bookmark icon**
2. The item is saved to your wishlist
3. Access via **Profile** > **Wishlist**
4. Great for remembering wines to try at other restaurants

### 4.6 Scanning Restaurant Menus

1. Tap **Scan Menu** from Home or the Scan tab
2. Point your camera at a restaurant's QR code
3. Their beverage menu loads instantly
4. Browse, filter, and save items to your wishlist

---

## 5. For Restaurant Owners: Managing Your Menu

### 5.1 Accessing Management Tools

1. Go to the **Profile** tab
2. Scroll to **Restaurant Management** section
3. You'll see options for:
   - Add Beverage
   - Inventory
   - QR Menu
   - Import CSV
   - Scan Labels
   - Analytics

### 5.2 Adding Beverages Manually

1. Tap **Add Beverage**
2. Select the category (Wine, Beer, Spirit, Cocktail, Non-Alcoholic)
3. Fill in required information:

**For Wines:**
- Name, Producer, Type (Red/White/etc.)
- Vintage, Region, Country, Grape
- Price (bottle and glass)
- Tasting notes, Food pairings
- Flavor profile sliders
- Dietary tags
- Stock status

**For Beers:**
- Name, Brewery, Style
- ABV, IBU
- Price, Serving size
- Description, Food pairings

**For Spirits:**
- Name, Brand, Type
- Origin, Age
- Price (bottle and shot)
- Suggested mixers

**For Cocktails:**
- Name, Type, Base spirit
- Ingredients, Garnish
- Glass type, Price
- Is it a signature cocktail?

**For Non-Alcoholic:**
- Name, Brand, Type
- Calories, Ingredients
- Price, Serving size

4. Tap **Save** to add to your menu

### 5.3 Bulk Importing via CSV

If you have your inventory in a spreadsheet:

1. Go to **Profile** > **Import CSV**
2. Prepare your CSV file with columns:
   
   **For Wines:**
   ```
   name,producer,type,vintage,region,country,grape,price,glassPrice,description,inStock
   ```
   
   **For Beers:**
   ```
   name,brewery,type,style,abv,ibu,price,servingSize,description,inStock
   ```

3. Copy/paste your CSV content or upload the file
4. Review the preview
5. Tap **Import** to add all items

### 5.4 Scanning Labels to Add Items

1. Go to **Profile** > **Scan Labels**
2. Point your camera at a wine/beer label
3. The AI reads the label and pre-fills information
4. Review and edit as needed
5. Tap **Save** to add to inventory

### 5.5 Generating QR Code Menus

1. Go to **Profile** > **QR Menu**
2. Customize your menu appearance:
   - Restaurant name and logo
   - Color theme
   - Which categories to show
3. Tap **Generate QR Code**
4. Print or display the QR code at your venue
5. Customers scan to view your digital menu

### 5.6 Managing Inventory

1. Go to **Discover** tab to see all your beverages
2. Tap any item to edit:
   - Update prices
   - Mark as out of stock
   - Update quantity
   - Toggle "Featured" status
3. Delete items you no longer carry

### 5.7 Viewing Analytics (Placeholder)

Currently, the Analytics feature is a placeholder. When connected to a backend, it would show:
- Most viewed items
- QR code scan counts
- Popular time periods
- Customer favorites

---

## 6. Making the App Production-Ready

To make this app fully functional for production use, you'll need to complete these steps:

### 6.1 Add a Backend Database

Currently, all data is stored locally. For a real app, you need a backend.

**Recommended Options:**

**Option A: Supabase (Easiest)**
1. Create account at https://supabase.com
2. Create a new project
3. Set up tables matching your types (wines, beers, spirits, etc.)
4. Update contexts to fetch from Supabase instead of AsyncStorage

**Option B: Firebase**
1. Create project at https://console.firebase.google.com
2. Enable Firestore database
3. Add firebase config to your app
4. Update data fetching to use Firebase

**Option C: Custom Backend**
1. Create a backend using the built-in Hono/tRPC setup
2. Read `skills/backend/SKILL.md` for instructions
3. Set up your database (PostgreSQL, MongoDB, etc.)
4. Create API endpoints for CRUD operations

### 6.2 Implement Real Authentication

The current auth is simulated. For production:

**Basic Auth (Email/Password):**
- Use Supabase Auth or Firebase Auth
- They handle password hashing, sessions, and security

**Social Login:**
- Add Google Sign-In
- Add Apple Sign-In (required for iOS if you have any sign-in)
- Use Expo AuthSession for OAuth providers

### 6.3 Enable Push Notifications

Push notifications require additional setup:

1. **Create an Expo account** at https://expo.dev
2. **Get push credentials**:
   - iOS: Apple Push Notification service (APNs) key
   - Android: Firebase Cloud Messaging (FCM) server key
3. **Set up notification server** to send notifications
4. The app code is ready (`contexts/NotificationsContext.tsx`), just needs real credentials

### 6.4 Connect AI Sommelier to Real AI

The AI Sommelier feature needs an AI backend:

1. **Get an API key** from:
   - OpenAI (ChatGPT)
   - Anthropic (Claude)
   - Google (Gemini)
   
2. **Set up the connection**:
   - Read `skills/rork-toolkit/SKILL.md` for AI integration
   - Configure the API key in environment variables
   - The chat UI is already built

### 6.5 Add Image Upload

Currently, images use placeholder URLs. For real image upload:

1. **Set up cloud storage**:
   - AWS S3
   - Cloudinary
   - Supabase Storage
   
2. **Implement image picker**:
   ```
   expo install expo-image-picker
   ```
   
3. **Upload to your storage service** when adding beverages

### 6.6 Enable Label Scanning

The wine/label scanner uses AI vision. To enable:

1. **Get an AI Vision API** (OpenAI, Google Vision, etc.)
2. **Configure the API key**
3. The scanner UI is built (`app/wine-scanner.tsx`)

---

## 7. Deploying to App Stores

### 7.1 Preparing for Deployment

Before submitting to app stores:

1. **Update app.json** with your information:
   - App name
   - Bundle identifier (iOS) and package name (Android)
   - Version number
   - Icons and splash screens

2. **Test thoroughly**:
   - Test on multiple devices
   - Test all features
   - Check for crashes

3. **Create app store accounts**:
   - Apple Developer Account ($99/year)
   - Google Play Developer Account ($25 one-time)

### 7.2 Building for iOS

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Log in to Expo
eas login

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

### 7.3 Building for Android

```bash
# Build for Android
eas build --platform android

# Submit to Google Play
eas submit --platform android
```

### 7.4 Building for Web

```bash
# Build web version
npx expo export:web

# Deploy to Vercel, Netlify, or any static host
```

---

## 8. Troubleshooting

### Common Issues

**Problem: App won't start**
```bash
# Clear cache and reinstall
rm -rf node_modules
bun install
bunx expo start --clear
```

**Problem: QR code won't scan on phone**
- Ensure phone and computer are on same WiFi network
- Try tunnel mode: `bun start -- --tunnel`
- Check firewall settings

**Problem: Data disappeared**
- Data is stored in AsyncStorage (device only)
- Clearing app cache/data will erase everything
- Consider implementing cloud backup

**Problem: Images not loading**
- Check internet connection
- Placeholder images require network access
- For local images, use proper asset imports

**Problem: Notifications not working**
- Push notifications require a custom development build
- They don't work in Expo Go
- See section 6.3 for full setup

---

## 9. Feature Checklist

Use this checklist to track what's complete and what needs work:

### Currently Working (Local Mode)

- [x] Home screen with recommendations
- [x] Browse all 5 beverage categories
- [x] Add/Edit/Delete beverages
- [x] Search and filter beverages
- [x] Price range filters
- [x] Dietary tag filters (vegan, organic, etc.)
- [x] Tasting journal entries
- [x] Favorites system
- [x] Wishlist functionality
- [x] Wine comparison tool
- [x] Dish pairing recommendations
- [x] QR code menu generation
- [x] CSV import functionality
- [x] Preference learning
- [x] Offline mode indicator
- [x] Basic auth (simulated)

### Needs Backend Connection

- [ ] Real user authentication
- [ ] Cloud data sync
- [ ] Push notifications
- [ ] AI Sommelier chat
- [ ] Label scanning with AI
- [ ] Analytics dashboard
- [ ] Multi-restaurant support
- [ ] Real-time inventory sync

### Optional Enhancements

- [ ] Dark mode (UI exists, logic needed)
- [ ] Multiple languages
- [ ] Social sharing
- [ ] Wine cellar tracking
- [ ] Barcode scanning
- [ ] Integration with POS systems
- [ ] Staff accounts with permissions
- [ ] Customer reviews/ratings

---

## Quick Reference Commands

| Command | Purpose |
|---------|---------|
| `bun install` | Install dependencies |
| `bun run start` | Start development server |
| `bun run start-web` | Start web preview |
| `bun run start -- --tunnel` | Start with tunnel (for network issues) |
| `bunx expo start --clear` | Clear cache and start |
| `eas build --platform ios` | Build iOS app |
| `eas build --platform android` | Build Android app |

---

## Support & Resources

- **Expo Documentation**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
- **Rork Platform**: https://rork.com
- **Supabase**: https://supabase.com/docs
- **Firebase**: https://firebase.google.com/docs

---

*This guide was generated for the Unbottl app. For the latest updates, check the project repository.*
