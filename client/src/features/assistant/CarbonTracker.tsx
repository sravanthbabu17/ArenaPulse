/**
 * @file CarbonTracker.tsx
 * @description Fan-facing sustainability tracker component.
 * Calculates carbon offset and fetches a GenAI-powered personalized sustainability message.
 */

import React, { useState, useCallback } from 'react';

interface CarbonResult {
  co2Saved: number;
  badge: string;
  badgeColor: string;
  couponCode?: string;
  aiMessage?: string;
}

interface CarbonTrackerProps {
  apiKey: string;
}

export const CarbonTracker: React.FC<CarbonTrackerProps> = ({ apiKey }) => {
  const [distance, setDistance] = useState<string>('5');
  const [transitMode, setTransitMode] = useState<string>('metro');
  const [didRecycle, setDidRecycle] = useState(false);
  const [carbonResult, setCarbonResult] = useState<CarbonResult | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  /** Calculates offset and fetches AI sustainability message. */
  const handleCalculateOffset = useCallback(async (): Promise<void> => {
    const distNum = parseFloat(distance) || 0;
    if (distNum < 0) return;

    let saved = 0;
    const baselineFactor = 0.21;

    if (transitMode === 'walking' || transitMode === 'cycling') {
      saved = distNum * baselineFactor;
    } else if (transitMode === 'metro') {
      saved = distNum * 0.165;
    } else if (transitMode === 'shuttle') {
      saved = distNum * 0.19;
    } else if (transitMode === 'rideshare') {
      saved = distNum * 0.08;
    }

    if (didRecycle) saved += 0.22;
    saved = parseFloat(saved.toFixed(2));

    let badge = 'Eco Guest';
    let badgeColor = '#8c9cb6';
    let coupon: string | undefined;

    if (saved > 0 && saved < 1.2) {
      badge = 'Green Champion';
      badgeColor = '#00e5ff';
      coupon = 'ECOFAN26';
    } else if (saved >= 1.2) {
      badge = 'Climate Defender';
      badgeColor = '#00ff87';
      coupon = 'ECOWORLD26';
    }

    setCarbonResult({
      co2Saved: saved,
      badge,
      badgeColor,
      couponCode: coupon,
      aiMessage: undefined,
    });
    setClaimSuccess(false);
    setIsLoadingInsight(true);

    try {
      const response = await fetch('/api/operations/carbon-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-gemini-key': apiKey },
        body: JSON.stringify({ distance: distNum, mode: transitMode, saved }),
      });
      if (response.ok) {
        const data = (await response.json()) as { message: string };
        setCarbonResult((prev) => (prev ? { ...prev, aiMessage: data.message } : null));
      }
    } catch {
      setCarbonResult((prev) =>
        prev ? { ...prev, aiMessage: 'Thank you for making a sustainable choice today!' } : null
      );
    } finally {
      setIsLoadingInsight(false);
    }
  }, [distance, transitMode, didRecycle, apiKey]);

  const handleClaimReward = useCallback(async (): Promise<void> => {
    if (!carbonResult) return;
    try {
      const response = await fetch('/api/operations/carbon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: carbonResult.co2Saved }),
      });
      if (response.ok) {
        setClaimSuccess(true);
        setDidRecycle(false);
      }
    } catch (err) {
      console.error('Error claiming carbon credits:', err);
    }
  }, [carbonResult]);

  return (
    <div className="panel-glass">
      <div className="panel-title-bar">
        <div>
          <h2>🌱 Post-Match Sustainability Tracker</h2>
          <span className="panel-subtitle">Offset carbon emissions, earn concession rewards</span>
        </div>
      </div>

      <div className="panel-content sustain-grid">
        <div className="calculator-card">
          <h3
            style={{
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '0.75rem',
            }}
          >
            Eco-Trip Calculator
          </h3>

          <div className="calc-row">
            <label htmlFor="select-transit">Method of Return Transit</label>
            <select
              id="select-transit"
              value={transitMode}
              onChange={(e) => setTransitMode(e.target.value)}
            >
              <option value="walking">🚶 Walking / Cycling (Zero Emission)</option>
              <option value="metro">🚇 Metro Line 2 (Electric Light Rail)</option>
              <option value="shuttle">🚌 Electric Tournament Shuttle</option>
              <option value="rideshare">🚙 Rideshare Carpool (Multi-passenger)</option>
            </select>
          </div>

          <div className="calc-row">
            <label htmlFor="input-distance">Travel Distance (Kilometers)</label>
            <input
              id="input-distance"
              type="number"
              min="0"
              step="0.5"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              aria-invalid={parseFloat(distance) < 0}
            />
          </div>

          <div className="calc-row calc-row-checkbox">
            <input
              id="check-recycle"
              type="checkbox"
              checked={didRecycle}
              onChange={(e) => setDidRecycle(e.target.checked)}
            />
            <label htmlFor="check-recycle">
              Logged bottle recycling at concession stand (+150g bonus)
            </label>
          </div>

          <button
            className="btn-action btn-primary"
            onClick={() => void handleCalculateOffset()}
            style={{ width: '100%' }}
          >
            Calculate Offset & Get AI Insight
          </button>
        </div>

        {carbonResult && (
          <div className="reward-badge-card" aria-live="polite">
            <div className="badge-row">
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>CO₂ EMISSIONS SAVED:</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-success)' }}>
                {carbonResult.co2Saved} kg
              </span>
            </div>

            <div className="badge-row" style={{ marginTop: '0.25rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>EARNED BADGE STATUS:</span>
              <span
                className="green-badge-pill"
                style={{ backgroundColor: carbonResult.badgeColor }}
              >
                {carbonResult.badge}
              </span>
            </div>

            {carbonResult.couponCode && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                }}
              >
                🎫 <strong>Reward Coupon Unlocked:</strong> Use code{' '}
                <strong style={{ color: 'var(--color-primary)' }}>{carbonResult.couponCode}</strong>{' '}
                for discount at Azteca concession stands.
              </div>
            )}

            {/* GenAI Insight Section */}
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: 'rgba(0,240,255,0.1)',
                borderLeft: '3px solid var(--color-primary)',
                borderRadius: '0 4px 4px 0',
                fontSize: '0.8rem',
                fontStyle: 'italic',
              }}
            >
              {isLoadingInsight
                ? '🤖 GenAI is analysing your eco-impact...'
                : `🤖 ${carbonResult.aiMessage || 'Thank you for making a sustainable choice!'}`}
            </div>

            {!claimSuccess ? (
              <button
                className="btn-action btn-success"
                onClick={() => void handleClaimReward()}
                style={{ width: '100%', marginTop: '0.75rem' }}
              >
                Log & Sync to Operations Command
              </button>
            ) : (
              <div
                style={{
                  color: 'var(--color-success)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textAlign: 'center',
                  marginTop: '0.5rem',
                }}
              >
                ✅ Offset successfully logged to command metrics!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
