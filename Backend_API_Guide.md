# SVSS — Backend API Specification
## Smart Venue Security System

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Base Configuration](#2-base-configuration)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Database Schema](#4-database-schema)
5. [Data Models / Schemas](#5-data-models--schemas)
6. [Module 1 — Staff Authentication](#6-module-1--staff-authentication)
7. [Module 2 — Customer Authentication](#7-module-2--customer-authentication)
8. [Module 3 — Session / Profile](#8-module-3--session--profile)
9. [Module 4 — Tickets (Admin)](#9-module-4--tickets-admin)
10. [Module 5 — QR Verification (Security)](#10-module-5--qr-verification-security)
11. [Module 6 — Incidents](#11-module-6--incidents)
12. [Module 7 — Users (Admin)](#12-module-7--users-admin)
13. [Module 8 — Dashboard & Reports](#13-module-8--dashboard--reports)
14. [Module 9 — Events (Customer)](#14-module-9--events-customer)
15. [Module 10 — Customer Tickets](#15-module-10--customer-tickets)
16. [Error Handling](#16-error-handling)
17. [File Upload Handling](#17-file-upload-handling)
18. [Security Requirements](#18-security-requirements)
19. [Environment Variables](#19-environment-variables)
20. [Complete Endpoint Summary](#20-complete-endpoint-summary)

---

## 1. Project Overview

**System Name:** Smart Venue Security System (SVSS)

**Purpose:**
A venue security and ticket management platform serving three user roles:

| Role | Portal URL | Description |
|------|-----------|-------------|
| `admin` | `/login` | Creates tickets, manages users, views reports and incidents |
| `security` | `/login` | Scans QR codes, verifies visitor entry, reports incidents |
| `customer` | `/customer/login` | Browses events, purchases tickets, views their own QR passes |

**Two completely independent authentication flows — never mix them:**
- **Staff Auth** — `/api/auth/*` — only creates/validates `admin` and `security` accounts
- **Customer Auth** — `/api/customer/auth/*` — only creates/validates `customer` accounts

**Frontend API client:** Axios instance, base URL from `VITE_API_BASE_URL` env var (defaults to `/api`).
Attaches `Authorization: Bearer <token>` on every request. Handles global `401` by logging out and redirecting to the appropriate login page.

---

## 2. Base Configuration

### Base URL
```
/api
```

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <jwt_token>    ← required on all protected routes
```

For file upload endpoints use `Content-Type: multipart/form-data` (set automatically by the HTTP client).

### Response Envelope

All responses follow a consistent structure:

```json
// Success (single resource)
{
  "success": true,
  "data": { ... }
}

// Success (list)
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 150,
    "totalPages": 8
  }
}

// Error
{
  "success": false,
  "message": "Human-readable summary of what went wrong.",
  "errors": [
    { "field": "email", "message": "Email is already in use." }
  ]
}
```

- `errors` array is only present on `400`/`422` responses.
- Never include a `data` key in error responses.
- Never include stack traces in production.

### Pagination
All list endpoints support pagination via query params:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed) |
| `pageSize` | integer | 20 | Items per page (max 100) |

---

## 3. Authentication & Authorization

### Token Strategy
- Use **JWT (JSON Web Token)** — Bearer token in the `Authorization` header.
- Token payload **must** include: `id`, `email`, `role`, `status`.
- Access token expiry: **24 hours**.
- Optionally implement refresh tokens (separate `refreshToken` in response, long-lived, stored in `httpOnly` cookie).

### Role Guard — Every Protected Route Must:
1. Confirm `Authorization: Bearer <token>` header is present.
2. Verify the token signature and expiry.
3. Confirm `user.status === "active"` — inactive users are rejected with `403`.
4. Confirm `user.role` is in the allowed roles list for that route.

### Portal Isolation Rules
- `POST /api/auth/login` — if credentials belong to a `customer` account → `403`
- `POST /api/customer/auth/login` — if credentials belong to an `admin` or `security` account → `403`
- Never allow a customer token to access any `/api/tickets`, `/api/users`, `/api/incidents`, `/api/dashboard`, or `/api/reports` endpoint.

### Role Permission Matrix

| Endpoint | `admin` | `security` | `customer` |
|----------|:-------:|:----------:|:----------:|
| `POST /api/auth/login` | Public | Public | ❌ Blocked |
| `POST /api/auth/register` | Public | Public | ❌ Blocked |
| `POST /api/customer/auth/login` | ❌ Blocked | ❌ Blocked | Public |
| `POST /api/customer/auth/register` | ❌ Blocked | ❌ Blocked | Public |
| `GET /api/me` | ✅ | ✅ | ✅ |
| `GET /api/tickets` | ✅ | ✅ | ❌ |
| `GET /api/tickets/:id` | ✅ | ✅ | ❌ |
| `POST /api/tickets` | ✅ | ❌ | ❌ |
| `PUT /api/tickets/:id` | ✅ | ❌ | ❌ |
| `POST /api/tickets/verify` | ❌ | ✅ | ❌ |
| `POST /api/tickets/:id/approve` | ❌ | ✅ | ❌ |
| `POST /api/tickets/:id/reject` | ❌ | ✅ | ❌ |
| `GET /api/incidents` | ✅ | ✅ | ❌ |
| `GET /api/incidents/:id` | ✅ | ✅ | ❌ |
| `POST /api/incidents` | ❌ | ✅ | ❌ |
| `PATCH /api/incidents/:id/status` | ✅ | ❌ | ❌ |
| `GET /api/users` | ✅ | ❌ | ❌ |
| `POST /api/users` | ✅ | ❌ | ❌ |
| `PATCH /api/users/:id/status` | ✅ | ❌ | ❌ |
| `GET /api/dashboard/stats` | ✅ | ✅ | ❌ |
| `GET /api/dashboard/scans` | ✅ | ✅ | ❌ |
| `GET /api/reports/tickets` | ✅ | ❌ | ❌ |
| `GET /api/reports/incidents` | ✅ | ❌ | ❌ |
| `GET /api/reports/entries` | ✅ | ❌ | ❌ |
| `GET /api/events` | ❌ | ❌ | ✅ |
| `GET /api/events/:id` | ❌ | ❌ | ✅ |
| `GET /api/customer/tickets` | ❌ | ❌ | ✅ |
| `GET /api/customer/tickets/:id` | ❌ | ❌ | ✅ |
| `POST /api/customer/tickets/purchase` | ❌ | ❌ | ✅ |

---

## 4. Database Schema

Recommended relational schema. Use PostgreSQL (or any relational DB). All `id` fields use UUID v4.

### `users`
```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,          -- bcrypt hash
  role       VARCHAR(20)  NOT NULL CHECK (role IN ('admin','security','customer')),
  status     VARCHAR(20)  NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### `events`
```sql
CREATE TABLE events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  venue       VARCHAR(255) NOT NULL,
  date        DATE NOT NULL,
  time        VARCHAR(10)  NOT NULL,         -- e.g. '19:00'
  category    VARCHAR(50)  NOT NULL,
  image_url   TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### `event_zones`
```sql
CREATE TABLE event_zones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name       VARCHAR(50)  NOT NULL,          -- VIP | Premium | General | Standard
  price      NUMERIC(10,2) NOT NULL,
  available  INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, name)
);
```

### `tickets`
Unified table for both admin-created and customer self-purchased tickets.
```sql
CREATE TABLE tickets (
  id            VARCHAR(20)  PRIMARY KEY,    -- e.g. TKT-001 or TKT-C001
  visitor_name  VARCHAR(255) NOT NULL,
  visitor_email VARCHAR(255),
  event_id      UUID REFERENCES events(id) ON DELETE SET NULL,
  event         VARCHAR(255) NOT NULL,       -- denormalized event name snapshot
  event_date    DATE,
  venue         VARCHAR(255),
  zone          VARCHAR(50)  NOT NULL,
  seat          VARCHAR(50)  NOT NULL,
  price         NUMERIC(10,2),               -- null for admin-created tickets
  status        VARCHAR(20)  NOT NULL DEFAULT 'valid' CHECK (status IN ('valid','used','invalid')),
  used_at       TIMESTAMPTZ,
  qr_data       TEXT UNIQUE NOT NULL,
  photo_url     TEXT,
  owner_id      UUID REFERENCES users(id) ON DELETE SET NULL,  -- null for admin tickets
  purchased_at  TIMESTAMPTZ,                -- null for admin-created tickets
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_status   ON tickets(status);
CREATE INDEX idx_tickets_owner    ON tickets(owner_id);
CREATE INDEX idx_tickets_qr_data  ON tickets(qr_data);
```

### `incidents`
```sql
CREATE TABLE incidents (
  id           VARCHAR(20)  PRIMARY KEY,    -- e.g. INC-001
  type         VARCHAR(30)  NOT NULL CHECK (type IN ('duplicate','suspicious','invalid','other')),
  ticket_id    VARCHAR(20)  REFERENCES tickets(id) ON DELETE SET NULL,
  description  TEXT NOT NULL,
  reported_by_id UUID NOT NULL REFERENCES users(id),
  status       VARCHAR(30)  NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_type   ON incidents(type);
```

### `scan_logs`
```sql
CREATE TABLE scan_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   VARCHAR(20) REFERENCES tickets(id) ON DELETE SET NULL,
  visitor_name VARCHAR(255),               -- denormalized snapshot
  result      VARCHAR(20) NOT NULL CHECK (result IN ('approved','rejected')),
  scanned_by  UUID NOT NULL REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scan_logs_created ON scan_logs(created_at DESC);
```

### Sequential ID Generation
Admin tickets: `TKT-001`, `TKT-002`, … (use a DB sequence or `LPAD(nextval('ticket_seq')::text, 3, '0')`)
Customer tickets: `TKT-C001`, `TKT-C002`, … (separate sequence with `C` prefix)
Incidents: `INC-001`, `INC-002`, … (separate sequence)

---

## 5. Data Models / Schemas

These are the JSON shapes returned by the API (camelCase, mapped from snake_case DB columns).

### User
```json
{
  "id": "uuid",
  "name": "Alice Admin",
  "email": "admin@svss.io",
  "role": "admin | security | customer",
  "status": "active | inactive",
  "createdAt": "2026-01-10"
}
```
> Password is **never** included in any API response.

### Ticket (unified — admin-created and customer-purchased)
```json
{
  "id": "TKT-001",
  "visitorName": "John Doe",
  "visitorEmail": "john@email.com",
  "eventId": "uuid | null",
  "event": "Rock Concert 2026",
  "eventDate": "2026-09-15",
  "venue": "Grand Arena, Downtown",
  "zone": "VIP",
  "seat": "A12",
  "price": 250,
  "status": "valid | used | invalid",
  "usedAt": "ISO 8601 datetime | null",
  "qrData": "TKT-001|John Doe|Rock Concert 2026|VIP|A12",
  "photoUrl": "https://storage.example.com/photos/tkt001.jpg | null",
  "ownerId": "uuid | null",
  "purchasedAt": "ISO 8601 datetime | null",
  "createdAt": "2026-06-01"
}
```
- `ownerId` / `purchasedAt` / `price` are `null` for admin-created tickets.
- For customer-purchased tickets these are always populated.

### Event
```json
{
  "id": "EVT-001",
  "name": "Rock Concert 2026",
  "venue": "Grand Arena, Downtown",
  "date": "2026-09-15",
  "time": "19:00",
  "category": "Concert | Expo | Conference | Festival",
  "image": "https://storage.example.com/events/evt001.jpg",
  "description": "An electrifying night of rock music...",
  "zones": [
    { "name": "VIP",      "price": 250, "available": 20 },
    { "name": "Premium",  "price": 150, "available": 45 },
    { "name": "General",  "price": 80,  "available": 120 },
    { "name": "Standard", "price": 50,  "available": 200 }
  ]
}
```

### Incident
```json
{
  "id": "INC-001",
  "type": "duplicate | suspicious | invalid | other",
  "ticketId": "TKT-002 | null",
  "description": "Ticket scanned a second time at Gate 3.",
  "reportedBy": "Bob Security",
  "reportedById": "uuid",
  "status": "open | investigating | resolved",
  "createdAt": "2026-06-20T18:35:00.000Z"
}
```
> `reportedBy` is a denormalized name snapshot. `reportedById` is the foreign key for joins.

### Scan Log
```json
{
  "id": "uuid",
  "ticketId": "TKT-001",
  "visitorName": "John Doe",
  "result": "approved | rejected",
  "scannedBy": "uuid",
  "time": "2026-06-23T08:10:00.000Z"
}
```

### Dashboard Stats
```json
{
  "totalTickets": 512,
  "usedTickets": 318,
  "validTickets": 189,
  "invalidTickets": 5,
  "totalEntries": 318,
  "approvedEntries": 305,
  "rejectedEntries": 13,
  "totalIncidents": 7,
  "openIncidents": 3,
  "todayScans": 42
}
```

---

## 6. Module 1 — Staff Authentication

> Routes for `admin` and `security` roles only. Customer accounts are hard-blocked.

---

### POST `/api/auth/login`

**Description:** Authenticate a staff member.

**Access:** Public

**Request Body:**
```json
{
  "email": "admin@svss.io",
  "password": "yourpassword"
}
```

**Validation:**
- `email` — required, valid email format
- `password` — required, minimum 4 characters

**Business Rules:**
1. Look up user by `email` where `status = 'active'`
2. If user `role === 'customer'` → return `403`: `"Customer accounts must use the Customer Portal to sign in."`
3. Verify `password` against stored bcrypt hash
4. Generate and return JWT token

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "u1",
      "name": "Alice Admin",
      "email": "admin@svss.io",
      "role": "admin",
      "status": "active",
      "createdAt": "2026-01-10"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `400` | Missing or invalid fields |
| `401` | Email not found or password mismatch |
| `403` | Account is inactive |
| `403` | Account belongs to `customer` role |

---

### POST `/api/auth/register`

**Description:** Register a new staff account (`admin` or `security` only).

**Access:** Public *(restrict to admin-only or invite-only in production)*

**Request Body:**
```json
{
  "firstName": "Bob",
  "lastName": "Security",
  "email": "bob@svss.io",
  "role": "security",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

**Validation:**
- `firstName`, `lastName` — required, non-empty string
- `email` — required, valid email format, unique across ALL users
- `role` — required, must be `admin` or `security`; return `400` if `customer` is submitted
- `password` — required, minimum 8 characters, must contain at least one number
- `confirmPassword` — must match `password`

**Business Rules:**
- Reject `role = "customer"` with message: `"Staff registration does not accept the customer role."`
- Hash password with bcrypt (cost ≥ 12)
- Set `status = "active"` by default
- Return user object (no password) and JWT token

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "u6",
      "name": "Bob Security",
      "email": "bob@svss.io",
      "role": "security",
      "status": "active",
      "createdAt": "2026-07-12"
    },
    "token": "eyJhbGci..."
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `400` | Validation errors (includes role = customer attempt) |
| `409` | Email already exists |

---

### POST `/api/auth/logout`

**Description:** Invalidate the current session token.

**Access:** Protected (`admin`, `security`)

**Request Body:** none

**Business Rules:**
- Stateless JWT: return `200` immediately (client deletes the token).
- Token blocklist (optional): add the token `jti` claim to a Redis/DB blocklist with TTL matching remaining token lifetime.

**Success Response `200`:**
```json
{
  "success": true,
  "data": { "message": "Logged out successfully." }
}
```

---

## 7. Module 2 — Customer Authentication

> Dedicated, fully isolated routes for `customer` role. Staff accounts are hard-blocked.

---

### POST `/api/customer/auth/login`

**Description:** Authenticate a customer account.

**Access:** Public

**Request Body:**
```json
{
  "email": "eva@example.com",
  "password": "yourpassword"
}
```

**Validation:**
- `email` — required, valid email format
- `password` — required, minimum 4 characters

**Business Rules:**
1. Look up user by `email` where `status = 'active'`
2. If user `role` is `admin` or `security` → return `403`: `"Staff accounts must use the Staff Portal to sign in."`
3. Verify password hash
4. Generate and return JWT token

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "u5",
      "name": "Eva Customer",
      "email": "eva@svss.io",
      "role": "customer",
      "status": "active",
      "createdAt": "2026-03-01"
    },
    "token": "eyJhbGci..."
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `400` | Missing or invalid fields |
| `401` | Email not found or password mismatch |
| `403` | Account is inactive |
| `403` | Account belongs to `admin` or `security` role |

---

### POST `/api/customer/auth/register`

**Description:** Register a new customer account. Role is always forced to `customer` server-side — never user-supplied.

**Access:** Public

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

**Validation:**
- `firstName`, `lastName` — required, non-empty string
- `email` — required, valid email, unique across ALL users (staff + customers share the same users table)
- `password` — required, minimum 8 characters, at least one number
- `confirmPassword` — must match `password`
- **`role` field is ignored entirely** if submitted — always set server-side

**Business Rules:**
- Forcibly set `role = "customer"` regardless of any submitted `role` value
- Hash password (bcrypt, cost ≥ 12)
- Default `status = "active"`
- Return user and JWT token

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "customer",
      "status": "active",
      "createdAt": "2026-07-12"
    },
    "token": "eyJhbGci..."
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `400` | Validation errors |
| `409` | Email already exists |

---

### POST `/api/customer/auth/logout`

**Description:** Logout from the customer portal.

**Access:** Protected (`customer`)

**Success Response `200`:**
```json
{
  "success": true,
  "data": { "message": "Logged out successfully." }
}
```

---

## 8. Module 3 — Session / Profile

> Shared endpoint available to all authenticated roles. Used by the FE to re-validate a persisted token after a page refresh.

---

### GET `/api/me`

**Description:** Returns the authenticated user's profile from the current JWT token. Used on app load to confirm the session is still valid and the account is still active.

**Access:** Protected (`admin`, `security`, `customer`)

**Request Body:** none

**Business Rules:**
- Decode token, look up user by `id`
- If user no longer exists or `status = "inactive"` → return `401`
- Return current user object (no password)

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "u1",
    "name": "Alice Admin",
    "email": "admin@svss.io",
    "role": "admin",
    "status": "active",
    "createdAt": "2026-01-10"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `401` | Token missing, expired, or invalid |
| `401` | User not found or deactivated since token was issued |

---

## 9. Module 4 — Tickets (Admin)

> Admin creates and manages tickets. Security staff can read them for verification context.

---

### GET `/api/tickets`

**Description:** Get all tickets. Supports search and status filtering.

**Access:** Protected (`admin`, `security`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Filter by visitor name, ticket ID, or event name (case-insensitive) |
| `status` | string | `valid`, `used`, or `invalid` |
| `page` | integer | Default: 1 |
| `pageSize` | integer | Default: 20 |

**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "TKT-001",
      "visitorName": "John Doe",
      "visitorEmail": "john@email.com",
      "eventId": null,
      "event": "Rock Concert 2026",
      "eventDate": "2026-09-15",
      "venue": "Grand Arena, Downtown",
      "zone": "VIP",
      "seat": "A12",
      "price": null,
      "status": "valid",
      "usedAt": null,
      "qrData": "TKT-001|John Doe|Rock Concert 2026|VIP|A12",
      "photoUrl": "https://storage.example.com/photos/tkt001.jpg",
      "ownerId": null,
      "purchasedAt": null,
      "createdAt": "2026-06-01"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 5, "totalPages": 1 }
}
```

---

### GET `/api/tickets/:id`

**Description:** Get a single ticket by its ID (works for both `TKT-XXX` and `TKT-CXXX` IDs).

**Access:** Protected (`admin`, `security`)

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "TKT-001",
    "visitorName": "John Doe",
    "visitorEmail": "john@email.com",
    "eventId": null,
    "event": "Rock Concert 2026",
    "eventDate": "2026-09-15",
    "venue": "Grand Arena, Downtown",
    "zone": "VIP",
    "seat": "A12",
    "price": null,
    "status": "valid",
    "usedAt": null,
    "qrData": "TKT-001|John Doe|Rock Concert 2026|VIP|A12",
    "photoUrl": "https://storage.example.com/photos/tkt001.jpg",
    "ownerId": null,
    "purchasedAt": null,
    "createdAt": "2026-06-01"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `404` | Ticket not found |

---

### POST `/api/tickets`

**Description:** Admin creates a new ticket with visitor identity photo.

**Access:** Protected (`admin`)

**Content-Type:** `multipart/form-data`

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `visitorName` | string | ✅ | Full name of visitor |
| `visitorEmail` | string | ✅ | Valid email address |
| `event` | string | ✅ | Event name |
| `eventDate` | date | ✅ | Format: `YYYY-MM-DD` |
| `zone` | string | ✅ | `VIP`, `Premium`, `General`, or `Standard` |
| `seat` | string | ✅ | Seat identifier e.g. `A12` |
| `photo` | file | ✅ | JPG, PNG, or WebP — max 5 MB |

**Business Rules:**
- Generate sequential ticket ID using `TKT-` prefix: `TKT-001`, `TKT-002`, etc.
- Store photo to file storage and save URL to `photoUrl`
- Generate `qrData` string: `{ticketId}|{visitorName}|{event}|{zone}|{seat}`
- Set `status = "valid"`, `usedAt = null`, `ownerId = null`, `purchasedAt = null`

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "TKT-006",
    "visitorName": "Sara Lee",
    "visitorEmail": "sara@email.com",
    "eventId": null,
    "event": "Tech Summit 2026",
    "eventDate": "2026-11-20",
    "venue": null,
    "zone": "Premium",
    "seat": "D22",
    "price": null,
    "status": "valid",
    "usedAt": null,
    "qrData": "TKT-006|Sara Lee|Tech Summit 2026|Premium|D22",
    "photoUrl": "https://storage.example.com/photos/tkt006.jpg",
    "ownerId": null,
    "purchasedAt": null,
    "createdAt": "2026-07-12"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `400` | Validation errors or unsupported file type |
| `403` | `admin` role required |
| `413` | Photo file exceeds 5 MB |

---

### PUT `/api/tickets/:id`

**Description:** Update ticket fields. Admin only.

**Access:** Protected (`admin`)

**Content-Type:** `application/json`

**Request Body** (send only fields to update):
```json
{
  "status": "invalid",
  "zone": "General",
  "seat": "B10",
  "event": "Rock Concert 2026",
  "eventDate": "2026-09-15",
  "visitorName": "John Doe",
  "visitorEmail": "john@email.com"
}
```

**Updatable Fields:** `visitorName`, `visitorEmail`, `event`, `eventDate`, `zone`, `seat`, `status`

**Business Rules:**
- If `status` changes to `"used"` → set `usedAt = NOW()`
- If `status` changes away from `"used"` → set `usedAt = null`
- `qrData` is **not** recalculated on update — if the ticket's core fields change the QR remains the same to avoid breaking printed/distributed tickets

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "TKT-001",
    "visitorName": "John Doe",
    "visitorEmail": "john@email.com",
    "eventId": null,
    "event": "Rock Concert 2026",
    "eventDate": "2026-09-15",
    "venue": null,
    "zone": "General",
    "seat": "B10",
    "price": null,
    "status": "invalid",
    "usedAt": null,
    "qrData": "TKT-001|John Doe|Rock Concert 2026|VIP|A12",
    "photoUrl": "https://storage.example.com/photos/tkt001.jpg",
    "ownerId": null,
    "purchasedAt": null,
    "createdAt": "2026-06-01"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `400` | Invalid status value |
| `403` | `admin` role required |
| `404` | Ticket not found |

---

## 10. Module 5 — QR Verification (Security)

> Core security workflow. Security staff scan a QR code and make an entry decision.

---

### POST `/api/tickets/verify`

**Description:** Verify a scanned QR payload and return ticket data. Does **not** change ticket status.

**Access:** Protected (`security`)

**Request Body:**
```json
{
  "qrData": "TKT-001|John Doe|Rock Concert 2026|VIP|A12"
}
```
Also accepted — ticket ID only:
```json
{
  "qrData": "TKT-001"
}
```

**Validation:**
- `qrData` — required, non-empty string

**Business Rules:**
1. Search `tickets` table where `qr_data = :qrData` **OR** `id = :qrData`
2. Both admin-created (`TKT-XXX`) and customer-purchased (`TKT-CXXX`) tickets exist in the same table — no special handling needed
3. If not found → return `{ valid: false, reason: "Ticket not found in system." }`
4. If `status = "used"` → return `{ valid: false, reason: "Ticket has already been used." }`
5. If `status = "invalid"` → return `{ valid: false, reason: "Ticket is marked invalid." }`
6. If `status = "valid"` → return `{ valid: true }` with full ticket object including `photoUrl`
7. **Do NOT modify any data** — status change only happens via approve/reject

> **Important:** This endpoint always returns HTTP `200`. Use HTTP error codes only for auth/server failures, not for business-logic validation outcomes.

**Response — Valid ticket `200`:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "reason": null,
    "ticket": {
      "id": "TKT-001",
      "visitorName": "John Doe",
      "visitorEmail": "john@email.com",
      "event": "Rock Concert 2026",
      "eventDate": "2026-09-15",
      "zone": "VIP",
      "seat": "A12",
      "status": "valid",
      "photoUrl": "https://storage.example.com/photos/tkt001.jpg",
      "qrData": "TKT-001|John Doe|Rock Concert 2026|VIP|A12",
      "usedAt": null,
      "createdAt": "2026-06-01"
    }
  }
}
```

**Response — Already used `200`:**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "reason": "Ticket has already been used.",
    "ticket": { "id": "TKT-002", "status": "used", "usedAt": "2026-06-20T18:32:00.000Z", "..." : "..." }
  }
}
```

**Response — Not found `200`:**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "reason": "Ticket not found in system.",
    "ticket": null
  }
}
```

**Error Responses (non-business):**
| Status | Condition |
|--------|-----------|
| `400` | `qrData` field missing |
| `401` | Unauthenticated |
| `403` | Not a `security` role |

---

### POST `/api/tickets/:id/approve`

**Description:** Approve entry for a verified ticket. Marks the ticket as used and records the scan.

**Access:** Protected (`security`)

**Request Body:** none

**Business Rules:**
1. Find ticket by `id`
2. If `status` is already `"used"` → return `409`
3. Set `status = "used"`, `usedAt = NOW()`
4. Insert a row into `scan_logs`: `result = "approved"`, `scannedBy = currentUser.id`, `visitorName` snapshot

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "ticketId": "TKT-001",
    "usedAt": "2026-09-15T19:04:22.000Z"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `404` | Ticket not found |
| `409` | Ticket already used |

---

### POST `/api/tickets/:id/reject`

**Description:** Reject entry for a ticket. Ticket status is **not** changed. Records the rejection in the scan log.

**Access:** Protected (`security`)

**Request Body:** none

**Business Rules:**
1. Find ticket by `id`
2. Do **NOT** modify `status` or `usedAt`
3. Insert a row into `scan_logs`: `result = "rejected"`, `scannedBy = currentUser.id`

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "ticketId": "TKT-001"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `404` | Ticket not found |

---

## 11. Module 6 — Incidents

---

### GET `/api/incidents`

**Description:** Get all incident reports with filtering support.

**Access:** Protected (`admin`, `security`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `type` | string | `duplicate`, `suspicious`, `invalid`, or `other` |
| `status` | string | `open`, `investigating`, or `resolved` |
| `search` | string | Search in `description`, `ticketId`, `reportedBy` (case-insensitive) |
| `dateFrom` | date | ISO date `YYYY-MM-DD` — filter `createdAt >=` |
| `dateTo` | date | ISO date `YYYY-MM-DD` — filter `createdAt <=` |
| `page` | integer | Default: 1 |
| `pageSize` | integer | Default: 20 |

**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "INC-001",
      "type": "duplicate",
      "ticketId": "TKT-002",
      "description": "Ticket scanned a second time at Gate 3.",
      "reportedBy": "Bob Security",
      "reportedById": "u2",
      "status": "open",
      "createdAt": "2026-06-20T18:35:00.000Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 3, "totalPages": 1 }
}
```

---

### GET `/api/incidents/:id`

**Description:** Get a single incident report.

**Access:** Protected (`admin`, `security`)

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "INC-002",
    "type": "suspicious",
    "ticketId": "TKT-003",
    "description": "Visitor appearance did not match registered photo.",
    "reportedBy": "Carol Guard",
    "reportedById": "u3",
    "status": "investigating",
    "createdAt": "2026-06-21T09:12:00.000Z"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `404` | Incident not found |

---

### POST `/api/incidents`

**Description:** Create a new incident report. Security staff only.

**Access:** Protected (`security`)

**Request Body:**
```json
{
  "type": "suspicious",
  "ticketId": "TKT-003",
  "description": "Visitor appearance did not match registered photo."
}
```

**Validation:**
- `type` — required, one of: `duplicate`, `suspicious`, `invalid`, `other`
- `ticketId` — **optional** string. If provided, it should reference an existing ticket ID but this is a soft check — the UI allows freeform entry or no ticket at all (incident from scanner failure). Do not return a 404 if ticket does not exist; log a warning instead.
- `description` — required, minimum 10 characters

**Business Rules:**
- Set `status = "open"` automatically
- Set `reportedBy` = authenticated user's `name` (denormalized snapshot)
- Set `reportedById` = authenticated user's `id` (FK)
- Generate sequential incident ID: `INC-001`, `INC-002`, etc.

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "INC-004",
    "type": "suspicious",
    "ticketId": "TKT-003",
    "description": "Visitor appearance did not match registered photo.",
    "reportedBy": "Carol Guard",
    "reportedById": "u3",
    "status": "open",
    "createdAt": "2026-07-12T10:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `400` | `type` missing or invalid |
| `400` | `description` too short |
| `403` | `security` role required |

---

### PATCH `/api/incidents/:id/status`

**Description:** Update the status of an incident. Admin only.

**Access:** Protected (`admin`)

**Request Body:**
```json
{
  "status": "investigating"
}
```

**Validation:**
- `status` — required, must be one of: `open`, `investigating`, `resolved`

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "INC-002",
    "type": "suspicious",
    "ticketId": "TKT-003",
    "description": "Visitor appearance did not match registered photo.",
    "reportedBy": "Carol Guard",
    "reportedById": "u3",
    "status": "resolved",
    "createdAt": "2026-06-21T09:12:00.000Z"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `400` | Invalid status value |
| `403` | `admin` role required |
| `404` | Incident not found |

---

## 12. Module 7 — Users (Admin)

---

### GET `/api/users`

**Description:** Get all users. Returns staff **and** customers — the FE user management page shows all registered users so admins can see the full picture. Filter by `role` to restrict to staff-only.

**Access:** Protected (`admin`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `role` | string | Filter by `admin`, `security`, or `customer` |
| `status` | string | Filter by `active` or `inactive` |
| `search` | string | Search by name or email |
| `page` | integer | Default: 1 |
| `pageSize` | integer | Default: 20 |

**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "u1",
      "name": "Alice Admin",
      "email": "admin@svss.io",
      "role": "admin",
      "status": "active",
      "createdAt": "2026-01-10"
    },
    {
      "id": "u5",
      "name": "Eva Customer",
      "email": "eva@svss.io",
      "role": "customer",
      "status": "active",
      "createdAt": "2026-03-01"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 5, "totalPages": 1 }
}
```

---

### POST `/api/users`

**Description:** Admin directly creates a new staff user (bypasses self-registration).

**Access:** Protected (`admin`)

**Request Body:**
```json
{
  "firstName": "New",
  "lastName": "Guard",
  "email": "newguard@svss.io",
  "role": "security"
}
```

> **Note:** No `password` field is sent from the FE `createUserApi`. The backend should either auto-generate a temporary password and email it to the user, or accept a `password` field. Recommended: generate a random temp password and include it in the response so the admin can share it.

**Validation:**
- `firstName`, `lastName` — required, non-empty string
- `email` — required, valid email, unique
- `role` — required, must be `admin` or `security`

**Business Rules:**
- Generate a secure random temporary password
- Hash and store it
- Set `status = "active"`
- Return the user and the **plaintext temporary password** (one-time display) or send via email

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "u7",
      "name": "New Guard",
      "email": "newguard@svss.io",
      "role": "security",
      "status": "active",
      "createdAt": "2026-07-12"
    },
    "temporaryPassword": "Xk9#mP2q"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `400` | Validation errors |
| `403` | `admin` role required |
| `409` | Email already exists |

---

### PATCH `/api/users/:id/status`

**Description:** Toggle a user's status between `active` and `inactive`.

**Access:** Protected (`admin`)

**Request Body:** none

**Business Rules:**
- `active` → `inactive`
- `inactive` → `active`
- Admin cannot deactivate their own account (compare `:id` with `currentUser.id`)
- Deactivated users are rejected at login and on every authenticated request

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "u4",
    "name": "Dave Operator",
    "email": "dave@svss.io",
    "role": "security",
    "status": "active",
    "createdAt": "2026-02-20"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `403` | `admin` role required |
| `403` | Cannot deactivate your own account |
| `404` | User not found |

---

## 13. Module 8 — Dashboard & Reports

---

### GET `/api/dashboard/stats`

**Description:** Aggregate statistics for admin and security dashboards.

**Access:** Protected (`admin`, `security`)

**Implementation Notes:**
| Field | SQL / Logic |
|-------|-------------|
| `totalTickets` | `SELECT COUNT(*) FROM tickets` |
| `usedTickets` | `... WHERE status = 'used'` |
| `validTickets` | `... WHERE status = 'valid'` |
| `invalidTickets` | `... WHERE status = 'invalid'` |
| `totalEntries` | `SELECT COUNT(*) FROM scan_logs` |
| `approvedEntries` | `... WHERE result = 'approved'` |
| `rejectedEntries` | `... WHERE result = 'rejected'` |
| `totalIncidents` | `SELECT COUNT(*) FROM incidents` |
| `openIncidents` | `... WHERE status = 'open'` |
| `todayScans` | `... WHERE DATE(created_at) = CURRENT_DATE` |

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalTickets": 512,
    "usedTickets": 318,
    "validTickets": 189,
    "invalidTickets": 5,
    "totalEntries": 318,
    "approvedEntries": 305,
    "rejectedEntries": 13,
    "totalIncidents": 7,
    "openIncidents": 3,
    "todayScans": 42
  }
}
```

---

### GET `/api/dashboard/scans`

**Description:** Most recent scan log entries for the live entry feed on dashboards.

**Access:** Protected (`admin`, `security`)

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | integer | 10 | Max number of entries to return |

**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "ticketId": "TKT-001",
      "visitorName": "John Doe",
      "result": "approved",
      "scannedBy": "u2",
      "time": "2026-06-23T08:10:00.000Z"
    },
    {
      "id": "uuid",
      "ticketId": "TKT-002",
      "visitorName": "Jane Smith",
      "result": "rejected",
      "scannedBy": "u2",
      "time": "2026-06-23T08:22:00.000Z"
    }
  ]
}
```

---

### GET `/api/reports/tickets`

**Description:** Paginated ticket data for the admin Reports page with breakdown summary.

**Access:** Protected (`admin`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `dateFrom` | date | `YYYY-MM-DD` — filter `createdAt >=` |
| `dateTo` | date | `YYYY-MM-DD` — filter `createdAt <=` |
| `status` | string | `valid`, `used`, or `invalid` |
| `event` | string | Filter by event name (partial match) |
| `zone` | string | Filter by zone |
| `page` | integer | Default: 1 |
| `pageSize` | integer | Default: 50 |

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTickets": 100,
      "validTickets": 60,
      "usedTickets": 35,
      "invalidTickets": 5
    },
    "tickets": [ ...array of ticket objects... ],
    "pagination": { "page": 1, "pageSize": 50, "total": 100, "totalPages": 2 }
  }
}
```

---

### GET `/api/reports/incidents`

**Description:** Incident report data with summary breakdown.

**Access:** Protected (`admin`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `dateFrom` | date | `YYYY-MM-DD` |
| `dateTo` | date | `YYYY-MM-DD` |
| `type` | string | `duplicate`, `suspicious`, `invalid`, `other` |
| `status` | string | `open`, `investigating`, `resolved` |

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 7,
      "open": 3,
      "investigating": 2,
      "resolved": 2
    },
    "incidents": [ ...array of incident objects... ]
  }
}
```

---

### GET `/api/reports/entries`

**Description:** Scan log / entry report for the admin Reports page.

**Access:** Protected (`admin`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `dateFrom` | date | `YYYY-MM-DD` |
| `dateTo` | date | `YYYY-MM-DD` |
| `result` | string | `approved` or `rejected` |
| `page` | integer | Default: 1 |
| `pageSize` | integer | Default: 50 |

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 318,
      "approved": 305,
      "rejected": 13
    },
    "entries": [
      {
        "id": "uuid",
        "ticketId": "TKT-001",
        "visitorName": "John Doe",
        "result": "approved",
        "scannedBy": "u2",
        "time": "2026-06-23T08:10:00.000Z"
      }
    ],
    "pagination": { ... }
  }
}
```

---

## 14. Module 9 — Events (Customer)

> Events are created and managed by admins (via direct DB seeding or a future admin UI). Currently read-only from the customer portal.

---

### GET `/api/events`

**Description:** List all available upcoming events with search and category filtering.

**Access:** Protected (`customer`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Partial match on event name, venue, or category |
| `category` | string | `Concert`, `Expo`, `Conference`, or `Festival` |
| `page` | integer | Default: 1 |
| `pageSize` | integer | Default: 12 |

**Business Rules:**
- Return only events where `date >= TODAY` (upcoming events)
- Include live `available` counts from `event_zones` table

**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "EVT-001",
      "name": "Rock Concert 2026",
      "venue": "Grand Arena, Downtown",
      "date": "2026-09-15",
      "time": "19:00",
      "category": "Concert",
      "image": "https://storage.example.com/events/evt001.jpg",
      "description": "An electrifying night of rock music...",
      "zones": [
        { "name": "VIP",      "price": 250, "available": 19 },
        { "name": "Premium",  "price": 150, "available": 45 },
        { "name": "General",  "price": 80,  "available": 120 },
        { "name": "Standard", "price": 50,  "available": 200 }
      ]
    }
  ],
  "pagination": { "page": 1, "pageSize": 12, "total": 4, "totalPages": 1 }
}
```

---

### GET `/api/events/:id`

**Description:** Get a single event with full zone detail and live availability.

**Access:** Protected (`customer`)

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "EVT-001",
    "name": "Rock Concert 2026",
    "venue": "Grand Arena, Downtown",
    "date": "2026-09-15",
    "time": "19:00",
    "category": "Concert",
    "image": "https://storage.example.com/events/evt001.jpg",
    "description": "An electrifying night of rock music...",
    "zones": [
      { "name": "VIP",      "price": 250, "available": 19 },
      { "name": "Premium",  "price": 150, "available": 45 },
      { "name": "General",  "price": 80,  "available": 120 },
      { "name": "Standard", "price": 50,  "available": 200 }
    ]
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `404` | Event not found |

---

## 15. Module 10 — Customer Tickets

---

### GET `/api/customer/tickets`

**Description:** Get all tickets owned by the currently authenticated customer.

**Access:** Protected (`customer`)

**Business Rules:**
- Only return tickets where `owner_id = currentUser.id`
- Sort by `purchased_at DESC` (newest first)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `status` | string | Filter by `valid`, `used`, or `invalid` |
| `page` | integer | Default: 1 |
| `pageSize` | integer | Default: 20 |

**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "TKT-C001",
      "visitorName": "Eva Customer",
      "visitorEmail": "eva@svss.io",
      "eventId": "EVT-001",
      "event": "Rock Concert 2026",
      "eventDate": "2026-09-15",
      "venue": "Grand Arena, Downtown",
      "zone": "General",
      "seat": "AUTO-G45",
      "price": 80,
      "status": "valid",
      "usedAt": null,
      "qrData": "TKT-C001|Eva Customer|Rock Concert 2026|General|AUTO-G45",
      "photoUrl": "https://storage.example.com/photos/c001.jpg",
      "ownerId": "u5",
      "purchasedAt": "2026-07-01T10:30:00.000Z",
      "createdAt": "2026-07-01"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 }
}
```

---

### GET `/api/customer/tickets/:id`

**Description:** Get a single customer ticket by ID. Used to display the QR code modal.

**Access:** Protected (`customer`)

**Business Rules:**
- Only return the ticket if `owner_id = currentUser.id`
- Return `403` if the ticket exists but belongs to a different customer

**Success Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "TKT-C001",
    "visitorName": "Eva Customer",
    "visitorEmail": "eva@svss.io",
    "eventId": "EVT-001",
    "event": "Rock Concert 2026",
    "eventDate": "2026-09-15",
    "venue": "Grand Arena, Downtown",
    "zone": "General",
    "seat": "AUTO-G45",
    "price": 80,
    "status": "valid",
    "usedAt": null,
    "qrData": "TKT-C001|Eva Customer|Rock Concert 2026|General|AUTO-G45",
    "photoUrl": "https://storage.example.com/photos/c001.jpg",
    "ownerId": "u5",
    "purchasedAt": "2026-07-01T10:30:00.000Z",
    "createdAt": "2026-07-01"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `403` | Ticket belongs to a different customer |
| `404` | Ticket not found |

---

### POST `/api/customer/tickets/purchase`

**Description:** Purchase a ticket for an event. Auto-assigns a seat within the chosen zone.

**Access:** Protected (`customer`)

**Content-Type:** `multipart/form-data`

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `eventId` | string | ✅ | Target event ID |
| `zone` | string | ✅ | Zone name from `event.zones` |
| `visitorName` | string | ✅ | Attendee full name (pre-filled from user profile) |
| `visitorEmail` | string | ✅ | Attendee email |
| `photo` | file | ✅ | Identity photo for gate verification — JPG/PNG/WebP, max 5 MB |

**Business Rules (execute in a DB transaction):**
1. Verify event exists
2. Verify zone exists within the event
3. **With row-level lock** (`SELECT ... FOR UPDATE`): check `event_zones.available > 0`
   - If `available = 0` → rollback, return `409`: `"This zone is sold out."`
4. Auto-generate seat: `AUTO-{ZoneInitial}{1–200}{A–H}` e.g. `AUTO-G45H`
5. Generate ticket ID with `TKT-C` prefix + zero-padded sequential number: `TKT-C002`
6. Generate `qrData`: `{ticketId}|{visitorName}|{eventName}|{zone}|{seat}`
7. Store photo file, save `photoUrl`
8. Insert row into `tickets` table with `owner_id = currentUser.id`, `purchased_at = NOW()`
9. **Decrement `event_zones.available` by 1** within the same transaction
10. Commit transaction
11. The new ticket is now queryable by security staff via `/api/tickets/verify` since it lives in the shared `tickets` table

> **Concurrency Note:** Use a database-level transaction with `SELECT FOR UPDATE` or an atomic `UPDATE event_zones SET available = available - 1 WHERE id = :id AND available > 0` with check on affected rows. Do not rely on application-level checks alone — two simultaneous purchases could both pass the availability check before either decrements the counter.

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "TKT-C002",
    "visitorName": "Eva Customer",
    "visitorEmail": "eva@svss.io",
    "eventId": "EVT-001",
    "event": "Rock Concert 2026",
    "eventDate": "2026-09-15",
    "venue": "Grand Arena, Downtown",
    "zone": "VIP",
    "seat": "AUTO-V112C",
    "price": 250,
    "status": "valid",
    "usedAt": null,
    "qrData": "TKT-C002|Eva Customer|Rock Concert 2026|VIP|AUTO-V112C",
    "photoUrl": "https://storage.example.com/photos/c002.jpg",
    "ownerId": "u5",
    "purchasedAt": "2026-07-12T14:30:00.000Z",
    "createdAt": "2026-07-12"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `400` | Missing required fields or invalid file type |
| `403` | `customer` role required |
| `404` | Event not found |
| `404` | Zone not found in this event |
| `409` | Zone is sold out |
| `413` | Photo exceeds 5 MB |

---

## 16. Error Handling

### HTTP Status Code Reference

| Code | Meaning | When to Use |
|------|---------|-------------|
| `200` | OK | Successful GET / PUT / PATCH; also for verify endpoint even when ticket is invalid |
| `201` | Created | Successful POST that creates a new resource |
| `400` | Bad Request | Missing fields, failed validation, unsupported file type |
| `401` | Unauthorized | No token, expired token, invalid signature, or deactivated user |
| `403` | Forbidden | Valid token but wrong role, or cross-portal login attempt |
| `404` | Not Found | Requested resource does not exist |
| `409` | Conflict | Duplicate email, already-used ticket, sold-out zone |
| `413` | Payload Too Large | Uploaded file exceeds size limit |
| `422` | Unprocessable Entity | Semantically invalid input (e.g. `dateTo` before `dateFrom`) |
| `429` | Too Many Requests | Rate limit exceeded on auth endpoints |
| `500` | Internal Server Error | Unhandled exception — never expose stack traces in production |

### Standard Error Response
```json
{
  "success": false,
  "message": "A user with this email already exists.",
  "errors": [
    { "field": "email", "message": "Email already in use." }
  ]
}
```

- `message` — one human-readable summary sentence
- `errors` — optional array, only for `400`/`422` with field-level detail
- Never include `data` in an error response
- Never include internal stack traces in production

### QR Verification Special Rule
`POST /api/tickets/verify` always returns `200` regardless of whether the ticket is valid, used, or not found. The `valid` boolean in `data` carries the business result. HTTP errors from this endpoint indicate only auth/server problems.

---

## 17. File Upload Handling

### Accepted MIME Types
- `image/jpeg`
- `image/png`
- `image/webp`

### Size Limit
- Maximum: **5 MB** per file

### Field Name
The FE sends the photo under the multipart field name `photo`.

### Storage Strategy
| Environment | Provider |
|-------------|----------|
| Development | Local disk (`./uploads/`) |
| Production | AWS S3, GCS, or Azure Blob |

- Use a unique filename: `{ticketId}-{timestamp}-{uuid}.{ext}` to prevent collisions
- Return a full public URL in `photoUrl`
- Store outside the web root to prevent direct shell execution

### Server-Side Validation
- Validate MIME type by inspecting the file buffer (e.g. `file-type` npm package) — do not trust the `Content-Type` header or file extension alone
- Reject files that exceed 5 MB with `413`
- Recommended middleware: `multer` (Node.js) with `limits: { fileSize: 5 * 1024 * 1024 }`

---

## 18. Security Requirements

### Passwords
- Hash with **bcrypt**, cost factor **≥ 12**
- Never return, log, or store plaintext passwords
- Server-side minimum: 8 characters and at least one number (even if FE validates first)

### JWT
- Sign with a secret of **≥ 256 bits**, stored only in environment variables
- Include `id`, `email`, `role`, `status` in the payload
- Access token expiry: **24 hours**
- On every request: verify signature, check expiry, confirm `status = "active"` from the DB

### Portal Isolation
- `/api/auth/*` — rejects `customer` role at the login/register level
- `/api/customer/auth/*` — rejects `admin` / `security` roles at the login/register level
- Middleware role guards enforce this on every downstream route too

### Input Validation & Sanitisation
- Validate all inputs server-side — never trust the FE alone
- Use parameterised queries or an ORM to prevent SQL injection
- Strip or escape HTML from all string fields
- Reject unexpected fields (use allow-lists for request body fields)

### Rate Limiting
Apply on all auth endpoints:
- `POST /api/auth/login` — max **10 req/min** per IP
- `POST /api/auth/register` — max **5 req/min** per IP
- `POST /api/customer/auth/login` — max **10 req/min** per IP
- `POST /api/customer/auth/register` — max **5 req/min** per IP

### CORS
- Set `Access-Control-Allow-Origin` to the known FE domain only
- Never use `*` in production

### File Uploads
- Validate MIME type from file content, not extension
- Consider virus/malware scanning for uploaded photos
- Store files outside the web root or in isolated object storage

### Sensitive Data
- Omit `password` from all API responses
- Redact sensitive fields in logs
- Use HTTPS in production (TLS ≥ 1.2)

---

## 19. Environment Variables

```env
# ── Server ────────────────────────────────────────────
PORT=5000
NODE_ENV=development              # development | production

# ── Database ──────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@localhost:5432/svss_db

# ── JWT ───────────────────────────────────────────────
JWT_SECRET=your_256_bit_or_longer_secret_here
JWT_EXPIRES_IN=24h

# ── File Storage ──────────────────────────────────────
STORAGE_PROVIDER=local            # local | s3 | gcs
STORAGE_BUCKET=svss-uploads

# AWS S3 (when STORAGE_PROVIDER=s3)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BASE_URL=https://svss-uploads.s3.amazonaws.com

# Local dev fallback
LOCAL_UPLOAD_DIR=./uploads
LOCAL_UPLOAD_BASE_URL=http://localhost:5000/uploads

# ── CORS ──────────────────────────────────────────────
CORS_ORIGIN=http://localhost:5173

# ── Frontend ──────────────────────────────────────────
FRONTEND_URL=http://localhost:5173
FRONTEND_STAFF_LOGIN_URL=http://localhost:5173/login
FRONTEND_CUSTOMER_LOGIN_URL=http://localhost:5173/customer/login
```

---

## 20. Complete Endpoint Summary

| Method | Endpoint | Auth | Allowed Roles |
|--------|----------|------|---------------|
| `POST` | `/api/auth/login` | Public | — |
| `POST` | `/api/auth/register` | Public | — |
| `POST` | `/api/auth/logout` | Bearer | admin, security |
| `POST` | `/api/customer/auth/login` | Public | — |
| `POST` | `/api/customer/auth/register` | Public | — |
| `POST` | `/api/customer/auth/logout` | Bearer | customer |
| `GET` | `/api/me` | Bearer | admin, security, customer |
| `GET` | `/api/tickets` | Bearer | admin, security |
| `GET` | `/api/tickets/:id` | Bearer | admin, security |
| `POST` | `/api/tickets` | Bearer | admin |
| `PUT` | `/api/tickets/:id` | Bearer | admin |
| `POST` | `/api/tickets/verify` | Bearer | security |
| `POST` | `/api/tickets/:id/approve` | Bearer | security |
| `POST` | `/api/tickets/:id/reject` | Bearer | security |
| `GET` | `/api/incidents` | Bearer | admin, security |
| `GET` | `/api/incidents/:id` | Bearer | admin, security |
| `POST` | `/api/incidents` | Bearer | security |
| `PATCH` | `/api/incidents/:id/status` | Bearer | admin |
| `GET` | `/api/users` | Bearer | admin |
| `POST` | `/api/users` | Bearer | admin |
| `PATCH` | `/api/users/:id/status` | Bearer | admin |
| `GET` | `/api/dashboard/stats` | Bearer | admin, security |
| `GET` | `/api/dashboard/scans` | Bearer | admin, security |
| `GET` | `/api/reports/tickets` | Bearer | admin |
| `GET` | `/api/reports/incidents` | Bearer | admin |
| `GET` | `/api/reports/entries` | Bearer | admin |
| `GET` | `/api/events` | Bearer | customer |
| `GET` | `/api/events/:id` | Bearer | customer |
| `GET` | `/api/customer/tickets` | Bearer | customer |
| `GET` | `/api/customer/tickets/:id` | Bearer | customer |
| `POST` | `/api/customer/tickets/purchase` | Bearer | customer |

**Total: 31 endpoints**

---

*Derived from SVSS frontend source code — July 2026.*
*Frontend configures the base URL via the `VITE_API_BASE_URL` environment variable (defaults to `/api`).*
