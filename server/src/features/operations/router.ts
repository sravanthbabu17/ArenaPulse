import { Router, Request, Response } from "express";
import { callGemini } from "../../lib/gemini.js";
import { queryCache } from "../../lib/cache.js";
import { config } from "../../config.js";

export const operationsRouter = Router();

/**
 * @route POST /api/operations/carbon-insight
 * @description Generates a personalized GenAI sustainability message for the fan based on their offset.
 */
operationsRouter.post(
  "/carbon-insight",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { distance, mode, saved } = req.body as {
        distance: unknown;
        mode: unknown;
        saved: unknown;
      };
      if (
        typeof distance !== "number" ||
        typeof mode !== "string" ||
        typeof saved !== "number"
      ) {
        res.status(400).json({ error: "Invalid insight parameters" });
        return;
      }

      const apiKey =
        (req.headers["x-gemini-key"] as string) || config.GEMINI_API_KEY || "";
      if (!apiKey) {
        res.json({
          message: "Thank you for making an eco-friendly choice today!",
        });
        return;
      }

      const prompt = `You are the sustainability AI for ArenaPulse 2026. A fan just travelled ${distance}km via ${mode} and saved ${saved}kg of CO2. Write a single, short, inspiring sentence (max 15 words) thanking them for their specific eco-impact.`;

      const responseText = await callGemini(
        prompt,
        "You are an eco-friendly AI assistant.",
      );
      res.json({ message: responseText });
    } catch (error) {
      res.json({
        message: "Thank you for making an eco-friendly choice today!",
      });
    }
  },
);

/** Severity levels for stadium incidents. */
type Severity = "critical" | "warning";

/** Status thresholds for seating zone crowd load. */
type ZoneStatus = "comfortable" | "busy" | "critical";

/** Represents a single active stadium incident. */
interface Incident {
  id: string;
  name: string;
  locationId: string;
  severity: Severity;
  timestamp: string;
  description: string;
}

/** Top-level telemetry state shared across all operations endpoints. */
interface TelemetryState {
  attendance: number;
  avgGateWait: number;
  carbonSaved: number;
  incidentCount: number;
  incidents: Incident[];
  zones: {
    id: string;
    name: string;
    occupancy: number;
    status: ZoneStatus;
  }[];
}

// In-Memory Telemetry Database — populated with realistic FIFA WC 2026 seed values
let state: TelemetryState = {
  attendance: 72450,
  avgGateWait: 11.2,
  carbonSaved: 2450.4,
  incidentCount: 2,
  incidents: [
    {
      id: "gate-d",
      name: "Gate D Congestion Alert",
      locationId: "gate-d",
      severity: "critical",
      timestamp: new Date().toLocaleTimeString(),
      description:
        "Ticketing turnstile failure causing line lengths to exceed 18 minutes.",
    },
    {
      id: "sec-102",
      name: "Section 102 Minor Medical Distress",
      locationId: "sec-102",
      severity: "warning",
      timestamp: new Date().toLocaleTimeString(),
      description:
        "Spectator reports mild heat exhaustion. First responders dispatched.",
    },
  ],
  zones: [
    {
      id: "zone-north",
      name: "North Zone (Blue)",
      occupancy: 68,
      status: "comfortable",
    },
    {
      id: "zone-east",
      name: "East Zone (Amber)",
      occupancy: 82,
      status: "busy",
    },
    {
      id: "zone-south",
      name: "South Zone (Green)",
      occupancy: 58,
      status: "comfortable",
    },
    {
      id: "zone-west",
      name: "West Zone (Red)",
      occupancy: 93,
      status: "critical",
    },
  ],
};

/**
 * Applies a random-walk fluctuation to the in-memory telemetry state,
 * simulating real-time stadium dynamics between polling intervals.
 */
function fluctuateState(): void {
  state.attendance += Math.floor((Math.random() - 0.5) * 40);
  state.avgGateWait = Math.max(
    3,
    Math.min(25, state.avgGateWait + (Math.random() - 0.5) * 0.8),
  );

  // Fluctuate seating quadrant percentages
  state.zones.forEach((z) => {
    z.occupancy = Math.max(
      20,
      Math.min(100, z.occupancy + Math.floor((Math.random() - 0.5) * 4)),
    );
    if (z.occupancy < 70) z.status = "comfortable";
    else if (z.occupancy < 90) z.status = "busy";
    else z.status = "critical";
  });

  state.incidentCount = state.incidents.length;
}

/**
 * GET /api/operations/snapshot
 * Returns the current live telemetry snapshot after applying a random-walk fluctuation.
 */
operationsRouter.get("/snapshot", (_req: Request, res: Response) => {
  fluctuateState();
  res.json(state);
});

/**
 * POST /api/operations/resolve
 * Clears a specific incident from the active incident board by ID.
 * Body: { incidentId: string }
 */
operationsRouter.post("/resolve", (req: Request, res: Response): void => {
  const { incidentId } = req.body as { incidentId?: string };
  if (!incidentId || typeof incidentId !== "string") {
    res
      .status(400)
      .json({ error: "Missing or invalid incidentId in request body." });
    return;
  }

  const initialLen = state.incidents.length;
  state.incidents = state.incidents.filter((inc) => inc.id !== incidentId);
  state.incidentCount = state.incidents.length;

  if (state.incidents.length < initialLen) {
    res.json({
      success: true,
      message: `Incident ${incidentId} resolved successfully.`,
      incidents: state.incidents,
    });
  } else {
    res.status(404).json({ error: `Incident ${incidentId} not found.` });
  }
});

/**
 * POST /api/operations/carbon
 * Increments the cumulative carbon-saved counter by the reported amount.
 * Body: { amount: number }
 * Validates: amount must be a finite, non-negative number not exceeding 1000 kg per request.
 */
operationsRouter.post("/carbon", (req: Request, res: Response): void => {
  const { amount } = req.body as { amount?: unknown };

  if (amount === undefined || typeof amount !== "number") {
    res
      .status(400)
      .json({
        error: "Missing or invalid amount in request body. Must be a number.",
      });
    return;
  }
  if (!isFinite(amount) || amount < 0) {
    res
      .status(400)
      .json({ error: "Amount must be a finite, non-negative number." });
    return;
  }
  if (amount > 1000) {
    res
      .status(400)
      .json({
        error:
          "Amount exceeds maximum allowed single-submission cap of 1000 kg.",
      });
    return;
  }

  state.carbonSaved += amount;
  res.json({ success: true, carbonSaved: state.carbonSaved });
});

/**
 * POST /api/operations/briefing
 * Generates an AI executive operations briefing from the current telemetry snapshot.
 * Uses Gemini if an API key is configured; falls back to simulation otherwise.
 * Results are cached for 30 seconds to reduce API calls.
 */
operationsRouter.post(
  "/briefing",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      fluctuateState();
      const cacheKey = `ops_briefing_${state.incidents.length}_${Math.floor(state.carbonSaved / 10)}`;
      const cached = queryCache.get<string>(cacheKey);
      if (cached) {
        res.json({ briefing: cached, cached: true });
        return;
      }

      let briefingText = "";

      if (config.GEMINI_API_KEY) {
        try {
          const stateContext = JSON.stringify(state);
          const systemPrompt = `You are "ArenaPulse Ops Command", a smart operational intelligence dashboard for stadium managers at Estadio Azteca.
Generate a concise, professional, prioritized operations briefing report summarizing the current telemetry state below.
Highlight zone occupancy warnings (especially critical zones), active incident alerts, and public transport queue wait times.
Include a direct 'Tactical Recommendations' section in bullet points. Use clean Markdown styling.

Stadium State Snapshot:
${stateContext}`;

          briefingText = await callGemini(
            "Generate Operations Briefing Report",
            systemPrompt,
          );
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.warn(
            "Briefing generation failed, using simulation:",
            message,
          );
          briefingText =
            `⚠️ **Gemini API Error (Simulation Fallback):** ${message}\n\n` +
            runSimulatedBriefing();
        }
      } else {
        briefingText = runSimulatedBriefing();
      }

      // Cache the briefing for 30 seconds
      queryCache.set(cacheKey, briefingText, 30000);
      res.json({ briefing: briefingText, cached: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown server error";
      console.error("Operations briefing error:", err);
      res.status(500).json({ error: "Internal server error: " + message });
    }
  },
);

/**
 * POST /api/operations/sop
 * Generates a standard operating procedure (SOP) for a given incident.
 * Body: { incidentId: string, customContext?: string }
 */
operationsRouter.post(
  "/sop",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { incidentId, customContext } = req.body as {
        incidentId?: string;
        customContext?: string;
      };
      if (!incidentId || typeof incidentId !== "string") {
        res
          .status(400)
          .json({ error: "Missing or invalid incidentId in request body." });
        return;
      }

      const cacheKey = `sop_${incidentId}_${(customContext || "").trim().toLowerCase()}`;
      const cached = queryCache.get<string>(cacheKey);
      if (cached) {
        res.json({ sop: cached, cached: true });
        return;
      }

      let sopText = "";

      if (config.GEMINI_API_KEY) {
        try {
          const systemPrompt = `You are "ArenaPulse Command", a tactical operational directives assistant for Estadio Azteca organizers.
Generate a professional, step-by-step Standard Operating Procedure (SOP) to resolve the specified incident.
Ensure the layout is formatted in Markdown with header '### SOP: [Incident Name]' followed by direct, actionable 'Operational Directives'.`;

          const prompt = `Incident ID: ${incidentId}. Context: ${customContext || "General alert."}`;
          sopText = await callGemini(prompt, systemPrompt);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Unknown error";
          console.warn("SOP generation failed, using simulation:", message);
          sopText =
            `⚠️ **Gemini API Error (Simulation Fallback):** ${message}\n\n` +
            runSimulatedSOP(incidentId, customContext);
        }
      } else {
        sopText = runSimulatedSOP(incidentId, customContext);
      }

      queryCache.set(cacheKey, sopText);
      res.json({ sop: sopText, cached: false });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unknown server error";
      console.error("SOP generation error:", err);
      res.status(500).json({ error: "Internal server error: " + message });
    }
  },
);

/** Generates a simulation-mode executive briefing from the current telemetry state. */
function runSimulatedBriefing(): string {
  const criticalZones = state.zones
    .filter((z) => z.status === "critical")
    .map((z) => z.name)
    .join(", ");
  const activeAlerts = state.incidents
    .map(
      (inc) =>
        `* **${inc.name}** (${inc.severity.toUpperCase()}): ${inc.description}`,
    )
    .join("\n");

  return `### 📊 Live Operations Executive Briefing

**ESTADIO AZTECA MATCHDAY SUMMARY**
* **Total Attendance**: ${state.attendance} fans checked-in.
* **Average Gate Wait Time**: ${state.avgGateWait.toFixed(1)} minutes.
* **Eco Contributions**: ${state.carbonSaved.toFixed(1)} kg CO₂ saved overall.

---

### 🚨 Critical Attention Points
${criticalZones ? `* **Crowd Loading**: Seating segments in **${criticalZones}** are at critical load (90%+).` : "* **Crowd Loading**: All seating segments are currently within safe bounds."}
${state.incidents.length > 0 ? `* **Active Incidents**:\n${activeAlerts}` : "* **Incidents**: Zero active security or medical events logged."}

---

### 🧭 Tactical Recommendations
1. **West Gate Re-routing**: Dispatch stewards to Gate D to support ticketing turnstile issues. Direct incoming fans to Gate A.
2. **First Responder Triage**: Medical Team B is executing first-aid protocols at Section 102. Standby for portal clearance confirmation.
3. **Transport Allocation**: Instruct Electric Shuttles to scale up departures at North Transit Hub to match increasing post-match flows.`;
}

/**
 * Generates a simulation-mode SOP for a given incident ID.
 * Falls back to a generic universal response directive for unknown incident types.
 */
function runSimulatedSOP(incidentId: string, customContext?: string): string {
  if (incidentId === "gate-d") {
    return `### 📋 SOP: Gate D Queue Congestion (Severity: RED)
**Trigger Event**: Gate D ticketing turnstile failure. Wait time exceeds 18 minutes.

**Operational Directives:**
1. **Dynamic Rerouting**: Activate outer video board maps pointing fans to **Gate A (North)**.
2. **Geo-targeted Alert**: Push app announcement: *"Gate D is congested. Please use Gate A for less than 5-minute wait time."*
3. **Turnstile Support**: Deploy 4 ticketing technicians to West VIP turnstile hub to check device connectivity.`;
  }

  if (incidentId === "sec-102") {
    return `### 📋 SOP: Section 102 Medical Incident (Severity: YELLOW)
**Trigger Event**: Spectator reports heat exhaustion at Lower Tier Section 102.

**Operational Directives:**
1. **Medical Dispatch**: Dispatch Medical Team B from Tunnel 4 Station.
2. **Access Clear**: Direct Local Security Staff to clear Gangway 102. Keep stretcher corridor sterile.
3. **Central Clinic Alert**: Alert stadium central hospital of incoming triage patient details.`;
  }

  const text = customContext || "General stadium alert.";
  return `### 📋 SOP: Custom Tactical Directive
**Scenario**: ${text}

**Operational Directives:**
1. **Local Assessment**: Security command checks camera feed covering local area.
2. **Staff Interlock**: Coordinate communications between hospitality volunteers and security stewards.
3. **Egress Preservation**: Ensure exits and exit stairwells remain completely clear.`;
}
