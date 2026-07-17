# ⚽ ArenaPulse 2026
### *GenAI-Powered Stadium Intelligence Platform for FIFA World Cup 2026*

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)

**[🎫 Fan Hub](#-fan-hub--pulseai-assistant) · [🖥️ Command Centre](#%EF%B8%8F-operations-command-centre) · [🌱 Sustainability](#-sustainability-tracker) · [🔐 Security](#-security) · [🚀 Setup](#-quick-start)**

</div>

---

Link:https://arena-pulse-server.vercel.app/

## 🌟 What is ArenaPulse 2026?

**ArenaPulse 2026** is a production-grade, full-stack AI platform built for stadium operations and fan experience at **FIFA World Cup 2026** (Estadio Azteca, Mexico City). It uses **Google Gemini 1.5 Flash** to power real-time crowd management, accessible fan navigation, multilingual assistance, and operational decision support — all from a single unified dashboard.

> **Chosen Vertical:** GenAI Stadium Intelligence Platform
>
> *"Leverage Generative AI to improve navigation, crowd management, accessibility, transportation, sustainability, multilingual assistance, operational intelligence, and real-time decision support during FIFA World Cup 2026."*

✅ **All 8 required domains are covered** in a single cohesive platform.

---

## 🎯 Domain Alignment

| Domain | How ArenaPulse Addresses It | Feature |
|:---|:---|:---|
| 🗺️ **Navigation** | PulseAI gives step-by-step directions to every facility and gate | Fan Hub Chat |
| 👥 **Crowd Management** | Real-time zone density heatmap + automated gate-redirect SOP alerts | Command Centre Map |
| ♿ **Accessibility** | Wheelchair routes, quiet sensory rooms, step-free paths, accessible restrooms | Fan Hub + Venue Dataset |
| 🚌 **Transportation** | Metro gate guidance, electric shuttle routes, rideshare zones with wait times | PulseAI Answers |
| 🌱 **Sustainability** | CO₂ calculator with science-based factors, reward badges, operations sync | Carbon Tracker |
| 🌐 **Multilingual** | Language selector (EN/ES/PT/AR/FR) injected directly into Gemini system prompt | Fan Hub Header |
| 🤖 **Operational Intelligence** | AI executive briefings synthesising attendance, incidents, wait times, CO₂ | Briefing Engine |
| ⚡ **Real-Time Decision Support** | GenAI Tactical SOPs per incident type, live IoT telemetry ticker | SOP Generator |

---

## 🏗️ Architecture & Approach

ArenaPulse is a **monorepo** with a clean separation between a React frontend and a Node/Express backend. The core design principle is **grounded AI** — the Gemini model is constrained to answer only from a structured venue dataset (`venue.ts`), preventing hallucination.

```
arenapulse-2026/
│
├── client/                          # React 19 + TypeScript + Vite (SPA)
│   ├── src/
│   │   ├── App.tsx                  # Root: tab routing, API key, skip link, ARIA
│   │   ├── index.css                # Design system: glassmorphism, CSS variables
│   │   ├── components/
│   │   │   └── Modal.tsx            # Accessible modal (focus trap, Escape key, ARIA)
│   │   └── features/
│   │       ├── assistant/
│   │       │   └── MatchGuide.tsx   # 🎫 Fan Hub: PulseAI chat + Carbon calculator
│   │       └── operations/
│   │           ├── useSnapshot.ts   # Custom hook: telemetry polling logic
│   │           └── CommandHub.tsx   # 🖥️ Command Centre: SVG map, incidents, SOPs
│
├── server/                          # Node.js + Express 5 + TypeScript (REST API)
│   └── src/
│       ├── index.ts                 # Entry: Helmet CSP, CORS, rate limiting, routing
│       ├── config.ts                # Zod-validated environment schema
│       ├── lib/
│       │   ├── gemini.ts            # Typed Gemini 1.5 Flash API bridge
│       │   └── cache.ts             # In-memory TTL cache (prevents API hammering)
│       ├── features/
│       │   ├── assistant/router.ts  # /api/assistant/* — grounded Gemini chat
│       │   ├── operations/router.ts # /api/operations/* — telemetry, briefings, SOPs
│       │   └── stadium/venue.ts     # Structured grounding dataset (gates, facilities)
│       └── tests/
│           └── run-tests.ts         # 14-assertion automated test suite
│
└── package.json                     # npm workspaces monorepo root
```

### How the Solution Works

1. **Fan opens the app** → placeholder telemetry loads instantly (no API needed)
2. **Fan asks a question** → React sends to `POST /api/assistant/ask` → Express passes to Gemini 1.5 Flash with the full `VENUE_DATASET` as grounding context → sanitized HTML response animates as a typewriter in the chat
3. **Operations manager opens Command Centre** → `GET /api/operations/snapshot` polls every 6 seconds via the `useSnapshot` custom hook → SVG heatmap updates zone colours and gate wait-time bubbles in real time
4. **Manager triggers a briefing** → `POST /api/operations/briefing` → Gemini synthesises the current telemetry state into an executive markdown report → cached for 30 seconds to avoid redundant API calls
5. **Manager generates SOP** → `POST /api/operations/sop` → Gemini produces a timed, step-by-step response plan for the selected incident type
6. **Fan calculates carbon offset** → Pure client-side calculation using science-based emission factors → synced to operations backend via `POST /api/operations/carbon`

---

## 🎫 Fan Hub — PulseAI Assistant

The **Fan Hub** is the primary fan-facing panel, powered by Gemini with offline resilience.

### Features

- **💬 Conversational AI Chat** — Grounded on `VENUE_DATASET`; no hallucinated facilities
- **⚡ 7 Quick-Access Presets** — Instant answers for the most common matchday queries
- **🌐 Multilingual** — Language code injected into Gemini system prompt (EN/ES/PT/AR/FR)
- **📡 Offline Fallback** — Precise, location-rich answers work without any API key
- **🔁 Typewriter Animation** — DOMPurify-sanitized AI responses stream character-by-character
- **📢 Screen Reader Support** — `aria-live` region announces new messages to assistive technology
- **429 Handling** — User-friendly message shown when AI rate limit is reached

### Preset Answer Coverage

| Preset | Information Provided |
|:---|:---|
| 🏥 Medical Room | Gate 3, NW Concourse · left at Costa Coffee · red-cross sign |
| 🚻 Accessible Restrooms | SW Concourse, Gate 7 side · blue ♿ floor markers · step-free |
| 🚇 Metro Line 2 | Gate 5 East · 150m walk · fully step-free walkway |
| ♿ Wheelchair Routing | Central Lobby elevator L0→L2 · green floor lines · no steps |
| 🗣️ Quiet Sensory Space | Concourse B, Room 12 · opposite Gate 9 · headphones + staff attendant |
| 🚌 Electric Shuttles | Gate S, Bay 4 · every 10 min · free with match ticket |
| ♻️ Report Hazard | Logged to operations · cleanup crew in 5 min · steward ext. 555 |

---

## 🖥️ Operations Command Centre

The **Command Centre** is the staff-facing operational intelligence dashboard.

### Features

- **🏟️ Live SVG Crowd Density Map** — Colour-coded zone heatmap (Green/Amber/Red) with real-time occupancy % overlays rendered as SVG paths
- **🚨 Animated Incident Pins** — Pulsating SVG alert circles at incident coordinates, driven by telemetry state
- **⏱️ Gate Wait-Time Nodes** — Gate circles (A–D) show live queue minutes, colour-coded by severity threshold
- **📡 IoT Telemetry Ticker** — Rolling log stream of sensor events, updated on every 6-second poll
- **📊 AI Executive Briefing** — Gemini synthesises current telemetry into an executive markdown report
- **🤖 Tactical SOP Generator** — Select incident → Gemini returns a timed response plan with minute-by-minute directives
- **✅ Incident Resolution** — One-click resolve clears incidents from the board and refreshes the map

### How Telemetry Works

The `useSnapshot` custom hook polls `GET /api/operations/snapshot` every 6 seconds. The server applies a **random-walk fluctuation** to simulate real sensor dynamics (attendance drift, gate queue variance, zone occupancy changes). The React component consumes the hook and re-renders only the changed values via `useMemo`.

---

## 🌱 Sustainability Tracker

The **Carbon Footprint Calculator** is built into the Fan Hub and uses science-based emission factors:

| Transport Mode | CO₂ Saving Factor | Threshold Badge |
|:---|:---|:---|
| 🚶 Walking / 🚲 Cycling | 0.21 kg/km | Climate Defender (≥ 1.20 kg) |
| 🚇 Metro Line 2 | 0.165 kg/km | Green Champion (0–1.20 kg) |
| 🚌 Electric Tournament Shuttle | 0.19 kg/km | Eco Guest (0 kg) |
| 🚗 Rideshare Carpool | 0.08 kg/km | — |
| ♻️ Bottle Recycling | +0.22 kg bonus | Stacks with transit savings |

Claimed offsets are synced to the Command Centre via `POST /api/operations/carbon`, contributing to the cumulative CO₂ saved counter on the dashboard.

---

## 🔐 Security

| Layer | Implementation |
|:---|:---|
| **XSS Prevention** | `DOMPurify.sanitize()` on every AI-generated HTML string before `dangerouslySetInnerHTML` |
| **Content Security Policy** | Helmet CSP: `defaultSrc 'self'`, blocks inline scripts, allows Google Fonts + Gemini API only |
| **Rate Limiting** | `express-rate-limit`: 120 req/min global; 10 req/min on all AI-generating endpoints |
| **CORS** | Strict origin (`ALLOWED_ORIGIN` env var, defaults to `localhost:5173`) |
| **Input Validation** | Zod schema for env vars; typed body assertions in all routes; carbon amount capped at 1000 kg |
| **HTTP Headers** | Helmet: XSS filter, HSTS, X-Frame-Options, referrer policy |
| **Error Handling** | Global Express error boundary; `unknown` catch type guards; no stack traces exposed |
| **TypeScript Strict Mode** | `strict: true`, `noImplicitAny`, `noImplicitReturns`, `noUnusedLocals` in all tsconfigs |

---

## ♿ Accessibility (WCAG 2.1)

| Standard | Implementation |
|:---|:---|
| **SC 2.4.1 Bypass Blocks** | `<a href="#main-content" class="skip-link">` — first focusable element on the page |
| **SC 2.1.1 Keyboard** | All features fully keyboard-operable; no mouse-only interactions |
| **SC 2.1.2 No Keyboard Trap** | Modal focus trap (Tab/Shift+Tab cycles within modal); Escape closes |
| **SC 2.4.7 Focus Visible** | `:focus-visible` outlines on all interactive elements |
| **SC 1.3.1 Info & Relationships** | `role="tablist/tab/tabpanel"`, `role="dialog"`, `role="log"` throughout |
| **SC 1.4.3 Contrast** | All text meets WCAG AA contrast ratios on dark glassmorphism background |
| **SC 4.1.3 Status Messages** | `aria-live="polite"` on chat log and mode badge |
| **Focus Management** | Modal: focus-on-open, focus-restore-on-close |
| **Decorative Content** | `aria-hidden="true"` on all decorative emoji |

---

## 🧪 Testing

The backend includes an automated test suite validating all critical logic:

```bash
cd server && npm test
```

### Test Coverage (14 Assertions, 3 Groups)

**Group 1 — Cache Operations**
- ✅ Standard store and retrieve
- ✅ Expired key returns `null` (negative TTL)
- ✅ Missing key returns `null`
- ✅ Overwrite existing key with new value
- ✅ `clear()` wipes all entries

**Group 2 — Venue Grounding Dataset**
- ✅ Stadium name matches specification exactly
- ✅ Exactly 4 gates present
- ✅ Exactly 2 medical stations present
- ✅ All 4 gates have 5 required non-empty fields (`id`, `name`, `serves`, `accessibility`, `transitClose`)
- ✅ Sensory room location is a non-empty string
- ✅ Venue capacity > 80,000

**Group 3 — Carbon Offset Calculations**
- ✅ Normal cases: walking 5km, metro 10km + recycle, rideshare 0km
- ✅ Zero distance for all 4 transit modes → `0.00`
- ✅ Recycling bonus only (0 km + recycled) → `0.22`
- ✅ Unknown transit mode → `0.00` savings
- ✅ Large distance: shuttle 100km → `19.00`
- ✅ Cycling uses same factor as walking

```
--- Test Group 1: Cache Operations ---
  ✓ PASS: Cache storage, expiration, overwrite, and clear all work correctly.

--- Test Group 2: Venue Grounding Dataset ---
  ✓ PASS: Venue dataset structure, gate fields, and sensory room data are fully valid.

--- Test Group 3: Carbon Offset Metrics ---
  ✓ PASS: Carbon offset calculations correct across normal, boundary, and edge-case inputs.

======================================
✅ ArenaPulse backend test suite FULLY GREEN.
======================================
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+** and **npm 9+**
- A **Google Gemini API key** *(optional — full simulation mode works without one)*

### Installation

```bash
# Clone the repository
git clone https://github.com/sravanthbabu17/ArenaPulse.git
cd ArenaPulse

# Install all workspace dependencies (client + server)
npm install
```

### Running Locally

```bash
# Terminal 1 — Start the backend API server (port 8080)
npm run dev:server

# Terminal 2 — Start the frontend dev server (port 5173)
npm run dev:client

# Open http://localhost:5173 in your browser
```

### Environment Variables (Optional)

Create `server/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8080
ALLOWED_ORIGIN=http://localhost:5173
```

> **No API key needed** — All features run in simulation mode with realistic pre-composed data.

### Running Tests

```bash
cd server && npm test
```

### Production Build

```bash
npm run build
# Builds both server TypeScript and client React into dist/ folders
```

---

## 🔑 Using the Gemini API Key

1. Get a free key at [aistudio.google.com](https://aistudio.google.com/app/apikey)
2. Paste it into the **API key field** in the top-right header of the running app
3. The badge changes from `Simulation` → `Live GenAI`
4. All AI responses are now powered by Gemini 1.5 Flash (rate limited to 10 req/min per endpoint)

---

## 🌐 API Reference

| Method | Endpoint | Rate Limit | Description |
|:---|:---|:---|:---|
| `GET` | `/api/health` | Global | Server status + mode indicator |
| `POST` | `/api/assistant/ask` | 10/min (AI) | PulseAI fan chat with Gemini grounding |
| `GET` | `/api/operations/snapshot` | Global | Live telemetry data with fluctuation |
| `POST` | `/api/operations/briefing` | 10/min (AI) | AI executive operations briefing |
| `POST` | `/api/operations/sop` | 10/min (AI) | AI tactical SOP for incident type |
| `POST` | `/api/operations/resolve` | Global | Clear incident from active board |
| `POST` | `/api/operations/carbon` | Global | Sync fan CO₂ offset to dashboard |

All AI endpoints return a structured `429` JSON response when the rate limit is reached, with a user-friendly message displayed in the UI.

---

## 🎨 Design System

ArenaPulse uses a dark glassmorphism design system with a premium sports HUD aesthetic:

```css
--color-primary:  #00f0ff   /* Cyan — primary CTA and focus rings */
--color-success:  #00ff87   /* Green — safe zones and success states */
--color-warning:  #ffd100   /* Amber — busy zones and warnings */
--color-error:    #ff3366   /* Red — critical zones and danger alerts */
--bg-base:        #060913   /* Deep space dark background */
--font-family:    'Outfit'  /* Google Fonts — modern, geometric */
```

- **Glassmorphism panels** with `backdrop-filter: blur(16px)` and subtle borders
- **Radial gradient background** creating depth without images
- **Micro-animations** on hover states, tab transitions, and message arrivals
- **Typewriter effect** for all AI-generated text (DOMPurify-sanitized before render)
- **Pulsating SVG alerts** with CSS `animate` for incident location pins

---

## 📋 Assumptions Made

1. **Stadium dataset is static** — Venue facility locations (gates, medical, elevators) do not change during the event. The `VENUE_DATASET` in `venue.ts` is the single source of truth for all AI grounding.

2. **Telemetry is simulated** — In the absence of real IoT sensors, the server applies a random-walk fluctuation model to seed data. Real deployment would replace `fluctuateState()` with a live sensor API integration.

3. **API key is per-user** — The Gemini API key is entered by the user in the browser and sent per-request in the `x-gemini-key` header. It is never persisted server-side. The server uses the `GEMINI_API_KEY` env variable as a secondary option.

4. **Single stadium deployment** — The platform is designed for Estadio Azteca, Mexico City. Multi-venue support would require parameterising the venue dataset.

5. **Emission factors are approximations** — CO₂ saving factors (0.21 kg/km walking, 0.165 kg/km metro, etc.) are relative to a single-occupancy petrol car baseline and are derived from publicly available transport emission studies.

6. **Rate limits are per-IP, in-memory** — The `express-rate-limit` store resets on server restart. Production deployment on distributed infrastructure would require a Redis store.

---

## 📁 Key Files

| File | Purpose |
|:---|:---|
| [`client/src/App.tsx`](./client/src/App.tsx) | Root component: tabs, API key, skip link, ARIA |
| [`client/src/components/Modal.tsx`](./client/src/components/Modal.tsx) | Accessible modal: focus trap, Escape key, focus restore |
| [`client/src/features/assistant/MatchGuide.tsx`](./client/src/features/assistant/MatchGuide.tsx) | Fan Hub: PulseAI chat, carbon calculator, DOMPurify sanitization |
| [`client/src/features/operations/useSnapshot.ts`](./client/src/features/operations/useSnapshot.ts) | Custom hook: telemetry polling, log state |
| [`client/src/features/operations/CommandHub.tsx`](./client/src/features/operations/CommandHub.tsx) | Command Centre: SVG map, incidents, SOPs, briefings |
| [`client/src/index.css`](./client/src/index.css) | Complete design system (skip-link, focus-visible, glassmorphism) |
| [`server/src/index.ts`](./server/src/index.ts) | Express entry: Helmet CSP, strict CORS, rate limiting |
| [`server/src/config.ts`](./server/src/config.ts) | Zod env schema: PORT, GEMINI_API_KEY, ALLOWED_ORIGIN |
| [`server/src/lib/gemini.ts`](./server/src/lib/gemini.ts) | Typed Gemini 1.5 Flash API bridge (no `any` types) |
| [`server/src/lib/cache.ts`](./server/src/lib/cache.ts) | TTL cache: prevents redundant Gemini API calls |
| [`server/src/features/stadium/venue.ts`](./server/src/features/stadium/venue.ts) | Typed venue grounding dataset |
| [`server/src/tests/run-tests.ts`](./server/src/tests/run-tests.ts) | 14-assertion automated test suite |
| [`client/eslint.config.js`](./client/eslint.config.js) | ESLint flat config with `no-explicit-any: error` |

---

## 🏆 Evaluation Criteria Coverage

| Criterion | Impact | How We Address It |
|:---|:---:|:---|
| **Code Quality** | 🔴 High | TypeScript strict mode, no `any` types, custom hooks, `useCallback`/`useMemo`, full JSDoc, ESLint |
| **Security** | 🔴 High | DOMPurify XSS sanitization, Helmet CSP, rate limiting, strict CORS, typed body validation |
| **Efficiency** | 🔴 High | TTL cache (30s briefings, 5min chat), `useCallback` stable refs, placeholder data (zero spinner) |
| **Testing** | 🟠 Medium | 14 automated assertions across 3 groups; edge cases for zero distance, unknown modes, cache clear |
| **Accessibility** | 🟠 Medium | WCAG 2.1: skip link (SC 2.4.1), focus trap (SC 2.1.2), `:focus-visible` (SC 2.4.7), `aria-live` |
| **Problem Alignment** | 🟠 Medium | All 8 FIFA 2026 domains covered; AI grounded on real venue dataset; no hallucination |

---

## 👤 Author

**Sravanth Babu**

- GitHub: [@sravanthbabu17](https://github.com/sravanthbabu17)
- Repository: [ArenaPulse](https://github.com/sravanthbabu17/ArenaPulse)

---

<div align="center">

**ArenaPulse 2026 — Where Every Fan Finds Their Way**

*Built with Google Gemini AI · React 19 · Node.js · TypeScript*

</div>
