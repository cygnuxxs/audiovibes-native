# AudioVibes 🎧

AudioVibes is a modern, personalized music sanctuary built with React Native and Expo. It offers an immersive offline and online listening experience with sleek, dynamic visuals.

## Features ✨

- **Music Playback**: Built with React Native Track Player for robust background audio processing.
- **Offline Mode**: Download your favorite tracks to your device and manage local storage securely.
- **Dynamic Theming**: Support for stunning Light and Dark modes with custom colors using NativeWind.
- **Modern UI Components**: Sleek buttons, wave progress indicators, bottom sheets, and interactive layouts.
- **Offline Storage Management**: Integrates easily with your device folders (Storage Access Framework on Android).

## Tech Stack 🛠

- **Framework**: [React Native](https://reactnative.dev) & [Expo](https://expo.dev)
- **Audio Engine**: [React Native Track Player](https://react-native-track-player.js.org/)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [TanStack React Query](https://tanstack.com/query)
- **Icons**: [Lucide React Native](https://lucide.dev/)

## Getting Started 🚀

### Prerequisites

Make sure you have Node.js and npm/yarn/pnpm installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/cygnuxxs/audiovibes-native.git
   ```
2. Navigate to the project directory:
   ```bash
   cd audiovibes-native
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

### Running the App

Start the Expo development server:

```bash
npx expo start
```

For Android:
```bash
npx expo run:android
```

For iOS:
```bash
npx expo run:ios
```

## Release APK 📦

A pre-built Android APK is included in the project for easy installation: [`app-release.apk`](./app-release.apk).

## License 📄

This project is licensed under the terms of the MIT license.
