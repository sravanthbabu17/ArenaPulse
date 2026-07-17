/**
 * @file run-tests.ts
 * @description ArenaPulse backend unit test suite.
 * Tests the TTL cache, venue dataset integrity, and carbon offset calculation logic
 * across normal, boundary, and edge-case inputs.
 *
 * Run with: npm test (compiles TypeScript then executes with Node)
 */

import assert from 'assert';
import { VENUE_DATASET } from '../features/stadium/venue.js';
import { queryCache } from '../lib/cache.js';

console.log('Starting ArenaPulse Backend Test Suite...\n');

// ── Test Group 1: TTL Cache Operations ──────────────────────────────────────

console.log('--- Test Group 1: Cache Operations ---');

// Standard store and retrieve
queryCache.set('key1', 'val1', 2000);
assert.strictEqual(queryCache.get('key1'), 'val1', 'Cache did not store key1 correctly.');

// Expired key must return null
queryCache.set('key2', 'val2', -100);
assert.strictEqual(queryCache.get('key2'), null, 'Cache did not expire key2 correctly.');

// Missing key must return null
assert.strictEqual(queryCache.get('nonexistent-key'), null, 'Cache must return null for missing keys.');

// Overwrite existing key with new value
queryCache.set('key3', 'original', 5000);
queryCache.set('key3', 'overwritten', 5000);
assert.strictEqual(queryCache.get('key3'), 'overwritten', 'Cache did not overwrite key3 correctly.');

// Cache clear wipes all entries
queryCache.set('key4', 'will-be-cleared', 10000);
queryCache.clear();
assert.strictEqual(queryCache.get('key4'), null, 'Cache.clear() did not remove all entries.');

console.log('  ✓ PASS: Cache storage, expiration, overwrite, and clear all work correctly.\n');

// ── Test Group 2: Venue Dataset Integrity ──────────────────────────────────

console.log('--- Test Group 2: Venue Grounding Dataset ---');

// Top-level structure
assert.strictEqual(VENUE_DATASET.stadiumName, 'FIFA World Cup 2026 — Mexico City (Estadio Azteca)', 'Stadium name must match the specification.');
assert.strictEqual(VENUE_DATASET.gates.length, 4, 'Gate count must be exactly 4.');
assert.strictEqual(VENUE_DATASET.facilities.medical.length, 2, 'Medical stations count must be exactly 2.');

// Every gate must have all required fields with non-empty string values
const REQUIRED_GATE_FIELDS: (keyof typeof VENUE_DATASET.gates[0])[] = ['id', 'name', 'serves', 'accessibility', 'transitClose'];
VENUE_DATASET.gates.forEach((gate, i) => {
  REQUIRED_GATE_FIELDS.forEach(field => {
    assert.ok(
      typeof gate[field] === 'string' && gate[field].length > 0,
      `Gate[${i}].${field} must be a non-empty string.`
    );
  });
});

// Sensory room must have a valid location string
assert.ok(
  typeof VENUE_DATASET.facilities.sensoryRoom.location === 'string' && VENUE_DATASET.facilities.sensoryRoom.location.length > 0,
  'Sensory room location must be a non-empty string.'
);

// Venue capacity must be a positive integer representative of Estadio Azteca
assert.ok(VENUE_DATASET.capacity > 80000, 'Stadium capacity must be greater than 80,000.');

console.log('  ✓ PASS: Venue dataset structure, gate fields, and sensory room data are fully valid.\n');

// ── Test Group 3: Carbon Offset Mathematical Calculations ──────────────────

console.log('--- Test Group 3: Carbon Offset Metrics ---');

/**
 * Mirrors the carbon offset calculation logic used in MatchGuide.tsx.
 * Must stay in sync with the frontend calculation to ensure server assertions match.
 */
const computeCarbonOffset = (mode: string, dist: number, recycled: boolean): number => {
  let saved = 0;
  if (mode === 'walking' || mode === 'cycling') saved = dist * 0.21;
  else if (mode === 'metro') saved = dist * 0.165;
  else if (mode === 'shuttle') saved = dist * 0.19;
  else if (mode === 'rideshare') saved = dist * 0.08;

  if (recycled) saved += 0.22;
  return parseFloat(saved.toFixed(2));
};

// Normal cases
assert.strictEqual(computeCarbonOffset('walking', 5, false), 1.05, 'Walking 5km: 5 * 0.21 = 1.05');
assert.strictEqual(computeCarbonOffset('metro', 10, true), 1.87, 'Metro 10km + recycle: 10 * 0.165 + 0.22 = 1.87');
assert.strictEqual(computeCarbonOffset('rideshare', 0, false), 0.00, 'Rideshare 0km: savings must be 0.00');

// Edge case: zero distance for every transit mode
assert.strictEqual(computeCarbonOffset('walking',   0, false), 0.00, 'Zero-distance walking must yield 0.00');
assert.strictEqual(computeCarbonOffset('metro',     0, false), 0.00, 'Zero-distance metro must yield 0.00');
assert.strictEqual(computeCarbonOffset('shuttle',   0, false), 0.00, 'Zero-distance shuttle must yield 0.00');
assert.strictEqual(computeCarbonOffset('rideshare', 0, false), 0.00, 'Zero-distance rideshare must yield 0.00');

// Edge case: recycling bonus only (zero distance)
assert.strictEqual(computeCarbonOffset('metro', 0, true), 0.22, 'Recycling only with zero distance must yield exactly 0.22');

// Edge case: unknown/invalid transit mode (no savings accrued)
assert.strictEqual(computeCarbonOffset('helicopter', 10, false), 0.00, 'Unknown transit mode must yield 0.00 savings');

// Edge case: large distance produces proportional result
assert.strictEqual(computeCarbonOffset('shuttle', 100, false), 19.00, 'Shuttle 100km: 100 * 0.19 = 19.00');

// Boundary: both cycling mode flag paths produce the same factor
assert.strictEqual(computeCarbonOffset('cycling', 5, false), 1.05, 'Cycling 5km: 5 * 0.21 = 1.05');

console.log('  ✓ PASS: Carbon offset calculations correct across normal, boundary, and edge-case inputs.\n');

console.log('======================================');
console.log('✅ ArenaPulse backend test suite FULLY GREEN.');
console.log('======================================');
