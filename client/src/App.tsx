/**
 * @file App.tsx
 * @description Root React component coordinating dashboard tabs, global state, and API key management.
 *
 * Accessibility:
 * - Provides a "Skip to main content" link (WCAG 2.1 SC 2.4.1) as the very first focusable element.
 * - Uses role="tablist" / role="tab" / role="tabpanel" ARIA pattern for the tab navigation.
 */

import { useState, useEffect } from 'react';
import { MatchGuide } from './features/assistant/MatchGuide';
import { CommandHub } from './features/operations/CommandHub';

function App() {
  const [activeTab, setActiveTab] = useState<'fan' | 'ops'>('fan');
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') ?? '';
  });

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  const handleKeyChange = (val: string): void => {
    setApiKey(val);
  };

  return (
    <div className="app-container">
      {/* Skip-to-content link — WCAG 2.1 SC 2.4.1: Bypass Blocks */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Header Panel */}
      <header className="app-header">
        <div className="brand-wrapper">
          <span className="brand-logo-icon" aria-hidden="true">
            ⚽
          </span>
          <div>
            <h1 className="brand-title">ArenaPulse 2026</h1>
            <span className="brand-subtitle">
              FIFA World Cup 2026 · GenAI Stadium Intelligence Platform
            </span>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="nav-tab-container" role="tablist" aria-label="Dashboard views">
          <button
            className={`nav-tab ${activeTab === 'fan' ? 'active' : ''}`}
            onClick={() => setActiveTab('fan')}
            role="tab"
            aria-selected={activeTab === 'fan'}
            id="tab-fan"
            aria-controls="panel-fan"
          >
            🎫 Fan Hub
          </button>
          <button
            className={`nav-tab ${activeTab === 'ops' ? 'active' : ''}`}
            onClick={() => setActiveTab('ops')}
            role="tab"
            aria-selected={activeTab === 'ops'}
            id="tab-ops"
            aria-controls="panel-ops"
          >
            🖥️ Command Centre
          </button>
        </div>

        {/* API Key Input */}
        <div className="api-key-wrapper">
          <input
            type="password"
            placeholder="Enter Gemini API Key..."
            value={apiKey}
            onChange={(e) => handleKeyChange(e.target.value)}
            aria-label="Google Gemini API Key"
          />
          <span
            className={`badge-mode ${apiKey ? 'badge-live' : 'badge-simulation'}`}
            aria-live="polite"
            aria-label={apiKey ? 'Live GenAI mode active' : 'Simulation mode active'}
          >
            {apiKey ? 'Live GenAI' : 'Simulation'}
          </span>
        </div>
      </header>

      {/* Main Viewports */}
      <main className="app-main" id="main-content" tabIndex={-1}>
        {/* Fan tab */}
        <div
          id="panel-fan"
          className={`tab-viewport ${activeTab === 'fan' ? 'active' : ''}`}
          role="tabpanel"
          aria-labelledby="tab-fan"
          hidden={activeTab !== 'fan'}
        >
          {activeTab === 'fan' && <MatchGuide apiKey={apiKey} />}
        </div>

        {/* Operations tab */}
        <div
          id="panel-ops"
          className={`tab-viewport ${activeTab === 'ops' ? 'active' : ''}`}
          role="tabpanel"
          aria-labelledby="tab-ops"
          hidden={activeTab !== 'ops'}
        >
          {activeTab === 'ops' && <CommandHub apiKey={apiKey} />}
        </div>
      </main>

      {/* A11y Announcer — used by MatchGuide for screen reader chat updates */}
      <div
        id="accessibility-announcer"
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      ></div>
    </div>
  );
}

export default App;
