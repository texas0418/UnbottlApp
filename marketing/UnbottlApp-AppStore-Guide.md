# 🍷 UnbottlApp - Complete App Store Submission Guide

**A Step-by-Step Manual for Getting Your Wine App on the App Store**

_Written in plain English for someone with no coding or App Store experience_

---

## 📋 Table of Contents

1. [Overview & Current Status](#1-overview--current-status)
2. [Before You Start (Prerequisites)](#2-before-you-start-prerequisites)
3. [Phase 1: Fix Code Issues](#3-phase-1-fix-code-issues)
4. [Phase 2: Set Up Your Apple Developer Account](#4-phase-2-set-up-your-apple-developer-account)
5. [Phase 3: Prepare Your App Assets](#5-phase-3-prepare-your-app-assets)
6. [Phase 4: Create Legal Documents](#6-phase-4-create-legal-documents)
7. [Phase 5: Configure Environment Variables](#7-phase-5-configure-environment-variables)
8. [Phase 6: Set Up EAS (Expo Application Services)](#8-phase-6-set-up-eas-expo-application-services)
9. [Phase 7: Build Your App](#9-phase-7-build-your-app)
10. [Phase 8: Test Your App](#10-phase-8-test-your-app)
11. [Phase 9: Create Your App Store Listing](#11-phase-9-create-your-app-store-listing)
12. [Phase 10: Submit for Review](#12-phase-10-submit-for-review)
13. [Troubleshooting Common Issues](#13-troubleshooting-common-issues)
14. [Post-Launch Checklist](#14-post-launch-checklist)
15. [Glossary of Terms](#15-glossary-of-terms)

---

## 1. Overview & Current Status

### What is UnbottlApp?

UnbottlApp is a wine and beverage management app with features like:

- 🍷 Wine catalog management
- 🤖 AI Sommelier chat (powered by OpenAI)
- 📱 Wine label scanning
- 📋 Menu management
- 📊 Analytics dashboard

### Current Status of Your App

| Item                    | Status                | Action Needed            |
| ----------------------- | --------------------- | ------------------------ |
| Basic app structure     | ✅ Complete           | None                     |
| App icon                | ⚠️ Needs verification | Verify 1024x1024 size    |
| Splash screen           | ✅ Present            | None                     |
| iOS configuration       | ✅ Basic setup done   | Fill in real credentials |
| EAS build config        | ⚠️ Has placeholders   | Replace with real values |
| Privacy Policy          | ❌ Missing            | Must create              |
| Terms of Service        | ❌ Missing            | Recommended to create    |
| Debug code              | ❌ Present            | Must remove              |
| Environment variables   | ⚠️ Need setup         | Configure for production |
| Apple Developer Account | ❓ Unknown            | Required ($99/year)      |
| App Store screenshots   | ❌ Missing            | Must create              |

### Estimated Time to Complete

- **If you have an Apple Developer account:** 3-5 days
- **If you need to set up everything from scratch:** 1-2 weeks

---

## 2. Before You Start (Prerequisites)

### Things You'll Need

#### 💻 Hardware & Software

- [x] A Mac computer (required for iOS development)
- [x] Xcode installed (free from Mac App Store)
- [x] Node.js installed (version 18 or higher)
- [x] Your iPhone for testing (recommended)

#### 💳 Accounts & Subscriptions

- [x] Apple ID (free - you probably already have one)
- [x] Apple Developer Account ($99/year) - **REQUIRED**
- [x] Expo account (free)
- [x] GitHub account (you already have this)

#### 🔑 API Keys (You May Already Have These)

- [x] OpenAI API key (for AI features)
- [x] Supabase project URL and anon key (for database)

### How to Check What You Already Have

**Check if Node.js is installed:**

1. Open Terminal (find it in Applications → Utilities → Terminal)
2. Type: `node --version`
3. If you see a number like `v18.17.0`, you're good!
4. If not, go to https://nodejs.org and download the LTS version

**Check if Xcode is installed:**

1. Open Finder
2. Go to Applications
3. Look for "Xcode"
4. If it's not there, open the Mac App Store and search for "Xcode" (it's free but large - about 12GB)

---

## 3. Phase 1: Fix Code Issues

### 🚨 CRITICAL: Remove Debug Alert

There's a debug popup in your code that will show to users! This MUST be removed before submitting.

**File to edit:** `services/supabase.ts`

**What to remove:** Find and delete these lines (approximately lines 9-15):

```javascript
// DELETE THIS ENTIRE BLOCK:
setTimeout(() => {
  Alert.alert(
    "Supabase Debug",
    `URL: ${supabaseUrl ? "LOADED ✅" : "MISSING ❌"}\nKey: ${supabaseAnonKey ? "LOADED ✅" : "MISSING ❌"}`,
    [{ text: "OK" }],
  );
}, 3000);
```

**How to do this:**

1. Open your project folder
2. Navigate to `services/supabase.ts`
3. Open it in a text editor (like VS Code or even TextEdit)
4. Find the code block above and delete it
5. Save the file

### Fix Null Safety Issues

You've already fixed some of these, but verify these files have null-safe code:

**File:** `app/sommelier-chat.tsx`

- Ensure all array operations use `(array || [])` pattern

**File:** `app/wine/[id].tsx`

- Ensure `foodPairings` check uses `wine.foodPairings && wine.foodPairings.length > 0`

---

## 4. Phase 2: Set Up Your Apple Developer Account

### Why You Need This

Apple requires all App Store apps to come from registered developers. This costs $99/year.

### Step-by-Step Instructions

#### Step 1: Enroll in Apple Developer Program

1. Go to https://developer.apple.com/programs/enroll/
2. Click "Start Your Enrollment"
3. Sign in with your Apple ID (or create one)
4. Choose "Individual" if this is for yourself, or "Organization" if for a business
5. Pay the $99 annual fee
6. Wait for approval (usually 24-48 hours)

#### Step 2: Accept Agreements

After approval:

1. Go to https://appstoreconnect.apple.com
2. Sign in
3. You'll see prompts to accept various agreements
4. Read and accept all required agreements

#### Step 3: Get Your Team ID

1. Go to https://developer.apple.com/account
2. Look in the top right - you'll see your name and a 10-character code
3. That code is your **Team ID** (looks like: `75ULC33H2C`)
4. Write this down - you'll need it later!

---

## 5. Phase 3: Prepare Your App Assets

### App Icon Requirements

Apple requires a **1024 x 1024 pixel** PNG image with:

- No transparency (no see-through parts)
- No rounded corners (Apple adds these automatically)
- No alpha channel

**How to check your current icon:**

1. Go to your project folder
2. Open `assets/images/icon.png`
3. Right-click → Get Info (on Mac)
4. Check the dimensions - should be 1024 x 1024

**If you need to resize:**

- Use Canva (free): https://www.canva.com
- Or Preview on Mac: Open image → Tools → Adjust Size

### Screenshots (REQUIRED)

You need screenshots for these iPhone sizes:

- **6.7" Display** (iPhone 15 Pro Max): 1290 x 2796 pixels
- **6.5" Display** (iPhone 14 Plus): 1284 x 2778 pixels
- **5.5" Display** (iPhone 8 Plus): 1242 x 2208 pixels

**How to take screenshots:**

1. Run your app in Xcode Simulator
2. Choose different iPhone models from the simulator menu
3. Press `Command + S` to save a screenshot
4. Screenshots save to your Desktop

**Recommended screenshots to take:**

1. Home screen showing wine list
2. Wine detail page
3. AI Sommelier chat in action
4. Wine scanner feature
5. Menu management screen

**Pro tip:** Use a tool like [AppMockUp](https://app-mockup.com) to put your screenshots in pretty phone frames.

### App Preview Video (Optional but Recommended)

A 15-30 second video showing your app in action can increase downloads by 20%!

**How to record:**

1. Open QuickTime Player on Mac
2. File → New Screen Recording
3. Run your app in the simulator
4. Record yourself using the main features
5. Keep it under 30 seconds

---

## 6. Phase 4: Create Legal Documents

### Privacy Policy (REQUIRED)

Apple **requires** a privacy policy. Your app collects:

- Location data (for nearby wine shops)
- Photos (for wine label scanning)
- Usage data (analytics)

**Easy option:** Use a free generator:

1. Go to https://www.freeprivacypolicy.com/free-privacy-policy-generator/
2. Fill in your app details
3. Download the generated policy
4. Host it on a free website (see below)

**What to include:**

- What data you collect
- How you use it
- Who you share it with (OpenAI for AI features, Supabase for storage)
- How users can contact you
- How users can delete their data

### Where to Host Your Privacy Policy

**Free options:**

1. **GitHub Pages** (free)
   - Create a new repository called `unbottl-privacy`
   - Add your privacy policy as `index.html`
   - Enable GitHub Pages in settings
   - Your URL will be: `https://yourusername.github.io/unbottl-privacy`

2. **Notion** (free)
   - Create a Notion page with your privacy policy
   - Click "Share" → "Share to web"
   - Copy the public link

3. **Google Sites** (free)
   - Go to https://sites.google.com
   - Create a simple one-page site
   - Paste your privacy policy

### Terms of Service (Recommended)

Similar to privacy policy but covers:

- Rules for using your app
- What users can and can't do
- Your liability limitations

Use the same generators mentioned above.

---

## 7. Phase 5: Configure Environment Variables

### What Are Environment Variables?

Think of these as secret passwords your app needs to work. They're stored separately from your code so they don't get accidentally shared.

### Setting Up for Production

#### Step 1: Create a `.env` file

In your project root folder, create a file called `.env` (just a dot and "env", no other extension):

```
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key-here
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url-here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

#### Step 2: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Paste it in your `.env` file

**⚠️ Important:** OpenAI charges money for API usage. Set a spending limit:

1. Go to https://platform.openai.com/account/billing
2. Set a monthly budget (maybe $20-50 to start)

#### Step 3: Get Your Supabase Credentials

If you already have a Supabase project:

1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings → API
4. Copy the "Project URL" and "anon public" key
5. Paste them in your `.env` file

If you need to create a Supabase project:

1. Go to https://supabase.com and sign up (free tier available)
2. Create a new project
3. Wait for it to set up (takes a minute)
4. Go to Settings → API to get your credentials

#### Step 4: Add Environment Variables to EAS

When building with EAS, you need to add secrets:

1. Install EAS CLI (if not already):

   ```
   npm install -g eas-cli
   ```

2. Log in to EAS:

   ```
   eas login
   ```

3. Add your secrets:
   ```
   eas secret:create --name EXPO_PUBLIC_OPENAI_API_KEY --value "your-key-here" --scope project
   eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "your-url-here" --scope project
   eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-key-here" --scope project
   ```

---

## 8. Phase 6: Set Up EAS (Expo Application Services)

### What is EAS?

EAS is Expo's cloud service that builds your app for the App Store. It's like a factory that turns your code into an actual iPhone app.

### Step-by-Step Setup

#### Step 1: Create an Expo Account

1. Go to https://expo.dev
2. Click "Sign Up"
3. Create your account

#### Step 2: Install EAS CLI

Open Terminal and run:

```bash
npm install -g eas-cli
```

#### Step 3: Log In

```bash
eas login
```

Enter your Expo username and password.

#### Step 4: Configure Your Project

Navigate to your project folder in Terminal:

```bash
cd ~/UnbottlApp
```

Then run:

```bash
eas build:configure
```

This will ask you some questions - just press Enter to accept defaults.

#### Step 5: Update eas.json with Your Real Info

Open `eas.json` and replace the placeholder values:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your.actual.email@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC123DEF4"
      }
    }
  }
}
```

**Where to find these values:**

| Field         | Where to Find It                                                      |
| ------------- | --------------------------------------------------------------------- |
| `appleId`     | Your Apple ID email address                                           |
| `appleTeamId` | https://developer.apple.com/account (top right)                       |
| `ascAppId`    | You'll get this after creating the app in App Store Connect (Phase 9) |

---

## 9. Phase 7: Build Your App

### Building for the App Store

#### Step 1: Run the Production Build

In Terminal, navigate to your project and run:

```bash
eas build --platform ios --profile production
```

#### Step 2: Wait for the Build

- EAS will upload your code to their servers
- The build takes about 15-30 minutes
- You'll see a URL where you can watch the progress
- When done, you'll get a download link for your `.ipa` file (your app!)

#### Step 3: Handle Code Signing

The first time you build, EAS will ask about code signing:

1. Choose "Let EAS handle it" (recommended for beginners)
2. Enter your Apple ID and password when prompted
3. EAS will create the necessary certificates automatically

**If you get asked for a 2FA code:** Check your iPhone or other Apple devices for the code.

---

## 10. Phase 8: Test Your App

### Internal Testing with TestFlight

TestFlight is Apple's way to let people test your app before it goes public.

#### Step 1: Upload to App Store Connect

After your build completes, submit it:

```bash
eas submit --platform ios --profile production
```

Or upload manually:

1. Download the `.ipa` file from EAS
2. Open Transporter app (free on Mac App Store)
3. Drag your `.ipa` file into Transporter
4. Click "Deliver"

#### Step 2: Wait for Processing

Apple processes your build (takes 15-30 minutes). You'll get an email when it's ready.

#### Step 3: Set Up TestFlight

1. Go to https://appstoreconnect.apple.com
2. Click on your app
3. Go to "TestFlight" tab
4. Click on your build
5. Answer the export compliance question:
   - Your app uses HTTPS, so select "Yes"
   - Select "Only uses standard encryption" (this is true for your app)

#### Step 4: Add Testers

**Internal testers** (up to 100):

- Must have Apple Developer account access
- Good for your team

**External testers** (up to 10,000):

- Anyone with an email address
- Requires a quick Apple review first

To add testers:

1. Go to TestFlight → Internal Testing → App Store Connect Users
2. Click the "+" button
3. Add email addresses

### What to Test

- [ ] App opens without crashing
- [ ] Can browse wine catalog
- [ ] Can add a new wine
- [ ] AI Sommelier responds to questions
- [ ] Wine scanner works (opens camera)
- [ ] All buttons and links work
- [ ] App looks good on different iPhone sizes
- [ ] App works without internet (gracefully shows error)

---

## 11. Phase 9: Create Your App Store Listing

### Setting Up in App Store Connect

#### Step 1: Create Your App

1. Go to https://appstoreconnect.apple.com
2. Click "My Apps"
3. Click the "+" button → "New App"
4. Fill in:
   - **Platform:** iOS
   - **Name:** Unbottl (or your preferred name)
   - **Primary Language:** English
   - **Bundle ID:** com.unbottl.app (select from dropdown)
   - **SKU:** unbottl-ios-001 (any unique identifier)

#### Step 2: Fill in App Information

**App Information Page:**

| Field              | What to Enter                                 |
| ------------------ | --------------------------------------------- |
| Name               | Unbottl - Wine & Beverage Manager             |
| Subtitle           | Your AI Sommelier in Your Pocket              |
| Category           | Food & Drink                                  |
| Secondary Category | Lifestyle (optional)                          |
| Content Rights     | Select "Does not contain third-party content" |

**Pricing and Availability:**

- Price: Free (or your preferred price)
- Availability: Select countries

#### Step 3: Write Your App Description

**Description (max 4000 characters):**

```
Discover the perfect wine for any occasion with Unbottl - your personal AI sommelier!

🍷 SMART WINE MANAGEMENT
• Organize your wine collection with ease
• Track bottles, vintages, and tasting notes
• Never forget a great wine again

🤖 AI-POWERED RECOMMENDATIONS
• Chat with our AI sommelier for personalized suggestions
• Get food pairing recommendations
• Discover new wines based on your preferences

📱 WINE LABEL SCANNING
• Point your camera at any wine label
• Instantly get information about the wine
• Add wines to your collection with one tap

📋 RESTAURANT FEATURES
• Manage your beverage menu
• Track inventory and stock levels
• Generate QR codes for digital menus

Whether you're a casual wine enthusiast or a restaurant professional, Unbottl helps you make the perfect pour every time.

Download now and transform how you discover, manage, and enjoy wine!
```

**Keywords (max 100 characters):**

```
wine,sommelier,beverage,cellar,tasting,food pairing,restaurant,menu,inventory,collection
```

**What's New (for updates):**

```
Initial release! Welcome to Unbottl - your AI-powered wine companion.
```

#### Step 4: Add Screenshots

1. Click "App Store" tab
2. Scroll to "Screenshots"
3. Upload screenshots for each device size
4. Add optional captions below each screenshot

#### Step 5: Add App Preview (Optional)

Upload your video if you made one.

#### Step 6: Fill in Additional Information

**Age Rating:**

- Click "Edit" next to Age Rating
- Answer the questionnaire (your app is likely 4+ or 17+ due to alcohol content)
- Apple may require 17+ because your app deals with alcoholic beverages

**App Review Information:**

- Contact info for Apple reviewers
- Demo account (if your app requires login):
  - Provide test username/password
  - Or explain how to use the app without an account

---

## 12. Phase 10: Submit for Review

### Pre-Submission Checklist

Before clicking "Submit for Review," verify:

- [ ] All screenshots uploaded
- [ ] Description complete
- [ ] Privacy policy URL added
- [ ] Age rating set
- [ ] Pricing configured
- [ ] Build selected
- [ ] Export compliance answered

### Submitting

1. In App Store Connect, go to your app
2. Click on the version (1.0)
3. Scroll to the bottom
4. Click "Add for Review"
5. Answer any final questions
6. Click "Submit to App Review"

### What Happens Next

| Timeline    | What's Happening                     |
| ----------- | ------------------------------------ |
| 0-24 hours  | Your app enters the review queue     |
| 24-48 hours | An Apple reviewer tests your app     |
| 48-72 hours | You get approved or receive feedback |

### If You Get Rejected

Don't panic! This is common. Apple will tell you exactly what to fix.

**Common rejection reasons:**

1. **Crashes or bugs** - Fix and resubmit
2. **Missing privacy policy** - Add the URL
3. **Incomplete metadata** - Fill in missing fields
4. **Broken features** - Fix and resubmit
5. **Guideline violations** - Read their feedback carefully

You can reply to the reviewer through Resolution Center in App Store Connect.

---

## 13. Troubleshooting Common Issues

### Build Failures

**"Error: Could not find credentials"**

```bash
eas credentials
```

Then select iOS and follow prompts to create new credentials.

**"Error: Bundle identifier mismatch"**
Check that `app.json` has the same bundle ID as App Store Connect.

### Submission Issues

**"Missing compliance information"**
Go to TestFlight, click on your build, and answer the encryption questions.

**"Invalid binary"**
Your build may have issues. Check the EAS build logs for errors.

### Runtime Crashes

**App crashes on launch**

- Check if all environment variables are set
- Make sure the debug alert is removed
- Test in simulator first

---

## 14. Post-Launch Checklist

After your app is approved:

### Day 1

- [ ] Download your own app from the App Store
- [ ] Verify everything works
- [ ] Share on social media!

### Week 1

- [ ] Monitor crash reports in App Store Connect
- [ ] Read and respond to user reviews
- [ ] Check analytics for user behavior

### Ongoing

- [ ] Release bug fixes promptly
- [ ] Add new features based on feedback
- [ ] Keep dependencies updated
- [ ] Renew your Apple Developer account annually

---

## 15. Glossary of Terms

| Term                     | Simple Explanation                                                 |
| ------------------------ | ------------------------------------------------------------------ |
| **API Key**              | A password that lets your app talk to other services (like OpenAI) |
| **App Store Connect**    | Apple's website where you manage your app listing                  |
| **Binary**               | The actual app file that runs on iPhones                           |
| **Build**                | The process of turning your code into an app                       |
| **Bundle ID**            | A unique identifier for your app (like com.unbottl.app)            |
| **Certificate**          | A digital document proving you're a real developer                 |
| **EAS**                  | Expo's cloud service for building apps                             |
| **Environment Variable** | A setting stored outside your code (like passwords)                |
| **IPA**                  | The file format for iOS apps                                       |
| **Provisioning Profile** | Apple's permission slip for your app                               |
| **SKU**                  | A unique reference number you create for your app                  |
| **Supabase**             | A database service that stores your app's data                     |
| **Team ID**              | Your unique identifier in Apple's system                           |
| **TestFlight**           | Apple's app for testing apps before release                        |

---

## Quick Reference Card

### Important URLs

- Apple Developer: https://developer.apple.com
- App Store Connect: https://appstoreconnect.apple.com
- Expo: https://expo.dev
- EAS Build Dashboard: https://expo.dev/accounts/[your-username]/projects/unbottl/builds

### Key Commands

```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production

# Check build status
eas build:list

# Add environment secrets
eas secret:create --name KEY_NAME --value "value" --scope project
```

### Your App's Key Info

- **Bundle ID:** com.unbottl.app
- **App Name:** Unbottl
- **Version:** 1.0.0

---

## Need Help?

If you get stuck:

1. **Expo Forums:** https://forums.expo.dev
2. **Apple Developer Forums:** https://developer.apple.com/forums/
3. **Stack Overflow:** Search for your error message
4. **Expo Discord:** https://chat.expo.dev

---

_Good luck with your App Store submission! 🍷🎉_

_Guide created: February 2026_
_For: UnbottlApp by texas0418_
