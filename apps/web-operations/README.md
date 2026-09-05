ConTrack Operations Module

The Operations Module is part of the ConTrack logistics management platform. It supports the operational lifecycle of import and export orders from order creation through bidding, supplier award handling, driver assignment, shipment tracking, issue reporting, completion, and archiving.

Responsibilities

The Operations team is responsible for:

Creating import and export orders

Opening and closing supplier bidding

Reviewing bids and preparing a supplier shortlist

Sending shortlisted suppliers to Logistics

Receiving the supplier selected by Logistics

Sending the selected-supplier notice

Recording supplier acceptance or rejection

Handling alternate-supplier selection when the selected supplier rejects

Sending final result notifications to unsuccessful bidders

Monitoring driver and shipment tracking

Reporting operational issues

Archiving and unarchiving completed orders

Operations does not directly select the final winning supplier. Logistics selects the winner from the shortlist sent by Operations.

Tech Stack

Frontend

React

Vite

JavaScript

Tailwind CSS / project UI components

Backend

Node.js

Express.js

Database and Storage

Supabase

PostgreSQL

Supabase Storage

Integration

JWT authentication

Role-based access control

API Gateway

Messaging integration

Supabase RPC / database views

Testing

Vitest

Supertest

Module Architecture

Operations React Frontend
        |
        v
API Gateway
        |
        v
Operations Express API
        |
        +--------------------+
        |                    |
        v                    v
Supabase PostgreSQL     Messaging Layer
        |
        v
Orders / Bids / Tracking / Issues / Notifications

The frontend communicates with the Operations API through the configured API base URL. Authentication is handled by the application session/token flow, and protected Operations API routes require the Operations role.

Main Features

1. Dashboard

The Dashboard provides a summary of current Operations activity and recent orders.

Key functions include:

Order statistics

Recent order overview

Quick navigation to Orders and Create Order

Operational status visibility

2. Create Order

Operations can create both import and export orders.

Validation includes:

Required order information

Cargo weight validation

Pickup and expected arrival dates

Expected arrival must not be earlier than pickup

Active schedules cannot use expired dates

Import/export route validation

Supported Sri Lankan port validation

Commercial invoice and packing-list document upload

Order references follow the project convention:

Import  -> IMP-xxxxx
Export  -> EXP-xxxxx

3. Orders

The Orders page displays the operational state of each order.

Supported lifecycle stages include:

Created
Open for Bids
Bid Accepted
Driver Assigned
In Transit
At Freezone
At Port
Completed
Archived

Supplier and driver information is loaded from backend/database state.

Important workflow behaviour:

A supplier can be known at Bid Accepted before a driver is assigned.

Tracking begins from Driver Assigned.

Completed and archived orders retain supplier, driver, and tracking history.

Only completed orders can be archived.

Archived orders can be restored to completed.

Bidding and Award Workflow

The Operations bidding workflow is:

Order Created
      |
      v
Open Bidding
      |
      v
Suppliers Submit Bids
      |
      v
Operations Reviews Bids
      |
      v
Operations Creates Shortlist
      |
      v
Shortlist Sent to Logistics
      |
      v
Logistics Selects Supplier
      |
      v
Operations Sends Selected-Supplier Notice
      |
      v
Supplier Response
   /        \
Accept      Reject
  |           |
  v           v
Bid       Logistics Selects
Accepted   Alternate Supplier
  |
  v
Notify All Unsuccessful Bidders
  |
  v
Award Completed

Dynamic Shortlist Rule

The shortlist requirement depends on the total number of available bids:

Total Bids

Allowed Shortlist

0

Cannot send

1

Must send 1

2

Must send both

3

Must send all 3

4

3 to 4

5

3 to 5

6+

3 to 5

The shortlist can be prepared as a draft, but the minimum rule is enforced before sending to Logistics.

Unsuccessful Bidder Handling

After the selected supplier accepts:

The winner is confirmed.

Every other bidder becomes unsuccessful.

This includes both shortlisted and non-shortlisted suppliers.

Result notifications are tracked as pending or sent.

Operations can email unsuccessful suppliers using BCC and mark result notices as sent.

Expired Order Recovery

Orders in early workflow stages can be rescheduled when their dates become invalid.

Rescheduling is allowed only while the order is:

Created
Open for Bids

Rescheduling is blocked after the shortlist has been sent to Logistics.

Validation includes:

Pickup date cannot be in the past

Expected arrival cannot be in the past

Expected arrival cannot be earlier than pickup

This prevents expired orders from progressing incorrectly into supplier acceptance.

Tracking

Tracking begins only after a driver has been assigned.

Tracking Rules

Created          -> No tracking
Open for Bids    -> No tracking
Bid Accepted     -> No tracking

Driver Assigned  -> Tracking enabled
In Transit       -> Tracking enabled
At Freezone      -> Tracking enabled
At Port          -> Tracking enabled
Completed        -> Tracking history retained
Archived         -> Tracking history retained

Tracking data is stored in the backend/database and can be viewed for operational monitoring and shipment history.

Issues

Operations can create issue reports for orders after the bidding stage has progressed.

Issue records may include:

Order

Supplier

Driver

Issue type

Priority

Description

Reporter

Status

Supported priorities include:

Low
Medium
High
Critical

Archive / Unarchive

Archive

Allowed transition:

Completed -> Archived

Unarchive

Allowed transition:

Archived -> Completed

Archiving and unarchiving do not remove historical operational data such as:

Winning supplier

Winning bid

Driver assignment

Vehicle assignment

Tracking records

Tracking history

Award outcome history

Important Database Objects

The Operations module uses database objects including:

orders
bidding
bids
bid_selection
bid_award_attempts
bid_outcome_notifications
order_assignments
container_tracking
order_tracking_history
issues
suppliers
drivers
notifications
notification_operations

The bidding workflow also uses Operations-specific database views / RPC functions where configured.

Authentication and Authorization

Operations API routes are protected using:

verifyToken
authorizeRole('operations')

The frontend application maintains the authenticated session/token and sends authenticated requests to the protected API.

Only users with the Operations role should access Operations routes.

Automated Tests

The Operations API includes automated tests using Vitest and Supertest.

Current automated coverage includes:

Dynamic shortlist rules

Order-date validation

Tracking-stage rules

Archive rules

Unarchive rules

Real Express API archive/unarchive tests

Current test status:

Test Files: 5 passed
Tests:      36 passed
Failures:   0

Run the Operations test suite with:

npm --workspace apps/api-operations test

or from apps/api-operations:

npm test

Local Development

From the repository root:

npm install

Run the Operations API

cd apps/api-operations
npm run dev

Run the Operations Frontend

Open a second terminal:

cd apps/web-operations
npm run dev

Run Automated Tests

From the repository root:

npm --workspace apps/api-operations test

Build the Operations Frontend

npm --workspace apps/web-operations run build

Environment Configuration

The module expects environment variables for the configured backend and Supabase services.

Typical frontend variables include:

VITE_API_URL
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

Typical backend configuration includes:

SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PORT

Actual secret values must not be committed to Git.

Project Structure

apps/
├── api-operations/
│   ├── src/
│   │   ├── config/
│   │   └── routes/
│   ├── tests/
│   ├── index.js
│   └── package.json
│
└── web-operations/
    ├── src/
    │   ├── components/
    │   ├── Bidding.jsx
    │   ├── CreateOrder.jsx
    │   ├── Dashboard.jsx
    │   ├── Issues.jsx
    │   ├── Orders.jsx
    │   └── Tracking.jsx
    ├── README.md
    └── package.json

Current Engineering Notes

The Operations module currently prioritizes functional workflow correctness and backend integration. Future maintainability improvements can include:

Splitting large page components into reusable components and hooks

Splitting the Operations API into smaller route/controller/service modules

Version-controlled database migrations

Additional integration and end-to-end tests

Automated CI quality gates for tests, linting, and builds

Stronger tracking data validation

Formal API DTO/schema validation

Summary

The Operations module implements the operational lifecycle of ConTrack from order creation through bidding, supplier award management, shipment tracking, issue handling, completion, and archival.

The module contains real backend/database integration, cross-role bidding workflow logic, validation, notifications, tracking, and automated tests rather than functioning as a UI-only prototype.