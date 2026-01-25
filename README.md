# Unbottl - Wine & Beverage App

## Building for iOS with Xcode

### Prerequisites
- macOS with Xcode 15+
- Node.js 18+ 
- CocoaPods (`sudo gem install cocoapods`)

### IMPORTANT: Use a folder path WITHOUT spaces!

```bash
# Extract to a path WITHOUT spaces (this is critical!)
unzip UnbottlApp.zip -d ~/UnbottlApp
cd ~/UnbottlApp

# Install dependencies
npm install

# Generate iOS project
npx expo prebuild --platform ios --clean

# Install CocoaPods
cd ios
pod install
cd ..

# Open in Xcode
open ios/*.xcworkspace
```

### In Xcode:
1. Select a simulator from **Product → Destination → iPhone 15 Pro**
2. Click the **Play button ▶** to build and run
3. If you get signing errors:
   - Click on the project in the left sidebar
   - Go to **Signing & Capabilities**
   - Check **Automatically manage signing**
   - Select your team

### Troubleshooting

**"No such file or directory" errors:**
- Make sure your project path has NO SPACES
- Move to ~/UnbottlApp or similar

**Signing errors:**
- Go to Signing & Capabilities and select your Apple Developer team

**Pod install errors:**
```bash
cd ios
pod deintegrate
pod install --repo-update
```

## Features
- 🍷 Wine Catalog Management
- 🍺 Beverage Tracking (Beer, Spirits, Cocktails)
- 📱 Wine Label Scanner
- 🤖 AI Sommelier Chat
- 📋 Menu Management
- 📊 Analytics Dashboard
