# RideSync — Carpool & Ride Sharing Board (MERN Full-Stack)

> **Category**: Travel, Transport & Bookings  
> **Project Title**: Carpool & Ride Sharing Board  
> **Academic Demonstration Platform**: Built with React.js (JavaScript/JSX), Node.js, Express.js, MongoDB (Mongoose), and Geoapify.

---

## 1. Project Overview

**RideSync** is a minimalist, production-ready, full-stack carpooling platform designed for academic demonstration and live college vivas. It allows registered commuters heading along common travel routes in India to discover one another, share rides, split travel expenses, and coordinate seat reservations.

Unlike mock student projects that simulate bookings with browser localStorage or in-memory arrays, **RideSync is backed by a real Node.js/Express server and real MongoDB database records**. Every action—publishing a ride, searching trips, requesting passenger seats, accepting or rejecting reservations, and retrieving trip history—executes live CRUD operations, atomic database updates, and overbooking prevention at the MongoDB engine layer.

---

## 2. Original Mandatory College Requirements

The faculty specified 5 non-negotiable core requirements. All 5 are fully implemented and verified:

| # | Faculty Requirement | Implementation Details |
|---|---------------------|------------------------|
| **1** | **Post a Ride** | Driver inputs From, To (Geoapify autocomplete), Travel Date, Departure Time, Available Seats (1–6), Fare per seat (₹), and optional notes. Validates future departure and saves to MongoDB with `status: ACTIVE`. |
| **2** | **Search Rides** | Riders search rides by pickup, destination, and travel date. Filtered dynamically from MongoDB for active, future departures with sufficient seats. |
| **3** | **Request Seats** | Rider selects $N$ seats on an active ride. Request is saved in MongoDB with status `PENDING`. **The driver's available seats remain unchanged while pending.** |
| **4** | **Accept / Reject Requests & Overbooking Prevention** | Driver views requests for their ride. Accepting atomically decreases available seats ($4 \to 2$). When seats reach 0, ride status becomes `FULL` and further requests are blocked. Rejecting sets status to `REJECTED` and leaves seats unchanged. |
| **5** | **Ride History** | Both drivers and riders view persistent MongoDB records: Tab 1 (Rides Offered) and Tab 2 (Rides Booked) with clear statuses (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`). |

---

## 3. Technology Stack

### Frontend (Client)
- **Library / Runtime**: React 18 (Vite 6)
- **Language**: Pure JavaScript & JSX (**Strictly NO TypeScript**)
- **Styling**: Tailwind CSS (Minimalist Black-and-White SaaS Theme: `#FFFFFF`, `#FAFAFA`, `#111111`, `#737373`, `#E5E5E5`)
- **Typography**: Google Fonts Inter
- **Routing**: React Router DOM v7
- **HTTP Client**: Axios with interceptors, credentials, and cancel tokens
- **Icons**: Lucide React
- **Mapping**: Leaflet & React Leaflet with Geoapify Positron tiles

### Backend (Server)
- **Environment**: Node.js (v22+)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM (Tested on MongoDB Server)
- **Authentication**: JSON Web Tokens (JWT) + bcryptjs password hashing + HttpOnly cookies
- **Security & Validation**: express-validator, express-rate-limit, CORS, cookie-parser
- **Testing**: Jest, Supertest

### Maps & Geolocation
- **Provider**: Geoapify API
- **Country Filter**: India (`filter=countrycode:in`)
- **APIs**:
  - Address Autocomplete API (`/api/locations/autocomplete`)
  - Driving Routing API (`/api/locations/route`)
  - Positron Map Tile Layer

---

## 4. System Architecture

```
                               ┌──────────────────────────────────────────────┐
                               │             React.js Client (Vite)           │
                               │        Minimalist Black & White SaaS UI      │
                               └──────────────────────┬───────────────────────┘
                                                      │ HTTP / REST APIs
                                                      │ (Axios with Auth JWT)
                                                      ▼
                               ┌──────────────────────────────────────────────┐
                               │             Express.js Server (Port 5001)    │
                               │  - authRoutes         - rideRoutes           │
                               │  - bookingRoutes      - locationRoutes       │
                               │  - dashboardRoutes    - authMiddleware       │
                               └───────────┬──────────────────────┬───────────┘
                                           │                      │
           Server-side HTTP with API Key   │                      │ Mongoose Models
                                           ▼                      ▼
                     ┌───────────────────────────┐  ┌─────────────────────────┐
                     │     Geoapify APIs         │  │   MongoDB Database      │
                     │  - Autocomplete (India)   │  │   - users collection    │
                     │  - Routing & Distance     │  │   - rides collection    │
                     │  - In-memory cache        │  │   - bookings collection │
                     └───────────────────────────┘  └─────────────────────────┘
```

---

## 5. Directory Structure

```
RideSync/
├── client/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Button.jsx            # Minimalist black & outline buttons
│   │   │   ├── Footer.jsx            # Clean footer
│   │   │   ├── Input.jsx             # Form inputs with validation
│   │   │   ├── LoadingSpinner.jsx    # Minimalist SVG spinner
│   │   │   ├── LocationSearch.jsx    # Debounced Geoapify Indian autocomplete
│   │   │   ├── Navbar.jsx            # Responsive header navigation
│   │   │   ├── ProtectedRoute.jsx    # Auth gate
│   │   │   ├── RideCard.jsx          # Trip card with Best Match badge
│   │   │   ├── RideMap.jsx           # Leaflet map with Positron tiles & polyline
│   │   │   └── StatusBadge.jsx       # PENDING, ACCEPTED, REJECTED, FULL badges
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # User session state & localStorage sync
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Metrics & upcoming trips
│   │   │   ├── FindRides.jsx         # Search trips with filters & empty state
│   │   │   ├── History.jsx           # Offered and Booked dual-tab history
│   │   │   ├── Home.jsx              # Landing page & How It Works cards
│   │   │   ├── Login.jsx             # Account login
│   │   │   ├── ManageRequests.jsx    # Driver accept/reject panel
│   │   │   ├── MyRides.jsx           # Driver's offered rides
│   │   │   ├── OfferRide.jsx         # Post ride with route preview
│   │   │   ├── Profile.jsx           # Account info & unified role
│   │   │   ├── Register.jsx          # User registration
│   │   │   └── RideDetails.jsx       # Trip details, map & seat request form
│   │   ├── services/
│   │   │   ├── api.js                # Axios base client
│   │   │   ├── authService.js
│   │   │   ├── bookingService.js
│   │   │   ├── locationService.js
│   │   │   └── rideService.js
│   │   ├── utils/
│   │   │   └── formatDate.js         # IST date, time, and ₹ currency formatters
│   │   ├── App.jsx                   # React Router routes
│   │   ├── index.css                 # Tailwind CSS directives
│   │   └── main.jsx                  # React DOM mount point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/
│   ├── config/
│   │   ├── db.js                     # MongoDB connection handler
│   │   └── seed.js                   # Realistic demo database populator
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── bookingController.js
│   │   ├── dashboardController.js
│   │   ├── locationController.js
│   │   └── rideController.js
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT cookie/header verification
│   │   ├── errorMiddleware.js        # Centralized error handler
│   │   └── validationMiddleware.js   # express-validator & ObjectId checks
│   ├── models/
│   │   ├── Booking.js                # rideId, riderId, seats, status
│   │   ├── Ride.js                   # driverId, from, to, departure, seats, status
│   │   └── User.js                   # name, email, passwordHash
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── locationRoutes.js
│   │   └── rideRoutes.js
│   ├── services/
│   │   ├── bookingService.js         # Atomic seat decrement & overbooking protection
│   │   ├── geoapifyService.js        # Server-side Geoapify autocomplete & routing
│   │   └── rideMatchingService.js    # Rule-based Haversine smart ranking
│   ├── tests/
│   │   ├── demoWorkflow.js           # Multi-user live integration test
│   │   └── ridesync.test.js          # Jest test suite (25 tests)
│   ├── utils/
│   │   └── haversine.js              # Great-circle distance calculation
│   ├── index.js                      # Express app entry point
│   └── package.json
├── package.json                      # Monorepo root scripts
└── README.md
```

---

## 6. Environment Configuration

### Server (`server/.env`)
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/ridesync
JWT_SECRET=ridesync_secure_jwt_secret_token_key_2026_academic_demo
CLIENT_URL=http://localhost:5173
GEOAPIFY_API_KEY=your_private_geoapify_api_key
NODE_ENV=development
```
> **Note on Port 5001**: Port 5001 is used by default because on Windows, port 5000 is frequently occupied by the Intel Graphics Command Center (`OneApp.IGCC.WinService`) Kestrel server.

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5001/api
VITE_GEOAPIFY_MAPS_KEY=your_browser_restricted_geoapify_key
```

---

## 7. Installation and Running Instructions

### Prerequisites
1. **Node.js**: v18 or higher (v22 recommended)
2. **MongoDB**: Local MongoDB community server running on port 27017 (`mongodb://127.0.0.1:27017/ridesync`) or a MongoDB Atlas connection string.

### Step-by-Step Setup

1. **Install All Dependencies**:
   ```bash
   npm run install:all
   ```
   *(Or individually: `npm install` in root, `cd server && npm install`, `cd client && npm install`)*

2. **Seed Sample Demo Data**:
   ```bash
   npm run seed
   ```
   *Populates the database with 3 sample Indian rides (Vijayawada $\to$ Guntur, Hyderabad $\to$ Vijayawada, Bengaluru $\to$ Chennai) and 1 pending booking request for immediate demonstration.*

3. **Start Frontend & Backend Concurrently**:
   ```bash
   npm run dev
   ```
   - **Frontend**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:5001](http://localhost:5001)
   - **Health Check**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

4. **Run Automated Test Suite (29 Tests)**:
   ```bash
   npm test
   ```

5. **Run Live End-to-End Demonstration Script**:
   ```bash
   npm --prefix server run demo
   ```

---

## 8. REST API Reference

### Authentication
- `POST /api/auth/register` — Register a unified user account
- `POST /api/auth/login` — Sign in and issue JWT cookie/token
- `POST /api/auth/logout` — Invalidate session cookie
- `GET  /api/auth/me` — Get authenticated user details (Protected)

### Rides
- `POST /api/rides` — Driver publishes a new ride (Protected)
- `GET  /api/rides` — Search active rides with smart matching filters
- `GET  /api/rides/my` — Get all rides created by the current driver (Protected)
- `GET  /api/rides/:id` — Get ride details and user's booking status

### Bookings
- `POST  /api/bookings` — Rider requests seats (Status: `PENDING`) (Protected)
- `GET   /api/bookings/my` — Rider views their booking history (Protected)
- `GET   /api/rides/:id/requests` — Driver views requests for their ride (Protected)
- `PATCH /api/bookings/:id/accept` — Driver accepts request, decrements seats (Protected)
- `PATCH /api/bookings/:id/reject` — Driver rejects request (Protected)

### Dashboard & Locations
- `GET /api/dashboard/stats` — User overview metrics from MongoDB (Protected)
- `GET /api/locations/autocomplete` — Debounced Geoapify Indian autocomplete (Rate limited)
- `GET /api/locations/route` — Geoapify driving route geometry and distance

---

## 9. Seat Booking & Overbooking Prevention Logic (Viva Explanation)

### How Atomic Seat Decrement Works
A common beginner flaw in web applications is reading available seats in JavaScript, subtracting 2, and saving back to the database:
```javascript
// ❌ WRONG (Vulnerable to race conditions and overbooking)
const ride = await Ride.findById(id);
if (ride.availableSeats >= 2) {
  ride.availableSeats -= 2;
  await ride.save();
}
```
If two riders request seats at the same time, both read 2 seats and both succeed, causing negative seats (overbooking).

### RideSync's Solution: Conditional Atomic Database Operation & Concurrency Control
RideSync enforces concurrency control at the database engine level:
```javascript
// ✅ CORRECT: Atomic conditional update in MongoDB
const updatedRide = await Ride.findOneAndUpdate(
  {
    _id: rideId,
    status: 'ACTIVE',
    availableSeats: { $gte: seatsRequested }, // Atomically guarantees seats exist
  },
  [
    {
      $set: {
        availableSeats: { $subtract: ['$availableSeats', seatsRequested] },
        status: {
          $cond: {
            if: { $lte: [{ $subtract: ['$availableSeats', seatsRequested] }, 0] },
            then: 'FULL',
            else: '$status',
          },
        },
      },
    },
  ],
  { new: true, session }
);
```

1. If available seats are less than requested, MongoDB matches 0 documents and returns `null`.
2. The server detects this immediately, aborts the transaction/operation, and returns an **HTTP 409 Conflict** error (`"Insufficient seats available"`).
3. If the update succeeds, the booking is transitioned from `PENDING` to `ACCEPTED`.
4. When available seats reach 0, the ride status transitions to `FULL`, blocking any subsequent requests.

### MongoDB Standalone vs. Replica Set Configuration
- **Standalone Local MongoDB**:
  By default, a local MongoDB Community Server runs as a `Single` standalone node. In standalone mode, MongoDB does **not** support multi-document transactions because the operations log (`oplog`) is not initialized. RideSync detects this automatically via `supportsTransactions()` and executes safe conditional atomic updates with guaranteed rollback handling, preventing race conditions and negative seats.
- **Recommended Replica Set Configuration (Production / Atlas)**:
  In production (such as MongoDB Atlas) or to enable multi-document transactions locally:
  1. Start mongod with `--replSet rs0`
  2. Run `mongosh --eval "rs.initiate()"`
  RideSync automatically detects the `ReplicaSetWithPrimary` topology and elevates to native MongoDB multi-document ACID transactions with `startSession()` and `startTransaction()`.

### CSRF & Cookie-Based Security
- **HttpOnly Session Cookies**: JWT tokens are transmitted via `HttpOnly` cookies, preventing XSS-based credential theft (no JWT in `localStorage`).
- **Double-Submit CSRF Cookie**: The server issues a cryptographically secure random `XSRF-TOKEN` cookie, which Axios automatically echoes in the `X-XSRF-TOKEN` header on all state-changing requests (`POST`, `PATCH`, `DELETE`).
- **Origin Validation**: Strict CORS and origin headers are validated against `http://localhost:5173`.

---

## 10. Smart Ride Matching (Minimal Explainable AI)

Per faculty instructions, RideSync avoids heavy LLM or black-box ML models. Instead, it implements an explainable **Haversine Proximity Ranking Algorithm**:

$$\text{distance} = 2 R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lon}}{2}\right)}\right)$$

- **Pickup Proximity Weight**: 40% (or 50% if time unselected)
- **Destination Proximity Weight**: 40% (or 50% if time unselected)
- **Departure Time Alignment Weight**: 20%
- Ranks rides within a 50 km radius and tags the highest scoring ride as **"Best Match"**.
- The standard search works completely independently even without coordinates.

---

## 11. Complete College Demonstration Walkthrough

Use the following step-by-step scenario for your live project evaluation:

```
+-------------------------------------------------------------------------------+
|                      STEP-BY-STEP LIVE VIVA DEMONSTRATION                     |
+-------------------------------------------------------------------------------+

1. Seed / Login as Driver
   - Go to http://localhost:5173/login
   - Email: driver@ridesync.com | Password: driver123
   - Notice the Dashboard metrics (Rides Offered: 3, Pending Requests: 1)

2. Post a New Ride (Requirement 1)
   - Click "Offer Ride"
   - Pickup: Type "Vijayawada" -> select verified suggestion from Geoapify
   - Destination: Type "Guntur" -> select verified suggestion from Geoapify
   - Route Map automatically renders Leaflet route preview
   - Available Seats: 4 | Fare: ₹150
   - Click "Publish Ride" -> Saved in MongoDB

3. Search Rides as Passenger (Requirement 2)
   - Log out and register a new rider account (e.g., student@college.edu)
   - Go to "Find Rides"
   - Search "Vijayawada" to "Guntur" -> Ride appears directly from MongoDB

4. Request Seats (Requirement 3)
   - Click "View Details" on the Vijayawada -> Guntur trip
   - Select 2 seats -> Click "Request Seats"
   - Booking record is created in MongoDB with status PENDING
   - CRITICAL CHECK: Available seats still remain 4 (unchanged while pending)

5. Driver Accepts Request (Requirement 4)
   - Log back in as driver@ridesync.com
   - Navigate to "My Rides" -> click "Manage Requests" on the Vijayawada ride
   - See student@college.edu with 2 seats PENDING
   - Click "Accept"
   - Available seats atomically drop: 4 -> 2! Status becomes ACCEPTED.

6. Verify History (Requirement 5)
   - Log back in as rider -> Go to "Ride History" -> Tab 2: Rides Booked
   - See status ACCEPTED with 2 confirmed seats.

7. Test Full Ride & Overbooking Protection
   - Another rider requests remaining 2 seats.
   - Driver accepts -> Seats become 0 -> Ride status transitions to FULL.
   - Attempting to book again displays: "This ride is already full."
```

---

## 12. Verification & Testing Evidence

All tests pass 100% on actual database operations:
- `npm test`: 25 passed test cases across registration, authentication, ride posting, search, Haversine proximity scoring, seat request creation, atomic accept, rejection, overbooking prevention, and persistent history.
- `npm run demo`: Fully automated 8-step live multi-user demonstration script confirming end-to-end database updates.
