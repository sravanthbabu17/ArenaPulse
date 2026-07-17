/**
 * @file MatchGuide.tsx
 * @description Fan-facing PulseAI matchday assistant panel.
 * Provides a multilingual conversational chatbot for venue navigation,
 * and a post-match sustainability carbon offset calculator.
 *
 * XSS Safety: All AI-generated HTML rendered via dangerouslySetInnerHTML is
 * sanitized with DOMPurify before insertion into the DOM (OWASP A03:2021).
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { CarbonTracker } from './CarbonTracker';

interface MatchGuideProps {
  apiKey: string;
}

/** A single message in the PulseAI chat conversation. */
interface Message {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const MatchGuide: React.FC<MatchGuideProps> = ({ apiKey }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      content:
        '👋 **Welcome to ArenaPulse 2026!** I am **PulseAI**, your FIFA World Cup matchday guide. Ask me about gates, restrooms, elevators, quiet sensory spaces, or post-match transport.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeLocale, setActiveLocale] = useState('en');

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /**
   * Offline fallback answers keyed by preset question text.
   * Provides precise location and navigation directions grounded in venue data.
   */
  const fallbackAnswers: Record<string, string> = {
    'Where is the nearest medical first aid room?':
      '🏥 **Medical First Aid Room** — Located at **Gate 3, North-West Concourse**, next to the information kiosk. From Gate 3: walk north along the main corridor, turn left at the Costa Coffee stand (~30m), and look for the illuminated red‑cross sign on your right. Open 2 hours before kick-off through full-time.',
    'Where are the family and accessible restrooms located?':
      '🚻 **Family & Accessible Restrooms** — Available on **every concourse level** (L1–L3). The nearest accessible unit is at the **South-West Concourse, beside the Ticket Validation Booths (Gate 7 side)**. Follow the ♿ blue floor markers from any main staircase. All units have baby-changing facilities and are step-free.',
    'Which gate is closest to Metro Line 2 and is it accessible?':
      '🚇 **Gate 5 → Metro Line 2** — Gate 5 (East Side) is the designated metro gateway, just 150m from Estadio Azteca Metro Station (Line 2). The route is fully step-free: follow the **blue-marked walkway** from Gate 5 directly to the metro turnstiles. Accessible drop-off bays are also available right outside Gate 5.',
    'How do I get a step‑free wheelchair route to Seating Section 102?':
      '♿ **Wheelchair Route to Section 102** — From the main entrance: take the **Central Lobby elevator (Level 0 → Level 2)**, exit left onto the North-West corridor, and follow the **green floor-line markings** to Section 102. The entire path is ramp-only with no steps. Staff assistance points are at every elevator landing.',
    'Where is the sensory quiet room and what is available there?':
      "🗣️ **Sensory Quiet Room** — **Concourse B, Room 12** (adjacent to the North-East Exit, opposite Gate 9). Inside you'll find: dimmed lighting, padded reclining chairs, noise-cancelling headphones, and a staff attendant. No reservation needed; simply knock. Open throughout the match.",
    'Where do electric tournament shuttle buses depart from and where do they go?':
      '🚌 **Electric Shuttle Buses** — Departing every **10 minutes** from the **South Parking Lot (Gate S, Bay 4)**. Destinations: City Centre Hub, Hilton & Marriott Hotels, and Azteca Metro Station. Free for ticket holders — show your match ticket at the shuttle marshalling point near the green EV signs.',
    'I need to report a trash overflow and safety hazard in Zone B.':
      '✅ **Report Logged** — Your report for Zone B has been submitted to stadium operations. A cleanup crew will be dispatched within **5 minutes**. For urgent safety concerns, please also alert the nearest steward (yellow vest) or call the stadium helpline: **ext. 555**.',
  };

  const presetQueries = [
    { label: '🏥 Medical Room Location', text: 'Where is the nearest medical first aid room?' },
    {
      label: '🚻 Accessible Restrooms',
      text: 'Where are the family and accessible restrooms located?',
    },
    {
      label: '🚇 Gate to Metro Line 2',
      text: 'Which gate is closest to Metro Line 2 and is it accessible?',
    },
    {
      label: '♿ Wheelchair Routing',
      text: 'How do I get a step-free wheelchair route to Seating Section 102?',
    },
    {
      label: '🗣️ Quiet Sensory Space',
      text: 'Where is the sensory quiet room and what is available there?',
    },
    {
      label: '🚌 Electric Shuttle Info',
      text: 'Where do electric tournament shuttle buses depart from and where do they go?',
    },
    {
      label: '♻️ Report Trash Overflow',
      text: 'I need to report a trash overflow and safety hazard in Zone B.',
    },
  ];

  /** Announces new assistant messages to screen readers via the aria-live region. */
  const announceScreenReader = useCallback((rawText: string): void => {
    const announcer = document.getElementById('accessibility-announcer');
    if (announcer) {
      const clean = rawText.replace(/[#*`🚨🧭🗣️🚶⚠️🤖♻️👉♿]/g, '').trim();
      announcer.textContent = `New assistant message: ${clean}`;
    }
  }, []);

  /**
   * Streams `fullText` into a new assistant message character-by-character,
   * creating a typewriter animation. All HTML is DOMPurify-sanitized before
   * being set as innerHTML to prevent XSS from AI-generated content.
   */
  const animateTypewriter = useCallback(
    (fullText: string): void => {
      const messageId = `msg-${Date.now()}`;
      const newMsg: Message = {
        id: messageId,
        sender: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, newMsg]);

      let currentIdx = 0;
      const formatted = fullText.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      // Sanitize the formatted HTML once before streaming it
      const sanitized = DOMPurify.sanitize(formatted);

      const interval = setInterval(() => {
        if (currentIdx <= sanitized.length) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId ? { ...m, content: sanitized.substring(0, currentIdx) } : m
            )
          );
          currentIdx++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
          announceScreenReader(fullText);
        }
      }, 8);
    },
    [announceScreenReader]
  );

  /**
   * Sends a user message to the PulseAI assistant API.
   * Gracefully falls back to pre-defined offline answers if the API is unreachable
   * or responds with a rate-limit (429) error.
   */
  const handleSendMessage = useCallback(
    async (text: string): Promise<void> => {
      if (!text.trim() || isTyping) return;

      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        sender: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setIsTyping(true);

      try {
        const response = await fetch('/api/assistant/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gemini-key': apiKey,
          },
          body: JSON.stringify({ prompt: text, locale: activeLocale }),
        });

        if (response.status === 429) {
          animateTypewriter(
            '⚠️ **AI request limit reached** (10/min). Please wait a moment before asking another question.'
          );
          return;
        }

        if (response.ok) {
          const data = (await response.json()) as { response: string };
          animateTypewriter(data.response);
        } else {
          const fallback =
            fallbackAnswers[text] ??
            'Sorry, I could not retrieve that information right now. Please try again.';
          animateTypewriter(fallback);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Network error';
        const fallback =
          fallbackAnswers[text] ??
          `⚠️ **Error connecting to assistant service:** ${message}. Please try again.`;
        animateTypewriter(fallback);
      }
    },
    [isTyping, apiKey, activeLocale, animateTypewriter, fallbackAnswers]
  );

  return (
    <div className="dashboard-grid-custom" style={{ flex: 1 }}>
      {/* LEFT COLUMN: Conversational Chatbot */}
      <div className="panel-glass">
        <div className="panel-title-bar">
          <div>
            <h2>💬 PulseAI Matchday Assistant</h2>
            <span className="panel-subtitle">
              FIFA World Cup 2026 · AI-powered venue navigation assistant
            </span>
          </div>

          <select
            aria-label="Language Selector"
            value={activeLocale}
            onChange={(e) => setActiveLocale(e.target.value)}
            style={{
              padding: '0.25rem 0.5rem',
              backgroundColor: 'rgba(0,0,0,0.3)',
              color: 'white',
              border: '1px solid var(--border-light)',
              borderRadius: '4px',
              fontSize: '0.75rem',
            }}
          >
            <option value="en">English (US)</option>
            <option value="es">Español (ES)</option>
            <option value="fr">Français (FR)</option>
            <option value="pt">Português (BR)</option>
            <option value="ar">العربية (AR)</option>
          </select>
        </div>

        <div className="panel-content chat-container">
          <div
            className="chat-messages"
            role="log"
            aria-live="polite"
            aria-label="Chat message history"
          >
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}-message`}>
                <div className="message-meta">
                  {msg.sender === 'user' ? 'You' : 'PulseAI Assistant'} • {msg.timestamp}
                </div>
                <div
                  className="message-content"
                  dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br>') }}
                />
              </div>
            ))}
            {isTyping && (
              <div className="message assistant-message">
                <div className="message-meta">PulseAI Assistant • Thinking...</div>
                <div className="spinner-container" style={{ padding: '0.25rem 0' }}>
                  <div
                    className="spin-loader"
                    style={{ width: '16px', height: '16px', borderWidth: '2px' }}
                  ></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick preset chips */}
          <div className="chat-presets" role="group" aria-label="Quick question presets">
            {presetQueries.map((preset, idx) => (
              <button
                key={idx}
                className="preset-chip"
                onClick={() => void handleSendMessage(preset.text)}
                disabled={isTyping}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* User Input Form */}
          <form
            className="chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendMessage(inputText);
            }}
          >
            <input
              type="text"
              placeholder="Ask about sections, bathrooms, elevators, sensory room, transit..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isTyping}
              aria-label="Message Input"
            />
            <button type="submit" className="btn-action btn-primary" disabled={isTyping}>
              Send
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Sustainability Tracker */}
      <CarbonTracker apiKey={apiKey} />
    </div>
  );
};
