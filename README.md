# ConnTrack — Logistics & Fleet Management Platform 🚚

**ConnTrack** is an end-to-end logistics platform for container transport — from the port, through clearance checkpoints, to the warehouse. It connects **operations staff, logistics coordinators, transport suppliers and drivers** in one system, with live GPS tracking, a supplier bidding marketplace, digital clearance documents and real-time issue reporting.

Built as a **microservices monorepo** (Turborepo) with 7 Node.js services, 4 React web portals and a React Native driver app, containerized with Docker and deployed on AWS.

---

## 🌐 Live Demo

**👉 [http://13.202.136.253:3001](http://13.202.136.253:3001)** — single login page; you are redirected to your portal based on your role.

| Portal | Email | Password |
| :--- | :--- | :--- |
| Operations | `testoperations@contrack.lk` | `tesruser` |
| Logistics | `testlogistics@contrack.lk` | `tesruser` |
| Supplier | `testsupplier@contrack.lk` | `testuser` |

> The Admin portal and the mobile driver app are not open to test users — see the screenshots below.

---

## ✨ Core Features

* **📍 Live GPS tracking** — drivers stream their location from the mobile app; web portals show it on interactive maps with reverse-geocoded place names.
* **💼 Supplier bidding** — transport suppliers bid on jobs, then manage assigned jobs, their drivers and vehicles.
* **📑 Digital clearance documents** — Gate Passes, Port Permits and BOI Clearance across Port, Warehouse and BOI checkpoints, with preview and download.
* **⚠️ Event-driven issue reporting** — vehicle breakdowns, delays and document problems are routed through RabbitMQ to the right teams as real-time notifications.
* **📊 Dashboards & reports** — order, logistics and staff overviews with charts for each role.
* **🌍 Multi-language driver app** — English, Sinhala (සිංහල) and Tamil (தமிழ்).
* **🔐 Role-based access** — separate portals for Admin, Operations, Logistics and Suppliers; JWT authentication for drivers.

---

## 📸 Screenshots

### Admin Portal

<img width="900" alt="Admin portal screenshot" src="https://github.com/user-attachments/assets/582602e8-2b63-4197-bd57-4a2acdca3c14" />
<img width="900" alt="Admin portal screenshot" src="https://github.com/user-attachments/assets/0a552967-6a0c-41c5-8660-5fedf034a452" />
<img width="900" alt="Admin portal screenshot" src="https://github.com/user-attachments/assets/4e6d1a64-8605-4b9f-ae55-e325d7728a12" />
<img width="900" alt="Admin portal screenshot" src="https://github.com/user-attachments/assets/d50a86ad-532c-4dee-9298-ec248789d0f9" />
<img width="900" alt="Admin portal screenshot" src="https://github.com/user-attachments/assets/8d40d162-002c-4b32-99de-38ec7a331980" />
<img width="900" alt="Admin portal screenshot" src="https://github.com/user-attachments/assets/e081f136-d1a4-43e4-93c2-d9e7de1549ac" />
<img width="900" alt="Admin portal screenshot" src="https://github.com/user-attachments/assets/677b979e-4fc0-4527-8476-35bbe1c00eff" />
<img width="900" alt="Admin portal screenshot" src="https://github.com/user-attachments/assets/5dc7f690-b76d-45fa-a87c-a016ae2a6b36" />
<img width="500" alt="Admin portal screenshot" src="https://github.com/user-attachments/assets/5ab98b80-e5d7-419a-a354-7ae3b1875edf" />
<img width="800" alt="Admin portal screenshot" src="https://github.com/user-attachments/assets/4f6d714c-8cfa-4b51-83da-a0d1d80910fd" />
<img width="900" alt="Admin portal screenshot" src="https://github.com/user-attachments/assets/c8dbf2a5-4da3-46ed-92d7-6d0ed1601259" />
<img width="900" alt="Admin portal screenshot" src="https://github.com/user-attachments/assets/8a1783c3-42e3-41e9-8456-4a9881800bdd" />

---

## 🏗️ Architecture

Services communicate synchronously through an **API Gateway** and asynchronously through **RabbitMQ**, with **Supabase** (PostgreSQL, Auth, Storage) as the shared data layer. Every service and portal runs in its own Docker container.

```text
             ┌─────────────────┐                           ┌────────────────┐
             │   Web Portals   │                           │ Mobile Driver  │
             │ (React + Vite)  │                           │ (React Native) │
             └───────┬─────────┘                           └───────┬────────┘
                     └──────────────────────┬──────────────────────┘
                                  ┌─────────▼─────────┐
                                  │    API Gateway    │ :5000
                                  └─────────┬─────────┘
     ┌──────────────┬──────────────┬────────┼──────────────┬──────────────┐
┌────▼─────┐   ┌────▼─────┐   ┌────▼────┐ ┌─▼────────┐   ┌─▼────────┐   ┌─▼────────┐
│ auth     │   │ admin    │   │ ops     │ │ logistics│   │ supplier │   │ driver   │
│ :5001    │   │ :5002    │   │ :5003   │ │ :5004    │   │ :5005    │   │ :5006    │
└────┬─────┘   └────┬─────┘   └────┬────┘ └─┬────────┘   └─┬────────┘   └─┬────────┘
     └──────────────┴──────────────┼────────┴──────────────┴──────────────┘
                   ┌───────────────┴───────────────┐
                   │  RabbitMQ (events) + Supabase │
                   └───────────────────────────────┘
```

---

## 📂 Workspace Structure

### Backend microservices (`apps/api-*`)

| Service | Port | Responsibility |
| :--- | :--- | :--- |
| [api-gateway](apps/api-gateway) | 5000 | Reverse proxy routing requests to all services |
| [api-auth](apps/api-auth) | 5001 | Login, JWT issuing/verification, role permissions |
| [api-admin](apps/api-admin) | 5002 | Staff, drivers, suppliers, orders and platform settings |
| [api-operations](apps/api-operations) | 5003 | Order creation, dispatching and issue handling |
| [api-logistics](apps/api-logistics) | 5004 | Shipment tracking, notifications and reports |
| [api-supplier](apps/api-supplier) | 5005 | Bidding, assigned jobs, supplier drivers and vehicles |
| [api-driver](apps/api-driver) | 5006 | Driver profiles, duty status, documents and live location |

### Web portals (`apps/web-*`)

| Portal | Port (Docker) | Purpose |
| :--- | :--- | :--- |
| [web-admin](apps/web-admin) | 3001 | Shared login + administration dashboard |
| [web-operations](apps/web-operations) | 3002 | Operations center for orders, dispatch and issues |
| [web-logistics](apps/web-logistics) | 3003 | Live tracking, order details, notifications and reports |
| [web-supplier](apps/web-supplier) | 3004 | Biddings, assigned jobs, driver and vehicle management |

### Mobile app

* [mobile-driver](apps/mobile-driver) — Expo / React Native app for drivers: GPS tracking, clearance documents, duty status, issue reporting and push notifications, in three languages.

### Shared packages (`packages/`)

* [@conntrack/api-core](packages/api-core) — shared Express middleware, auth/JWT helpers and response utilities
* [@conntrack/database](packages/database) — shared Supabase client
* [@conntrack/messaging](packages/messaging) — RabbitMQ (AMQP) publish/subscribe wrapper
* [@conntrack/ui](packages/ui) — shared React component library (Tailwind CSS, Radix UI)

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Monorepo** | Turborepo, npm workspaces |
| **Backend** | Node.js, Express (ESM), JWT, bcrypt |
| **Messaging** | RabbitMQ (AMQP) |
| **Database & storage** | Supabase — PostgreSQL, Auth, Storage buckets |
| **Web** | React 19, Vite, Tailwind CSS v4, Radix UI, Recharts, Leaflet |
| **Mobile** | React Native, Expo, expo-router, React Navigation, react-native-maps, i18next |
| **DevOps** | Docker, Docker Compose, Nginx, AWS EC2, GitHub Actions |

---

## 🚀 Deployment

* Each microservice and web portal has its own **Dockerfile**; the whole stack (including RabbitMQ) is orchestrated with **Docker Compose**.
* Web portals are built with Vite and served as static sites by **Nginx**.
* Production runs on **AWS EC2**. A **GitHub Actions** workflow ([deploy.yml](.github/workflows/deploy.yml)) deploys over SSH and can rebuild all services or only selected ones.

---

## 💻 Getting Started

### Prerequisites

* Node.js `>= 18`
* npm `>= 10`
* Docker Desktop (for RabbitMQ and the full container stack)
* A Supabase project (add its URL and keys to each app's `.env`)

### Install

```bash
git clone https://github.com/hemi-chk/conntrack-new.git
cd conntrack-new
npm install
```

### Run — local development (Turborepo)

```bash
npm run dev                          # all services and web portals
npm run dev -- --filter=web-logistics  # a single app
```

### Run — Docker Compose

```bash
docker compose up -d --build
```

### Run — mobile driver app

```bash
cd apps/mobile-driver
npx expo start
```

### Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Run all microservices and web portals concurrently |
| `npm run build` | Build all packages and apps |
| `npm run lint` | Run ESLint across the workspace |

---

## 📐 Coding Standards

* Keep microservices decoupled — use `@conntrack/messaging` (RabbitMQ) for cross-service events instead of direct service-to-service calls.
* Build UI with `@conntrack/ui` components and design tokens.
* Document controllers and service handlers with JSDoc.

---

## 👥 Team

* **Hemindi Kalubovila**
* **Binuwara Disanayake**
* **Ravindu Lakshan**
* **Shimra Foumy**
* **Fathima Ramaza**
