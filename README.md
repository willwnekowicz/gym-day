# Gym Day

A simple push/pull workout tracker for iOS.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Expo Go](https://apps.apple.com/app/expo-go/id982107779) app installed on your iPhone

## Setup

```bash
# Install dependencies
npm install
```

## Running on iPhone

1. Start the development server:
   ```bash
   npm start
   ```

2. Scan the QR code with your iPhone camera (or open Expo Go and scan from there)

3. The app will load in Expo Go

## Building for App Store (EAS Build)

To create a production build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Build for iOS
eas build --platform ios
```

For App Store submission:
```bash
eas submit --platform ios
```

## Project Structure

- `App.js` - Main application code
- `app.json` - Expo configuration
- `eas.json` - EAS Build configuration
