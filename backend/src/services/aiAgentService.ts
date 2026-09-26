import { DbStore } from './dbStore.js';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIAgentService {
  private static instance: AIAgentService;
  private groqApiKey: string = process.env.GROQ_API_KEY || '';

  private constructor() {}

  public static getInstance(): AIAgentService {
    if (!AIAgentService.instance) {
      AIAgentService.instance = new AIAgentService();
    }
    return AIAgentService.instance;
  }

  public setApiKey(key: string) {
    this.groqApiKey = key.trim();
  }

  public getApiKeyStatus(): { configured: boolean; maskedKey?: string } {
    const key = this.groqApiKey || process.env.GROQ_API_KEY || '';
    if (!key) return { configured: false };
    return {
      configured: true,
      maskedKey: `${key.slice(0, 4)}...${key.slice(-4)}`
    };
  }

  /**
   * Builds real-time polar telemetry context string from the database store
   */
  private async buildSystemTelemetryContext(): Promise<string> {
    const store = DbStore.getInstance();
    const stations = await store.getStations();
    const simState = store.getSimulationState();
    const satState = store.getSatelliteState();
    const inventory = await store.getInventory();
    const routes = await store.getRouteLegs();
    const incidents = await store.getIncidents();

    const criticalItems = inventory.filter((i) => i.critical_alert);
    const activeRoutes = routes.filter((r) => r.status === 'in_transit');

    return `
SYSTEM OPERATIONAL CONTEXT (LIVE TELEMETRY):
- Mission: 44th Indian Scientific Expedition to Antarctica (ISEA)
- Current Expedition Day: ${Math.floor(simState.expedition_day)} / ${simState.total_days}
- Satellite Link: ${satState.status.toUpperCase()} (${satState.bandwidth_kbps} kbps via ${satState.constellation})
- Blizzard Status: ${simState.is_blizzard_active ? 'ACTIVE CODE-RED KATABATIC BLIZZARD' : 'NORMAL (Advisory Winds)'}

STATIONS:
1. Maitri (Inland Schirmacher Oasis, 70°45'S, 11°43'E):
   - Weather: Temp ${stations.find((s) => s.id === 'maitri')?.weather.temp_c}°C, Wind ${stations.find((s) => s.id === 'maitri')?.weather.wind_speed_kt} kt ${stations.find((s) => s.id === 'maitri')?.weather.wind_dir} (${stations.find((s) => s.id === 'maitri')?.weather.condition})
   - Runway: Novolazarevskaya Blue-Ice Runway (ALCI / DROMLAN hub - 15 km)
2. Bharati (Coastal Larsemann Hills, 69°24'S, 76°11'E):
   - Weather: Temp ${stations.find((s) => s.id === 'bharati')?.weather.temp_c}°C, Wind ${stations.find((s) => s.id === 'bharati')?.weather.wind_speed_kt} kt ${stations.find((s) => s.id === 'bharati')?.weather.wind_dir}
   - Wharf: Fast-ice wharf & helipad (Prydz Bay)

KEY POLAR CONSTRAINTS TO STRICTLY ADHERE TO:
- AIR ROUTING: There is NO DIRECT CAPE TOWN TO BHARATI FLIGHT. Air cargo/personnel must stage via Maitri and execute a mandatory refueling stop at the intermediate polar skiway fuel cache (70.2°S, 42.0°E).
- AIRCRAFT LIMITS: Basler BT-67 ski landing payload limit is 2,500 kg. Twin Otter payload limit is 1,400 kg. Overweight shipments must be split into multi-sortie flights or dispatched by ship.
- RESUPPLY WINDOW: Austral Summer shipping window is strictly November through March. Next resupply window begins Nov 15 (~140 days away). Any station item with < 140 days of stock is in critical winter lock-in danger.
- CRITICAL INVENTORY DEFICITS: ${criticalItems.length > 0 ? criticalItems.map((c) => `${c.item_name} at ${c.station_name} (${c.days_until_depletion} days left)`).join(', ') : 'None, reserves currently secure'}.
- ACTIVE TRANSITS: ${activeRoutes.map((r) => `${r.vehicle_name} (${r.name}, ${r.current_progress_pct}% progress)`).join('; ')}.
- ACTIVE INCIDENTS: ${incidents.filter((i) => i.status === 'active').length} active incidents.
`;
  }

  public async chat(
    messages: ChatMessage[],
    clientKey?: string
  ): Promise<{ response: string; model: string; source: 'groq' | 'simulated' }> {
    const rawKey = (clientKey || this.groqApiKey || process.env.GROQ_API_KEY || '').trim();
    const key = rawKey.replace(/^["']|["']$/g, '').trim();
    const telemetryContext = await this.buildSystemTelemetryContext();

    const systemPrompt = `You are "HIMVEER" (हिमवीर), the Tactical AI Logistics & Operations Co-Pilot for the Indian Antarctic Expeditions, operated by the National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences (MoES), Government of India.

Your duty is to provide authoritative, mathematically sound, and operationally realistic advice to Expedition Leaders, Logistics Officers, and Station Commanders across Maitri and Bharati.

${telemetryContext}

GUIDELINES FOR RESPONSES:
- Adopt a calm, authoritative, mission-control tone ("Polar Operations Console style").
- Always cite exact numbers, coordinates (e.g. 70.2°S 42.0°E), aircraft models (Basler BT-67, Twin Otter, IL-76), and vessel details (MV Vasiliy Golovnin).
- If asked about routing to Bharati, always emphasize that Cape Town-Bharati direct air flights are impossible and explain the Maitri staging & skiway refuel requirement.
- If asked about cargo exceeding 2,500 kg, suggest multi-sortie splitting or sea hold allocation.
- If asked about emergencies or MEDEVAC, provide structured operational directives (triage, flight corridor, HF radio 8.291 MHz, Cape Town hospital divert).
- FORMATTING: Use clean GitHub-flavored Markdown tables. NEVER insert literal '<br>' tags inside table cells; keep text clean and readable. Use bold text for key metrics.

CONSOLE CONTROL DIRECTIVES:
You have direct operational control over this console application.
If the user asks you to take an action, trigger an event, change speed, navigate the console, or enact rationing, append an action block at the very end of your response:
\`\`\`action
{
  "action": "TRIGGER_BLIZZARD" | "CLEAR_BLIZZARD" | "TRIGGER_BLACKOUT" | "RESTORE_SATELLITE" | "SET_TIME_WARP" | "NAVIGATE_TAB" | "ENACT_RATIONING" | "TRIGGER_EMERGENCY",
  "params": { ... }
}
\`\`\`
Examples:
- User asks to inject blizzard: \`\`\`action\n{ "action": "TRIGGER_BLIZZARD", "params": { "active": true } }\n\`\`\`
- User asks to open map / cargo / inventory: \`\`\`action\n{ "action": "NAVIGATE_TAB", "params": { "tab": "map" } }\n\`\`\`
- User asks to speed up simulation: \`\`\`action\n{ "action": "SET_TIME_WARP", "params": { "warp": 60 } }\n\`\`\`
- User asks to enact fuel rationing: \`\`\`action\n{ "action": "ENACT_RATIONING", "params": { "itemId": "inv-mai-01" } }\n\`\`\`
`;

    // If Groq API key is provided, call Groq API
    if (key) {
      try {
        const payload = {
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          temperature: 0.3,
          max_tokens: 1024
        };

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errData = (await response.json().catch(() => ({}))) as any;
          throw new Error(errData.error?.message || `Groq API returned HTTP ${response.status}`);
        }

        const data = (await response.json()) as any;
        const content = data.choices?.[0]?.message?.content || 'No response generated from Groq.';
        return {
          response: content,
          model: 'Groq (openai/gpt-oss-120b)',
          source: 'groq'
        };
      } catch (err: any) {
        console.error('[AIAgentService] Groq API Error:', err.message);
        // Fall back to rule-based contextual generator if call fails
        const fallback = this.generateFallbackResponse(messages[messages.length - 1]?.content || '', telemetryContext, err.message);
        return {
          response: fallback,
          model: 'Polar Tactical Fallback Engine (Groq connection error)',
          source: 'simulated'
        };
      }
    }

    // No API key provided: Return rich polar domain response with prompt to integrate Groq key
    const userMsg = messages[messages.length - 1]?.content || '';
    const fallbackResponse = this.generateFallbackResponse(userMsg, telemetryContext);
    return {
      response: fallbackResponse,
      model: 'HIMVEER Polar Tactical Engine (Simulated Mode)',
      source: 'simulated'
    };
  }

  private generateFallbackResponse(userMsg: string, telemetry: string, errorNote?: string): string {
    const q = userMsg.toLowerCase();

    let body = '';
    if (q.includes('fuel') || q.includes('diesel') || q.includes('resupply') || q.includes('burn')) {
      body = `### ❄️ Polar Fuel & Resupply Analysis (Day 142/450)

**1. Current Inventory State:**
- **Maitri Station**: 58,000 L Arctic-grade diesel remaining (Daily burn: 340 L/day). Projected depletion: **170 Days**.
- **Bharati Station**: 84,000 L Arctic-grade diesel remaining (Daily burn: 420 L/day). Projected depletion: **200 Days**.
- **Aviation Jet A-1 at Maitri**: 12,400 L remaining (Burn: 110 L/day) $\\to$ **112 Days remaining** (**CRITICAL WARNING**: May deplete before the Nov 15 Austral shipping window!).

**2. Tactical Recommendations:**
- **Enact Level-2 Heating Rationing** at Maitri immediately (cuts consumption by 22%, saving ~75 L/day).
- Pre-position an emergency air transfer of 3,500 L Jet A-1 from Bharati via the **70.2°S, 42.0°E Skiway Fuel Depot** using the Basler BT-67 before winter freeze.`;
    } else if (q.includes('route') || q.includes('dispatch') || q.includes('bharati') || q.includes('cargo') || q.includes('weight')) {
      body = `### ✈️ Tactical Multi-Modal Dispatch Recommendation

**1. Real-World Constraint Verification:**
- **NO Direct Flight Cape Town $\\to$ Bharati**: Distance (>6,800 km) exceeds polar utility flight envelopes.
- **Mandatory Air Route Corridor**: Cape Town (FACT) $\\to$ Maitri / Novolazarevskaya Blue-Ice Runway (4,200 km) $\\to$ Intermediate Skiway Fuel Depot (70.2°S, 42.0°E) $\\to$ Bharati Station (Prydz Bay). Total: **15.0 Hours**.

**2. Payload Feasibility Analysis:**
- **Basler BT-67 Ceiling**: 2,500 kg maximum ski landing limit.
- **Twin Otter Ceiling**: 1,400 kg maximum ski landing limit.
- If cargo exceeds 2,500 kg, dispatch via **MV Vasiliy Golovnin** icebreaker cargo hold (transit time 10-14 days depending on sea-ice severity) or authorize a **Dual Basler Sortie**.`;
    } else if (q.includes('emergency') || q.includes('medevac') || q.includes('blizzard') || q.includes('injury')) {
      body = `### 🚨 MoES / NCPOR Emergency Crisis Protocol

**1. Incident Assessment & Transport Feasibility:**
- **Corridor Check**: If Katabatic winds exceed 45 kt or visibility < 200m, air evacuation is grounded until weather window clears.
- **MEDEVAC Staging**: Mobilize Basler BT-67 (ICU configured) at Novolazarevskaya/Maitri skiway.
- **Evacuation Route**: Station $\\to$ Novo Blue-Ice Runway $\\to$ Christiaan Barnard Memorial Hospital / Netcare ICU (Cape Town). ETA: **7.0 - 16.5 Hours**.

**2. Immediate Communications Protocol:**
- Enforce emergency radio silence on **HF 8.291 MHz USB**.
- Activate Iridium SatPhone SAR Channel: \`+8816-3184-9022\`.
- Generate MoES clearance code for Indian Armed Forces & ALCI logistical clearance.`;
    } else {
      body = `### 🛰️ Tactical Operations Briefing — 44th ISEA

**HIMVEER Co-Pilot Telemetry Status:**
- **Current Polar Expedition Day**: 142 / 450 (Winter-Over Phase Active)
- **Maitri Status**: -19°C, 28 kt ESE winds. Schirmacher Oasis seismic array operational.
- **Bharati Status**: -14°C, 18 kt NE winds. Larsemann Hills wharf ice-pack clear for sea operations.
- **Active Maritime Transit**: *MV Vasiliy Golovnin* at 54.0°S, 14.5°E sailing Southern Ocean Roaring Forties towards Maitri Shelf.
- **Active Air Transit**: *Basler BT-67 (Polar Star 1)* mid-way at 70.2°S, 42.0°E refueling skiway depot.

How may I assist your expedition command decisions (Logistics Optimization, Resupply Forecasting, or SAR Protocols)?`;
    }

    let footer = '';
    if (errorNote) {
      footer = `\n\n> ⚠️ *Note: Groq API call encountered: ${errorNote}. Displaying tactical fallback knowledge base.*`;
    } else if (!this.groqApiKey) {
      footer = `\n\n> 💡 *Tip: To activate live ultra-fast LLaMA-3.3-70B inference via Groq, enter your Groq API Key in the AI Settings modal or set \`GROQ_API_KEY\` in \`backend/.env\`.*`;
    }

    return body + footer;
  }
}
