const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}/api${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status} at ${endpoint}`);
  }
  return res.json() as Promise<T>;
}

// API methods
export const api = {
  // Auth
  login: (role: string) => fetchApi<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ role }) }),
  getDemoUsers: () => fetchApi<{ users: any[] }>('/auth/users'),

  // Stations
  getStations: () => fetchApi<{ stations: any[] }>('/stations'),

  // Assets & Custody
  getAssets: (category?: string, station?: string) => {
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (station) query.set('station', station);
    return fetchApi<{ assets: any[]; count: number }>(`/assets?${query.toString()}`);
  },
  getAssetById: (id: string) => fetchApi<{ asset: any; integrity: any }>(`/assets/${id}`),
  createAsset: (assetData: any) => fetchApi<{ asset: any }>('/assets', { method: 'POST', body: JSON.stringify(assetData) }),
  appendCustodyHandoff: (id: string, handoffData: any) =>
    fetchApi<{ asset: any; integrity: any }>(`/assets/${id}/custody`, { method: 'POST', body: JSON.stringify(handoffData) }),
  simulateTamper: (id: string, blockIndex: number = 0) =>
    fetchApi<{ message: string; asset: any; integrity: any }>(`/assets/${id}/tamper`, { method: 'POST', body: JSON.stringify({ block_index: blockIndex }) }),
  repairTamper: (id: string) =>
    fetchApi<{ message: string; asset: any; integrity: any }>(`/assets/${id}/repair`, { method: 'POST' }),

  // Inventory & Forecasting
  getInventory: (stationId?: string) => {
    const query = stationId ? `?stationId=${stationId}` : '';
    return fetchApi<{ inventory: any[]; count: number }>(`/inventory${query}`);
  },
  getStationInventory: (stationId: string) => fetchApi<{ station_id: string; inventory: any[] }>(`/inventory/${stationId}`),
  getResupplyForecast: (stationId: string) => fetchApi<any>(`/inventory/${stationId}/forecast`),
  enactRationing: (id: string) => fetchApi<{ message: string; item: any }>(`/inventory/${id}/ration`, { method: 'POST' }),

  // Personnel
  getPersonnel: (stationId?: string, location?: string) => {
    const query = new URLSearchParams();
    if (stationId) query.set('stationId', stationId);
    if (location) query.set('location', location);
    return fetchApi<{ personnel: any[]; count: number }>(`/personnel?${query.toString()}`);
  },
  updatePersonnelLocation: (id: string, data: any) =>
    fetchApi<{ personnel: any }>(`/personnel/${id}/location`, { method: 'PATCH', body: JSON.stringify(data) }),
  getBloodDonors: (bloodGroup: string, stationId?: string) => {
    const query = stationId ? `?stationId=${stationId}` : '';
    return fetchApi<any>(`/personnel/donors/${bloodGroup}${query}`);
  },
  getPersonnelSummary: () => fetchApi<any>('/personnel/summary'),

  // Routes & Optimization
  getRoutes: () => fetchApi<{ legs: any[] }>('/routes'),
  recommendRoute: (params: { origin: string; destination: string; weight: number; category: string; urgency: string; sea_ice: string }) => {
    const query = new URLSearchParams();
    query.set('origin', params.origin);
    query.set('destination', params.destination);
    query.set('weight', params.weight.toString());
    query.set('category', params.category);
    query.set('urgency', params.urgency);
    query.set('sea_ice', params.sea_ice);
    return fetchApi<{ recommendation: any }>(`/routes/recommend?${query.toString()}`);
  },

  // Emergency
  getIncidents: () => fetchApi<{ incidents: any[]; count: number }>('/emergency'),
  triggerEmergency: (data: { type: string; station_id: string; notes?: string }) =>
    fetchApi<{ message: string; incident: any }>('/emergency/trigger', { method: 'POST', body: JSON.stringify(data) }),

  // Offline Sync
  batchSync: (actions: any[]) => fetchApi<any>('/sync/batch', { method: 'POST', body: JSON.stringify({ actions }) }),

  // Simulation controls
  getSimulationState: () => fetchApi<{ simulation: any; satellite: any }>('/simulation/state'),
  setTimeWarp: (warp: number) => fetchApi<{ message: string; simulation: any }>('/simulation/time-warp', { method: 'POST', body: JSON.stringify({ warp }) }),
  triggerBlizzard: (active: boolean) => fetchApi<{ message: string; simulation: any }>('/simulation/blizzard', { method: 'POST', body: JSON.stringify({ active }) }),
  triggerSatelliteBlackout: (blackout: boolean) => fetchApi<{ message: string; satellite: any }>('/simulation/satellite-blackout', { method: 'POST', body: JSON.stringify({ blackout }) }),
  toggleSatellite: () => fetchApi<{ satellite: any }>('/simulation/toggle-satellite', { method: 'POST' }),

  // AI Tactical Agent (Groq Powered)
  aiChat: (messages: { role: string; content: string }[], apiKey?: string) =>
    fetchApi<{ response: string; model: string; source: 'groq' | 'simulated' }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, api_key: apiKey })
    }),
  getAiStatus: () => fetchApi<{ configured: boolean; maskedKey?: string }>('/ai/status'),
  setAiConfig: (apiKey: string) =>
    fetchApi<{ message: string; configured: boolean; maskedKey?: string }>('/ai/config', {
      method: 'POST',
      body: JSON.stringify({ api_key: apiKey })
    })
};
