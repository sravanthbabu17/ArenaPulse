import { Router, Request, Response } from 'express';
import { callGemini } from '../../lib/gemini.js';
import { queryCache } from '../../lib/cache.js';
import { VENUE_DATASET } from '../stadium/venue.js';
import { config } from '../../config.js';

export const assistantRouter = Router();

/**
 * Localised simulation response dictionary for the most common fan queries.
 * Used as a fallback when the Gemini API is unavailable or not configured.
 */
const dictionary: Record<string, Record<string, string>> = {
  es: {
    medical: "La sala médica principal está en la Sección 102 (Lower Tier).",
    bathroom: "Los baños están cerca de las salidas de la rampa en cada nivel.",
    entrance: "Acceda a la zona norte por la Puerta A, la zona este por la Puerta B.",
    help: "Por favor, acérquese a un voluntario del estadio o al punto médico.",
    exit: "Las salidas de emergencia están señalizadas en todas las rampas del concourse."
  },
  fr: {
    medical: "L'infirmerie principale se trouve à la Section 102 (niveau inférieur).",
    bathroom: "Les toilettes se situent près des rampes de sortie à chaque étage.",
    entrance: "Utilisez la porte A pour la zone Nord, la porte B pour la zone Est.",
    help: "Veuillez contacter un agent de sécurité ou vous rendre au poste médical.",
    exit: "Les issues de secours sont indiquées sur chaque rampe du hall."
  },
  ar: {
    medical: "تقع العيادة الطبية الرئيسية في القسم 102 (المستوى السفلي).",
    bathroom: "توجد دورات المياه بالقرب من مخارج الممرات في كل طابق.",
    entrance: "ادخل من البوابة A للمنطقة الشمالية، ومن البوابة B للمنطقة الشرقية.",
    help: "يرجى التوجه إلى أقرب متطوع أو نقطة إسعافات أولية.",
    exit: "مخارج الطوارئ موجهة بوضوح عبر جميع ممرات الملعب."
  },
  pt: {
    medical: "O posto médico principal fica na Seção 102 (Nível Inferior).",
    bathroom: "Banheiros estão perto das rampas de saída de cada andar.",
    entrance: "Entre pelo Portão A para a Zona Norte e Portão B para a Zona Leste.",
    help: "Por favor, procure um assistente do estádio ou posto de primeiros socorros.",
    exit: "Saídas de emergência estão indicadas em todas as rampas do corredor."
  }
};

/**
 * POST /api/assistant/ask
 * Processes a user question via Gemini AI, grounded on the stadium venue dataset.
 * Responds in the locale specified in the request body.
 * Body: { prompt: string, locale?: string }
 */
assistantRouter.post('/ask', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt, locale } = req.body as { prompt?: unknown; locale?: unknown };
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({ error: "Missing or invalid prompt string in request body." });
      return;
    }

    const lang = (typeof locale === 'string' ? locale : 'en').toLowerCase().substring(0, 2);
    const cacheKey = `ask_${lang}_${prompt.trim().toLowerCase()}`;

    // Check local TTL cache
    const cached = queryCache.get<string>(cacheKey);
    if (cached) {
      res.json({ response: cached, cached: true });
      return;
    }

    let responseText = "";

    if (config.GEMINI_API_KEY) {
      try {
        const venueContext = JSON.stringify(VENUE_DATASET);
        const systemPrompt = `You are "PulseAI", a smart, multilingual GenAI assistant for the FIFA World Cup 2026 stadium companion platform (Estadio Azteca).
You must answer the user's question by grounding your response STRICTLY on the stadium venue dataset below. Do not hallucinate external facilities, gates, or transport.
If the question is outside the scope of the dataset, answer politely that you only have information about Estadio Azteca facilities.
If they mention wheelchairs, prams, strollers, or reduced mobility, prioritize step-free routes, ramp info, and VIP elevators from the dataset.
Always respond in the language corresponding to this language code: "${lang}". Keep responses concise, clear, and structured in Markdown.

Stadium Venue Dataset:
${venueContext}`;

        responseText = await callGemini(prompt, systemPrompt);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.warn("Gemini API call failed, falling back to simulation.", message);
        responseText = `⚠️ **Gemini API Error (Falling back to Simulation mode):** ${message}\n\n` +
          await runSimulation(prompt, lang);
      }
    } else {
      responseText = await runSimulation(prompt, lang);
    }

    // Save to cache
    queryCache.set(cacheKey, responseText);
    res.json({ response: responseText, cached: false });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    console.error("Assistant ask error:", err);
    res.status(500).json({ error: "Internal server error: " + message });
  }
});

/**
 * Simulation fallback: matches the user's query against known venue facts
 * and returns a grounded, localised response without calling Gemini.
 * @param promptText - The user's raw question text.
 * @param lang - ISO 639-1 language code (e.g. 'en', 'es', 'fr').
 */
async function runSimulation(promptText: string, lang: string): Promise<string> {
  await new Promise(resolve => setTimeout(resolve, 800));

  const text = promptText.toLowerCase().trim();
  const dict = dictionary[lang] ?? {};

  // Check translation matches
  if (lang !== 'en') {
    if (text.includes('medic') || text.includes('clin') || text.includes('doctor') || text.includes('aid')) {
      return dict['medical'] ?? `🏥 **Medical Support:** Located in Section 102 (Lower Tier).`;
    }
    if (text.includes('bathroom') || text.includes('restroom') || text.includes('toilet') || text.includes('wc')) {
      return dict['bathroom'] ?? `🚻 **Restrooms:** Located near every concourse ramp.`;
    }
    if (text.includes('gate') || text.includes('entrance') || text.includes('enter')) {
      return dict['entrance'] ?? `🧭 **Entry Reroute:** Enter Gate A for lower sections, Gate B for suites.`;
    }
    if (text.includes('help') || text.includes('assist') || text.includes('lost')) {
      return dict['help'] ?? `🙋 **Assistance:** Please find stadium staff or volunteer booths.`;
    }
    if (text.includes('exit') || text.includes('evacuate') || text.includes('emergency')) {
      return dict['exit'] ?? `🚨 **Emergencies:** Emergency exits are labeled at all gates and ramps.`;
    }
  }

  // Seating and Routes Queries
  if (text.includes('route') || text.includes('sector') || text.includes('section') || text.includes('find') || text.includes('go to')) {
    if (text.includes('wheelchair') || text.includes('stroller') || text.includes('mobility') || text.includes('pram') || text.includes('elevator')) {
      return `♿ **Accessibility Step-Free Route (Estadio Azteca Grounding):**
To reach your seat with step-free access:
1. Enter via **Gate A (North)** or **Gate C (South)**, which feature dedicated access ramps.
2. If seated in the upper suites or VIP zones, use the **West VIP Lobby Elevators** or **East Concourse Elevators**.
3. Accessible family restrooms are located next to Sections 105, 215, and 325.`;
    }

    if (text.includes('102') || text.includes('100') || text.includes('lower')) {
      return `🧭 **Route Guidance:**
* Seating Stand: **Lower Tier (Sections 100-150)**
* Recommended Entrance: **Gate A (North)**
* Adjacent Amenities: Central First Aid Clinic at Section 102.`;
    }
    if (text.includes('212') || text.includes('200') || text.includes('suite') || text.includes('middle')) {
      return `🧭 **Route Guidance:**
* Seating Stand: **Middle Tier / Suites (Sections 200-290)**
* Recommended Entrance: **Gate B (East)**
* Adjacent Amenities: Sensory Quiet Room is located at **Section 212** (Middle Tier).`;
    }
    return `🧭 **Route Guidance:**
* For Sections 100-199: Enter via **Gate A (North)**.
* For Sections 200-299: Enter via **Gate B (East)**.
* For Sections 300-399: Enter via **Gate C (South)**.
* For Sections 400-499: Enter via **Gate D (West)**.`;
  }

  // Sensory space
  if (text.includes('sensory') || text.includes('quiet') || text.includes('neuro') || text.includes('noise')) {
    return `🗣️ **Sensory Quiet Room Grounded Information:**
Estadio Azteca provides a dedicated **Sensory Room** located at **Section 212 (Middle Tier)**.
* Designed for neurodivergent guests, sensory bags and noise-canceling headphones are available.
* Accessible via **Gate B** and the main concourse elevators.`;
  }

  // Transit Queries
  if (text.includes('transit') || text.includes('metro') || text.includes('shuttle') || text.includes('rideshare') || text.includes('bus') || text.includes('cab') || text.includes('taxi')) {
    return `🚌 **Estadio Azteca Post-Match Transport Grounded Info:**
* **Metro Line 2 (Estadio Azteca Station)**: Located at **Gate A (North)**. Direct boarding, rolling departures every 2.5 minutes.
* **Electric Tournament Shuttles**: Depart from the **North Transit Hub** near Gate A. Continuous rolling services to Downtown and Airport.
* **Rideshare Zone (Uber/Didi/Taxi)**: Located at **Outer Parking Lot E (West Gate D)**. Priority lanes for accessible rides.`;
  }

  // Waste & Recycling
  if (text.includes('trash') || text.includes('overflow') || text.includes('recycle') || text.includes('rubbish') || text.includes('waste')) {
    return `♻️ **Sustainability Incident Logged:**
Thank you for reporting. Clean-up crews are dispatched to **Zone B / Sector 10**.
* Log your recycling action in the **Sustainability Tracker** to receive **150 Green Points** and a 10% concession coupon!`;
  }

  return `👋 **PulseAI Assist (Simulation Mode):**
I'm here to support your World Cup experience at Estadio Azteca. You can ask me:
* "What is the fastest route to Sector 4?"
* "Translate 'Where is the bathroom' to Arabic"
* "How do I catch the post-match shuttle?"
* "Where is the sensory room?"
\n*(Configuring a live server GEMINI_API_KEY unlocks real-time AI responses)*`;
}
