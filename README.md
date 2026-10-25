check once(due to slow network , i am unable to upload the video to drive)..so i tried deploying frontend...please chek it ...the api is working but render is not responding....if it do...i will change this:
https://campuspilot-mu.vercel.app/

# CampusPilot AI — Your College Day, Intelligently Coordinated

> **Tagline:** Your college day, intelligently coordinated.  
> **Primary Goal:** Help college students complete everyday campus activities (printing lab manuals, grabbing lunch) without wasting their limited breaks or being late for class.

---

## 1. Product Vision & Differentiator

College students face daily friction on campus:
- Long, unpredictable queues at print shops right before laboratory submissions.
- Delays at student canteens during meal rushes.
- Short 15–35 minute breaks between lectures.
- Uncertainty about whether they can travel across campus, print documents, pick up food, and reach their next hall before the professor locks the door.

**CampusPilot AI** coordinates multiple campus services around the student's timetable using a **Multi-Agent Orchestration Architecture** backed by Google's **Gemma 4** model and a pure TypeScript **Deterministic Scheduling Engine**.

### Core Test Scenario
> *"I have 35 minutes before my next class. I need a vegetarian lunch and 25 pages printed. Find the fastest plan that fits my budget and won't make me late."*

CampusPilot AI:
1. Interprets the natural-language request and extracts required services, page counts, dietary preferences, and deadlines.
2. Queries the student's class timetable to identify the upcoming lecture and break window.
3. Consults the **Print Agent** for live queue estimates, printing speeds, and deterministic pricing.
4. Consults the **Canteen Agent** for menu availability, dietary filters (100% vegetarian), and kitchen prep estimates.
5. Invokes the **Deterministic Scheduling Engine** to evaluate sequence permutations (e.g. pipelined food prep while printing vs sequential execution) and walking times between campus buildings.
6. Enforces a configurable **safety buffer** (default: 5 min) before class.
7. Produces a consolidated, transparent plan.
8. **Asks for explicit student confirmation** before creating simulated orders (strictly following: *Request → Specialist Agents → Scheduler → Preview → Confirmation → Order Creation*).

---

## 2. Multi-Agent Architecture

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 STUDENT REQUEST                        │
                  │   "35 mins, vegetarian lunch, 25 pages printed"        │
                  └─────────────────────────┬──────────────────────────────┘
                                            │
                                            ▼
                  ┌────────────────────────────────────────────────────────┐
                  │               AGENT A: CENTRAL ORCHESTRATOR            │
                  │   - Gemma 4 Model Integration / Demo Fallback Parser   │
                  │   - Intent Classification & Parameter Extraction       │
                  └──────┬──────────────────┬───────────────────┬──────────┘
                         │                  │                   │
         ┌───────────────┘                  │                   └───────────────┐
         ▼                                  ▼                                   ▼
┌──────────────────┐             ┌────────────────────┐             ┌─────────────────────┐
│  AGENT B: PRINT  │             │  AGENT C: CANTEEN  │             │ AGENT D: STUDENT DAY│
│  - Shop Queues   │             │  - Menu & Prices   │             │  - Class Timetable  │
│  - Speed (PPM)   │             │  - Dietary Filters │             │  - Campus Locations │
│  - Duplex / Color│             │  - Prep Durations  │             │  - Walking Matrix   │
└────────┬─────────┘             └──────────┬─────────┘             └───────────┬─────────┘
         │                                  │                                   │
         └─────────────────┬────────────────┴───────────────────────────────────┘
                           │
                           ▼
                  ┌────────────────────────────────────────────────────────┐
                  │          AGENT E: DETERMINISTIC SCHEDULING ENGINE      │
                  │   - Evaluates valid task sequences (pipelined/seq)     │
                  │   - Calculates start/end minute per step               │
                  │   - Evaluates walking times & class safety buffer      │
                  │   - Feasibility check: Slack = Available - Required    │
                  │   - Generates viable alternatives if infeasible        │
                  └─────────────────────────┬──────────────────────────────┘
                                            │
                                            ▼
                  ┌────────────────────────────────────────────────────────┐
                  │             STRUCTURED COORDINATED PLAN CARD           │
                  │     (Feasibility, Timeline Sequence, Itemized Costs)   │
                  └─────────────────────────┬──────────────────────────────┘
                                            │
                                            ▼ [Explicit Student Confirmation]
                  ┌────────────────────────────────────────────────────────┐
                  │         AGENT F: ORDER AND CONFIRMATION MANAGER        │
                  │   - Server-side price & menu revalidation              │
                  │   - Duplicate submission protection                    │
                  │   - Generates simulated orders (PO-xxx & FO-xxx)       │
                  └────────────────────────────────────────────────────────┘
```

### Agent Roles:
- **Agent A (Central Orchestrator):** Uses Gemma 4 to parse intent, orchestrate specialists, and compile the final draft.
- **Agent B (Print Agent):** Computes print duration: `queueWait + (pages * copies / ppm)` and price: `(pages * copies) * unitPrice`. Never hallucinates prices or queue lengths.
- **Agent C (Canteen Agent):** Filters menu items by diet (Vegetarian/Vegan), verifies availability, and calculates concurrent kitchen prep durations.
- **Agent D (Student Day Agent):** Tracks classes, upcoming rooms, break windows, and campus walking times.
- **Agent E (Deterministic Scheduling Engine):** Pure TypeScript scheduling algorithm. Computes slack margin:
  $$\text{Slack} = \text{Available Minutes} - (\text{Total Task Duration} + \text{Safety Buffer})$$
  Rejects schedules where $\text{Slack} < 0$ and suggests concrete alternatives.
- **Agent F (Order & Confirmation Manager):** Ensures no orders are created without explicit confirmation. Prevents duplicate submissions and re-verifies prices on the server.

---

## 3. Technology Stack

- **Framework:** Next.js 14 App Router (React 18, TypeScript strict mode)
- **Styling:** Tailwind CSS (Dark navy theme `#070b14` with restrained violet `#8b5cf6` and pink `#ec4899` accents)
- **Icons:** Lucide React
- **Validation:** Zod schemas
- **AI SDK:** Google's official `@google/generative-ai` SDK (server-side only)
- **Testing:** Vitest (comprehensive unit & integration test suite covering 21 critical test cases)
- **Database:** Persistent local JSON database with atomic writes (via temp file replacement) located at `./data/campus-pilot.json`.

---

## 4. Gemma 4 Configuration & Setup

### Environment Files
1. `.env.example` — Template with placeholders (safe for Git commits).
2. `.env.local` — Automatically created with:
   ```env
   GEMINI_API_KEY=PASTE_YOUR_API_KEY_HERE
   GEMMA_MODEL=gemma-4-26b-a4b-it
   AI_PROVIDER=gemma
   DEMO_MODE=true
   APP_URL=http://localhost:3000
   DATABASE_PATH=./data/campus-pilot.json
   ```

### How to Switch to Live Gemma 4 AI:
1. Open `.env.local`.
2. Replace `PASTE_YOUR_API_KEY_HERE` with your actual Google AI Studio API key.
3. Change `DEMO_MODE=true` to `DEMO_MODE=false`.
4. Restart the development server (`npm run dev`).
5. Open the app — the status pill will switch from **Gemma 4 Demo Mode** to **Gemma 4 Live** (or click the badge to run an instant connection check).

### Security Requirements:
- The API key is read **exclusively on the server** in `src/lib/gemma/client.ts`.
- `.env.local` is added to `.gitignore`.
- Error handlers sanitize all output and never leak credentials.
- When `DEMO_MODE=true` or if credentials are missing/invalid, the app falls back transparently to its high-fidelity deterministic multi-agent engine.

---

## 5. Getting Started Locally

### Prerequisites
- Node.js 18+ (tested on Node.js v24.19.0)
- npm 9+ (tested on npm 12.0.2)

### Installation
```bash
# Clone the repository and navigate to root
cd "campuspilot ai"

# Install dependencies
npm install
```

### Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Automated Tests
```bash
npm test
```
All 21 comprehensive test cases will execute via Vitest.

### TypeScript Typechecking
```bash
npm run typecheck
```

### Production Build
```bash
npm run build
npm start
```

---

## 6. Demonstration Workflows

### Scenario 1: Feasible 35-Minute Lunch & Print Request
1. On the **Today** dashboard, click the scenario chip:
   > *"I have 35 minutes before my next class. I need a vegetarian lunch and 25 pages printed. Find the fastest plan that fits my budget and won't make me late."*
2. Click **Find Plan**.
3. The system coordinates:
   - Print: 25 pages double-sided B&W at Central Library (₹37.50, 4 min duration).
   - Canteen: Mini Veg Thali at SAC Food Court (₹110.00, 11 min prep).
   - Sequence: Order food → Print during cooking → Pickup food → Walk to Auditorium A-01.
   - Total time: 20 min + 5 min safety buffer = 25 min (leaves **+10 min slack margin**).
4. Review the timeline and click **"Confirm Plan & Place Simulated Orders"**.
5. Observe orders created with IDs (e.g. `PO-10482` & `FO-91823`) and visible in the active orders list.

### Scenario 2: Infeasible 12-Minute Request (Honest Conflict Reporting)
1. In the prompt input, enter:
   > *"I have only 12 minutes before class. Need 50 pages printed in color and a lunch thali."*
2. The orchestrator flags the schedule overrun:
   - Required duration (24 min) + safety buffer (5 min) exceeds available 12 minutes.
   - Status: **Schedule Conflict Detected**.
   - Alternatives offered: Switch to express grab-and-go snack or postpone food and execute priority printing only.
3. The application never fabricates a successful outcome.

### Scenario 3: Timetable Overlap Prevention
1. Go to **Timetable** (`/timetable`).
2. Click **Add Class** and enter a class on Monday from `10:45` to `11:30`.
3. Click **Add to Timetable**.
4. The system detects the conflict with `CS303 (10:30 - 12:00)` and rejects the overlapping entry.

---

## 7. Data Model & Resetting Demo Sandbox

Demo data is seeded into `./data/campus-pilot.json`:
- **Student:** Alex Chen (CS2024-8841), Vegetarian, Budget: ₹250.
- **Locations & Walking Matrix:** Academic Block A, Engineering Block B, Central Library, SAC Canteen, Main Gate.
- **Print Shops:** Central Library Print Center, Engineering FastPrint Hub.
- **Canteens & Menus:** Mini Veg Thali, Paneer Wrap, Chole Kulche, Grilled Sandwich, Cold Coffee, Fresh Lime Soda, and out-of-stock items.
- **Timetable:** Monday to Friday schedule with a 35-minute break before the next lecture.

To reset all data to initial defaults at any time:
- Click the **Reset Demo Sandbox** button in the navigation header or go to **Profile & Settings** (`/profile`).

---

## 8. Simulated vs Real Integrations Notice

- Print shop queues and canteen kitchen prep are **high-fidelity simulations** based on realistic campus seed datasets.
- Orders created in demo mode are flagged with `isSimulated: true`.
- No actual charges, card submissions, or live merchant orders occur.
- Attendance tracking is student-maintained and not linked to an official college registrar.
