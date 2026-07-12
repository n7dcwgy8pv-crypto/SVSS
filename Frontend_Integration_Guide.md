# SVSS — Frontend Integration Guide
## Smart Venue Security System — Complete API Reference for Frontend Developers

---

## Table of Contents

1. [Setup & Base Configuration](#1-setup--base-configuration)
2. [Development Tools](#2-development-tools)
3. [Authentication Flow](#3-authentication-flow)
4. [Module 1 — Staff Auth](#4-module-1--staff-auth)
5. [Module 2 — Customer Auth](#5-module-2--customer-auth)
6. [Module 3 — Profile / Session](#6-module-3--profile--session)
7. [Module 4 — Tickets (Admin/Security)](#7-module-4--tickets-adminsecurity)
8. [Module 5 — QR Verification (Security)](#8-module-5--qr-verification-security)
9. [Module 6 — Incidents](#9-module-6--incidents)
10. [Module 7 — Users (Admin)](#10-module-7--users-admin)
11. [Module 8 — Dashboard](#11-module-8--dashboard)
12. [Module 9 — Reports (Admin)](#12-module-9--reports-admin)
13. [Module 10 — Events (Customer)](#13-module-10--events-customer)
14. [Module 11 — Customer Tickets](#14-module-11--customer-tickets)
15. [Error Handling](#15-error-handling)
16. [File Upload Rules](#16-file-upload-rules)
17. [Rate Limiting](#17-rate-limiting)
18. [QR Data Format](#18-qr-data-format)
19. [TypeScript Types Reference](#19-typescript-types-reference)
20. [Quick Reference — All Endpoints](#quick-reference--all-endpoints)

---

## 1. Setup & Base Configuration

### Environment Variables (Frontend `.env`)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Base URL

```
http://localhost:8000/api
```

All endpoint paths in this guide are relative to this base URL. The full URL for any endpoint is `{VITE_API_BASE_URL}{path}`.

### Axios Instance

```ts
// src/lib/axios.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler — redirect to appropriate login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const role = localStorage.getItem('role');
      localStorage.clear();
      window.location.href = role === 'customer' ? '/customer/login' : '/login';
    }
    return Promise.reject(error);
  },
);

export default api;
```

> **Important — multipart/form-data:** Never manually set `Content-Type: multipart/form-data` in Axios when uploading files. Pass the `FormData` object directly and let Axios set the header automatically with the correct boundary. Overriding it manually will break the upload.

### Response Envelope

Every response follows this shape:

```ts
// Success (single resource)
{ success: true; data: T }

// Success (list with pagination)
{ success: true; data: T[]; pagination: Pagination }

// Error
{ success: false; message: string; errors?: { message: string }[] }
```

```ts
interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
```

- `errors[]` is only present on `400` / `422` responses and contains field-level detail.
- Error responses never contain a `data` key.

---

## 2. Development Tools

### Swagger UI

Interactive API documentation is available while the backend is running:

```
http://localhost:8000/api-docs
```

Use it to explore all endpoints, inspect request/response schemas, and test calls directly with a Bearer token via the **Authorize** button.

### MongoDB

The backend uses MongoDB. Default connection: `mongodb://localhost:27017/svss`

Configure via the backend `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/svss
```

---

## 3. Authentication Flow

### Token Storage

```ts
// After login / register — store token and role
localStorage.setItem('token', data.token);
localStorage.setItem('role', data.user.role);
```

### Portal Rules

| Role | Login endpoint | Redirect on 401 |
|------|---------------|-----------------|
| `admin` / `security` | `POST /auth/login` | `/login` |
| `customer` | `POST /customer/auth/login` | `/customer/login` |

- A `customer` token on any staff endpoint (`/tickets`, `/users`, `/incidents`, `/dashboard`, `/reports`) → `403`.
- An `admin`/`security` token on any customer endpoint (`/events`, `/customer/tickets`) → `403`.
- `GET /me` works for **all three roles** — use it to rehydrate the session on app load regardless of role.

---

## 4. Module 1 — Staff Auth

### POST `/auth/login`

```ts
const staffLoginApi = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data; // { success: true, data: { user: User, token: string } }
};
```

**Errors to handle:**

| Status | Reason |
|--------|--------|
| `400` | Validation failed (empty fields, bad email format) |
| `401` | Wrong email or password |
| `403` | Account inactive, or customer trying staff portal |

---

### POST `/auth/register`

```ts
const staffRegisterApi = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'security';
  password: string;
  confirmPassword: string;
}) => {
  const { data } = await api.post('/auth/register', payload);
  return data; // { success: true, data: { user: User, token: string } }
};
```

**Notes:**
- `role` must be `admin` or `security`. Sending `customer` returns `400` with message `"Staff registration does not accept the customer role."`.
- Returns `409` if email already exists.

---

### POST `/auth/logout`

```ts
const staffLogoutApi = async () => {
  await api.post('/auth/logout');
  localStorage.clear();
};
```

Requires `Authorization: Bearer <token>` header (attached automatically by the Axios interceptor).

---

## 5. Module 2 — Customer Auth

### POST `/customer/auth/login`

```ts
const customerLoginApi = async (email: string, password: string) => {
  const { data } = await api.post('/customer/auth/login', { email, password });
  return data; // { success: true, data: { user: User, token: string } }
};
```

**Errors to handle:**

| Status | Reason |
|--------|--------|
| `400` | Validation failed |
| `401` | Wrong email or password |
| `403` | Account inactive, or staff trying customer portal |

---

### POST `/customer/auth/register`

```ts
const customerRegisterApi = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}) => {
  const { data } = await api.post('/customer/auth/register', payload);
  return data; // { success: true, data: { user: User, token: string } }
};
```

**Notes:**
- Do **not** send a `role` field — it is ignored server-side and always set to `customer`.
- Returns `409` if email already exists.

---

### POST `/customer/auth/logout`

```ts
const customerLogoutApi = async () => {
  await api.post('/customer/auth/logout');
  localStorage.clear();
};
```

---

## 6. Module 3 — Profile / Session

### GET `/me`

Available to **all roles** — `admin`, `security`, and `customer`. Use on every app boot to confirm the token is still valid and the account is still active.

```ts
const getMeApi = async () => {
  const { data } = await api.get('/me');
  return data; // { success: true, data: User }
};
```

**Typical usage:**

```ts
// On app boot — works for all portals
try {
  const res = await getMeApi();
  setCurrentUser(res.data); // res.data is a User object
} catch {
  // 401 — token expired or user deactivated since token was issued
  localStorage.clear();
  const role = localStorage.getItem('role');
  redirect(role === 'customer' ? '/customer/login' : '/login');
}
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| `401` | No token, expired token, invalid signature |
| `401` | User account deactivated after token was issued |

---

## 7. Module 4 — Tickets (Admin/Security)

### GET `/tickets`

Accessible by both `admin` and `security` roles. The `search` param does a case-insensitive match against **visitor name**, **ticket ID** (e.g. `TKT-001`), and **event name** simultaneously.

```ts
const getTicketsApi = async (params?: {
  search?: string;   // matches visitorName, ticketId, or event name
  status?: 'valid' | 'used' | 'invalid';
  page?: number;     // default: 1
  pageSize?: number; // default: 20, max: 100
}) => {
  const { data } = await api.get('/tickets', { params });
  return data;
  // { success: true, data: Ticket[], pagination: Pagination }
};
```

---

### GET `/tickets/:id`

Works for **both** admin-created tickets (`TKT-001`) and customer-purchased tickets (`TKT-C001`) — they share the same table and the same endpoint.

```ts
const getTicketByIdApi = async (id: string) => {
  // id can be TKT-001, TKT-C001, etc.
  const { data } = await api.get(`/tickets/${id}`);
  return data; // { success: true, data: Ticket }
};
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| `404` | Ticket not found |

---

### POST `/tickets` — `multipart/form-data`

> Do **not** set `Content-Type` manually — pass the `FormData` directly and Axios will set the correct multipart boundary automatically.

```ts
const createTicketApi = async (payload: {
  visitorName: string;
  visitorEmail: string;
  event: string;
  eventDate: string; // YYYY-MM-DD
  zone: string;      // e.g. 'VIP', 'Premium', 'General', 'Standard'
  seat: string;      // e.g. 'A12'
  photo: File;       // required — JPG/PNG/WebP, max 5 MB
}) => {
  const form = new FormData();
  form.append('visitorName', payload.visitorName);
  form.append('visitorEmail', payload.visitorEmail);
  form.append('event', payload.event);
  form.append('eventDate', payload.eventDate);
  form.append('zone', payload.zone);
  form.append('seat', payload.seat);
  form.append('photo', payload.photo); // field name must be 'photo'

  const { data } = await api.post('/tickets', form);
  // Do NOT pass headers here — Axios handles multipart/form-data automatically
  return data; // { success: true, data: Ticket }  HTTP 201
};
```

**Server-side behaviour:**
- Generates sequential ticket ID: `TKT-001`, `TKT-002`, …
- Generates `qrData`: `{ticketId}|{visitorName}|{event}|{zone}|{seat}`
- Sets `status = "valid"`, `ownerId = null`, `purchasedAt = null`, `price = null`

**Error Responses:**

| Status | Reason |
|--------|--------|
| `400` | Missing required fields, missing photo, or unsupported file type |
| `403` | Not `admin` role |
| `413` | Photo exceeds 5 MB |

---

### PUT `/tickets/:id`

Only `admin` role. Send only the fields you want to change — all fields are optional.

```ts
const updateTicketApi = async (
  id: string,
  payload: Partial<{
    visitorName: string;
    visitorEmail: string;
    event: string;
    eventDate: string; // YYYY-MM-DD
    zone: string;
    seat: string;
    status: 'valid' | 'used' | 'invalid';
  }>,
) => {
  const { data } = await api.put(`/tickets/${id}`, payload);
  return data; // { success: true, data: Ticket }
};
```

**Business rules:**
- Setting `status = "used"` → server automatically sets `usedAt = NOW()`.
- Setting `status = "valid"` or `"invalid"` → server clears `usedAt` to `null`.
- `qrData` is **never** recalculated on update — printed/distributed QR codes stay valid.

**Error Responses:**

| Status | Reason |
|--------|--------|
| `400` | Invalid status value |
| `403` | Not `admin` role |
| `404` | Ticket not found |

---

## 8. Module 5 — QR Verification (Security)

### POST `/tickets/verify`

Always returns HTTP `200` regardless of whether the ticket is valid, used, or not found. **Never treat a non-200 status as a business result here** — only `401`/`403`/`500` indicate non-business errors.

The `qrData` field accepts **either** the full pipe-separated QR payload **or** just the ticket ID:

```ts
// Full QR string (from a scanned QR code)
{ qrData: "TKT-001|John Doe|Rock Concert 2026|VIP|A12" }

// Ticket ID only (manual lookup)
{ qrData: "TKT-001" }
```

```ts
const verifyTicketApi = async (qrData: string) => {
  const { data } = await api.post('/tickets/verify', { qrData });
  return data;
  // { success: true, data: { valid: boolean, reason: string | null, ticket: Ticket | null } }
};
```

**Response cases:**

```ts
// Valid ticket — allow entry
{ valid: true, reason: null, ticket: Ticket }

// Already scanned/used
{ valid: false, reason: "Ticket has already been used.", ticket: Ticket }

// Manually invalidated
{ valid: false, reason: "Ticket is marked invalid.", ticket: Ticket }

// Not in system
{ valid: false, reason: "Ticket not found in system.", ticket: null }
```

**Non-business error responses:**

| Status | Reason |
|--------|--------|
| `400` | `qrData` field missing from request body |
| `401` | Unauthenticated |
| `403` | Not `security` role |

---

### POST `/tickets/:id/approve`

Marks the ticket as `used`, records the scan as `approved`. Only call this after a successful `verify` response with `valid: true`.

```ts
const approveTicketApi = async (ticketId: string) => {
  const { data } = await api.post(`/tickets/${ticketId}/approve`);
  return data;
  // { success: true, data: { success: true, ticketId: string, usedAt: string } }
};
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| `404` | Ticket not found |
| `409` | Ticket already used (double-tap prevention) |

---

### POST `/tickets/:id/reject`

Records the scan as `rejected`. Does **not** change the ticket status — the ticket remains in its current state.

```ts
const rejectTicketApi = async (ticketId: string) => {
  const { data } = await api.post(`/tickets/${ticketId}/reject`);
  return data;
  // { success: true, data: { success: true, ticketId: string } }
};
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| `404` | Ticket not found |

---

## 9. Module 6 — Incidents

### GET `/incidents`

The `search` param matches against `description`, `ticketId`, and `reportedBy` (case-insensitive). Date filters use `YYYY-MM-DD` format and are inclusive on both ends.

```ts
const getIncidentsApi = async (params?: {
  type?: 'duplicate' | 'suspicious' | 'invalid' | 'other';
  status?: 'open' | 'investigating' | 'resolved';
  search?: string;   // matches description, ticketId, or reportedBy
  dateFrom?: string; // YYYY-MM-DD inclusive
  dateTo?: string;   // YYYY-MM-DD inclusive
  page?: number;     // default: 1
  pageSize?: number; // default: 20, max: 100
}) => {
  const { data } = await api.get('/incidents', { params });
  return data;
  // { success: true, data: Incident[], pagination: Pagination }
};
```

---

### GET `/incidents/:id`

```ts
const getIncidentByIdApi = async (id: string) => {
  const { data } = await api.get(`/incidents/${id}`);
  return data; // { success: true, data: Incident }
};
```

---

### POST `/incidents`

Only `security` role. `ticketId` is optional — an incident can exist without a linked ticket (e.g. scanner malfunction). If provided and the ticket ID doesn't exist in the system, a warning is logged server-side but the incident is still created successfully.

```ts
const createIncidentApi = async (payload: {
  type: 'duplicate' | 'suspicious' | 'invalid' | 'other';
  ticketId?: string; // optional soft reference
  description: string; // minimum 10 characters
}) => {
  const { data } = await api.post('/incidents', payload);
  return data; // { success: true, data: Incident }  HTTP 201
};
```

**Server auto-sets:**
- `status = "open"`
- `reportedBy` = authenticated user's name (snapshot)
- `reportedById` = authenticated user's ID
- `id` = sequential `INC-001`, `INC-002`, …

**Error Responses:**

| Status | Reason |
|--------|--------|
| `400` | Missing/invalid `type` or `description` too short (< 10 chars) |
| `403` | Not `security` role |

---

### PATCH `/incidents/:id/status`

Only `admin` role. Transitions the incident through its lifecycle.

```ts
const updateIncidentStatusApi = async (
  id: string,
  status: 'open' | 'investigating' | 'resolved',
) => {
  const { data } = await api.patch(`/incidents/${id}/status`, { status });
  return data; // { success: true, data: Incident }
};
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| `400` | Invalid status value |
| `403` | Not `admin` role |
| `404` | Incident not found |

---

## 10. Module 7 — Users (Admin)

### GET `/users`

Returns **all users** — staff (admin/security) and customers. Filter by `role` to show only staff. The `search` param matches against `name` and `email`.

```ts
const getUsersApi = async (params?: {
  role?: 'admin' | 'security' | 'customer';
  status?: 'active' | 'inactive';
  search?: string;   // matches name or email
  page?: number;     // default: 1
  pageSize?: number; // default: 20, max: 100
}) => {
  const { data } = await api.get('/users', { params });
  return data;
  // { success: true, data: User[], pagination: Pagination }
};
```

---

### POST `/users`

Creates a staff account with an auto-generated temporary password. No `password` field is sent from the frontend.

```ts
const createUserApi = async (payload: {
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'security'; // customer not allowed here
}) => {
  const { data } = await api.post('/users', payload);
  return data;
  // { success: true, data: { user: User, temporaryPassword: string } }  HTTP 201
};
```

> `temporaryPassword` is returned **once** in this response only — it is stored hashed afterwards. Display it to the admin immediately (e.g. in a modal) so they can share it with the new user.

**Error Responses:**

| Status | Reason |
|--------|--------|
| `400` | Validation errors |
| `403` | Not `admin` role |
| `409` | Email already exists |

---

### PATCH `/users/:id/status`

Toggles between `active` ↔ `inactive`. Pass the MongoDB `_id` string of the target user (returned in the `id` field of any User object).

```ts
const toggleUserStatusApi = async (userId: string) => {
  // userId is the user's `id` field from any GET /users response
  const { data } = await api.patch(`/users/${userId}/status`);
  return data; // { success: true, data: User }
};
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| `403` | Not `admin` role, or trying to deactivate own account |
| `404` | User not found |

---

## 11. Module 8 — Dashboard

Both `admin` and `security` roles have access to all dashboard endpoints.

### GET `/dashboard/stats`

Returns aggregate counts for the entire system. No query params.

```ts
const getDashboardStatsApi = async () => {
  const { data } = await api.get('/dashboard/stats');
  return data;
  // { success: true, data: DashboardStats }
};
```

**Response shape:**

```ts
{
  totalTickets: number;
  usedTickets: number;
  validTickets: number;
  invalidTickets: number;
  totalEntries: number;
  approvedEntries: number;
  rejectedEntries: number;
  totalIncidents: number;
  openIncidents: number;
  todayScans: number;   // scans from today (server local date)
}
```

---

### GET `/dashboard/scans`

Returns the most recent scan log entries for the live entry feed. Default `limit` is **10**.

```ts
const getDashboardScansApi = async (limit = 10) => {
  const { data } = await api.get('/dashboard/scans', { params: { limit } });
  return data;
  // { success: true, data: ScanLog[] }
};
```

Each `ScanLog` item:

```ts
{
  id: string;
  ticketId: string | null;
  visitorName: string | null;
  result: 'approved' | 'rejected';
  scannedBy: string; // user ID of the security officer
  time: string;      // ISO 8601 datetime
}
```

---

## 12. Module 9 — Reports (Admin)

All report endpoints are `admin` only. Default `pageSize` is **50** (not 20 like other list endpoints).

### GET `/reports/tickets`

```ts
const getTicketsReportApi = async (params?: {
  dateFrom?: string;  // YYYY-MM-DD — filters by ticket createdAt >=
  dateTo?: string;    // YYYY-MM-DD — filters by ticket createdAt <=
  status?: 'valid' | 'used' | 'invalid';
  event?: string;     // partial case-insensitive match on event name
  zone?: string;      // exact match e.g. 'VIP'
  page?: number;      // default: 1
  pageSize?: number;  // default: 50, max: 100
}) => {
  const { data } = await api.get('/reports/tickets', { params });
  return data;
};
```

**Response shape:**

```ts
{
  success: true,
  data: {
    summary: {
      totalTickets: number;
      validTickets: number;
      usedTickets: number;
      invalidTickets: number;
    },
    tickets: Ticket[],      // full ticket objects
    pagination: Pagination
  }
}
```

---

### GET `/reports/incidents`

Returns all matching incidents (no pagination).

```ts
const getIncidentsReportApi = async (params?: {
  dateFrom?: string;
  dateTo?: string;
  type?: 'duplicate' | 'suspicious' | 'invalid' | 'other';
  status?: 'open' | 'investigating' | 'resolved';
}) => {
  const { data } = await api.get('/reports/incidents', { params });
  return data;
};
```

**Response shape:**

```ts
{
  success: true,
  data: {
    summary: {
      total: number;
      open: number;
      investigating: number;
      resolved: number;
    },
    incidents: Incident[]   // full incident objects
  }
}
```

---

### GET `/reports/entries`

```ts
const getEntriesReportApi = async (params?: {
  dateFrom?: string;
  dateTo?: string;
  result?: 'approved' | 'rejected';
  page?: number;      // default: 1
  pageSize?: number;  // default: 50, max: 100
}) => {
  const { data } = await api.get('/reports/entries', { params });
  return data;
};
```

**Response shape:**

```ts
{
  success: true,
  data: {
    summary: {
      total: number;
      approved: number;
      rejected: number;
    },
    entries: ScanLog[],
    pagination: Pagination
  }
}
```

---

## 13. Module 10 — Events (Customer)

`customer` role only. Only **upcoming** events (date >= today) are returned.

### GET `/events`

The `search` param matches against event `name`, `venue`, and `category`. Default `pageSize` is **12**.

```ts
const getEventsApi = async (params?: {
  search?: string;    // matches name, venue, or category
  category?: 'Concert' | 'Expo' | 'Conference' | 'Festival';
  page?: number;      // default: 1
  pageSize?: number;  // default: 12, max: 100
}) => {
  const { data } = await api.get('/events', { params });
  return data;
  // { success: true, data: Event[], pagination: Pagination }
};
```

Each event includes **live zone availability**:

```ts
{
  id: string;
  name: string;
  venue: string;
  date: string;        // YYYY-MM-DD
  time: string;        // "HH:MM"
  category: string;
  image: string | null;
  description: string | null;
  zones: [
    { name: 'VIP',      price: 250, available: 19 },
    { name: 'Premium',  price: 150, available: 45 },
    { name: 'General',  price: 80,  available: 120 },
    { name: 'Standard', price: 50,  available: 200 },
  ]
}
```

---

### GET `/events/:id`

```ts
const getEventByIdApi = async (id: string) => {
  const { data } = await api.get(`/events/${id}`);
  return data; // { success: true, data: Event }
};
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| `404` | Event not found |

---

## 14. Module 11 — Customer Tickets

`customer` role only. All endpoints scope automatically to the authenticated customer.

### GET `/customer/tickets`

Sorted by `purchasedAt` descending (newest first).

```ts
const getMyTicketsApi = async (params?: {
  status?: 'valid' | 'used' | 'invalid';
  page?: number;     // default: 1
  pageSize?: number; // default: 20, max: 100
}) => {
  const { data } = await api.get('/customer/tickets', { params });
  return data;
  // { success: true, data: Ticket[], pagination: Pagination }
};
```

---

### GET `/customer/tickets/:id`

```ts
const getMyTicketByIdApi = async (id: string) => {
  // id is the ticketId string e.g. "TKT-C001"
  const { data } = await api.get(`/customer/tickets/${id}`);
  return data; // { success: true, data: Ticket }
};
```

**Error Responses:**

| Status | Reason |
|--------|--------|
| `403` | Ticket belongs to a different customer |
| `404` | Ticket not found |

---

### POST `/customer/tickets/purchase` — `multipart/form-data`

> Do **not** set `Content-Type` manually — pass `FormData` directly.

```ts
const purchaseTicketApi = async (payload: {
  eventId: string;      // MongoDB _id from GET /events
  zone: string;         // must match a zone name in the event e.g. 'VIP'
  visitorName: string;
  visitorEmail: string;
  photo: File;          // required — JPG/PNG/WebP, max 5 MB, field name: 'photo'
}) => {
  const form = new FormData();
  form.append('eventId', payload.eventId);
  form.append('zone', payload.zone);
  form.append('visitorName', payload.visitorName);
  form.append('visitorEmail', payload.visitorEmail);
  form.append('photo', payload.photo);

  const { data } = await api.post('/customer/tickets/purchase', form);
  return data; // { success: true, data: Ticket }  HTTP 201
};
```

**Server-side behaviour:**
- Atomically decrements zone availability — safe against concurrent purchases (no overselling).
- Auto-generates seat: `AUTO-{ZoneInitial}{1–200}{A–H}` e.g. `AUTO-V112C`.
- Generates ticket ID: `TKT-C001`, `TKT-C002`, …
- Sets `ownerId`, `purchasedAt`, and `price` from the zone.

**Error Responses:**

| Status | Reason |
|--------|--------|
| `400` | Missing fields, missing photo, or unsupported file type |
| `403` | Not `customer` role |
| `404` | Event not found |
| `404` | Zone not found in this event |
| `409` | Zone is sold out |
| `413` | Photo exceeds 5 MB |

---

## 15. Error Handling

### Error response shape

```ts
// All errors
{ success: false, message: string }

// Additionally on 400 / 422 — field-level detail
{ success: false, message: string, errors: [{ message: string }] }
```

### Utility helper

```ts
// src/lib/handleApiError.ts
import { AxiosError } from 'axios';

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as
      | { success: false; message: string; errors?: { message: string }[] }
      | undefined;

    if (body?.errors?.length) {
      return body.errors.map((e) => e.message).join('\n');
    }
    return body?.message ?? error.message;
  }
  return 'An unexpected error occurred.';
}
```

### Status code reference

| Code | Meaning | When it appears |
|------|---------|----------------|
| `200` | OK | Successful GET / PUT / PATCH; also `POST /tickets/verify` even when invalid |
| `201` | Created | POST register, POST /tickets, POST /incidents, POST /users, POST /customer/tickets/purchase |
| `400` | Bad Request | Validation failure — check `errors[]` array |
| `401` | Unauthorized | No token, expired token, invalid signature, or user deactivated |
| `403` | Forbidden | Valid token but wrong role or wrong portal |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate email, already-used ticket, sold-out zone |
| `413` | Payload Too Large | Uploaded file > 5 MB |
| `429` | Too Many Requests | Rate limit hit on auth endpoints |
| `500` | Server Error | Unhandled exception — report to backend team |

### React usage example

```tsx
const [error, setError] = useState('');

const handleLogin = async () => {
  try {
    const res = await staffLoginApi(email, password);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('role', res.data.user.role);
    navigate('/dashboard');
  } catch (err) {
    if (err instanceof AxiosError && err.response?.status === 429) {
      setError('Too many attempts. Please wait before trying again.');
    } else {
      setError(getErrorMessage(err));
    }
  }
};
```

---

## 16. File Upload Rules

Both `POST /tickets` (admin) and `POST /customer/tickets/purchase` (customer) accept a photo under field name **`photo`**.

| Rule | Detail |
|------|--------|
| Field name | Must be exactly `photo` |
| Accepted MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Maximum size | 5 MB |
| Content-Type header | Set automatically by Axios when passing `FormData` — do **not** override manually |
| Server validation | MIME type is validated from the file buffer — not just the extension |
| Storage (dev) | `./uploads/` served at `http://localhost:8000/uploads/` |

```ts
// Correct
const form = new FormData();
form.append('photo', file);
await api.post('/tickets', form); // no headers override

// Wrong — manually setting Content-Type breaks the multipart boundary
await api.post('/tickets', form, {
  headers: { 'Content-Type': 'multipart/form-data' }, // breaks it
});
```

---

## 17. Rate Limiting

Auth endpoints are rate-limited per IP. Exceeding the limit returns HTTP `429`.

| Endpoint | Limit |
|----------|-------|
| `POST /auth/login` | 10 requests / minute |
| `POST /auth/register` | 5 requests / minute |
| `POST /customer/auth/login` | 10 requests / minute |
| `POST /customer/auth/register` | 5 requests / minute |

Handle `429` by showing a cooldown message and temporarily disabling the submit button.

---

## 18. QR Data Format

The `qrData` field on every ticket is a pipe-separated string:

```
{ticketId}|{visitorName}|{eventName}|{zone}|{seat}
```

**Examples:**

```
TKT-001|John Doe|Rock Concert 2026|VIP|A12
TKT-C001|Eva Customer|Rock Concert 2026|General|AUTO-G45H
```

When a security officer scans a QR code, the full string is sent to `POST /tickets/verify`. The endpoint also accepts just the ticket ID (for manual lookups):

```ts
// From QR scanner — full string
await verifyTicketApi('TKT-001|John Doe|Rock Concert 2026|VIP|A12');

// Manual lookup — ticket ID only
await verifyTicketApi('TKT-001');
await verifyTicketApi('TKT-C001');
```

The server matches against both the `qrData` field and the `ticketId` field, so either format works.

---

## 19. TypeScript Types Reference

```ts
// ── Users ────────────────────────────────────────────────────
type UserRole   = 'admin' | 'security' | 'customer';
type UserStatus = 'active' | 'inactive';

interface User {
  id: string;        // MongoDB ObjectId as string
  name: string;      // "First Last"
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string; // YYYY-MM-DD
}

// ── Tickets ──────────────────────────────────────────────────
type TicketStatus = 'valid' | 'used' | 'invalid';

interface Ticket {
  id: string;               // "TKT-001" (admin) or "TKT-C001" (customer)
  visitorName: string;
  visitorEmail: string | null;
  eventId: string | null;   // null for admin-created tickets
  event: string;            // denormalized event name snapshot
  eventDate: string | null; // YYYY-MM-DD
  venue: string | null;
  zone: string;             // e.g. "VIP"
  seat: string;             // e.g. "A12" or "AUTO-G45H"
  price: number | null;     // null for admin-created tickets
  status: TicketStatus;
  usedAt: string | null;    // ISO 8601 — set when status becomes "used"
  qrData: string;           // "TKT-001|John Doe|Event|Zone|Seat"
  photoUrl: string | null;  // full URL to uploaded photo
  ownerId: string | null;   // null for admin-created tickets
  purchasedAt: string | null; // ISO 8601
  createdAt: string;        // YYYY-MM-DD
}

// ── Events ───────────────────────────────────────────────────
type EventCategory = 'Concert' | 'Expo' | 'Conference' | 'Festival';

interface EventZone {
  name: string;       // "VIP" | "Premium" | "General" | "Standard"
  price: number;
  available: number;  // live count — decremented on each purchase
}

interface Event {
  id: string;         // MongoDB ObjectId as string
  name: string;
  venue: string;
  date: string;       // YYYY-MM-DD
  time: string;       // "HH:MM" e.g. "19:00"
  category: EventCategory;
  image: string | null;
  description: string | null;
  zones: EventZone[];
}

// ── Incidents ────────────────────────────────────────────────
type IncidentType   = 'duplicate' | 'suspicious' | 'invalid' | 'other';
type IncidentStatus = 'open' | 'investigating' | 'resolved';

interface Incident {
  id: string;           // "INC-001"
  type: IncidentType;
  ticketId: string | null;  // soft reference — may not exist in tickets
  description: string;
  reportedBy: string;       // denormalized name snapshot
  reportedById: string;     // MongoDB ObjectId of the reporter
  status: IncidentStatus;
  createdAt: string;        // ISO 8601 full datetime
}

// ── Scan Logs ────────────────────────────────────────────────
type ScanResult = 'approved' | 'rejected';

interface ScanLog {
  id: string;               // MongoDB ObjectId as string
  ticketId: string | null;
  visitorName: string | null;
  result: ScanResult;
  scannedBy: string;        // MongoDB ObjectId of the security officer
  time: string;             // ISO 8601 datetime
}

// ── Verify response ──────────────────────────────────────────
interface VerifyResult {
  valid: boolean;
  reason: string | null;    // null when valid === true
  ticket: Ticket | null;    // null only when ticket not found
}

// ── Dashboard ────────────────────────────────────────────────
interface DashboardStats {
  totalTickets: number;
  usedTickets: number;
  validTickets: number;
  invalidTickets: number;
  totalEntries: number;
  approvedEntries: number;
  rejectedEntries: number;
  totalIncidents: number;
  openIncidents: number;
  todayScans: number;
}

// ── Report summaries ─────────────────────────────────────────
interface TicketReportSummary {
  totalTickets: number;
  validTickets: number;
  usedTickets: number;
  invalidTickets: number;
}

interface IncidentReportSummary {
  total: number;
  open: number;
  investigating: number;
  resolved: number;
}

interface EntryReportSummary {
  total: number;
  approved: number;
  rejected: number;
}

// ── Pagination ───────────────────────────────────────────────
interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ── Generic API response wrappers ────────────────────────────
interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiList<T> {
  success: true;
  data: T[];
  pagination: Pagination;
}

interface ApiError {
  success: false;
  message: string;
  errors?: { message: string }[];
}
```

---

## Quick Reference — All Endpoints

| Method | Endpoint | HTTP | Auth | Allowed Roles |
|--------|----------|------|------|---------------|
| `POST` | `/auth/login` | 200 | Public | — |
| `POST` | `/auth/register` | 201 | Public | — |
| `POST` | `/auth/logout` | 200 | Bearer | admin, security |
| `POST` | `/customer/auth/login` | 200 | Public | — |
| `POST` | `/customer/auth/register` | 201 | Public | — |
| `POST` | `/customer/auth/logout` | 200 | Bearer | customer |
| `GET` | `/me` | 200 | Bearer | admin, security, customer |
| `GET` | `/tickets` | 200 | Bearer | admin, security |
| `GET` | `/tickets/:id` | 200 | Bearer | admin, security |
| `POST` | `/tickets` | 201 | Bearer | admin |
| `PUT` | `/tickets/:id` | 200 | Bearer | admin |
| `POST` | `/tickets/verify` | 200 | Bearer | security |
| `POST` | `/tickets/:id/approve` | 200 | Bearer | security |
| `POST` | `/tickets/:id/reject` | 200 | Bearer | security |
| `GET` | `/incidents` | 200 | Bearer | admin, security |
| `GET` | `/incidents/:id` | 200 | Bearer | admin, security |
| `POST` | `/incidents` | 201 | Bearer | security |
| `PATCH` | `/incidents/:id/status` | 200 | Bearer | admin |
| `GET` | `/users` | 200 | Bearer | admin |
| `POST` | `/users` | 201 | Bearer | admin |
| `PATCH` | `/users/:id/status` | 200 | Bearer | admin |
| `GET` | `/dashboard/stats` | 200 | Bearer | admin, security |
| `GET` | `/dashboard/scans` | 200 | Bearer | admin, security |
| `GET` | `/reports/tickets` | 200 | Bearer | admin |
| `GET` | `/reports/incidents` | 200 | Bearer | admin |
| `GET` | `/reports/entries` | 200 | Bearer | admin |
| `GET` | `/events` | 200 | Bearer | customer |
| `GET` | `/events/:id` | 200 | Bearer | customer |
| `GET` | `/customer/tickets` | 200 | Bearer | customer |
| `GET` | `/customer/tickets/:id` | 200 | Bearer | customer |
| `POST` | `/customer/tickets/purchase` | 201 | Bearer | customer |

---

*Generated from SVSS backend implementation — July 2026.*
*Swagger UI: `http://localhost:8000/api-docs`*
