# Architectural Decisions & Design Rationale
**Project:** Customer Inquiry Management System  
**Organization:** Coffee Ninja (Pvt) Ltd  
**Author:** Fullstack Development Assessment Candidate  

---

## 1. Assumptions & Problem Framing

- **Business Workflow:** A fast-paced specialty coffee & equipment service business receives customer inquiries across walk-ins, phone calls, and chats. Staff struggle with loss of context ("who is handling it", "has it been addressed", and "what happened last").
- **Users:** Internal staff members with designated roles: standard `staff` (support/sales agents) and `manager` (operations supervisors).
- **Authentication Model:** JWT Bearer token authentication stored client-side in `localStorage` and sent via `Authorization: Bearer <token>` on all API requests. Seeded accounts are provided to enable immediate evaluation without registration overhead.

---

## 2. Meaningful Design Choices

### A. Ownership and Access Boundaries (Enforced at the Database & API Level)
- **Design Rule:** While standard customer inquiries are visible to the team to foster collaborative triage, inquiries can be flagged as **Confidential / Restricted** (e.g., enterprise VIP accounts, sensitive complaints, or executive leasing agreements).
- **API Enforcement:** 
  - Standard `staff` can only access unrestricted inquiries or inquiries explicitly assigned to their user ID.
  - Role `manager` has comprehensive visibility over all records.
  - When unauthorized staff navigate directly to a restricted record (e.g., via direct URL or manual API query), the backend immediately rejects the request with **HTTP 403 Forbidden** (`FORBIDDEN`). The database query filters records using `WHERE is_restricted = FALSE OR assigned_to_id = $userId` so unauthorized records are never leaked in listing endpoints.

### B. Finite State Machine for Inquiry Lifecycles
- **Status Lifecycle:** `New` ➔ `In Progress` ➔ `Resolved`.
- **Transitions Permitted & Prohibited:**
  - `New` ➔ `In Progress`: Allowed (staff acknowledges and claims ownership).
  - `New` ➔ `Resolved`: **Strictly Prohibited** (returns HTTP 400). Inquiries must be moved to `In Progress` before resolution to prevent uninspected closures.
  - `In Progress` ➔ `Resolved`: Allowed.
  - `In Progress` ➔ `New`: Allowed (unassigning or returning to queue).
  - `Resolved` ➔ `In Progress` (Reopening): Allowed **only** when accompanied by an explanation note (min 5 characters) explaining why the issue re-occurred.
  - `Resolved` ➔ `New`: **Strictly Prohibited** (returns HTTP 400). A resolved inquiry cannot return to a pristine "New" triage state; it must be reopened to "In Progress".

### C. The Purposeful Additional Field & Interaction
- The brief allows one purposeful addition: We introduced **Staff Assignee** (`assigned_to_id` / `assigned_to_name`) paired with an **Audit & Activity Log** (`inquiry_activities`).
- **Rationale:** Directly answers the prompt’s core problem: *"Staff sometimes lose track of who is handling a request, whether it has been addressed, and what happened last."* Assignee answers "who", status answers "whether addressed", and activity history answers "what happened last".

---

## 3. Real-World Situations & How They Are Handled

### Situation 1: Staff submits missing or invalid information
- **Frontend Guidance:** The UI performs real-time field validation, displays red border indicators with specific error messages ("Customer name is required", "Please enter a valid email or phone number", "Description must be at least 10 characters"), and disables the submit button during submission.
- **Backend Rejection:** The Express API uses **Zod schemas** in validation middleware. If invalid payload bypasses the UI, the API returns **HTTP 400 Bad Request** with structured error details `{ code: 'VALIDATION_ERROR', details: [...] }`.
- **Duplicate Protection:** The API queries recent entries and rejects duplicate inquiries with identical contact info and subject submitted within 5 minutes (**HTTP 409 Conflict: `DUPLICATE_SUBMISSION`**).

### Situation 2: Two browser tabs show the same inquiry (Stale Data Handling)
- **Trade-Off Accepted: Optimistic Concurrency Control (OCC) vs. WebSockets:**
  - *Decision:* Rather than introducing heavyweight WebSocket connections or polling loops, we implemented integer versioning (`version` column on `inquiries`).
  - When Tab A updates status, the database increments `version = version + 1`.
  - When Tab B submits with the outdated `version`, the database update condition `WHERE id = $id AND version = $version` matches 0 rows.
  - The API responds with **HTTP 409 Conflict: `STALE_DATA`** and the latest version metadata.
  - The UI captures the 409, surfaces a high-visibility warning banner explaining that another user updated the inquiry, and provides a one-click **"Reload Latest"** button to refresh data without clobbering remote changes.

### Situation 3: Direct link to an unauthorized inquiry
- Access control is validated on every endpoint via `requireAuth` and controller-level security checks:
  ```typescript
  if (inquiry.is_restricted && user.role !== 'manager' && inquiry.assigned_to_id !== user.id) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', ... } });
  }
  ```
- Opening a direct link to an unauthorized record returns **HTTP 403 Forbidden**. The UI renders an access-denied state rather than the inquiry data.

---

## 4. What Would Be Improved Next

1. **Database-backed Refresh Tokens & Revocation:** Current implementation uses stateless JWTs. In a high-security environment, adding a token whitelist/revocation table in PostgreSQL and refresh tokens in `httpOnly` secure cookies would strengthen session security.
2. **Server-Sent Events (SSE) for Real-Time Triage:** For high volume customer service desks, SSE could push new inquiry notifications to all connected staff in real time.
3. **Comprehensive End-to-End Cypress / Playwright Tests:** While Vitest tests cover business rules and UI interaction states, adding end-to-end browser tests across dual sessions would automate the two-tab concurrency test.

---

## 5. Use of AI and Outside Resources

- **Where AI helped:** AI assisted in scaffolding boilerplate Express routes, TypeScript interfaces, and Tailwind color paletting.
- **Suggestion Evaluated:**
  - *AI Suggestion:* AI initially proposed using WebSockets (Socket.io) or continuous client polling every 2 seconds to synchronize stale data across tabs.
  - *Engineering Decision (Rejected & Changed):* **Rejected Socket.io and polling**. For a small service business, introducing stateful WebSocket infrastructure adds unwarranted operational complexity and connection overhead. Instead, we chose **Optimistic Concurrency Control (OCC) with atomic version check (`version = version + 1`)**, which provides bulletproof concurrency safety with zero daemon overhead.
