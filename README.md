# ConnTrack - Logistics Management System 🚚

Welcome to the **ConnTrack** platform. This repository contains the **Driver Mobile Application** and its associated **Node.js Backend**, providing a real-time, professional solution for logistics operations.

## 📱 Project Overview

The ConnTrack Driver system is designed to streamline delivery workflows. It focuses on high-accuracy tracking, robust document management, and professional user experiences.

### Key Features
- **Real-time GPS Tracking**: Integrated `expo-location` with live coordinate reporting and reverse-geocoded location names.
- **Dynamic Document Management**: Access to clearance documents (Gate Pass, Clearance Permits, etc.) with support for multiple location checkpoints (Port, Warehouse, BOI).
- **Driver Profile & Security**: 
    - Profile photo upload and management.
    - Duty status toggling (Active/Inactive).
    - Secure password update flow.
- **Multi-language Support (i18n)**: Full localization for English, Sinhala, and Tamil.
- **Notification System**: Real-time reporting and monitoring of issues (Vehicle issues, delays, etc.).

## 🛠️ Technology Stack

### Frontend (Mobile)
- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Navigation**: React Navigation (Stack & Tabs)
- **Localization**: `react-i18next`
- **Location Services**: `expo-location`

### Backend (Server)
- **Runtime**: Node.js & Express
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Storage**: Supabase Storage (for documents and profile photos)
- **Authentication**: Custom identifier-based logic (Driver ID / Employee ID)

---

## 🚀 Getting Started

### 1. Repository Setup
```bash
git clone https://github.com/hemi-chk/conntrack-new.git
cd conntrack-new
git checkout feature/driver-ui
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`.
   - Add your `SUPABASE_URL` and `SUPABASE_KEY`.
4. Start the server:
   ```bash
   npm run dev
   ```

### 3. Mobile App Setup
1. Navigate to the mobile driver directory:
   ```bash
   cd apps/mobile-driver
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure API endpoint:
   - Update `src/constants/config.js` with your local IP or server URL.
4. Start Expo:
   ```bash
   npx expo start
   ```

---

## 📂 Project Structure

```text
conntrack-new/
├── apps/
│   └── mobile-driver/       # Expo React Native application
│       ├── src/
│       │   ├── components/  # Atomic UI elements
│       │   ├── constants/   # Theme & Global Config
│       │   ├── i18n/        # Translation JSONs
│       │   ├── navigation/  # Navigation logic
│       │   └── screens/     # Dashboard, Tracking, Profile, etc.
├── backend/                 # Node.js Express server
│   ├── src/
│   │   ├── config/          # Supabase & DB connections
│   │   ├── controllers/     # Professional JSDoc documented logic
│   │   ├── routes/          # API endpoint definitions
│   └── scratch/             # Utility scripts
└── package.json             # Root monorepo configuration
```

## 🤝 Contribution Guidelines
When contributing, ensure all core logic is documented using JSDoc. Maintain modular UI components and follow the established color palette defined in `theme.js`.

---
© 2026 ConnTrack Logistics Management Systems
