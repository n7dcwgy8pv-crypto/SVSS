# SVSS — Backend API Specification
## Smart Venue Security System

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Base Configuration](#2-base-configuration)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Data Models / Schemas](#4-data-models--schemas)
5. [Module 1 — Staff Authentication](#5-module-1--staff-authentication)
6. [Module 2 — Customer Authentication](#6-module-2--customer-authentication)
7. [Module 3 — Tickets (Admin)](#7-module-3--tickets-admin)
8. [Module 4 — QR Verification (Security)](#8-module-4--qr-verification-security)
9. [Module 5 — Incidents](#9-module-5--incidents)
10. [Module 6 — Users (Admin)](#10-module-6--users-admin)
11. [Module 7 — Dashboard & Reports (Admin)](#11-module-7--dashboard--reports-admin)
12. [Module 8 — Events (Customer)](#12-module-8--events-customer)
13. [Module 9 — Customer Tickets](#13-module-9--customer-tickets)
14. [Error Handling](#14-error-handling)
15. [File Upload Handling](#15-file-upload-handling)
16. [Security Requirements](#16-security-requirements)
17. [Environment Variables](#17-environment-variables)

---

## 1. Project Overview

**System Name:** Smart Venue Security System (SVSS)

**Purpose:**
A venue security and ticket management platform serving three user roles:

| Role | Portal | Description |
|------|--------|-------------|
| `admin` | Staff Portal (`/login`) | Creates tickets, manages users, views reports and incidents |
| `security` | Staff Portal (`/login`) | Scans QR codes, verifies entry, reports incidents |
| `customer` | Customer Portal (`/customer/login`) | Browses events, purchases tickets, views their QR passes |

**Two completely independent authentication flows:**
- **Staff Auth** — `/api/auth/login` and `/api/auth/register` — only creates/validates `admin` and `security` accounts
- **Customer Auth** — `/api/customer/auth/login` and `/api/customer/auth/register` — only creates/validates `customer` accounts

---

## 2. Base Configuration

### Base URL
```
/api
```

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <jwt_token>   ← required on all protected routes
```

### Response Format
All responses follow a consistent envelope:

```json
// Success
{
  "success": true,
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [ ... ]   // optional field-level validation errors
}
```

### Pagination (list endpoints)
```json
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
```

Query params for paginated routes: `?page=1&pageSize=20`

---

## 3. Authentication & Authorization

### Token Strategy
- Use **JWT (JSON Web Token)** — Bearer token in `Authorization` header.
- Token payload must include: `id`, `email`, `role`, `status`.
- Token expiry: **24 hours** (access token). Optionally implement refresh tokens.

### Role Guards
Every protected route must validate:
1. Token is present and valid.
2. Token is not expired.
3. User `status` is `active`.
4. User `role` matches the allowed roles for that route.

### Role Permission Matrix

| Route Group | `admin` | `security` | `customer` |
|-------------|:-------:|:----------:|:----------:|
| Staff Auth endpoints | Public | Public | Blocked |
| Customer Auth endpoints | Blocked | Blocked | Public |
| `GET /api/tickets` | ✅ | ✅ | ❌ |
| `POST /api/tickets` | ✅ | ❌ | ❌ |
| `PUT /api/tickets/:id` | ✅ | ❌ | ❌ |
| `POST /api/tickets/:id/verify` | ❌ | ✅ | ❌ |
| `POST /api/tickets/:id/approve` | ❌ | ✅ | ❌ |
| `POST /api/tickets/:id/reject` | ❌ | ✅ | ❌ |
| `GET /api/incidents` | ✅ | ✅ | ❌ |
| `POST /api/incidents` | ❌ | ✅ | ❌ |
| `GET /api/users` | ✅ | ❌ | ❌ |
| `POST /api/users` | ✅ | ❌ | ❌ |
| `PATCH /api/users/:id/status` | ✅ | ❌ | ❌ |
| `GET /api/dashboard/stats` | ✅ | ✅ | ❌ |
| `GET /api/dashboard/scans` | ✅ | ✅ | ❌ |
| `GET /api/events` | ❌ | ❌ | ✅ |
| `GET /api/events/:id` | ❌ | ❌ | ✅ |
| `GET /api/customer/tickets` | ❌ | ❌ | ✅ |
| `POST /api/customer/tickets/purchase` | ❌ | ❌ | ✅ |

---

## 4. Data Models / Schemas

### User
```json
{
  "id": "string (UUID)",
  "name": "string",
  "email": "string (unique)",
  "role": "admin | security | customer",
  "status": "active | inactive",
  "createdAt": "ISO 8601 date string"
}
```

### Ticket (Admin-created / Staff-managed)
```json
{
  "id": "string  e.g. TKT-001",
  "visitorName": "string",
  "visitorEmail": "string",
  "event": "string",
  "eventDate": "date string  YYYY-MM-DD",
  "zone": "VIP | Premium | General | Standard",
  "seat": "string  e.g. A12",
  "status": "valid | used | invalid",
  "usedAt": "ISO 8601 datetime | null",
  "qrData": "string  encoded QR payload",
  "photoUrl": "string (URL to stored image) | null",
  "createdAt": "ISO 8601 date string"
}
```

### Customer Ticket (Self-purchased)
Extends the Ticket schema with ownership fields:
```json
{
  "id": "string  e.g. TKT-C001",
  "ownerId": "string (User.id)",
  "ownerName": "string",
  "ownerEmail": "string",
  "eventId": "string (Event.id)",
  "event": "string",
  "eventDate": "date string",
  "venue": "string",
  "zone": "string",
  "seat": "string  auto-assigned  e.g. AUTO-G45",
  "price": "number",
  "status": "valid | used | invalid",
  "usedAt": "ISO 8601 datetime | null",
  "qrData": "string",
  "photoUrl": "string | null",
  "purchasedAt": "ISO 8601 datetime",
  "visitorName": "string",
  "visitorEmail": "string",
  "createdAt": "ISO 8601 date string"
}
```

### Event
```json
{
  "id": "string  e.g. EVT-001",
  "name": "string",
  "venue": "string",
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "category": "Concert | Expo | Conference | Festival",
  "image": "string (URL)",
  "description": "string",
  "zones": [
    {
      "name": "VIP | Premium | General | Standard",
      "price": "number",
      "available": "number (remaining seats)"
    }
  ]
}
```

### Incident
```json
{
  "id": "string  e.g. INC-001",
  "type": "duplicate | suspicious | invalid | other",
  "ticketId": "string",
  "description": "string",
  "reportedBy": "string (User.name or User.id)",
  "status": "open | investigating | resolved",
  "createdAt": "ISO 8601 datetime"
}
```

### Scan Log (for recent scan history)
```json
{
  "id": "string",
  "ticketId": "string",
  "visitorName": "string",
  "result": "approved | rejected",
  "scannedBy": "string (User.id)",
  "time": "ISO 8601 datetime"
}
```

### Dashboard Stats
```json
{
  "totalTickets": "number",
  "usedTickets": "number",
  "validTickets": "number",
  "invalidTickets": "number",
  "totalEntries": "number",
  "approvedEntries": "number",
  "rejectedEntries": "number",
  "totalIncidents": "number",
  "openIncidents": "number",
  "todayScans": "number"
}
```

---

## 5. Module 1 — Staff Authentication

> Routes for `admin` and `security` roles only. Customer accounts are rejected.

---

### POST `/api/auth/login`

**Description:** Authenticate a staff member (admin or security).

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
- Look up user by email where `status = active`
- If user role is `customer` → return `403` with message: `"Customer accounts must use the Customer Portal to sign in."`
- Verify password against stored hash
- On success, return user object and JWT token

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
    "token": "eyJhbGci..."
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| `400` | Validation errors (missing fields) |
| `401` | Invalid credentials |
| `403` | Customer account — use customer portal |
| `403` | Account is inactive |

---

### POST `/api/auth/register`

**Description:** Register a new staff member (admin or security roles only).

**Access:** Public *(consider restricting to admin-only in production)*

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
- `firstName`, `lastName` — required, string
- `email` — required, valid email, unique in DB
- `role` — required, must be `admin` or `security` (reject `customer`)
- `password` — required, minimum 8 characters, must contain at least one number
- `confirmPassword` — must match `password`

**Business Rules:**
- If `role` is `customer` → return `400`: `"Staff registration does not accept customer role."`
- Hash password before storing (bcrypt, cost factor ≥ 12)
- Return user (without password) and JWT token

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGci..."
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| `400` | Validation errors |
| `409` | Email already exists |

---

### POST `/api/auth/logout`

**Description:** Invalidate the current session token.

**Access:** Protected (any authenticated staff role)

**Request Body:** none

**Business Rules:**
- If using stateless JWT: this is a client-side operation (FE deletes the token). Return `200`.
- If using a token blocklist: add the token `jti` to the blocklist.

**Success Response `200`:**
```json
{ "success": true, "data": { "message": "Logged out successfully." } }
```

---

## 6. Module 2 — Customer Authentication

> Dedicated routes for `customer` role only. Staff accounts are rejected.

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
- Same as staff login

**Business Rules:**
- Look up user by email where `status = active`
- If user role is `admin` or `security` → return `403`: `"Staff accounts must use the Staff Portal to sign in."`
- Verify password hash
- Return customer user object and JWT token

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
| Status | Message |
|--------|---------|
| `401` | Invalid credentials |
| `403` | Staff account — use staff portal |
| `403` | Account is inactive |

---

### POST `/api/customer/auth/register`

**Description:** Register a new customer account. Role is always set to `customer` — not user-supplied.

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
- `firstName`, `lastName` — required, string
- `email` — required, valid email, unique across ALL users
- `password` — required, minimum 8 characters, at least one number
- `confirmPassword` — must match `password`
- **No `role` field accepted** — always forced to `customer` on the server

**Business Rules:**
- Ignore any `role` field in the request body
- Always set `role = "customer"` server-side
- Hash password (bcrypt, cost factor ≥ 12)
- New customer status defaults to `active`
- After registration → redirect FE to `/customer/events`

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "u10",
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
| Status | Message |
|--------|---------|
| `400` | Validation errors |
| `409` | Email already exists |

---

### POST `/api/customer/auth/logout`

**Description:** Logout from the customer portal.

**Access:** Protected (`customer`)

**Success Response `200`:**
```json
{ "success": true, "data": { "message": "Logged out successfully." } }
```

---

## 7. Module 3 — Tickets (Admin)

> Admin creates and manages tickets. Security staff can read tickets.

---

### GET `/api/tickets`

**Description:** Get all tickets. Supports search filtering.

**Access:** Protected (`admin`, `security`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Filter by visitor name, ticket ID, or event name |
| `status` | string | Filter by `valid`, `used`, or `invalid` |
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Results per page (default: 20) |

**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "TKT-001",
      "visitorName": "John Doe",
      "visitorEmail": "john@email.com",
      "event": "Rock Concert 2026",
      "eventDate": "2026-09-15",
      "zone": "VIP",
      "seat": "A12",
      "status": "valid",
      "usedAt": null,
      "qrData": "TKT-001|John Doe|Rock Concert 2026|VIP|A12",
      "photoUrl": "https://storage.example.com/photos/tkt001.jpg",
      "createdAt": "2026-06-01"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 5, "totalPages": 1 }
}
```

---

### GET `/api/tickets/:id`

**Description:** Get a single ticket by ID.

**Access:** Protected (`admin`, `security`)

**Success Response `200`:**
```json
{
  "success": true,
  "data": { ...ticket object... }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| `404` | Ticket not found |

---

### POST `/api/tickets`

**Description:** Create a new ticket with visitor photo. Admin only.

**Access:** Protected (`admin`)

**Request Body:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `visitorName` | string | ✅ | Full name of visitor |
| `visitorEmail` | string | ✅ | Valid email |
| `event` | string | ✅ | Event name |
| `eventDate` | date | ✅ | Format: `YYYY-MM-DD` |
| `zone` | string | ✅ | `VIP`, `Premium`, `General`, `Standard` |
| `seat` | string | ✅ | Seat number e.g. `A12` |
| `photo` | file | ✅ | JPG/PNG/WebP, max 5MB |

**Business Rules:**
- Generate a sequential ticket ID: `TKT-XXX` (zero-padded, e.g. `TKT-006`)
- Store photo to file storage (S3, local disk, etc.) and save URL to `photoUrl`
- Generate `qrData` string: `{ticketId}|{visitorName}|{event}|{zone}|{seat}`
- Set `status = "valid"` and `usedAt = null`

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "TKT-006",
    "visitorName": "Sara Lee",
    "visitorEmail": "sara@email.com",
    "event": "Tech Summit 2026",
    "eventDate": "2026-11-20",
    "zone": "Premium",
    "seat": "D22",
    "status": "valid",
    "usedAt": null,
    "qrData": "TKT-006|Sara Lee|Tech Summit 2026|Premium|D22",
    "photoUrl": "https://storage.example.com/photos/tkt006.jpg",
    "createdAt": "2026-07-12"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| `400` | Validation errors / invalid file type |
| `403` | Admin role required |
| `413` | Photo exceeds 5MB |

---

### PUT `/api/tickets/:id`

**Description:** Update ticket fields. Admin only.

**Access:** Protected (`admin`)

**Request Body:** `application/json` (send only fields to update)
```json
{
  "status": "invalid",
  "zone": "General",
  "seat": "B10"
}
```

**Business Rules:**
- Only `admin` may update tickets
- If `status` is updated to `used`, set `usedAt` to current timestamp
- If `status` is updated away from `used`, clear `usedAt`

**Success Response `200`:**
```json
{
  "success": true,
  "data": { ...updated ticket object... }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| `404` | Ticket not found |
| `403` | Admin role required |

---

## 8. Module 4 — QR Verification (Security)

> Core security workflow. Security staff scan a QR code and process entry decisions.

---

### POST `/api/tickets/verify`

**Description:** Verify a scanned QR code and return ticket information. Does NOT mark the ticket as used.

**Access:** Protected (`security`)

**Request Body:**
```json
{
  "qrData": "TKT-001|John Doe|Rock Concert 2026|VIP|A12"
}
```

**Alternative** — also accept ticket ID directly:
```json
{
  "qrData": "TKT-001"
}
```

**Business Rules:**
- Search tickets where `qrData = value` OR `id = value`
- If not found → `valid: false` with reason
- If `status = "used"` → `valid: false` with reason and ticket data
- If `status = "invalid"` → `valid: false` with reason and ticket data
- If `status = "valid"` → `valid: true` with full ticket data
- **Do NOT change `status` here** — that only happens on approve/reject

**Success Response `200`:**
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
      "createdAt": "2026-06-01"
    }
  }
}
```

**Invalid ticket example `200`:**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "reason": "Ticket has already been used.",
    "ticket": { ...ticket object... }
  }
}
```

**Not found example `200`:**
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

> **Note:** The FE expects a `200` even for invalid tickets. Use HTTP error codes only for actual server/auth failures.

---

### POST `/api/tickets/:id/approve`

**Description:** Approve entry for a ticket. Marks the ticket as used.

**Access:** Protected (`security`)

**Request Body:** none

**Business Rules:**
- Find ticket by `id`
- Set `status = "used"` and `usedAt = currentTimestamp`
- Create a **Scan Log** entry: `result = "approved"`, `scannedBy = currentUser.id`

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
| Status | Message |
|--------|---------|
| `404` | Ticket not found |
| `409` | Ticket already used |

---

### POST `/api/tickets/:id/reject`

**Description:** Reject entry for a ticket. Ticket status remains unchanged.

**Access:** Protected (`security`)

**Request Body:** none

**Business Rules:**
- Find ticket by `id`
- Do NOT change ticket status
- Create a **Scan Log** entry: `result = "rejected"`, `scannedBy = currentUser.id`

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

---

## 9. Module 5 — Incidents

---

### GET `/api/incidents`

**Description:** Get all incident reports. Supports filtering.

**Access:** Protected (`admin`, `security`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `type` | string | Filter by `duplicate`, `suspicious`, `invalid`, `other` |
| `status` | string | Filter by `open`, `investigating`, `resolved` |
| `search` | string | Search in description, ticketId, reportedBy |
| `dateFrom` | date | Filter incidents from this date (`YYYY-MM-DD`) |
| `dateTo` | date | Filter incidents to this date (`YYYY-MM-DD`) |
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Default: 20 |

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
      "status": "open",
      "createdAt": "2026-06-20T18:35:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

---

### GET `/api/incidents/:id`

**Description:** Get a single incident by ID.

**Access:** Protected (`admin`, `security`)

**Success Response `200`:**
```json
{
  "success": true,
  "data": { ...incident object... }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
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
- `ticketId` — required, string (must reference existing ticket)
- `description` — required, minimum 10 characters

**Business Rules:**
- Set `status = "open"` automatically
- Set `reportedBy` from the authenticated user's name
- Generate sequential ID: `INC-XXX`

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
    "status": "open",
    "createdAt": "2026-07-12T10:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| `400` | Validation errors |
| `404` | Referenced ticketId not found |

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
- `status` — required, one of: `open`, `investigating`, `resolved`

**Success Response `200`:**
```json
{
  "success": true,
  "data": { ...updated incident object... }
}
```

---

## 10. Module 6 — Users (Admin)

---

### GET `/api/users`

**Description:** Get all staff users (admin and security). Customers are excluded from this list.

**Access:** Protected (`admin`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `role` | string | Filter by `admin` or `security` |
| `status` | string | Filter by `active` or `inactive` |
| `page` | number | Default: 1 |
| `pageSize` | number | Default: 20 |

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
    }
  ],
  "pagination": { ... }
}
```

---

### POST `/api/users`

**Description:** Admin creates a new staff user directly (without self-registration flow).

**Access:** Protected (`admin`)

**Request Body:**
```json
{
  "firstName": "New",
  "lastName": "Guard",
  "email": "newguard@svss.io",
  "role": "security",
  "password": "TempPass123"
}
```

**Validation:**
- `firstName`, `lastName` — required, string
- `email` — required, valid email, unique
- `role` — required, `admin` or `security` only
- `password` — required, minimum 8 characters

**Business Rules:**
- Always sets `status = "active"`
- Hashes password before storing

**Success Response `201`:**
```json
{
  "success": true,
  "data": { ...user object (no password)... }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| `400` | Validation errors |
| `409` | Email already exists |

---

### PATCH `/api/users/:id/status`

**Description:** Toggle a user's status between `active` and `inactive`.

**Access:** Protected (`admin`)

**Request Body:** none

**Business Rules:**
- If current `status = "active"` → set to `"inactive"`
- If current `status = "inactive"` → set to `"active"`
- Admin cannot deactivate their own account

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
| Status | Message |
|--------|---------|
| `404` | User not found |
| `403` | Cannot deactivate your own account |

---

## 11. Module 7 — Dashboard & Reports (Admin)

---

### GET `/api/dashboard/stats`

**Description:** Returns aggregate statistics for the admin and security dashboards.

**Access:** Protected (`admin`, `security`)

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

**Implementation Notes:**
- `totalTickets` — COUNT of all tickets (admin + customer-purchased)
- `usedTickets` — COUNT where `status = "used"`
- `validTickets` — COUNT where `status = "valid"`
- `invalidTickets` — COUNT where `status = "invalid"`
- `totalEntries` — COUNT of approve + reject scan log entries
- `approvedEntries` — COUNT of scan logs where `result = "approved"`
- `rejectedEntries` — COUNT of scan logs where `result = "rejected"`
- `totalIncidents` — COUNT of all incidents
- `openIncidents` — COUNT of incidents where `status = "open"`
- `todayScans` — COUNT of scan logs created today (UTC date match)

---

### GET `/api/dashboard/scans`

**Description:** Returns the most recent scan log entries.

**Access:** Protected (`admin`, `security`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `limit` | number | Max entries to return (default: 10) |

**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "s1",
      "ticketId": "TKT-001",
      "visitorName": "John Doe",
      "result": "approved",
      "scannedBy": "u2",
      "time": "2026-06-23T08:10:00.000Z"
    }
  ]
}
```

---

### GET `/api/reports/tickets`

**Description:** Full ticket report data for the Reports page.

**Access:** Protected (`admin`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `dateFrom` | date | Start date `YYYY-MM-DD` |
| `dateTo` | date | End date `YYYY-MM-DD` |
| `status` | string | Filter by ticket status |
| `event` | string | Filter by event name |
| `zone` | string | Filter by zone |
| `page` | number | Default: 1 |
| `pageSize` | number | Default: 50 |

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
    "pagination": { ... }
  }
}
```

---

### GET `/api/reports/incidents`

**Description:** Incident report data for the Reports page.

**Access:** Protected (`admin`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `dateFrom` | date | Start date |
| `dateTo` | date | End date |
| `type` | string | Incident type |
| `status` | string | Incident status |

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

**Description:** Entry (scan log) report for the Reports page.

**Access:** Protected (`admin`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `dateFrom` | date | Start date |
| `dateTo` | date | End date |
| `result` | string | `approved` or `rejected` |

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
    "entries": [ ...array of scan log objects... ]
  }
}
```

---

## 12. Module 8 — Events (Customer)

> Events are browsable by authenticated customers only.

---

### GET `/api/events`

**Description:** List all available events with search and category filtering.

**Access:** Protected (`customer`)

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `search` | string | Search by event name, venue, or category |
| `category` | string | Filter by `Concert`, `Expo`, `Conference`, `Festival` |
| `page` | number | Default: 1 |
| `pageSize` | number | Default: 12 |

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
        { "name": "VIP",      "price": 250, "available": 20 },
        { "name": "Premium",  "price": 150, "available": 45 },
        { "name": "General",  "price": 80,  "available": 120 },
        { "name": "Standard", "price": 50,  "available": 200 }
      ]
    }
  ],
  "pagination": { ... }
}
```

---

### GET `/api/events/:id`

**Description:** Get a single event with full zone details.

**Access:** Protected (`customer`)

**Success Response `200`:**
```json
{
  "success": true,
  "data": { ...full event object... }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| `404` | Event not found |

---

## 13. Module 9 — Customer Tickets

---

### GET `/api/customer/tickets`

**Description:** Get all tickets owned by the currently authenticated customer.

**Access:** Protected (`customer`)

**Business Rules:**
- Only return tickets where `ownerId = currentUser.id`
- Return newest first (sort by `purchasedAt DESC`)

**Success Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "TKT-C001",
      "ownerId": "u5",
      "ownerName": "Eva Customer",
      "ownerEmail": "eva@svss.io",
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
      "purchasedAt": "2026-07-01T10:30:00.000Z",
      "visitorName": "Eva Customer",
      "visitorEmail": "eva@svss.io",
      "createdAt": "2026-07-01"
    }
  ]
}
```

---

### POST `/api/customer/tickets/purchase`

**Description:** Purchase a ticket for an event. Auto-assigns a seat.

**Access:** Protected (`customer`)

**Request Body:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `eventId` | string | ✅ | Target event ID |
| `zone` | string | ✅ | Zone name from event.zones |
| `visitorName` | string | ✅ | Customer full name for the ticket |
| `visitorEmail` | string | ✅ | Customer email |
| `photo` | file | ✅ | Identity photo — JPG/PNG/WebP max 5MB |

**Business Rules:**
1. Validate event exists
2. Validate zone exists within the event
3. Check `zone.available > 0` — if not, return `409` sold out
4. Auto-generate seat: `AUTO-{ZoneInitial}{RandomNumber}{RandomLetter}` e.g. `AUTO-G45H`
5. Generate ticket ID with prefix `TKT-C` + sequential number: `TKT-C002`
6. Generate `qrData`: `{ticketId}|{visitorName}|{eventName}|{zone}|{seat}`
7. Store photo, save URL to `photoUrl`
8. Set `ownerId = currentUser.id`
9. Set `status = "valid"` and `purchasedAt = currentTimestamp`
10. **Decrement `zone.available` by 1** in the events table
11. **Also insert into the shared tickets table** so security can verify this QR at the gate

**Success Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "TKT-C002",
    "ownerId": "u5",
    "ownerName": "Eva Customer",
    "ownerEmail": "eva@svss.io",
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
    "purchasedAt": "2026-07-12T14:30:00.000Z",
    "visitorName": "Eva Customer",
    "visitorEmail": "eva@svss.io",
    "createdAt": "2026-07-12"
  }
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| `400` | Validation errors / invalid file |
| `404` | Event not found |
| `404` | Zone not found in this event |
| `409` | This zone is sold out |
| `413` | Photo exceeds 5MB |

---

## 14. Error Handling

### Standard HTTP Status Codes

| Code | Meaning | When to use |
|------|---------|-------------|
| `200` | OK | Successful GET, PUT, PATCH, POST for verify/approve/reject |
| `201` | Created | Successful POST that creates a resource |
| `400` | Bad Request | Validation errors, malformed request body |
| `401` | Unauthorized | No token or invalid/expired token |
| `403` | Forbidden | Valid token but insufficient role permission |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Duplicate email, sold-out zone, already-used ticket |
| `413` | Payload Too Large | File upload exceeds size limit |
| `422` | Unprocessable Entity | Semantic validation failure |
| `500` | Internal Server Error | Unexpected server-side failure |

### Error Response Shape

```json
{
  "success": false,
  "message": "A user with this email already exists.",
  "errors": [
    { "field": "email", "message": "Email already in use." }
  ]
}
```

- `message` — single human-readable summary
- `errors` — array of field-level issues (only for `400`/`422` validation errors)

### QR Verification Special Case
The `/api/tickets/verify` endpoint always returns `200` even when a ticket is invalid. HTTP error codes are reserved for auth/server failures, not business logic outcomes.

---

## 15. File Upload Handling

### Accepted Formats
- `image/jpeg`
- `image/png`
- `image/webp`

### Size Limit
- Maximum: **5 MB** per file

### Storage
- Store files in a dedicated object storage bucket (AWS S3, GCS, Azure Blob, or local disk for development)
- Return a full, publicly accessible URL in `photoUrl`
- Use a unique filename: `{ticketId}-{timestamp}.{ext}` to avoid collisions

### Multipart Field Name
- The FE sends the photo under the field name `photo`
- Use `multipart/form-data` encoding for all ticket create/purchase endpoints

### Recommended Middleware
- `multer` (Node.js) or equivalent
- Validate MIME type server-side — do not rely on file extension alone
- Reject files that exceed the size limit with `413`

---

## 16. Security Requirements

### Passwords
- Hash all passwords using **bcrypt** with a cost factor of **12 or higher**
- Never return or log passwords
- Validate password complexity server-side: minimum 8 characters, at least one number

### JWT
- Sign tokens with a strong secret (minimum 256-bit) stored in environment variables
- Set expiry to **24 hours**
- Include `role` and `status` in the token payload for role guards
- Validate `status = "active"` on every protected request

### Role Isolation
- Staff portal endpoints (`/api/auth/*`) must reject `customer` role logins
- Customer portal endpoints (`/api/customer/auth/*`) must reject `admin`/`security` role logins
- Never allow cross-portal access at any endpoint

### Input Validation
- Validate and sanitize all request inputs server-side
- Use parameterized queries / ORM to prevent SQL injection
- Strip or escape HTML in string fields

### Rate Limiting
- Apply rate limiting on auth endpoints:
  - Login: max **10 requests / minute** per IP
  - Register: max **5 requests / minute** per IP

### CORS
- Restrict `Access-Control-Allow-Origin` to the known frontend domain
- Do not use wildcard `*` in production

### File Uploads
- Validate MIME type server-side (not just extension)
- Scan uploaded files for malware if the infrastructure allows
- Store files outside the web root or in a separate bucket

---

## 17. Environment Variables

The backend service must support the following environment variables:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/svss_db

# JWT
JWT_SECRET=your_strong_256_bit_secret_here
JWT_EXPIRES_IN=24h

# File Storage
STORAGE_PROVIDER=local          # or: s3 | gcs
STORAGE_BUCKET=svss-uploads
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=

# Local storage fallback (dev only)
LOCAL_UPLOAD_DIR=./uploads

# CORS
CORS_ORIGIN=http://localhost:5173

# Frontend Base URL (for redirect links in emails etc.)
FRONTEND_URL=http://localhost:5173
```

---

## Summary — All Endpoints

| Method | Endpoint | Auth | Roles |
|--------|----------|------|-------|
| `POST` | `/api/auth/login` | Public | — |
| `POST` | `/api/auth/register` | Public | — |
| `POST` | `/api/auth/logout` | Bearer | admin, security |
| `POST` | `/api/customer/auth/login` | Public | — |
| `POST` | `/api/customer/auth/register` | Public | — |
| `POST` | `/api/customer/auth/logout` | Bearer | customer |
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
| `POST` | `/api/customer/tickets/purchase` | Bearer | customer |

---

*Generated from the SVSS frontend source — July 2026.*
*Frontend base URL configured via `VITE_API_BASE_URL` environment variable (defaults to `/api`).*
