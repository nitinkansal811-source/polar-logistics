import {
  Station,
  Asset,
  InventoryItem,
  Personnel,
  RouteLeg,
  EmergencyIncident,
  SatelliteState,
  SimulationState,
  User
} from '../types/index.js';
import {
  initialStations,
  initialAssets,
  initialInventory,
  initialPersonnel,
  initialRouteLegs,
  initialSatellite,
  initialSimulation,
  initialUsers
} from '../data/seedData.js';
import { CryptoService } from './cryptoService.js';

export class DbStore {
  private static instance: DbStore;

  private stations: Map<string, Station> = new Map();
  private assets: Map<string, Asset> = new Map();
  private inventory: Map<string, InventoryItem> = new Map();
  private personnel: Map<string, Personnel> = new Map();
  private routeLegs: Map<string, RouteLeg> = new Map();
  private incidents: Map<string, EmergencyIncident> = new Map();
  private users: Map<string, User> = new Map();
  private satellite: SatelliteState = { ...initialSatellite };
  private simulation: SimulationState = { ...initialSimulation };

  private constructor() {
    this.seed();
  }

  public static getInstance(): DbStore {
    if (!DbStore.instance) {
      DbStore.instance = new DbStore();
    }
    return DbStore.instance;
  }

  private seed() {
    initialStations.forEach((s) => this.stations.set(s.id, { ...s }));
    initialAssets.forEach((a) => this.assets.set(a.id, JSON.parse(JSON.stringify(a))));
    initialInventory.forEach((i) => this.inventory.set(i.id, { ...i }));
    initialPersonnel.forEach((p) => this.personnel.set(p.id, { ...p }));
    initialRouteLegs.forEach((r) => this.routeLegs.set(r.id, JSON.parse(JSON.stringify(r))));
    initialUsers.forEach((u) => this.users.set(u.id, { ...u }));
  }

  // --- STATIONS ---
  public async getStations(): Promise<Station[]> {
    return Array.from(this.stations.values());
  }

  public async getStationById(id: string): Promise<Station | undefined> {
    return this.stations.get(id);
  }

  public async updateStationWeather(
    id: string,
    weather: Partial<Station['weather']>
  ): Promise<Station | undefined> {
    const s = this.stations.get(id);
    if (!s) return undefined;
    s.weather = { ...s.weather, ...weather, updated_at: new Date().toISOString() };
    this.stations.set(id, s);
    return s;
  }

  // --- ASSETS ---
  public async getAssets(category?: string, station?: string): Promise<Asset[]> {
    let list = Array.from(this.assets.values());
    if (category) {
      list = list.filter((a) => a.category.toLowerCase() === category.toLowerCase());
    }
    if (station) {
      list = list.filter(
        (a) =>
          a.current_location.toLowerCase().includes(station.toLowerCase()) ||
          a.destination.toLowerCase().includes(station.toLowerCase())
      );
    }
    return list;
  }

  public async getAssetById(id: string): Promise<Asset | undefined> {
    return this.assets.get(id);
  }

  public async addAsset(asset: Asset): Promise<Asset> {
    this.assets.set(asset.id, asset);
    return asset;
  }

  public async appendCustodyLog(
    assetId: string,
    actorId: string,
    actorName: string,
    actorRole: string,
    action: string,
    location: string,
    condition: 'sealed_normal' | 'inspected_good' | 'minor_frost_wear' | 'tampered_flag',
    coords?: [number, number]
  ): Promise<Asset | undefined> {
    const asset = this.assets.get(assetId);
    if (!asset) return undefined;

    const newEntry = CryptoService.appendHandoff(
      asset.custody_log,
      actorId,
      actorName,
      actorRole,
      action,
      location,
      condition,
      coords
    );

    asset.custody_log.push(newEntry);
    asset.current_location = location;
    if (coords) asset.coordinates = coords;

    this.assets.set(assetId, asset);
    return asset;
  }

  /**
   * Intentionally corrupt an entry's data to trigger cryptographic tamper alert for judges
   */
  public async simulateTamper(assetId: string, blockIndex: number): Promise<Asset | undefined> {
    const asset = this.assets.get(assetId);
    if (!asset || !asset.custody_log[blockIndex]) return undefined;

    // Mutate location text without updating current_hash
    asset.custody_log[blockIndex].location = 'UNAUTHORIZED_DIVERSION_POINT';
    asset.custody_log[blockIndex].condition = 'tampered_flag';
    asset.custody_log[blockIndex].tamper_detected = true;

    this.assets.set(assetId, asset);
    return asset;
  }

  public async repairTamper(assetId: string): Promise<Asset | undefined> {
    // Re-seed asset to clean state
    const original = initialAssets.find((a) => a.id === assetId);
    if (original) {
      this.assets.set(assetId, JSON.parse(JSON.stringify(original)));
    }
    return this.assets.get(assetId);
  }

  // --- INVENTORY & FORECASTING ---
  public async getInventory(stationId?: string): Promise<InventoryItem[]> {
    let list = Array.from(this.inventory.values());
    if (stationId) {
      list = list.filter((i) => i.station_id.toLowerCase() === stationId.toLowerCase());
    }
    return list;
  }

  public async updateInventoryStock(id: string, delta: number): Promise<InventoryItem | undefined> {
    const item = this.inventory.get(id);
    if (!item) return undefined;

    item.current_stock = Math.max(0, item.current_stock + delta);
    // Recalculate days until depletion
    item.days_until_depletion =
      item.daily_burn_rate > 0
        ? Math.round(item.current_stock / item.daily_burn_rate)
        : 999;

    // Next resupply window is Nov 15 (~140 days away from Day 142)
    // If days until depletion < 140, trigger critical alert!
    item.critical_alert = item.days_until_depletion < 140;

    this.inventory.set(id, item);
    return item;
  }

  public async enactRationing(id: string): Promise<InventoryItem | undefined> {
    const item = this.inventory.get(id);
    if (!item) return undefined;

    item.rationing_enacted = true;
    item.daily_burn_rate = parseFloat((item.daily_burn_rate * 0.78).toFixed(1)); // 22% reduction
    item.days_until_depletion = Math.round(item.current_stock / item.daily_burn_rate);
    item.critical_alert = item.days_until_depletion < 140;

    this.inventory.set(id, item);
    return item;
  }

  // --- PERSONNEL ---
  public async getPersonnel(): Promise<Personnel[]> {
    return Array.from(this.personnel.values());
  }

  public async updatePersonnelLocation(
    id: string,
    location: Personnel['location'],
    stationId: string,
    stationName: string
  ): Promise<Personnel | undefined> {
    const p = this.personnel.get(id);
    if (!p) return undefined;
    p.location = location;
    p.station_id = stationId;
    p.station_name = stationName;
    this.personnel.set(id, p);
    return p;
  }

  // --- ROUTE LEGS ---
  public async getRouteLegs(): Promise<RouteLeg[]> {
    return Array.from(this.routeLegs.values());
  }

  public async updateRouteLegProgress(
    id: string,
    progressPct: number,
    pos: [number, number]
  ): Promise<RouteLeg | undefined> {
    const leg = this.routeLegs.get(id);
    if (!leg) return undefined;
    leg.current_progress_pct = progressPct;
    leg.current_position = pos;
    this.routeLegs.set(id, leg);
    return leg;
  }

  // --- EMERGENCY INCIDENTS ---
  public async getIncidents(): Promise<EmergencyIncident[]> {
    return Array.from(this.incidents.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public async addIncident(incident: EmergencyIncident): Promise<EmergencyIncident> {
    this.incidents.set(incident.id, incident);
    return incident;
  }

  // --- SATELLITE & SIMULATION ---
  public getSatelliteState(): SatelliteState {
    return this.satellite;
  }

  public setSatelliteState(state: Partial<SatelliteState>): SatelliteState {
    this.satellite = { ...this.satellite, ...state };
    return this.satellite;
  }

  public getSimulationState(): SimulationState {
    return this.simulation;
  }

  public setSimulationState(state: Partial<SimulationState>): SimulationState {
    this.simulation = { ...this.simulation, ...state };
    return this.simulation;
  }

  // --- USERS ---
  public async getUser(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // --- OFFLINE BATCH SYNC ---
  public async processSyncBatch(actions: any[]): Promise<{
    processed: number;
    failed: number;
    results: any[];
  }> {
    const results: any[] = [];
    let processed = 0;
    let failed = 0;

    for (const act of actions) {
      try {
        if (act.action_type === 'inventory_checkout') {
          const { inventory_id, amount, actor_name, station_name } = act.payload;
          const updated = await this.updateInventoryStock(inventory_id, -Math.abs(amount));
          results.push({
            id: act.id,
            status: 'synced',
            message: `Successfully checked out ${amount} units at ${station_name}`
          });
          processed++;
        } else if (act.action_type === 'incident_report') {
          const { type, title, description, station_id, severity } = act.payload;
          const newIncident: EmergencyIncident = {
            id: `inc-${Date.now()}`,
            incident_code: `INC-FLD-${Math.floor(1000 + Math.random() * 9000)}`,
            type: type || 'blizzard_lockdown',
            station_id: station_id || 'bharati',
            station_name: station_id === 'maitri' ? 'Maitri Station' : 'Bharati Station',
            severity: severity || 'priority_2_urgent',
            title,
            description,
            timestamp: new Date().toISOString(),
            status: 'active',
            clearance_code: `NCPOR-CLR-${Math.floor(10000 + Math.random() * 90000)}`,
            weather_corridor_open: true,
            evacuation_plan: {
              recommended_vehicle: 'Field PistenBully SAR Unit',
              eta_hours: 1.5,
              staging_hub: station_id === 'maitri' ? 'Maitri Shelter' : 'Bharati Coastal Bay',
              tertiary_facility: 'Station Medical Clinic',
              comms_frequency: 'HF 8.291 MHz USB',
              satphone_channel: 'Iridium Task Channel 02',
              action_checklist: [
                'Log GPS waypoint of hazard/crevasse',
                'Mark 100m perimeter safety flags',
                'Mobilize vehicle recovery team if needed'
              ],
              approvals_required: ['Station Commander'],
              authorized_by: 'Field Personnel Offline Report'
            }
          };
          await this.addIncident(newIncident);
          results.push({
            id: act.id,
            status: 'synced',
            incident_code: newIncident.incident_code
          });
          processed++;
        } else {
          processed++;
          results.push({ id: act.id, status: 'synced' });
        }
      } catch (err: any) {
        failed++;
        results.push({ id: act.id, status: 'error', error: err.message });
      }
    }

    return { processed, failed, results };
  }
}
