import { create } from 'zustand';
import { UserRole, SatelliteState, SimulationState, RouteLeg, Asset } from '../types/index.js';

interface PolarStore {
  currentRole: UserRole;
  activeTab: string;
  satellite: SatelliteState;
  simulation: SimulationState;
  selectedRouteLeg: RouteLeg | null;
  selectedAsset: Asset | null;
  pendingSyncCount: number;
  emergencyTriggerOpen: boolean;
  tamperModalOpen: boolean;
  aiDrawerOpen: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;

  setCurrentRole: (role: UserRole) => void;
  setActiveTab: (tab: string) => void;
  setSatellite: (satellite: Partial<SatelliteState>) => void;
  setSimulation: (simulation: Partial<SimulationState>) => void;
  setSelectedRouteLeg: (leg: RouteLeg | null) => void;
  setSelectedAsset: (asset: Asset | null) => void;
  setPendingSyncCount: (count: number) => void;
  setEmergencyTriggerOpen: (open: boolean) => void;
  setTamperModalOpen: (open: boolean) => void;
  setAiDrawerOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
}

export const usePolarStore = create<PolarStore>((set) => ({
  currentRole: 'expedition_lead',
  activeTab: 'map',
  satellite: {
    status: 'active',
    bandwidth_kbps: 128,
    latency_ms: 680,
    last_window_sync: new Date().toISOString(),
    next_window_time: new Date(Date.now() + 45 * 60000).toISOString(),
    signal_strength_pct: 94,
    constellation: 'Iridium NEXT Ring 4'
  },
  simulation: {
    time_warp: 1,
    is_blizzard_active: false,
    is_satellite_blackout: false,
    simulated_date: new Date().toISOString(),
    expedition_day: 142,
    total_days: 450
  },
  selectedRouteLeg: null,
  selectedAsset: null,
  pendingSyncCount: 0,
  emergencyTriggerOpen: false,
  tamperModalOpen: false,
  aiDrawerOpen: false,
  sidebarCollapsed: false,
  mobileMenuOpen: false,

  setCurrentRole: (role) => set({ currentRole: role }),
  setActiveTab: (tab) => set({ activeTab: tab, mobileMenuOpen: false }),
  setSatellite: (satellite) =>
    set((state) => ({ satellite: { ...state.satellite, ...satellite } })),
  setSimulation: (simulation) =>
    set((state) => ({ simulation: { ...state.simulation, ...simulation } })),
  setSelectedRouteLeg: (leg) => set({ selectedRouteLeg: leg }),
  setSelectedAsset: (asset) => set({ selectedAsset: asset }),
  setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
  setEmergencyTriggerOpen: (open) => set({ emergencyTriggerOpen: open }),
  setTamperModalOpen: (open) => set({ tamperModalOpen: open }),
  setAiDrawerOpen: (open) => set({ aiDrawerOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen }))
}));
