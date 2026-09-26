export type UserRole =
  | 'expedition_lead'
  | 'logistics_officer'
  | 'medical_officer'
  | 'station_personnel'
  | 'ncpor_hq';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  station_id: string;
  badge_number: string;
}

export interface Station {
  id: string;
  name: string;
  code: string;
  coordinates: [number, number]; // [lat, lng]
  type: 'inland_station' | 'coastal_station' | 'staging_port' | 'headquarters';
  elevation_m: number;
  runway_type: string;
  weather: {
    temp_c: number;
    wind_speed_kt: number;
    wind_dir: string;
    condition: string;
    blizzard_warning: boolean;
    updated_at: string;
  };
  occupancy_current: number;
  occupancy_capacity: number;
}

export interface CustodyLogEntry {
  index: number;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  location: string;
  coordinates?: [number, number];
  condition: 'sealed_normal' | 'inspected_good' | 'minor_frost_wear' | 'tampered_flag';
  prev_hash: string;
  current_hash: string;
  tamper_detected?: boolean;
}

export type AssetCategory =
  | 'fuel'
  | 'food'
  | 'scientific-equipment'
  | 'medical'
  | 'spares';

export interface Asset {
  id: string;
  code: string;
  name: string;
  category: AssetCategory;
  weight_kg: number;
  volume_m3: number;
  origin: string;
  destination: string;
  current_location: string;
  coordinates: [number, number];
  status: 'stored' | 'in_transit' | 'delivered' | 'quarantined';
  priority: 'routine' | 'critical' | 'emergency';
  temperature_sensitive: boolean;
  min_temp_c?: number;
  custody_log: CustodyLogEntry[];
}

export interface InventoryItem {
  id: string;
  station_id: string;
  station_name: string;
  item_name: string;
  category: AssetCategory;
  current_stock: number;
  unit: string;
  daily_burn_rate: number;
  min_threshold: number;
  max_capacity: number;
  days_until_depletion: number;
  critical_alert: boolean;
  resupply_deadline: string;
  rationing_enacted: boolean;
}

export type BloodGroup = 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';

export interface Personnel {
  id: string;
  code: string;
  name: string;
  role: UserRole;
  designation: string;
  station_id: string;
  station_name: string;
  location: 'Bharati' | 'Maitri' | 'MV Vasiliy Golovnin' | 'Cape Town Hub' | 'NCPOR Goa';
  days_in_post: number;
  max_post_days: number;
  winter_over_status: 'summer_influx' | 'winter_over_active' | 'demobilization_ready';
  medical_fitness: 'fit' | 'restricted' | 'critical';
  blood_group: BloodGroup;
  emergency_donor_eligible: boolean;
  polar_night_days: number;
  readiness_score: number; // 0 - 100
  rotation_batch: string;
}

export interface RouteLeg {
  id: string;
  name: string;
  mode: 'air' | 'sea';
  origin: string;
  destination: string;
  distance_km: number;
  transit_time_hrs: number;
  waypoints: [number, number][];
  current_progress_pct: number;
  current_position: [number, number];
  vehicle_name: string;
  cargo_manifest_ids: string[];
  status: 'in_transit' | 'docked' | 'delayed' | 'scheduled';
  sea_ice_severity: 'Low (0-20%)' | 'Moderate (30-50%)' | 'Severe Pack Ice (70-90%)';
}

export interface RouteRecommendation {
  recommended_mode: 'air' | 'sea' | 'split';
  summary: string;
  total_distance_km: number;
  total_transit_hours: number;
  estimated_cost_inr: number;
  carbon_footprint_kg: number;
  weather_risk_score: number; // 1-10
  maitri_stopover_required: boolean;
  payload_limit_warning?: string;
  legs_breakdown: {
    leg_name: string;
    mode: 'air' | 'sea';
    from: string;
    to: string;
    distance_km: number;
    hours: number;
    notes: string;
  }[];
  cargo_split_proposal?: {
    aircraft_sortie_1_kg: number;
    aircraft_sortie_2_kg: number;
    sea_overflow_kg: number;
    rationale: string;
  };
}

export interface EmergencyIncident {
  id: string;
  incident_code: string;
  type: 'medical_evacuation' | 'blizzard_lockdown' | 'fuel_rupture';
  station_id: string;
  station_name: string;
  severity: 'priority_1_critical' | 'priority_2_urgent' | 'priority_3_elevated';
  title: string;
  description: string;
  timestamp: string;
  status: 'active' | 'response_enacted' | 'resolved';
  clearance_code: string;
  weather_corridor_open: boolean;
  evacuation_plan: {
    recommended_vehicle: string;
    eta_hours: number;
    staging_hub: string;
    tertiary_facility: string;
    comms_frequency: string;
    satphone_channel: string;
    action_checklist: string[];
    approvals_required: string[];
    authorized_by: string;
  };
}

export interface SatelliteState {
  status: 'active' | 'closed';
  bandwidth_kbps: number;
  latency_ms: number;
  last_window_sync: string;
  next_window_time: string;
  signal_strength_pct: number;
  constellation: string;
}

export interface SimulationState {
  time_warp: 1 | 10 | 60;
  is_blizzard_active: boolean;
  is_satellite_blackout: boolean;
  simulated_date: string;
  expedition_day: number;
  total_days: number;
}
