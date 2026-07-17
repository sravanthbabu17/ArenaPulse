export interface Gate {
  id: string;
  name: string;
  serves: string;
  accessibility: string;
  transitClose: string;
}

export interface MedicalStation {
  location: string;
  name: string;
  services: string;
}

export interface Elevator {
  name: string;
  accessTo: string;
}

export interface SensoryRoom {
  location: string;
  purpose: string;
}

export interface TransitService {
  name: string;
  frequency?: string;
  accessibility?: string;
  departurePoint?: string;
  destinations?: string;
  location?: string;
  waitTimes?: string;
}

export interface VenueDataset {
  stadiumName: string;
  capacity: number;
  gates: Gate[];
  facilities: {
    medical: MedicalStation[];
    restrooms: string;
    elevators: Elevator[];
    sensoryRoom: SensoryRoom;
  };
  transit: {
    metro: TransitService;
    shuttles: TransitService;
    rideshare: TransitService;
  };
}

export const VENUE_DATASET: VenueDataset = {
  stadiumName: "FIFA World Cup 2026 — Mexico City (Estadio Azteca)",
  capacity: 87500,
  
  gates: [
    {
      id: "gate-a",
      name: "Gate A (North)",
      serves: "Sections 100-150 and Lower Tier",
      accessibility: "Wheelchair accessible, dedicated step-free ramp.",
      transitClose: "Metro Line 2 (Estadio Azteca Station)"
    },
    {
      id: "gate-b",
      name: "Gate B (East)",
      serves: "Sections 200-290 and Suites",
      accessibility: "Standard access, escalator available at main lobby.",
      transitClose: "Tournament Shuttle Hub (Departing to Downtown)"
    },
    {
      id: "gate-c",
      name: "Gate C (South)",
      serves: "Sections 300-350 and Middle Tier",
      accessibility: "Wheelchair accessible, step-free ramps.",
      transitClose: "South Bus Terminal"
    },
    {
      id: "gate-d",
      name: "Gate D (West)",
      serves: "Sections 400-490 and Press Box",
      accessibility: "Elevators available at West VIP Lobby.",
      transitClose: "Outer Parking Lot E (Rideshare & Taxis)"
    }
  ],
  
  facilities: {
    medical: [
      { location: "Section 102 (Lower Tier)", name: "Central First Aid Station", services: "Full medical triage, defibrillator, stretcher transport" },
      { location: "Section 308 (Upper Tier)", name: "Satellite First Aid Room", services: "Basic first aid, heat exhaustion care" }
    ],
    restrooms: "Located at every concourse exit near the ramps. Dedicated family and accessible restrooms are placed adjacent to Sections 105, 215, and 325.",
    elevators: [
      { name: "West VIP Lobby Elevators", accessTo: "All tiers, VIP Suites, and Press Zone" },
      { name: "East Concourse Elevators", accessTo: "Suites and Middle Tier" }
    ],
    sensoryRoom: {
      location: "Section 212 (Middle Tier)",
      purpose: "Quiet space for neurodivergent fans, sensory bags, and noise-canceling headphones available."
    }
  },
  
  transit: {
    metro: {
      name: "Metro Line 2 (Estadio Azteca Station)",
      frequency: "Every 2.5 minutes post-match",
      accessibility: "Elevators to platform, tactile paving, wheelchair boarding slots."
    },
    shuttles: {
      name: "Electric Tournament Shuttles",
      departurePoint: "North Transit Hub (Gate A)",
      destinations: "City Center, Airport, FIFA Fan Festival",
      frequency: "Continuous rolling departures post-match"
    },
    rideshare: {
      name: "Official Rideshare & Taxi Zone",
      location: "Outer Parking Lot E (West Concourse)",
      waitTimes: "Typically 15-20 minutes, priority lanes for accessible rides."
    }
  }
};
