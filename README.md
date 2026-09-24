# ConnTrack - Enterprise Logistics & Fleet Management System 

Welcome to **ConnTrack**, an enterprise logistics, fleet management, and supply chain tracking platform. Built as a modern monorepo using **Turborepo**, ConnTrack delivers real-time visibility, automated logistics workflows, multi-portal web applications, and a dedicated mobile driver application.

## Test it here:
http://13.202.136.253:3001/

# Operational interfcae
testoperations@contrack.lk - tesruser

# Logistics interface
testlogistics@contrack.lk - tesruser

# Supplier interface
testsupplier@contrack.lk - testuser

Admin interface and Mobile Application is not open for test users. 

Admin Interface images 
<img width="1890" height="858" alt="image" src="https://github.com/user-attachments/assets/0a552967-6a0c-41c5-8660-5fedf034a452" />
<img width="1880" height="740" alt="image" src="https://github.com/user-attachments/assets/4e6d1a64-8605-4b9f-ae55-e325d7728a12" />
<img width="1882" height="758" alt="image" src="https://github.com/user-attachments/assets/d50a86ad-532c-4dee-9298-ec248789d0f9" />
<img width="1878" height="758" alt="image" src="https://github.com/user-attachments/assets/8d40d162-002c-4b32-99de-38ec7a331980" />
<img width="1843" height="763" alt="image" src="https://github.com/user-attachments/assets/e081f136-d1a4-43e4-93c2-d9e7de1549ac" />
<img width="1885" height="865" alt="image" src="https://github.com/user-attachments/assets/677b979e-4fc0-4527-8476-35bbe1c00eff" />
<img width="1897" height="752" alt="image" src="https://github.com/user-attachments/assets/5dc7f690-b76d-45fa-a87c-a016ae2a6b36" />
<img width="827" height="783" alt="image" src="https://github.com/user-attachments/assets/5ab98b80-e5d7-419a-a354-7ae3b1875edf" />
<img width="1296" height="857" alt="image" src="https://github.com/user-attachments/assets/4f6d714c-8cfa-4b51-83da-a0d1d80910fd" />
<img width="1892" height="763" alt="image" src="https://github.com/user-attachments/assets/c8dbf2a5-4da3-46ed-92d7-6d0ed1601259" />
<img width="1850" height="758" alt="image" src="https://github.com/user-attachments/assets/8a1783c3-42e3-41e9-8456-4a9881800bdd" />


---

## Architecture Overview

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

##  Workspace Structure

###  Applications (`apps/`)

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

## Technology Stack

* **Monorepo Engine**: [Turborepo](https://turbo.build/) & npm Workspaces
* **Backend Microservices**: Node.js, Express.js
* **Messaging & Async Events**: [RabbitMQ](https://www.rabbitmq.com/) (AMQP)
* **Database & Storage**: [Supabase](https://supabase.com/) (PostgreSQL & Storage Buckets)
* **Web Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Recharts, Leaflet
* **Mobile Frontend**: React Native, Expo, React Navigation, `expo-location`, `react-i18next`
* **Containerization**: Docker & Docker Compose

---

##  Core Features

*  **Live GPS & Route Tracking**: Coordinate ingestion from mobile drivers with interactive map overlays on web portals.
*  **Document & Checkpoint Management**: Digital Gate Passes, Port Permits, and BOI Clearance verification with file preview and download capabilities.
*  **Multi-Language Support (i18n)**: Driver mobile localization supporting English, Sinhala (සිංහල), and Tamil (தமிழ்).
*  **Event-Driven Issue Reporting**: Real-time notifications and alerts for vehicle breakdowns, traffic delays, or document discrepancies routed through RabbitMQ.
*  **Secure Role-Based Authentication**: Custom JWT authentication tailored for mobile drivers alongside Supabase Auth for web dashboard users.

---

##  Getting Started

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


##  Running the Application

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

##  Available NPM Scripts

From the repository root:

| Script | Description |
| :--- | :--- |
| `npm run dev` | Runs all microservices and web portals concurrently using Turborepo |
| `npm run build` | Builds all packages and production artifacts across workspaces |
| `npm run lint` | Runs ESLint verification across all packages and apps |

---

##  Contribution & Coding Standards

* **JSDoc Documentation**: All core API controllers and service handlers must maintain JSDoc annotations.
* **Component Design**: UI components should leverage `@conntrack/ui` design tokens and atomic patterns.
* **Service Scoping**: Keep microservice responsibilities strictly decoupled; use `@conntrack/messaging` for cross-service events.

---


