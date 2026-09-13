# ConnTrack - Enterprise Logistics & Fleet Management System 🚚

Welcome to **ConnTrack**, an enterprise logistics, fleet management, and supply chain tracking platform. Built as a modern monorepo using **Turborepo**, ConnTrack delivers real-time visibility, automated logistics workflows, multi-portal web applications, and a dedicated mobile driver application.

---

## 🏗️ Architecture Overview

ConnTrack is structured as a **Microservices Monorepo** managed with `npm` workspaces and `Turborepo`. Services communicate synchronously via an **API Gateway** and asynchronously via **RabbitMQ** message queues, using **Supabase** (PostgreSQL) for unified persistence and storage.

```text
                               ┌─────────────────────────┐
                               │       Client Apps       │
                               └────────────┬────────────┘
                                            │
                     ┌──────────────────────┴──────────────────────┐
                     │                                             │
             ┌───────▼─────────┐                           ┌───────▼────────┐
             │   Web Portals   │                           │ Mobile Driver  │
             │ (React + Vite)  │                           │ (React Native) │
             └───────┬─────────┘                           └───────┬────────┘
                     │                                             │
                     └──────────────────────┬──────────────────────┘
                                            │
                                  ┌─────────▼─────────┐
                                  │    API Gateway    │ (Port 5000)
                                  └─────────┬─────────┘
                                            │
     ┌──────────────┬──────────────┬────────┼──────────────┬──────────────┐
     │              │              │        │              │              │
┌────▼─────┐   ┌────▼─────┐   ┌────▼────┐ ┌─▼────────┐   ┌─▼────────┐   ┌─▼────────┐
│api-auth  │   │api-admin │   │api-oper │ │api-logis │   │api-suppl │   │api-driver│
│(Port 5001)   │(Port 5002)   │(P:5003) │ │(P:5004)  │   │(P:5005)  │   │(P:5006)  │
└────┬─────┘   └────┬─────┘   └────┬────┘ └─┬────────┘   └─┬────────┘   └─┬────────┘
     │              │              │        │              │              │
     └──────────────┴──────────────┼────────┴──────────────┴──────────────┘
                                   │
                   ┌───────────────┴───────────────┐
                   │  RabbitMQ Broker + Supabase   │
                   └───────────────────────────────┘
```

---

## 📦 Workspace Structure

### 🚀 Applications (`apps/`)

#### Backend Microservices
* **[api-gateway](file:///c:/Users/HP/Desktop/conntrack-new/apps/api-gateway)** *(Port 5000)*: Central routing proxy directing traffic across microservices.
* **[api-auth](file:///c:/Users/HP/Desktop/conntrack-new/apps/api-auth)** *(Port 5001)*: Authentication, JWT token verification, and role permissions.
* **[api-admin](file:///c:/Users/HP/Desktop/conntrack-new/apps/api-admin)** *(Port 5002)*: Platform settings, user management, and audit logs.
* **[api-operations](file:///c:/Users/HP/Desktop/conntrack-new/apps/api-operations)** *(Port 5003)*: Dispatching, task assignment, and fleet operations logic.
* **[api-logistics](file:///c:/Users/HP/Desktop/conntrack-new/apps/api-logistics)** *(Port 5004)*: Shipment routing, tracking updates, and analytics/reporting.
* **[api-supplier](file:///c:/Users/HP/Desktop/conntrack-new/apps/api-supplier)** *(Port 5005)*: Supplier order management, inventory dispatching, and vendor APIs.
* **[api-driver](file:///c:/Users/HP/Desktop/conntrack-new/apps/api-driver)** *(Port 5006)*: Driver profile management, duty status, document verification, and live location ingestion.

#### Web Portals
* **[web-admin](file:///c:/Users/HP/Desktop/conntrack-new/apps/web-admin)**: Enterprise administration dashboard for system configurability and user management.
* **[web-logistics](file:///c:/Users/HP/Desktop/conntrack-new/apps/web-logistics)**: Logistics management portal for trip scheduling, live tracking, and document verification.
* **[web-operations](file:///c:/Users/HP/Desktop/conntrack-new/apps/web-operations)**: Real-time operations center for dispatch monitoring and issue management.
* **[web-supplier](file:///c:/Users/HP/Desktop/conntrack-new/apps/web-supplier)**: Vendor dashboard to manage goods dispatch, manifests, and delivery statuses.

#### Mobile Applications
* **[mobile-driver](file:///c:/Users/HP/Desktop/conntrack-new/apps/mobile-driver)**: Cross-platform mobile app (iOS/Android) for drivers with location tracking, document viewing (Gate Pass, BOI Clearance, Port Permits), duty status management, and offline-capable notifications.

---

### 🧩 Shared Packages (`packages/`)

* **[@conntrack/api-core](file:///c:/Users/HP/Desktop/conntrack-new/packages/api-core)**: Shared Express middleware, standardized response helpers, error handlers, and authentication utilities.
* **[@conntrack/database](file:///c:/Users/HP/Desktop/conntrack-new/packages/database)**: Shared Supabase DB client initializers and common database querying modules.
* **[@conntrack/messaging](file:///c:/Users/HP/Desktop/conntrack-new/packages/messaging)**: RabbitMQ AMQP wrapper routines for event pub/sub across backend microservices.
* **[@conntrack/ui](file:///c:/Users/HP/Desktop/conntrack-new/packages/ui)**: Shared UI component design system (Tailwind CSS, Radix UI primitives, icons, and theme configuration).

---

## 🛠️ Technology Stack

* **Monorepo Engine**: [Turborepo](https://turbo.build/) & npm Workspaces
* **Backend Microservices**: Node.js, Express.js
* **Messaging & Async Events**: [RabbitMQ](https://www.rabbitmq.com/) (AMQP)
* **Database & Storage**: [Supabase](https://supabase.com/) (PostgreSQL & Storage Buckets)
* **Web Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Recharts, Leaflet
* **Mobile Frontend**: React Native, Expo, React Navigation, `expo-location`, `react-i18next`
* **Containerization**: Docker & Docker Compose

---

## 🔑 Core Features

* 📍 **Live GPS & Route Tracking**: Coordinate ingestion from mobile drivers with interactive map overlays on web portals.
* 📄 **Document & Checkpoint Management**: Digital Gate Passes, Port Permits, and BOI Clearance verification with file preview and download capabilities.
* 🌐 **Multi-Language Support (i18n)**: Driver mobile localization supporting English, Sinhala (සිංහල), and Tamil (தமிழ்).
* 🚨 **Event-Driven Issue Reporting**: Real-time notifications and alerts for vehicle breakdowns, traffic delays, or document discrepancies routed through RabbitMQ.
* 🔐 **Secure Role-Based Authentication**: Custom JWT authentication tailored for mobile drivers alongside Supabase Auth for web dashboard users.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your local system:
* **Node.js** `>= 18.0.0`
* **npm** `>= 10.0.0`
* **Docker Desktop** (for RabbitMQ & full container stack)

### 2. Installation
Clone the repository and install dependencies at the monorepo root:

```bash
git clone https://github.com/hemi-chk/conntrack-new.git
cd conntrack-new
npm install
```

### 3. Environment Configuration
Copy `.env.example` to create `.env` in the root directory and configure your Supabase credentials and secret keys:

```bash
cp .env.example .env
```

Key environment variables:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
DRIVER_JWT_SECRET=your-random-jwt-secret
AMQP_URL=amqp://conntrack:conntrack123@localhost:5672
```

---

## 💻 Running the Application

### Option A: Local Development Mode (Turborepo)

Start all backend services and web applications concurrently:

```bash
npm run dev
```

To run a specific application individually:
```bash
npm run dev --filter=web-logistics
# or
npm run dev --filter=api-driver
```

### Option B: Running via Docker Compose

Spin up RabbitMQ and all containerized microservices:

```bash
docker-compose up -d
```

### Option C: Mobile Driver App Setup

To start the Expo development server for the mobile app:

```bash
cd apps/mobile-driver
npm install
npx expo start
```

---

## 📜 Available NPM Scripts

From the repository root:

| Script | Description |
| :--- | :--- |
| `npm run dev` | Runs all microservices and web portals concurrently using Turborepo |
| `npm run build` | Builds all packages and production artifacts across workspaces |
| `npm run lint` | Runs ESLint verification across all packages and apps |

---

## 🤝 Contribution & Coding Standards

* **JSDoc Documentation**: All core API controllers and service handlers must maintain JSDoc annotations.
* **Component Design**: UI components should leverage `@conntrack/ui` design tokens and atomic patterns.
* **Service Scoping**: Keep microservice responsibilities strictly decoupled; use `@conntrack/messaging` for cross-service events.

---

© 2026 ConnTrack Logistics Management Systems. All rights reserved.
