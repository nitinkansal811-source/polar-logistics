import {
  Station,
  Asset,
  InventoryItem,
  Personnel,
  RouteLeg,
  User,
  SatelliteState,
  SimulationState
} from '../types/index.js';
import { CryptoService } from '../services/cryptoService.js';

export const initialStations: Station[] = [
  {
    id: 'maitri',
    name: 'Maitri Station',
    code: 'MAI-01',
    coordinates: [-70.7667, 11.7333],
    type: 'inland_station',
    elevation_m: 130,
    runway_type: 'Blue-Ice Runway (Novolazarevskaya Staging - 15 km)',
    weather: {
      temp_c: -19,
      wind_speed_kt: 28,
      wind_dir: 'ESE',
      condition: 'Blowing Snow / Katabatic Advisory',
      blizzard_warning: false,
      updated_at: new Date().toISOString()
    },
    occupancy_current: 24,
    occupancy_capacity: 35
  },
  {
    id: 'bharati',
    name: 'Bharati Station',
    code: 'BHA-02',
    coordinates: [-69.4078, 76.1872],
    type: 'coastal_station',
    elevation_m: 35,
    runway_type: 'Fast-Ice Skiway + Helipads (Prydz Bay)',
    weather: {
      temp_c: -14,
      wind_speed_kt: 18,
      wind_dir: 'NE',
      condition: 'Overcast, Low Sea Ice Visibility',
      blizzard_warning: false,
      updated_at: new Date().toISOString()
    },
    occupancy_current: 28,
    occupancy_capacity: 45
  },
  {
    id: 'cape_town',
    name: 'Cape Town Logistics Hub',
    code: 'CPT-HUB',
    coordinates: [-33.9249, 18.4241],
    type: 'staging_port',
    elevation_m: 12,
    runway_type: 'Cape Town International (FACT)',
    weather: {
      temp_c: 18,
      wind_speed_kt: 12,
      wind_dir: 'S',
      condition: 'Clear Coastal Skies',
      blizzard_warning: false,
      updated_at: new Date().toISOString()
    },
    occupancy_current: 16,
    occupancy_capacity: 100
  },
  {
    id: 'goa_hq',
    name: 'NCPOR Headquarters (Goa)',
    code: 'NCPOR-GOA',
    coordinates: [15.3991, 73.8118],
    type: 'headquarters',
    elevation_m: 22,
    runway_type: 'Dabolim / Goa International (VAGO)',
    weather: {
      temp_c: 30,
      wind_speed_kt: 8,
      wind_dir: 'WSW',
      condition: 'Tropical Humid',
      blizzard_warning: false,
      updated_at: new Date().toISOString()
    },
    occupancy_current: 50,
    occupancy_capacity: 200
  }
];

export const initialUsers: User[] = [
  {
    id: 'usr-lead-01',
    name: 'Dr. Amitabh Sen',
    email: 'lead@ncpor.res.in',
    role: 'expedition_lead',
    station_id: 'maitri',
    badge_number: 'ISEA-44-001'
  },
  {
    id: 'usr-log-01',
    name: 'Cdr. Rajesh Nair (Retd.)',
    email: 'logistics@ncpor.res.in',
    role: 'logistics_officer',
    station_id: 'cape_town',
    badge_number: 'ISEA-44-012'
  },
  {
    id: 'usr-med-01',
    name: 'Dr. Sunita Sharma (Surgeon)',
    email: 'medical@ncpor.res.in',
    role: 'medical_officer',
    station_id: 'bharati',
    badge_number: 'ISEA-44-009'
  },
  {
    id: 'usr-field-01',
    name: 'Vikramaditya Chauhan (Technician)',
    email: 'field@ncpor.res.in',
    role: 'station_personnel',
    station_id: 'bharati',
    badge_number: 'ISEA-44-033'
  },
  {
    id: 'usr-hq-01',
    name: 'Dr. Thamban Meloth (Director)',
    email: 'director@ncpor.res.in',
    role: 'ncpor_hq',
    station_id: 'goa_hq',
    badge_number: 'NCPOR-DIR-01'
  }
];

// Helper to build verified custody chain for seed assets
function buildSeedChain(assetId: string, origin: string, intermediate?: string, dest?: string) {
  const genesis = CryptoService.createGenesisBlock(
    'usr-hq-01',
    'Dr. Thamban Meloth',
    origin === 'goa_hq' ? 'NCPOR Goa Central Warehouse' : 'Cape Town Staging Depot'
  );
  const chain = [genesis];

  if (intermediate) {
    const b2 = CryptoService.appendHandoff(
      chain,
      'usr-log-01',
      'Cdr. Rajesh Nair',
      'Logistics Officer',
      'LOADED_ABOARD_VESSEL',
      intermediate,
      'inspected_good',
      [-33.9249, 18.4241]
    );
    chain.push(b2);
  }

  if (dest) {
    const b3 = CryptoService.appendHandoff(
      chain,
      'usr-field-01',
      'Station Command Handover',
      'Station Personnel',
      'SECURED_IN_POLAR_STORAGE',
      dest,
      'sealed_normal',
      dest === 'Maitri' ? [-70.7667, 11.7333] : [-69.4078, 76.1872]
    );
    chain.push(b3);
  }

  return chain;
}

export const initialAssets: Asset[] = [
  // FUEL ASSETS
  {
    id: 'ast-fuel-01',
    code: 'POL-DSL-50K-M1',
    name: 'Arctic-Grade Low-Sulfur Diesel (50,000 L Tanker)',
    category: 'fuel',
    weight_kg: 42500,
    volume_m3: 50.0,
    origin: 'Cape Town Port',
    destination: 'Maitri Station',
    current_location: 'Maitri Station Fuel Farm',
    coordinates: [-70.7667, 11.7333],
    status: 'stored',
    priority: 'critical',
    temperature_sensitive: true,
    min_temp_c: -50,
    custody_log: buildSeedChain('ast-fuel-01', 'cape_town', 'MV Vasiliy Golovnin', 'Maitri')
  },
  {
    id: 'ast-fuel-02',
    code: 'POL-JETA1-20K-B1',
    name: 'Aviation Turbine Fuel Jet A-1 (Bladder Unit B1)',
    category: 'fuel',
    weight_kg: 16000,
    volume_m3: 20.0,
    origin: 'Cape Town Port',
    destination: 'Bharati Station',
    current_location: 'Bharati Station Helipad Depot',
    coordinates: [-69.4078, 76.1872],
    status: 'stored',
    priority: 'critical',
    temperature_sensitive: true,
    min_temp_c: -47,
    custody_log: buildSeedChain('ast-fuel-02', 'cape_town', 'MV Vasiliy Golovnin', 'Bharati')
  },
  {
    id: 'ast-fuel-03',
    code: 'POL-DSL-IN-TRANSIT',
    name: 'Bulk Arctic Diesel Lot 44-D2 (25 Metric Tons)',
    category: 'fuel',
    weight_kg: 25000,
    volume_m3: 29.5,
    origin: 'Cape Town Port',
    destination: 'Bharati Station',
    current_location: 'Aboard MV Vasiliy Golovnin',
    coordinates: [-52.4, 45.2],
    status: 'in_transit',
    priority: 'critical',
    temperature_sensitive: true,
    custody_log: buildSeedChain('ast-fuel-03', 'cape_town', 'MV Vasiliy Golovnin')
  },
  {
    id: 'ast-fuel-04',
    code: 'POL-LPG-CYL-M2',
    name: 'Pressurized Propane/Butane Cooking Gas Rack (48 Cylinders)',
    category: 'fuel',
    weight_kg: 2400,
    volume_m3: 6.2,
    origin: 'Cape Town Port',
    destination: 'Maitri Station',
    current_location: 'Maitri Station Domestic Shed',
    coordinates: [-70.7667, 11.7333],
    status: 'stored',
    priority: 'routine',
    temperature_sensitive: false,
    custody_log: buildSeedChain('ast-fuel-04', 'cape_town', 'MV Vasiliy Golovnin', 'Maitri')
  },

  // SCIENTIFIC EQUIPMENT
  {
    id: 'ast-sci-01',
    code: 'SCI-DRILL-CORING',
    name: 'Electromechanical Ice Core Deep Drilling Rig',
    category: 'scientific-equipment',
    weight_kg: 4200,
    volume_m3: 12.0,
    origin: 'NCPOR Goa',
    destination: 'Bharati Station',
    current_location: 'Cape Town Hub Staging',
    coordinates: [-33.9249, 18.4241],
    status: 'stored',
    priority: 'routine',
    temperature_sensitive: false,
    custody_log: buildSeedChain('ast-sci-01', 'goa_hq')
  },
  {
    id: 'ast-sci-02',
    code: 'SCI-SEISMIC-ARRAY',
    name: 'Broadband Polar Seismological Sensor Suite (x6)',
    category: 'scientific-equipment',
    weight_kg: 850,
    volume_m3: 3.2,
    origin: 'NCPOR Goa',
    destination: 'Maitri Station',
    current_location: 'Maitri Schirmacher Seismic Vault',
    coordinates: [-70.7667, 11.7333],
    status: 'stored',
    priority: 'routine',
    temperature_sensitive: true,
    custody_log: buildSeedChain('ast-sci-02', 'goa_hq', 'Basler BT-67', 'Maitri')
  },
  {
    id: 'ast-sci-03',
    code: 'SCI-LIDAR-OPTIC',
    name: 'Stratospheric Rayleigh Aerosol LIDAR Optical Head',
    category: 'scientific-equipment',
    weight_kg: 620,
    volume_m3: 2.1,
    origin: 'NCPOR Goa',
    destination: 'Bharati Station',
    current_location: 'Bharati Upper Atmospheric Lab',
    coordinates: [-69.4078, 76.1872],
    status: 'stored',
    priority: 'routine',
    temperature_sensitive: true,
    custody_log: buildSeedChain('ast-sci-03', 'goa_hq', 'MV Vasiliy Golovnin', 'Bharati')
  },
  {
    id: 'ast-sci-04',
    code: 'SCI-MET-SONDE-100',
    name: 'Vaisala Ozonesonde & Radiosonde Launch Modules (100 units)',
    category: 'scientific-equipment',
    weight_kg: 340,
    volume_m3: 1.8,
    origin: 'NCPOR Goa',
    destination: 'Maitri Station',
    current_location: 'Maitri Meteorological Lab',
    coordinates: [-70.7667, 11.7333],
    status: 'stored',
    priority: 'routine',
    temperature_sensitive: false,
    custody_log: buildSeedChain('ast-sci-04', 'goa_hq', 'Basler BT-67', 'Maitri')
  },

  // MEDICAL SUPPLIES
  {
    id: 'ast-med-01',
    code: 'MED-TRAUMA-SURG',
    name: 'Emergency Surgical Trauma Kit & Cryo-Suture Pack',
    category: 'medical',
    weight_kg: 180,
    volume_m3: 0.9,
    origin: 'Cape Town Port',
    destination: 'Maitri Station',
    current_location: 'Maitri Station Medical Bay',
    coordinates: [-70.7667, 11.7333],
    status: 'stored',
    priority: 'emergency',
    temperature_sensitive: true,
    min_temp_c: 2,
    custody_log: buildSeedChain('ast-med-01', 'cape_town', 'Basler BT-67', 'Maitri')
  },
  {
    id: 'ast-med-02',
    code: 'MED-O2-CONC-BHA',
    name: 'High-Purity Medical Oxygen Bottles (20x 50L manifold)',
    category: 'medical',
    weight_kg: 920,
    volume_m3: 2.8,
    origin: 'Cape Town Port',
    destination: 'Bharati Station',
    current_location: 'Bharati Clinic Triage Ward',
    coordinates: [-69.4078, 76.1872],
    status: 'stored',
    priority: 'critical',
    temperature_sensitive: false,
    custody_log: buildSeedChain('ast-med-02', 'cape_town', 'MV Vasiliy Golovnin', 'Bharati')
  },
  {
    id: 'ast-med-03',
    code: 'MED-PLASMA-EXP',
    name: 'Lyophilized Human Blood Plasma & Rehydration Fluids (Cold Chain)',
    category: 'medical',
    weight_kg: 75,
    volume_m3: 0.4,
    origin: 'Cape Town Port',
    destination: 'Bharati Station',
    current_location: 'In Flight - Basler BT-67 (Novo to Maitri/Bharati)',
    coordinates: [-70.1, 42.5],
    status: 'in_transit',
    priority: 'emergency',
    temperature_sensitive: true,
    min_temp_c: 4,
    custody_log: buildSeedChain('ast-med-03', 'cape_town', 'Basler Sortie 44')
  },
  {
    id: 'ast-med-04',
    code: 'MED-FROSTBITE-KIT',
    name: 'Severe Frostbite & Hypothermia Rewarming Systems',
    category: 'medical',
    weight_kg: 110,
    volume_m3: 0.6,
    origin: 'Cape Town Port',
    destination: 'Maitri Station',
    current_location: 'Maitri Station Medical Bay',
    coordinates: [-70.7667, 11.7333],
    status: 'stored',
    priority: 'critical',
    temperature_sensitive: false,
    custody_log: buildSeedChain('ast-med-04', 'cape_town', 'Basler BT-67', 'Maitri')
  },

  // FOOD RATIONS
  {
    id: 'ast-food-01',
    code: 'RAT-DRY-365-MAI',
    name: 'Freeze-Dried Nutrient Balanced Polar Rations (5,000 Days)',
    category: 'food',
    weight_kg: 6500,
    volume_m3: 18.0,
    origin: 'Cape Town Port',
    destination: 'Maitri Station',
    current_location: 'Maitri Ration Container Yard',
    coordinates: [-70.7667, 11.7333],
    status: 'stored',
    priority: 'critical',
    temperature_sensitive: false,
    custody_log: buildSeedChain('ast-food-01', 'cape_town', 'MV Vasiliy Golovnin', 'Maitri')
  },
  {
    id: 'ast-food-02',
    code: 'RAT-CRYO-PROT-BHA',
    name: 'Vacuum-Sealed Blast-Frozen Proteins (Fish, Mutton, Pulses)',
    category: 'food',
    weight_kg: 7800,
    volume_m3: 19.5,
    origin: 'Cape Town Port',
    destination: 'Bharati Station',
    current_location: 'Bharati Deep Freeze Storeroom (-25°C)',
    coordinates: [-69.4078, 76.1872],
    status: 'stored',
    priority: 'critical',
    temperature_sensitive: true,
    min_temp_c: -20,
    custody_log: buildSeedChain('ast-food-02', 'cape_town', 'MV Vasiliy Golovnin', 'Bharati')
  },
  {
    id: 'ast-food-03',
    code: 'RAT-FRESH-TRANSIT',
    name: 'Fresh Hydroponic Starter Seeds & Summer Produce Crate',
    category: 'food',
    weight_kg: 480,
    volume_m3: 2.2,
    origin: 'Cape Town Port',
    destination: 'Bharati Station',
    current_location: 'Aboard MV Vasiliy Golovnin (Chill Container)',
    coordinates: [-52.4, 45.2],
    status: 'in_transit',
    priority: 'routine',
    temperature_sensitive: true,
    min_temp_c: 2,
    custody_log: buildSeedChain('ast-food-03', 'cape_town', 'MV Vasiliy Golovnin')
  },

  // SPARES & MACHINERY
  {
    id: 'ast-spr-01',
    code: 'SPR-PISTENBULLY-TRK',
    name: 'PistenBully 300 Heavy Snowcat Track Bands & Sprockets',
    category: 'spares',
    weight_kg: 3200,
    volume_m3: 5.5,
    origin: 'Cape Town Port',
    destination: 'Maitri Station',
    current_location: 'Maitri Vehicle Workshop',
    coordinates: [-70.7667, 11.7333],
    status: 'stored',
    priority: 'routine',
    temperature_sensitive: false,
    custody_log: buildSeedChain('ast-spr-01', 'cape_town', 'MV Vasiliy Golovnin', 'Maitri')
  },
  {
    id: 'ast-spr-02',
    code: 'SPR-GEN-INJECTOR',
    name: 'Kirloskar 125 kVA Polar Generator Injectors & Turbo Cartridges',
    category: 'spares',
    weight_kg: 450,
    volume_m3: 1.2,
    origin: 'NCPOR Goa',
    destination: 'Bharati Station',
    current_location: 'Bharati Technical Plant Room',
    coordinates: [-69.4078, 76.1872],
    status: 'stored',
    priority: 'critical',
    temperature_sensitive: false,
    custody_log: buildSeedChain('ast-spr-02', 'goa_hq', 'MV Vasiliy Golovnin', 'Bharati')
  },
  {
    id: 'ast-spr-03',
    code: 'SPR-VSAT-FEEDHORN',
    name: 'C-Band / Ku-Band Iridium-VSAT Radome Tracking Motor Spare',
    category: 'spares',
    weight_kg: 190,
    volume_m3: 0.8,
    origin: 'NCPOR Goa',
    destination: 'Maitri Station',
    current_location: 'Maitri Comms Center',
    coordinates: [-70.7667, 11.7333],
    status: 'stored',
    priority: 'critical',
    temperature_sensitive: false,
    custody_log: buildSeedChain('ast-spr-03', 'goa_hq', 'Basler BT-67', 'Maitri')
  },
  {
    id: 'ast-spr-04',
    code: 'SPR-WINDPWR-SLIPRING',
    name: '10 kW Arctic Wind Turbine Blade Pitch Motors & Slip Rings',
    category: 'spares',
    weight_kg: 820,
    volume_m3: 2.4,
    origin: 'Cape Town Port',
    destination: 'Bharati Station',
    current_location: 'Bharati Green Energy Farm',
    coordinates: [-69.4078, 76.1872],
    status: 'stored',
    priority: 'routine',
    temperature_sensitive: false,
    custody_log: buildSeedChain('ast-spr-04', 'cape_town', 'MV Vasiliy Golovnin', 'Bharati')
  },
  {
    id: 'ast-spr-05',
    code: 'SPR-SNOWMOBILE-ENG',
    name: 'Lynx Commander 800R E-TEC Engine Rebuild Module',
    category: 'spares',
    weight_kg: 310,
    volume_m3: 1.1,
    origin: 'Cape Town Port',
    destination: 'Maitri Station',
    current_location: 'Maitri Vehicle Workshop',
    coordinates: [-70.7667, 11.7333],
    status: 'stored',
    priority: 'routine',
    temperature_sensitive: false,
    custody_log: buildSeedChain('ast-spr-05', 'cape_town', 'MV Vasiliy Golovnin', 'Maitri')
  }
];

export const initialInventory: InventoryItem[] = [
  // MAITRI STATION INVENTORY
  {
    id: 'inv-mai-01',
    station_id: 'maitri',
    station_name: 'Maitri Station',
    item_name: 'Arctic-Grade Diesel (Heating & Power)',
    category: 'fuel',
    current_stock: 58000,
    unit: 'Liters',
    daily_burn_rate: 340, // Base burn rate
    min_threshold: 30000,
    max_capacity: 120000,
    days_until_depletion: 170, // 58000 / 340 ~ 170 days
    critical_alert: false,
    resupply_deadline: '2026-11-15', // Austral Summer Resupply Window starts Nov 15
    rationing_enacted: false
  },
  {
    id: 'inv-mai-02',
    station_id: 'maitri',
    station_name: 'Maitri Station',
    item_name: 'Aviation Turbine Fuel (Jet A-1)',
    category: 'fuel',
    current_stock: 12400,
    unit: 'Liters',
    daily_burn_rate: 110,
    min_threshold: 8000,
    max_capacity: 35000,
    days_until_depletion: 112,
    critical_alert: true, // WARNING: May deplete before ship arrival!
    resupply_deadline: '2026-11-15',
    rationing_enacted: false
  },
  {
    id: 'inv-mai-03',
    station_id: 'maitri',
    station_name: 'Maitri Station',
    item_name: 'Freeze-Dried Balanced Rations',
    category: 'food',
    current_stock: 4600,
    unit: 'Person-Days',
    daily_burn_rate: 24, // 24 crew * 1 ration/day
    min_threshold: 2000,
    max_capacity: 12000,
    days_until_depletion: 191,
    critical_alert: false,
    resupply_deadline: '2026-11-15',
    rationing_enacted: false
  },
  {
    id: 'inv-mai-04',
    station_id: 'maitri',
    station_name: 'Maitri Station',
    item_name: 'Medical Oxygen Cylinders',
    category: 'medical',
    current_stock: 18,
    unit: 'Cylinders (50L)',
    daily_burn_rate: 0.1,
    min_threshold: 10,
    max_capacity: 40,
    days_until_depletion: 180,
    critical_alert: false,
    resupply_deadline: '2026-11-15',
    rationing_enacted: false
  },
  {
    id: 'inv-mai-05',
    station_id: 'maitri',
    station_name: 'Maitri Station',
    item_name: 'Generator Primary Oil & Air Filters',
    category: 'spares',
    current_stock: 14,
    unit: 'Sets',
    daily_burn_rate: 0.08,
    min_threshold: 8,
    max_capacity: 50,
    days_until_depletion: 175,
    critical_alert: false,
    resupply_deadline: '2026-11-15',
    rationing_enacted: false
  },

  // BHARATI STATION INVENTORY
  {
    id: 'inv-bha-01',
    station_id: 'bharati',
    station_name: 'Bharati Station',
    item_name: 'Arctic-Grade Diesel (Power Generation)',
    category: 'fuel',
    current_stock: 84000,
    unit: 'Liters',
    daily_burn_rate: 420,
    min_threshold: 40000,
    max_capacity: 180000,
    days_until_depletion: 200,
    critical_alert: false,
    resupply_deadline: '2026-11-15',
    rationing_enacted: false
  },
  {
    id: 'inv-bha-02',
    station_id: 'bharati',
    station_name: 'Bharati Station',
    item_name: 'Aviation Turbine Fuel (Helicopter/Twin Otter)',
    category: 'fuel',
    current_stock: 22500,
    unit: 'Liters',
    daily_burn_rate: 130,
    min_threshold: 12000,
    max_capacity: 50000,
    days_until_depletion: 173,
    critical_alert: false,
    resupply_deadline: '2026-11-15',
    rationing_enacted: false
  },
  {
    id: 'inv-bha-03',
    station_id: 'bharati',
    station_name: 'Bharati Station',
    item_name: 'Combined Food Reserves & Cold Storage',
    category: 'food',
    current_stock: 5900,
    unit: 'Person-Days',
    daily_burn_rate: 28, // 28 crew
    min_threshold: 2500,
    max_capacity: 15000,
    days_until_depletion: 210,
    critical_alert: false,
    resupply_deadline: '2026-11-15',
    rationing_enacted: false
  },
  {
    id: 'inv-bha-04',
    station_id: 'bharati',
    station_name: 'Bharati Station',
    item_name: 'Trauma & Emergency Surgical Packs',
    category: 'medical',
    current_stock: 8,
    unit: 'Complete Suites',
    daily_burn_rate: 0.03,
    min_threshold: 5,
    max_capacity: 20,
    days_until_depletion: 266,
    critical_alert: false,
    resupply_deadline: '2026-11-15',
    rationing_enacted: false
  },
  {
    id: 'inv-bha-05',
    station_id: 'bharati',
    station_name: 'Bharati Station',
    item_name: 'Wind Turbine Hydraulic Seals & Spares',
    category: 'spares',
    current_stock: 12,
    unit: 'Kits',
    daily_burn_rate: 0.05,
    min_threshold: 6,
    max_capacity: 30,
    days_until_depletion: 240,
    critical_alert: false,
    resupply_deadline: '2026-11-15',
    rationing_enacted: false
  }
];

export const initialPersonnel: Personnel[] = [
  // MAITRI STATION COMMAND & SCIENTISTS (24 Members)
  {
    id: 'per-m-01',
    code: 'IND-MAI-01',
    name: 'Dr. Amitabh Sen',
    role: 'expedition_lead',
    designation: 'Station Leader & Glaciologist',
    station_id: 'maitri',
    station_name: 'Maitri Station',
    location: 'Maitri',
    days_in_post: 210,
    max_post_days: 450,
    winter_over_status: 'winter_over_active',
    medical_fitness: 'fit',
    blood_group: 'O+',
    emergency_donor_eligible: true,
    polar_night_days: 72,
    readiness_score: 94,
    rotation_batch: '44-A (Winter-Over)'
  },
  {
    id: 'per-m-02',
    code: 'IND-MAI-02',
    name: 'Dr. Pradeep Joshi',
    role: 'medical_officer',
    designation: 'Expedition Medical Officer (Surgeon)',
    station_id: 'maitri',
    station_name: 'Maitri Station',
    location: 'Maitri',
    days_in_post: 210,
    max_post_days: 450,
    winter_over_status: 'winter_over_active',
    medical_fitness: 'fit',
    blood_group: 'A+',
    emergency_donor_eligible: true,
    polar_night_days: 72,
    readiness_score: 98,
    rotation_batch: '44-A (Winter-Over)'
  },
  {
    id: 'per-m-03',
    code: 'IND-MAI-03',
    name: 'Sqn Ldr Aniket Verma',
    role: 'logistics_officer',
    designation: 'Base Operations & Air-Ground Controller',
    station_id: 'maitri',
    station_name: 'Maitri Station',
    location: 'Maitri',
    days_in_post: 210,
    max_post_days: 450,
    winter_over_status: 'winter_over_active',
    medical_fitness: 'fit',
    blood_group: 'B+',
    emergency_donor_eligible: true,
    polar_night_days: 72,
    readiness_score: 91,
    rotation_batch: '44-A (Winter-Over)'
  },
  {
    id: 'per-m-04',
    code: 'IND-MAI-04',
    name: 'Kavita Sundaram',
    role: 'station_personnel',
    designation: 'Atmospheric Physics Researcher (IMD)',
    station_id: 'maitri',
    station_name: 'Maitri Station',
    location: 'Maitri',
    days_in_post: 210,
    max_post_days: 450,
    winter_over_status: 'winter_over_active',
    medical_fitness: 'fit',
    blood_group: 'O-',
    emergency_donor_eligible: true, // Universal Donor!
    polar_night_days: 72,
    readiness_score: 89,
    rotation_batch: '44-A (Winter-Over)'
  },
  {
    id: 'per-m-05',
    code: 'IND-MAI-05',
    name: 'Harpreet Singh Sandhu',
    role: 'station_personnel',
    designation: 'Chief Heavy Vehicle Mechanic (PistenBully)',
    station_id: 'maitri',
    station_name: 'Maitri Station',
    location: 'Maitri',
    days_in_post: 210,
    max_post_days: 450,
    winter_over_status: 'winter_over_active',
    medical_fitness: 'fit',
    blood_group: 'AB+',
    emergency_donor_eligible: false,
    polar_night_days: 72,
    readiness_score: 95,
    rotation_batch: '44-A (Winter-Over)'
  },
  {
    id: 'per-m-06',
    code: 'IND-MAI-06',
    name: 'Debashish Roy',
    role: 'station_personnel',
    designation: 'Diesel Power Plant Engineer (EME Corps)',
    station_id: 'maitri',
    station_name: 'Maitri Station',
    location: 'Maitri',
    days_in_post: 210,
    max_post_days: 450,
    winter_over_status: 'winter_over_active',
    medical_fitness: 'fit',
    blood_group: 'A-',
    emergency_donor_eligible: true,
    polar_night_days: 72,
    readiness_score: 92,
    rotation_batch: '44-A (Winter-Over)'
  },

  // BHARATI STATION COMMAND & SCIENTISTS (28 Members)
  {
    id: 'per-b-01',
    code: 'IND-BHA-01',
    name: 'Dr. Meenakshi Swaminathan',
    role: 'expedition_lead',
    designation: 'Station Leader & Marine Biologist',
    station_id: 'bharati',
    station_name: 'Bharati Station',
    location: 'Bharati',
    days_in_post: 195,
    max_post_days: 450,
    winter_over_status: 'winter_over_active',
    medical_fitness: 'fit',
    blood_group: 'B+',
    emergency_donor_eligible: true,
    polar_night_days: 64,
    readiness_score: 96,
    rotation_batch: '44-B (Winter-Over)'
  },
  {
    id: 'per-b-02',
    code: 'IND-BHA-02',
    name: 'Dr. Sunita Sharma',
    role: 'medical_officer',
    designation: 'Senior Medical Officer (Orthopedic / Critical Care)',
    station_id: 'bharati',
    station_name: 'Bharati Station',
    location: 'Bharati',
    days_in_post: 195,
    max_post_days: 450,
    winter_over_status: 'winter_over_active',
    medical_fitness: 'fit',
    blood_group: 'O+',
    emergency_donor_eligible: true,
    polar_night_days: 64,
    readiness_score: 99,
    rotation_batch: '44-B (Winter-Over)'
  },
  {
    id: 'per-b-03',
    code: 'IND-BHA-03',
    name: 'Lt Cdr Arvind Pillai',
    role: 'logistics_officer',
    designation: 'Naval Logistics & Coastal Wharf Officer',
    station_id: 'bharati',
    station_name: 'Bharati Station',
    location: 'Bharati',
    days_in_post: 195,
    max_post_days: 450,
    winter_over_status: 'winter_over_active',
    medical_fitness: 'fit',
    blood_group: 'O-',
    emergency_donor_eligible: true,
    polar_night_days: 64,
    readiness_score: 93,
    rotation_batch: '44-B (Winter-Over)'
  },
  {
    id: 'per-b-04',
    code: 'IND-BHA-04',
    name: 'Vikramaditya Chauhan',
    role: 'station_personnel',
    designation: 'Electrical & Automation Systems Specialist',
    station_id: 'bharati',
    station_name: 'Bharati Station',
    location: 'Bharati',
    days_in_post: 195,
    max_post_days: 450,
    winter_over_status: 'winter_over_active',
    medical_fitness: 'fit',
    blood_group: 'AB-',
    emergency_donor_eligible: false,
    polar_night_days: 64,
    readiness_score: 90,
    rotation_batch: '44-B (Winter-Over)'
  },
  {
    id: 'per-b-05',
    code: 'IND-BHA-05',
    name: 'Priyanka Deshmukh',
    role: 'station_personnel',
    designation: 'Satellite Oceanography & Ice Radar Analyst',
    station_id: 'bharati',
    station_name: 'Bharati Station',
    location: 'Bharati',
    days_in_post: 195,
    max_post_days: 450,
    winter_over_status: 'winter_over_active',
    medical_fitness: 'restricted',
    blood_group: 'A+',
    emergency_donor_eligible: false,
    polar_night_days: 64,
    readiness_score: 82,
    rotation_batch: '44-B (Winter-Over)'
  },

  // MARITIME VESSEL CREW (MV Vasiliy Golovnin Transit)
  {
    id: 'per-v-01',
    code: 'IND-VES-01',
    name: 'Capt. Oleg Voronov',
    role: 'expedition_lead',
    designation: 'Master of the Vessel (Ice Class 1A Super)',
    station_id: 'cape_town',
    station_name: 'MV Vasiliy Golovnin',
    location: 'MV Vasiliy Golovnin',
    days_in_post: 42,
    max_post_days: 120,
    winter_over_status: 'summer_influx',
    medical_fitness: 'fit',
    blood_group: 'O+',
    emergency_donor_eligible: true,
    polar_night_days: 0,
    readiness_score: 98,
    rotation_batch: 'Voyage 44-Sea'
  },
  {
    id: 'per-v-02',
    code: 'IND-VES-02',
    name: 'Cdr. Rajesh Nair (Retd.)',
    role: 'logistics_officer',
    designation: 'NCPOR Voyage Logistics Director',
    station_id: 'cape_town',
    station_name: 'MV Vasiliy Golovnin',
    location: 'MV Vasiliy Golovnin',
    days_in_post: 42,
    max_post_days: 120,
    winter_over_status: 'summer_influx',
    medical_fitness: 'fit',
    blood_group: 'B+',
    emergency_donor_eligible: true,
    polar_night_days: 0,
    readiness_score: 95,
    rotation_batch: 'Voyage 44-Sea'
  },

  // CAPE TOWN STAGING & RELIEF BATCH (Upcoming Winter-Over Replacements)
  {
    id: 'per-cpt-01',
    code: 'IND-CPT-01',
    name: 'Dr. Suresh Ranganathan',
    role: 'expedition_lead',
    designation: 'Incoming 45th ISEA Station Leader (Designate)',
    station_id: 'cape_town',
    station_name: 'Cape Town Staging Depot',
    location: 'Cape Town Hub',
    days_in_post: 12,
    max_post_days: 450,
    winter_over_status: 'demobilization_ready',
    medical_fitness: 'fit',
    blood_group: 'O+',
    emergency_donor_eligible: true,
    polar_night_days: 0,
    readiness_score: 100,
    rotation_batch: '45-A (Relief Crew)'
  },
  {
    id: 'per-cpt-02',
    code: 'IND-CPT-02',
    name: 'Dr. Neha Varma',
    role: 'medical_officer',
    designation: 'Incoming Medical Officer (Anesthesiologist)',
    station_id: 'cape_town',
    station_name: 'Cape Town Staging Depot',
    location: 'Cape Town Hub',
    days_in_post: 12,
    max_post_days: 450,
    winter_over_status: 'demobilization_ready',
    medical_fitness: 'fit',
    blood_group: 'B-',
    emergency_donor_eligible: true,
    polar_night_days: 0,
    readiness_score: 100,
    rotation_batch: '45-A (Relief Crew)'
  },

  // NCPOR GOA HQ EXECUTIVES
  {
    id: 'per-hq-01',
    code: 'IND-HQ-01',
    name: 'Dr. Thamban Meloth',
    role: 'ncpor_hq',
    designation: 'Director, NCPOR (Ministry of Earth Sciences)',
    station_id: 'goa_hq',
    station_name: 'NCPOR Headquarters',
    location: 'NCPOR Goa',
    days_in_post: 720,
    max_post_days: 1800,
    winter_over_status: 'summer_influx',
    medical_fitness: 'fit',
    blood_group: 'A+',
    emergency_donor_eligible: false,
    polar_night_days: 0,
    readiness_score: 100,
    rotation_batch: 'HQ Command'
  },
  {
    id: 'per-hq-02',
    code: 'IND-HQ-02',
    name: 'Dr. M. Ravichandran',
    role: 'ncpor_hq',
    designation: 'Secretary, Ministry of Earth Sciences (MoES)',
    station_id: 'goa_hq',
    station_name: 'NCPOR Headquarters',
    location: 'NCPOR Goa',
    days_in_post: 840,
    max_post_days: 1800,
    winter_over_status: 'summer_influx',
    medical_fitness: 'fit',
    blood_group: 'O+',
    emergency_donor_eligible: false,
    polar_night_days: 0,
    readiness_score: 100,
    rotation_batch: 'HQ Command'
  }
];

export const initialRouteLegs: RouteLeg[] = [
  // 1. Maritime Vessel: MV Vasiliy Golovnin
  {
    id: 'leg-sea-01',
    name: 'Cape Town to Maitri Shelf (Sea Transect)',
    mode: 'sea',
    origin: 'Cape Town Logistics Hub',
    destination: 'Maitri Station (Ice Shelf Landing)',
    distance_km: 4480,
    transit_time_hrs: 240, // 10 days
    waypoints: [
      [-33.9249, 18.4241], // Cape Town
      [-42.0, 16.0],       // Roaring Forties
      [-54.0, 14.5],       // Screaming Fifties
      [-65.0, 13.0],       // Pack Ice Edge
      [-70.0, 12.0]        // Princess Astrid Coast Ice Shelf
    ],
    current_progress_pct: 65,
    current_position: [-54.0, 14.5],
    vehicle_name: 'MV Vasiliy Golovnin (Icebreaker Charter)',
    cargo_manifest_ids: ['ast-fuel-03', 'ast-food-03'],
    status: 'in_transit',
    sea_ice_severity: 'Moderate (30-50%)'
  },
  // 2. Maritime Leg 2: Maitri Shelf to Bharati Station
  {
    id: 'leg-sea-02',
    name: 'Maitri Shelf to Bharati Station (Prydz Bay)',
    mode: 'sea',
    origin: 'Maitri Station (Ice Shelf Landing)',
    destination: 'Bharati Station (Larsemann Hills)',
    distance_km: 2950,
    transit_time_hrs: 144, // 6 days
    waypoints: [
      [-70.0, 12.0],
      [-68.5, 35.0],
      [-67.8, 55.0],
      [-69.4078, 76.1872]
    ],
    current_progress_pct: 0,
    current_position: [-70.0, 12.0],
    vehicle_name: 'MV Vasiliy Golovnin (Icebreaker Charter)',
    cargo_manifest_ids: [],
    status: 'scheduled',
    sea_ice_severity: 'Severe Pack Ice (70-90%)'
  },
  // 3. DROMLAN Intercontinental Flight: Cape Town to Novo Runway (Maitri)
  {
    id: 'leg-air-01',
    name: 'DROMLAN Intercontinental: Cape Town to Novo / Maitri',
    mode: 'air',
    origin: 'Cape Town Logistics Hub',
    destination: 'Maitri Station (Novo Blue-Ice Runway)',
    distance_km: 4200,
    transit_time_hrs: 6.5,
    waypoints: [
      [-33.9249, 18.4241],
      [-52.0, 15.0],
      [-62.0, 13.5],
      [-70.7667, 11.7333]
    ],
    current_progress_pct: 100,
    current_position: [-70.7667, 11.7333],
    vehicle_name: 'Ilyushin IL-76 / Basler BT-67',
    cargo_manifest_ids: ['ast-med-01', 'ast-spr-03'],
    status: 'docked',
    sea_ice_severity: 'Low (0-20%)'
  },
  // 4. Inter-Station Flight: Maitri to Bharati (MANDATORY MID-WAY REFUELING)
  {
    id: 'leg-air-02',
    name: 'Inter-Station Air Corridor: Maitri to Bharati (via Skiway Fuel Cache)',
    mode: 'air',
    origin: 'Maitri Station',
    destination: 'Bharati Station',
    distance_km: 2680,
    transit_time_hrs: 8.5,
    waypoints: [
      [-70.7667, 11.7333], // Maitri
      [-70.2, 42.0],       // Mid-way Skiway Fuel Depot (Crucial refuel stop!)
      [-69.4078, 76.1872]  // Bharati
    ],
    current_progress_pct: 45,
    current_position: [-70.2, 42.0],
    vehicle_name: 'Basler BT-67 (Callsign: Polar Star 1)',
    cargo_manifest_ids: ['ast-med-03'],
    status: 'in_transit',
    sea_ice_severity: 'Low (0-20%)'
  }
];

export const initialSatellite: SatelliteState = {
  status: 'active',
  bandwidth_kbps: 128,
  latency_ms: 680,
  last_window_sync: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  next_window_time: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
  signal_strength_pct: 92,
  constellation: 'Iridium NEXT Polar Ring 4 (SV-118)'
};

export const initialSimulation: SimulationState = {
  time_warp: 1,
  is_blizzard_active: false,
  is_satellite_blackout: false,
  simulated_date: new Date().toISOString(),
  expedition_day: 142,
  total_days: 450
};
