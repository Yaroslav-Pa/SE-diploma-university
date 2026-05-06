# Geo-Social App — AI & Developer Reference Manual

Welcome! This document provides an exhaustive, structured overview of the **Geo-Social App** (MVP) codebase. It is designed to give any AI Agent or human developer an instant, comprehensive understanding of the project's architecture, database schema, user interface, business logic patterns, and design principles.

---

## 1. Project Essence & Core Concepts

### Purpose
The **Geo-Social App** is a high-fidelity, interactive web application built to monitor, map, and share local events, community activities, and commercial operations in real time. It enables users to pin time-sensitive activities directly onto a live, interactive map, creating a localized, community-driven social map.

### Key Use Cases
- **🎪 Local Fairs & Markets:** Seasonal community gatherings, pop-up craft markets, food festivals.
- **🏷️ Sales & Commercial Offers:** Flash sales, shop discounts, limited-time deals at local stores.
- **🎉 Grand Openings:** New café, restaurant, store, or venue launch notifications.
- **📅 Temporary Events:** Concerts, block parties, outdoor fitness classes, exhibitions.
- **📍 Other Custom Points of Interest (POIs):** Anything else relevant to local neighborhood explorer communities.

---

## 2. Technology Stack & Key Dependencies

This project is built using a modern, performant, and type-safe web stack:

### Frontend Layer
- **Framework:** **Next.js 16.2.4** (with **React 19.2.4**), leveraging the **App Router** (`/src/app`) for routing, layouts, and server-side components.
- **Styling:** **Tailwind CSS v4** for clean, modern, and rapid responsive UI styling.
- **Icons:** **Lucide React** (`lucide-react`) for a unified, modern icon design language.
- **Notifications:** **React Hot Toast** (`react-hot-toast`) for beautiful, sleek toast alert micro-animations.

### Interactive Mapping
- **Map Canvas:** **Leaflet v1.9.4** & **React Leaflet v5.0.0** with custom HTML-injected map markers and fly-to pan-and-zoom animations.
- **Map Tiles:** Voyager light/dark map tileset provided by **CartoDB** (via OpenStreetMap data attribution).

### Backend & Database Layer
- **BaaS Platform:** **Supabase** (auth, database, file storage, edge triggers, and stored functions).
- **Database Engine:** **PostgreSQL** with the **PostGIS** spatial database extension.
- **SDK Integrations:** `@supabase/supabase-js` and `@supabase/ssr` (for safe cookie-based SSR sessions).

### GIS & Utility Libraries
- **`wkx` (Well-Known Binary/Text Parser):** Crucial for converting PostGIS-native geography data (specifically hex-encoded WKB string representations) into GeoJSON points `[longitude, latitude]` for rendering in React-Leaflet, and vice-versa.
- **`browser-image-compression`:** Performs client-side thumbnail/photo compression before uploading attachments to Supabase Storage, maintaining lightning-fast performance and lowering storage costs.

---

## 3. Database Architecture & Schema

The Postgres database is split into public tables and customized triggers/stored procedures. PostGIS handles spatial columns with geography indices.

```mermaid
erDiagram
    users {
        uuid id PK "REFERENCES auth.users"
        text username UNIQUE
        text avatar_url
        boolean is_admin
        timestamp created_at
    }
    pois {
        uuid id PK
        uuid creator_id FK "REFERENCES users.id"
        text title
        text description
        text category
        geography location "POINT, 4326"
        timestamp start_date
        timestamp end_date
        text_array image_urls
        integer upvotes
        integer downvotes
        timestamp created_at
    }
    comments {
        uuid id PK
        uuid poi_id FK "REFERENCES pois.id"
        uuid user_id FK "REFERENCES users.id"
        text content
        text_array image_urls
        timestamp created_at
    }
    reactions {
        uuid poi_id PK, FK "REFERENCES pois.id"
        uuid user_id PK, FK "REFERENCES users.id"
        text type "'upvote' | 'downvote'"
    }

    users ||--o{ pois : "creates"
    users ||--o{ comments : "writes"
    users ||--o{ reactions : "reacts"
    pois ||--o{ comments : "has"
    pois ||--o{ reactions : "receives"
```

### Core Schema Definition (`schema.sql`)
1. **`public.users`:** Synchronizes with Supabase auth users, containing public profile data and administrative tags (`is_admin`).
2. **`public.pois`:** Houses Point of Interest locations. Contains a spatial `location` column of type `GEOGRAPHY(POINT, 4326)` backed by a high-performance **GIST (Generalized Search Tree) Index** (`pois_location_idx`) for rapid geographical bounding-box queries.
3. **`public.comments`:** Connects user reviews or live activity photos to POIs.
4. **`public.reactions`:** Pivot table maintaining a strict unique combination of `(poi_id, user_id)` with reactions checked as `upvote` or `downvote`.

### Row-Level Security (RLS) Policies
- **Read Access:** Profiles, POIs, comments, and reactions are **publicly readable** by anonymous and authenticated visitors (`USING (true)`).
- **Write Access:** Inserting POIs, comments, and reactions is limited strictly to authenticated users (`auth.role() = 'authenticated'`).
- **Update/Delete Access:** Limited to the **original creator** (`auth.uid() = creator_id` / `user_id`) **OR** users having the `is_admin = true` privilege flag in the database.

### Database Functions & RPCs
- **`toggle_reaction(p_poi_id UUID, p_type TEXT)` (`schema.sql`):** Updates voting statistics atomically. If a user votes 'upvote', it upserts into `reactions` and increments `pois.upvotes` while checking for previously existing opposing votes (switching/untoggling them gracefully). Runs under `SECURITY DEFINER` context.
- **`get_pois_in_bounds(min_lat float, min_lng float, max_lat float, max_lng float)` (`rpc.sql`):** Fetches all points residing inside the client's current viewport bounding box using PostGIS's bounding-box intersection operator `&&` and envelope generation function `ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)`, filtering out expired items (`end_date > NOW()`).
- **`is_username_available(p_username TEXT)` (`alter_db.sql`):** Client-callable check during registration to verify nickname uniqueness.

---

## 4. Codebase Navigation & Architecture

```
geo-app/
├── schema.sql                   # Database table definitions & triggers
├── rpc.sql                      # Spatial bounding-box querying function
├── alter_db.sql                 # Username checking function & schema alterations
├── admin_migration.sql          # RLS policies allowing admin deletes
├── package.json                 # Precise dependency declarations
└── src/
    ├── middleware.ts            # Root middleware router
    ├── lib/
    │   └── supabase/            # Client, server, and middleware session helpers
    ├── components/
    │   ├── map/
    │   │   ├── InteractiveMap.tsx     # The central, highly integrated Leaflet map component
    │   │   ├── MapFilterBar.tsx       # Text & Category filters + OpenStreetMap Nominatim Geocoder
    │   │   ├── PoiDetailPanel.tsx     # Details Drawer (images, countdowns, reactions, comment threads)
    │   │   ├── MapWrapper.tsx         # SSR-safe dynamic wrapper for the client-only map
    │   │   └── HeroMap.tsx            # Beautiful ambient background map on landing
    │   ├── poi/
    │   │   └── CommentForm.tsx        # Structured comment input
    │   └── ui/
    │       ├── ToastNotification.tsx  # Dynamic styling for hot toasts
    │       └── ImageCarousel.tsx      # Media gallery view
    └── app/
        ├── page.tsx             # Interactive, animated dark-mode landing page
        ├── globals.css          # Core custom CSS styling variables and custom scrollbars
        ├── (auth)/              # Sub-routes for registration & login auth pages
        ├── account/             # Sub-routes for active user profiles and "My POIs" management
        └── actions/             # Next.js Server Actions
            ├── poi.ts           # POI loading, server storage uploading, and creation logic
            └── interaction.ts   # Upvoting/downvoting, comment posting, and details loading
```

---

## 5. UI/UX Features & Interface Architecture

The application focuses heavily on high-end aesthetics, liquid-smooth animations, and a rich, modern, glassmorphic dark interface.

### Dynamic Map Canvas (`InteractiveMap.tsx` & `MapWrapper.tsx`)
- **SSR Safety:** Leaflet attempts to access `window` on import, causing Next.js compilation errors during pre-rendering. This is solved by using `next/dynamic` inside `MapWrapper.tsx` with `ssr: false`, ensuring it only runs on the client.
- **Local Storage Coordinates:** The user's center latitude, longitude, and zoom level are continuously saved in `localStorage` under `mapPos` as they move around. On page load, the app immediately centers itself to this cached position (defaulting to London `[51.505, -0.09]` if empty).
- **Micro-Categorization Custom Pins:** Distinct, beautifully colored HTML `L.divIcon` pins with soft shadow rings and emojis distinguish categories:
  - 🎪 **Fair:** Purple badge (`bg-purple-500`)
  - 🏷️ **Sale:** Red badge (`bg-red-500`)
  - 🎉 **Grand Opening:** Yellow badge (`bg-yellow-500`)
  - 📅 **Temporary Event:** Emerald badge (`bg-emerald-500`)
  - 📍 **Other:** Gray badge (`bg-gray-500`)

### Advanced Map Filters & Geocoding (`MapFilterBar.tsx`)
- **Address-to-Coordinate Geocoder:** Combines simple text queries with OpenStreetMap's public **OSM Nominatim Search API** to look up physical locations dynamically. Uses a `400ms` debounce threshold and a custom `User-Agent` to query city names or streets. Clicking a result instantly pans the map canvas to the coordinates.
- **Instant POI Autocomplete:** Searches client-side filtered results, showing up to 4 local POIs matching the input query in the dropdown concurrently with search results.
- **Dynamic URL Synchronization:** Selection changes, text inputs (`q`), and category filters (`cat`) are immediately synchronized with the URL search parameters (`/map?q=fairs&cat=fair,sale&poi=UUID`). This enables direct sharing, page-refresh state persistence, and responsive synchronicity.

### Point of Interest Creation Flow
- **Interactive Dropping:** Selecting "Create POI" switches the cursor to `crosshair` mode. Clicking anywhere on the map drops a bouncing blue location pin with a pulsing glow, launching the `PoiCreationModal`.
- **Intelligent Creation Modal:**
  - Standard fields for title, category, description, and times.
  - **Start Date (Optional)** and **End Date (Required)** inputs.
  - Form validation: prevents start dates from succeeding end dates.
  - **Photos Attachment Widget:** Compresses attached image arrays in the browser, supports multi-image galleries, and contains a cover photo selection button (automatically ordering the selected cover to index 0 of the saved array).

### Detailed Event Drawer (`PoiDetailPanel.tsx`)
This sliding glass-overlay container features a premium double-column layout:
- **Left Column (Context & Timeline):**
  - `<ImageCarousel>`: A media slider showing attached high-quality pictures.
  - **Dynamic Timeline Widget:** Uses high-end, responsive SVGs to map out start and end times.
  - **Real-Time Live Countdowns:** Evaluates current time against `start_date` and `end_date` to assign status labels:
    - `Live` (if ongoing) with an active pulsing indicator.
    - `Upcoming` (if scheduled for the future).
    - `Ended` (if historical).
    - For ongoing live events, it displays a tabular countdown showing exactly how many days, hours, and minutes remain (`2d 14h 5m` left).
- **Right Column (Engagement Feed):**
  - **Voting Panel:** Allows upvoting or downvoting. Triggers rapid database updates using state optimistic triggers.
  - **Interactive Comment Section:** Shows comment threads with users' public nicknames and custom-tinted profile circles. Supports image attachment uploads directly in comments. Shows trash delete icons for creators and admins.

---

## 6. Business Logic Patterns & Implementation Details

To build or maintain this project efficiently, pay close attention to these engineering patterns:

### 1. Next.js Server Actions for Database Mutations
Do not use API endpoints for database writes. All actions are compiled as safe `'use server'` hooks in `/src/app/actions`:
- `createPoi(formData: FormData)`: Takes multipart files, uploads them to the Supabase storage bucket `poi-images`, gets their public URLs, parses latitude/longitude floats, transforms coordinates into Well-Known Binary representations, and inserts the row.
- `addComment(poiId: string, formData: FormData)`: Standardizes writing comments and uploading associated photos to the storage bucket.
- `toggleReaction(poiId: string, type: 'upvote' | 'downvote')`: Calls the remote database RPC.

### 2. PostGIS WKB Parsing (`wkx`)
Postgres represents spatial columns internally as binary. When querying via the client SDK, locations return as hex strings:
- **Parse Hex-to-GeoJSON:** Use the `parseLocation` helper:
  ```typescript
  import wkx from 'wkx'
  function parseLocation(loc: string) {
    const geometry = wkx.Geometry.parse(Buffer.from(loc, 'hex'))
    return geometry.toGeoJSON() // Returns { type: "Point", coordinates: [lng, lat] }
  }
  ```
- **Parse GeoJSON-to-WKB (During Insertion):**
  ```typescript
  const point = new wkx.Point(lng, lat)
  point.srid = 4326
  const locationWkb = point.toWkb().toString('hex')
  ```

### 3. Progressive Cache Revalidation
Whenever modifications (POI creation, comment addition, comment/POI deletions, voting toggles) take place, the corresponding Server Actions call Next.js's native `revalidatePath('/map')` or `revalidatePath('/my-pois')`. This immediately purges the cached static or dynamic HTML pages, forcing Next.js to fetch new database states on the next request.

---

## 7. Guidelines for AI & Agent Developers

When writing code or adding features to this repository, adhere strictly to the following parameters:

- **Do Not Break SSR Safety:** Never import Leaflet components, map container utilities, or tile layers at the root of a page component. Always load them dynamically with `ssr: false`.
- **Synchronize State via URL:** Whenever you add a map state (such as drawer states, coordinates, or filtered attributes), serialize and sync it through Next.js `useSearchParams()` and `router.replace` instead of utilizing local React states. This guarantees deep-linking capabilities.
- **Maintain PostGIS Spatial Conventions:** Always handle coordinates in `[lng, lat]` order when communicating with GeoJSON structures, but map them to `[lat, lng]` when positioning Leaflet layers. When querying the database or inserting records, ensure geographic points are explicitly hex-encoded using `wkx` with `srid = 4326`.
- **Compress Images Client-Side:** Ensure any upload widgets utilize the `browser-image-compression` utility with sensible limits (e.g., maximum `0.8MB - 1MB`, `1920px` max dimension) before passing file attachments to server actions to save storage space and increase bandwidth efficiency.
- **RLS & Admin Ownership Rules:** Before adding editing or deleting functionality, always check if the logged-in user matches `creator_id`/`user_id` or has the administrative flag (`is_admin`) set to `true`.
- **Do Not Write CSS Utility Bloat:** Rely primarily on the streamlined classes in Tailwind CSS. Maintain consistent hover states, glassmorphism filters, smooth transitions, and dark modes to protect the premium feel of the interface.

---

*This reference manual was compiled on 2026-05-06 to support next-generation software intelligence on the Geo-Social platform.*
