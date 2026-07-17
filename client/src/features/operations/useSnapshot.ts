/**
 * @file useSnapshot.ts
 * @description Custom React hook encapsulating all telemetry polling logic for the
 * Command Hub dashboard. Isolates side effects from UI rendering for testability.
 */

import { useState, useEffect, useCallback } from 'react';

/** Severity levels for stadium incidents. */
type Severity = 'critical' | 'warning';

/** Status thresholds for seating zone crowd load. */
type ZoneStatus = 'comfortable' | 'busy' | 'critical';

/** Represents a single active stadium incident. */
export interface Incident {
  id: string;
  name: string;
  locationId: string;
  severity: Severity;
  timestamp: string;
  description: string;
}

/** Full telemetry snapshot returned by the /api/operations/snapshot endpoint. */
export interface TelemetrySnapshot {
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

/** Offline placeholder snapshot — ensures the dashboard never renders empty on first load. */
const PLACEHOLDER_SNAPSHOT: TelemetrySnapshot = {
  attendance: 87523,
  avgGateWait: 6.2,
  carbonSaved: 4.3,
  incidentCount: 1,
  incidents: [
    {
      id: 'inc-demo-1',
      name: 'Crowd Surge Warning',
      locationId: 'gate-d',
      severity: 'warning',
      timestamp: new Date().toLocaleTimeString(),
      description: 'Elevated density near Gate D entry tunnel — stewards dispatched.',
    },
  ],
  zones: [
    { id: 'zone-north', name: 'North Stand', occupancy: 91, status: 'critical' },
    { id: 'zone-east', name: 'East Stand', occupancy: 74, status: 'busy' },
    { id: 'zone-south', name: 'South Stand', occupancy: 62, status: 'comfortable' },
    { id: 'zone-west', name: 'West Stand', occupancy: 85, status: 'busy' },
  ],
};

/** Return shape of the useSnapshot hook. */
export interface UseSnapshotReturn {
  snapshot: TelemetrySnapshot;
  logs: string[];
  fetchSnapshot: () => Promise<void>;
}

/**
 * Polls `/api/operations/snapshot` every 6 seconds and maintains a rolling log
 * of the last 16 telemetry events. Falls back gracefully to the placeholder
 * snapshot when the API is unreachable.
 *
 * @returns Current telemetry snapshot, rolling log entries, and a manual refetch function.
 */
export function useSnapshot(): UseSnapshotReturn {
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot>(PLACEHOLDER_SNAPSHOT);
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [SYSTEM] GenAI Command Hub online. FIFA World Cup 2026 — Mexico City Stadium Operations Centre.`,
  ]);

  const fetchSnapshot = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/operations/snapshot');
      if (response.ok) {
        const data = (await response.json()) as TelemetrySnapshot;
        setSnapshot(data);
        const tickLog = `[${new Date().toLocaleTimeString()}] [SENSOR] Live update: Gate D wait now ${data.avgGateWait.toFixed(1)}m | Attendance ${data.attendance.toLocaleString()}.`;
        setLogs((prev) => [tickLog, ...prev.slice(0, 15)]);
      } else {
        const errLog = `[${new Date().toLocaleTimeString()}] [WARN] API returned ${response.status}. Running on simulation data.`;
        setLogs((prev) => [errLog, ...prev.slice(0, 15)]);
      }
    } catch {
      const errLog = `[${new Date().toLocaleTimeString()}] [WARN] API unreachable. Simulation mode active.`;
      setLogs((prev) => [errLog, ...prev.slice(0, 15)]);
    }
  }, []);

  useEffect(() => {
    void fetchSnapshot();
    const interval = setInterval(() => void fetchSnapshot(), 6000);
    return () => clearInterval(interval);
  }, [fetchSnapshot]);

  return { snapshot, logs, fetchSnapshot };
}
