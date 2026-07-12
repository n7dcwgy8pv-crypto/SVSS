# SVSS — Events API Integration Guide

---

## Overview

The Events module provides two read-only endpoints for the **customer portal**. Customers browse upcoming events, view zone pricing and live availability, then use the event `id` and a chosen zone to purchase a ticket.

| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| `GET` | `/api/events` | Bearer | `customer` |
| `GET` | `/api/events/:id` | Bearer | `customer` |

**Base URL:** `http://localhost:8000/api`  
**Swagger UI:** `http://localhost:8000/api-docs`

> Both endpoints require a valid `customer` JWT in the `Authorization: Bearer <token>` header. `admin` and `security` tokens receive `403`.

---

## Data Model

### Event object

```ts
interface EventZone {
  name: string;       // 'VIP' | 'Premium' | 'General' | 'Standard'
  price: number;      // price per ticket in this zone
  available: number;  // live seat count — decrements on each purchase
}

interface Event {
  id: string;               // MongoDB ObjectId string — use this for GET /events/:id and purchase
  name: string;             // e.g. "Rock Concert 2026"
  venue: string;            // e.g. "Grand Arena, Downtown"
  date: string;             // YYYY-MM-DD  e.g. "2026-09-15"
  time: string;             // HH:MM  e.g. "19:00"
  category: EventCategory;  // 'Concert' | 'Expo' | 'Conference' | 'Festival'
  image: string | null;     // full URL or null
  description: string | null;
  zones: EventZone[];       // always an array — may be empty if no zones configured
}

type EventCategory = 'Concert' | 'Expo' | 'Conference' | 'Festival';
```

**Notes:**
- `id` is the MongoDB `_id` as a string. Pass it directly to `GET /api/events/:id` and `POST /api/customer/tickets/purchase` as `eventId`.
- `available` on each zone is a live count — it reflects real-time purchases. Always re-fetch before showing a purchase form to avoid showing stale availability.
- Only events with `date >= today` (server date) are returned. Past events never appear.

---

## GET `/api/events`

### Description

Returns a paginated list of all **upcoming** events. Supports search and category filtering. Sorted by date ascending (soonest first).

### Access

Protected — `customer` role only.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `search` | string | No | — | Case-insensitive match against event `name`, `venue`, and `category` |
| `category` | string | No | — | Exact match: `Concert`, `Expo`, `Conference`, or `Festival` |
| `page` | integer | No | `1` | Page number (1-indexed) |
| `pageSize` | integer | No | `12` | Items per page (max: 100) |

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": [
    {
      "id": "64abc123def456789012abcd",
      "name": "Rock Concert 2026",
      "venue": "Grand Arena, Downtown",
      "date": "2026-09-15",
      "time": "19:00",
      "category": "Concert",
      "image": "http://localhost:8000/uploads/events/evt001.jpg",
      "description": "An electrifying night of rock music.",
      "zones": [
        { "name": "VIP",      "price": 250, "available": 19 },
        { "name": "Premium",  "price": 150, "available": 45 },
        { "name": "General",  "price": 80,  "available": 120 },
        { "name": "Standard", "price": 50,  "available": 200 }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 12,
    "total": 4,
    "totalPages": 1
  }
}
```

### Error Responses

| Status | Reason |
|--------|--------|
| `401` | Token missing, expired, or invalid |
| `403` | Token belongs to `admin` or `security` role |

### Axios Implementation

```ts
// src/api/events.api.ts
import api from 'src/lib/axios';

export type EventCategory = 'Concert' | 'Expo' | 'Conference' | 'Festival';

export interface EventZone {
  name: string;
  price: number;
  available: number;
}

export interface Event {
  id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  category: EventCategory;
  image: string | null;
  description: string | null;
  zones: EventZone[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface GetEventsParams {
  search?: string;
  category?: EventCategory;
  page?: number;
  pageSize?: number;
}

export interface GetEventsResponse {
  success: true;
  data: Event[];
  pagination: Pagination;
}

export const getEventsApi = async (
  params?: GetEventsParams,
): Promise<GetEventsResponse> => {
  const { data } = await api.get<GetEventsResponse>('/events', { params });
  return data;
};
```

### Usage Examples

```ts
// Load all upcoming events — first page, default 12 per page
const res = await getEventsApi();
const events = res.data;

// Search by keyword
const res = await getEventsApi({ search: 'rock' });

// Filter by category
const res = await getEventsApi({ category: 'Concert' });

// Combine search and category with pagination
const res = await getEventsApi({
  search: 'arena',
  category: 'Concert',
  page: 2,
  pageSize: 8,
});

// Access pagination info
const { page, pageSize, total, totalPages } = res.pagination;
```

---

## GET `/api/events/:id`

### Description

Returns a single event by its MongoDB `id`. Includes full zone detail with live availability counts. Use this on the event detail / purchase page.

### Access

Protected — `customer` role only.

### Path Parameter

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | MongoDB ObjectId of the event — taken from the `id` field of any event in the list response |

### Success Response — `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "64abc123def456789012abcd",
    "name": "Rock Concert 2026",
    "venue": "Grand Arena, Downtown",
    "date": "2026-09-15",
    "time": "19:00",
    "category": "Concert",
    "image": "http://localhost:8000/uploads/events/evt001.jpg",
    "description": "An electrifying night of rock music.",
    "zones": [
      { "name": "VIP",      "price": 250, "available": 19 },
      { "name": "Premium",  "price": 150, "available": 45 },
      { "name": "General",  "price": 80,  "available": 120 },
      { "name": "Standard", "price": 50,  "available": 200 }
    ]
  }
}
```

### Error Responses

| Status | Reason |
|--------|--------|
| `401` | Token missing, expired, or invalid |
| `403` | Token belongs to `admin` or `security` role |
| `404` | Event not found (invalid or non-existent `id`) |

### Axios Implementation

```ts
export interface GetEventResponse {
  success: true;
  data: Event;
}

export const getEventByIdApi = async (
  id: string,
): Promise<GetEventResponse> => {
  const { data } = await api.get<GetEventResponse>(`/events/${id}`);
  return data;
};
```

### Usage Examples

```ts
// Load event detail page
const res = await getEventByIdApi('64abc123def456789012abcd');
const event = res.data;

// Access zones for the purchase form
const availableZones = event.zones.filter((z) => z.available > 0);

// Display zone options
event.zones.forEach((zone) => {
  console.log(`${zone.name} — $${zone.price} — ${zone.available} seats left`);
});
```

---

## Error Handling

```ts
import { AxiosError } from 'axios';

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const body = error.response?.data as
      | { success: false; message: string }
      | undefined;
    return body?.message ?? error.message;
  }
  return 'An unexpected error occurred.';
}
```

### React example

```tsx
const [events, setEvents] = useState<Event[]>([]);
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);

const loadEvents = async (params?: GetEventsParams) => {
  setLoading(true);
  setError('');
  try {
    const res = await getEventsApi(params);
    setEvents(res.data);
  } catch (err) {
    setError(getErrorMessage(err));
  } finally {
    setLoading(false);
  }
};

// On mount
useEffect(() => {
  void loadEvents();
}, []);

// On category filter change
const handleCategoryChange = (category: EventCategory) => {
  void loadEvents({ category });
};
```

---

## Integration Flow — Event to Ticket Purchase

The typical customer flow connecting these endpoints:

```
1. GET /api/events
       ↓
   Display event cards with date, venue, category, min price
       ↓
2. Customer clicks an event card
       ↓
3. GET /api/events/:id
       ↓
   Show full detail: description, image, zone table with live prices and availability
       ↓
4. Customer selects a zone with available > 0
       ↓
5. POST /api/customer/tickets/purchase
   {
     eventId: event.id,      ← from step 3
     zone: selectedZone.name,
     visitorName: '...',
     visitorEmail: '...',
     photo: File
   }
       ↓
6. On success — redirect to GET /api/customer/tickets/:id
   to display the QR code pass
```

**Zone sold-out handling:**

```ts
const handlePurchase = async (zone: EventZone) => {
  if (zone.available === 0) {
    setError('This zone is sold out.');
    return;
  }
  // proceed with purchase
};
```

> Always check `zone.available > 0` before enabling the purchase button. If the API returns `409` during purchase, it means two users bought the last seat simultaneously — show a "sold out" message and refresh the event detail.

---

## Seeding Events (Development)

Events are read-only from the customer portal — there is no admin UI to create them yet. Seed directly into MongoDB for development/testing:

```js
// MongoDB shell or mongosh
db.events.insertOne({
  name: "Rock Concert 2026",
  venue: "Grand Arena, Downtown",
  date: new Date("2026-09-15"),
  time: "19:00",
  category: "Concert",
  imageUrl: null,
  description: "An electrifying night of rock music.",
  zones: [
    { name: "VIP",      price: 250, available: 20 },
    { name: "Premium",  price: 150, available: 45 },
    { name: "General",  price: 80,  available: 120 },
    { name: "Standard", price: 50,  available: 200 }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
});
```

**Valid category values:** `Concert` | `Expo` | `Conference` | `Festival`

---

## Quick Reference

```ts
// List upcoming events
GET /api/events
  ?search=rock          // optional — matches name, venue, category
  &category=Concert     // optional — Concert | Expo | Conference | Festival
  &page=1               // optional — default: 1
  &pageSize=12          // optional — default: 12, max: 100

// Get single event
GET /api/events/:id
```

Both endpoints:
- Require `Authorization: Bearer <token>` with a `customer` role token
- Return `{ success: true, data: Event | Event[], pagination? }`
- Return only upcoming events (`date >= today`)
- Sort by date ascending (soonest event first)
