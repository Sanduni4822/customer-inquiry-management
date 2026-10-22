# ☕ Customer Inquiry Management System
**Coffee Ninja (Pvt) Ltd — Technical Assessment Submission**

A full-stack customer inquiry management solution built to help a growing service business streamline customer inquiry tracking, staff ownership, lifecycle progression, and audit history.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Vitest + React Testing Library
- **Backend:** Node.js, Express, TypeScript, Zod, JWT (`jsonwebtoken`), `bcryptjs`, Vitest + Supertest
- **Database:** PostgreSQL with SQL migrations and automated seed scripts

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18+ or v20+)
- **PostgreSQL** instance running locally or in Docker

### 2. Environment Configuration
Create a `.env` file in the root or inside `backend/` and `frontend/` using `.env.example` as a template:

**`backend/.env`:**
```env
# Database Connection (PostgreSQL)
DATABASE_URL=postgres://postgres:your_password@localhost:5432/customer_inquiries

# Or individual parameters:
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=customer_inquiries

# Server & Auth
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_change_in_production_ninja_2026
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

**`frontend/.env`:**
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Install Dependencies
Run from the project root:
```bash
# Install root orchestration tools
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

---

### 4. Database Migration & Seeding
Once your PostgreSQL database is created and connection details are placed in `backend/.env`, run:

```bash
# Run schema migrations (creates users, inquiries, activity tables & indexes)
npm run db:migrate

# Seed demo staff accounts and sample customer inquiries
npm run db:seed
```

---

### 5. Running the Application Locally
You can run both backend and frontend concurrently from the root directory:

```bash
npm run dev
```

Or run them individually in separate terminals:
- **Backend API:** `cd backend && npm run dev` (Runs on `http://localhost:5000`)
- **Frontend SPA:** `cd frontend && npm run dev` (Runs on `http://localhost:5173`)

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 👥 Seeded Test Accounts

The system comes pre-seeded with test accounts representing real operational roles:

| Name | Email | Password | Role | Department | Access Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sarah Jenkins** | `sarah@coffeeninja.com` | `password123` | `staff` | Support | Standard triage & assigned inquiries |
| **David Chen** | `david@coffeeninja.com` | `password123` | `staff` | Sales | Standard triage & assigned inquiries |
| **Elena Rostova** | `elena@coffeeninja.com` | `password123` | `manager` | Management | Full visibility (including confidential/restricted inquiries) |

*Tip: The Sign-In screen contains 1-click quick login buttons for all three accounts for effortless testing.*

---

## 🧪 Running Automated Tests

Both the frontend and backend include purposeful test suites:

```bash
# Run all tests (backend + frontend)
npm test

# Run backend tests only (Business rules, state machine, OCC, 401/403 access control)
cd backend && npm test

# Run frontend tests only (Form interaction, input validation, status badge rendering)
cd frontend && npm test
```

### Purposeful Tests Included:
1. **Backend (`backend/tests/inquiry.rules.test.ts`):**
   - **Authentication Enforcement:** Ensures unauthenticated access yields `401 Unauthorized`.
   - **Access Boundary Protection:** Ensures standard staff cannot view restricted inquiries (`403 Forbidden`).
   - **Validation Enforcement:** Ensures missing or malformed inputs return `400 Validation Error`.
   - **State Machine Enforcement:** Ensures illegal transitions (e.g. `New` ➔ `Resolved` directly or `Resolved` ➔ `New`) are rejected with `400 Bad Request`.
   - **Optimistic Concurrency Control:** Ensures updating a record with a stale version yields `409 Conflict: STALE_DATA`.
2. **Frontend (`frontend/src/tests/InquiryForm.test.tsx`):**
   - **User Guidance on Invalid Data:** Tests that submitting empty or invalid data displays inline error feedback and stops submission.
   - **Contact Format Validation:** Verifies invalid phone/email rejection and successful submission when valid.
   - **Badge Component (`frontend/src/tests/StatusBadge.test.tsx`):** Verifies correct badge rendering for all lifecycle stages.

---

## 🔍 How to Demonstrate the 3 Real-World Situations

### Situation 1: Staff submits missing or invalid information
1. Sign in as **Sarah Jenkins**.
2. Click **Record Inquiry** in the top right.
3. Leave fields blank and click **Record Inquiry**. Observe the red field indicators and guidance messages.
4. Enter an invalid contact (e.g., `not-an-email`) and observe the inline warning.
5. In addition, submit an inquiry, and immediately submit the exact same subject & contact again to observe the duplicate submission protection (**409 Conflict**).

### Situation 2: Two browser tabs show the same inquiry (Stale Data Handling)
1. Open two browser tabs side-by-side at `http://localhost:5173`.
2. In **Tab 1**, open inquiry **"Espresso blend tastes unusually bitter"** (Status: `New`).
3. In **Tab 2**, open the **same inquiry**.
4. In **Tab 1**, click **Start Handling (Move to In Progress)**. Status updates to `In Progress` (version advances to `v2`).
5. In **Tab 2** (which is still displaying the older status and `v1`), attempt to change the status.
6. **Result:** The system catches the version conflict and displays the banner:
   *"Concurrency Conflict Detected: This inquiry has been changed in another window or by another team member."*
7. Click the **"Reload Latest"** button to safely refresh the view to the current state without data loss.

### Situation 3: Direct link to an unauthorized inquiry
1. Sign in as **Elena Rostova** (Manager). Notice the confidential inquiry: **"Executive Boardroom Exclusive Supply Contract"** (marked with a red lock).
2. Note its ID or click to view.
3. Sign out and sign in as **Sarah Jenkins** (Staff).
4. Notice this inquiry is filtered out of Sarah's overview.
5. Attempting to fetch this inquiry by ID directly via API (or via URL) results in **HTTP 403 Forbidden: Access Denied**.

---

## 📖 Architecture & Design Decisions
See [DECISIONS.md](./DECISIONS.md) for the complete rationale on data modeling, state machine design, concurrency trade-offs, and where AI was used/evaluated.