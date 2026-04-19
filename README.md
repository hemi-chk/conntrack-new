# Logistics Management System - Driver App 🚚

Welcome to the **Driver App** interface for the Logistics Management System. This mobile application is built using **React Native** and **Expo**, designed to provide a seamless, real-time experience for delivery drivers.

## 📱 About the Project

This application is one of the five core interfaces in the broader Logistics Management System (which will eventually be structured as a Turborepo monorepo). It handles everything a driver needs on the road, including:
- Real-time route tracking and navigation.
- Order details and delivery management.
- Driver profile and vehicle information.
- Push notifications for new assignments.

## 🛠️ Tech Stack

- **Framework:** [React Native](https://reactnative.dev/)
- **Toolchain:** [Expo](https://expo.dev/)
- **Routing:** Expo Router / React Navigation
- **Architecture (Planned):** Will integrate with **Supabase** for real-time Postgres DB/Auth and **RabbitMQ** (via a Node.js backend) for scalable asynchronous task queueing.

## 🚀 Getting Started

Follow these steps to run the application locally on your machine.

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- Expo Go app installed on your physical device (iOS/Android), or an Android Emulator / iOS Simulator running on your computer.

### Installation

1. Clone the repository and checkout the driver UI branch:
   ```bash
   git clone https://github.com/hemi-chk/conntrack-new.git
   cd conntrack-new
   git checkout feature/driver-ui
   ```

2. Install the project dependencies:
   ```bash
   npm install
   ```

### Running the App

1. Start the Expo development server:
   ```bash
   npm start
   ```

2. Open the app:
   - **On a physical device:** Scan the QR code generated in your terminal using the Expo Go app.
   - **On Android Emulator:** Press `a` in the terminal.
   - **On iOS Simulator:** Press `i` in the terminal.

## 📂 Project Structure

```text
src/
├── components/      # Reusable UI elements (Buttons, Typography, Cards)
├── constants/       # Global constants like Colors, Theme, Styles
├── context/         # React Context providers (e.g., OrderContext)
├── i18n/            # Internationalization (en, si, ta)
├── navigation/      # Stack and Tab Navigators
└── screens/         # App screens (Dashboard, Tracking, Login, etc.)
```

## 🤝 Contributing

When contributing to this project, please ensure UI components remain modular and decoupled from complex business logic, as they will eventually be migrated to a shared `ui-components` package within our Turborepo architecture.
