'use client';

import React, { useState } from 'react';
import { usePolarStore } from '../../lib/store';
import { api } from '../../lib/api';
import { UserRole } from '../../types';
import {
  Satellite,
  Radio,
  Wind,
  ShieldAlert,
  FastForward,
  Bot,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  ThermometerSnowflake,
  Layers,
  AlertTriangle
} from 'lucide-react';

export const TopStatusBar: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    satellite,
    setSatellite,
    simulation,
    setSimulation,
    setEmergencyTriggerOpen,
    setActiveTab,
    setAiDrawerOpen,
    toggleMobileMenu,
    mobileMenuOpen
  } = usePolarStore();

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const handleToggleSatellite = async () => {
    try {
      setLoadingAction('sat');
      const res = await api.toggleSatellite();
      setSatellite(res.satellite);
      setSimulation({ is_satellite_blackout: res.satellite.status === 'closed' });
    } catch (e) {
      const newStatus = satellite.status === 'active' ? 'closed' : 'active';
      setSatellite({
        status: newStatus,
        bandwidth_kbps: newStatus === 'active' ? 128 : 0,
        signal_strength_pct: newStatus === 'active' ? 92 : 0
      });
      setSimulation({ is_satellite_blackout: newStatus === 'closed' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTimeWarpChange = async (warp: 1 | 10 | 60) => {
    try {
      await api.setTimeWarp(warp);
      setSimulation({ time_warp: warp });
    } catch (e) {
      setSimulation({ time_warp: warp });
    }
  };

  const handleToggleBlizzard = async () => {
    const nextState = !simulation.is_blizzard_active;
    try {
      await api.triggerBlizzard(nextState);
      setSimulation({ is_blizzard_active: nextState });
    } catch (e) {
      setSimulation({ is_blizzard_active: nextState });
    }
  };

  const roles: { id: UserRole; label: string; badge: string }[] = [
    { id: 'expedition_lead', label: 'Expedition Leader', badge: 'MAI/BHA LEAD' },
    { id: 'logistics_officer', label: 'Logistics Officer', badge: 'CARGO OPS' },
    { id: 'medical_officer', label: 'Medical Officer', badge: 'MEDEVAC' },
    { id: 'station_personnel', label: 'Station Field Personnel', badge: 'FIELD TEAM' },
    { id: 'ncpor_hq', label: 'NCPOR Goa Directorate', badge: 'MINISTRY HQ' }
  ];

  const currentRoleObj = roles.find((r) => r.id === currentRole) || roles[0];

  return (
    <header className="h-14 bg-polar-950/95 backdrop-blur-xl border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between text-xs select-none z-30 relative shadow-lg">
      {/* LEFT: Mobile Menu Button + Brand Logo & Title */}
      <div className="flex items-center space-x-2.5 sm:space-x-3 shrink-0">
        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-polar-cyan" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand Icon */}
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-polar-cyan shadow-sm shadow-cyan-950">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-100 tracking-wide text-xs sm:text-sm">
                POLAR<span className="text-polar-cyan">OPS</span>
              </span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[9px] bg-slate-900 border border-slate-800 text-slate-400 font-telemetry">
                44th ISEA • MoES
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-1.5 text-[10px] text-slate-400 font-telemetry">
              <span>Maitri & Bharati</span>
              <span className="text-slate-600">•</span>
              <span className="text-polar-ice font-bold">
                Day {Math.floor(simulation.expedition_day)}
                <span className="text-slate-500">/{simulation.total_days}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: Consolidated Clean Weather & Satellite Telemetry Pill (Desktop) */}
      <div className="hidden xl:flex items-center space-x-2.5 bg-slate-900/60 border border-slate-800/80 rounded-full px-3 py-1 shadow-inner font-telemetry text-[11px]">
        {/* Weather Maitri */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 font-semibold text-[10px] uppercase">MAI:</span>
          <span className={`font-bold ${simulation.is_blizzard_active ? 'text-red-400 animate-pulse' : 'text-sky-300'}`}>
            {simulation.is_blizzard_active ? '-44°C BLIZZARD' : '-19°C'}
          </span>
          <span className="text-slate-500 text-[10px]">
            ({simulation.is_blizzard_active ? '86kt' : '28kt'})
          </span>
        </div>

        <span className="text-slate-700">|</span>

        {/* Weather Bharati */}
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-400 font-semibold text-[10px] uppercase">BHA:</span>
          <span className="font-bold text-emerald-400">-14°C</span>
          <span className="text-slate-500 text-[10px]">(18kt)</span>
        </div>

        <span className="text-slate-700">|</span>

        {/* Interactive Satellite Status Toggle */}
        <button
          onClick={handleToggleSatellite}
          title="Click to toggle Satellite Comms (Simulate Iridium Blackout)"
          className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full transition-all cursor-pointer ${
            satellite.status === 'active'
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400'
              : 'bg-red-950/70 text-red-300 border border-red-500/60 hover:border-red-400 animate-pulse'
          }`}
        >
          <Satellite className="w-3 h-3" />
          <span className="font-bold text-[10px]">
            {satellite.status === 'active' ? 'SATCOM 128k' : 'SATCOM OFF'}
          </span>
        </button>
      </div>

      {/* RIGHT: Actions, Speed Control, AI Co-Pilot & Profile Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-2.5">
        {/* Speed Segmented Pill */}
        <div className="hidden sm:flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
          <span className="px-1.5 text-[10px] text-slate-500 font-telemetry flex items-center">
            <FastForward className="w-3 h-3 text-polar-cyan mr-1" />
          </span>
          {([1, 10, 60] as const).map((w) => (
            <button
              key={w}
              onClick={() => handleTimeWarpChange(w)}
              className={`px-2 py-0.5 rounded text-[10px] font-telemetry transition-all ${
                simulation.time_warp === w
                  ? 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {w}x
            </button>
          ))}
        </div>

        {/* Crisis & Scenario Injectors Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setScenarioMenuOpen(!scenarioMenuOpen);
              setRoleMenuOpen(false);
            }}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-telemetry flex items-center space-x-1.5 transition-all ${
              simulation.is_blizzard_active
                ? 'bg-red-950/70 border-red-500/80 text-red-300 animate-pulse'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300'
            }`}
            title="Simulation Scenarios & Crisis Injectors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Sim Controls</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {scenarioMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-polar-900/95 border border-slate-700/80 rounded-xl p-2 z-40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
              <div className="text-[10px] font-telemetry uppercase text-slate-400 px-2 py-1 border-b border-slate-800">
                Scenario Injectors (Evaluation)
              </div>
              <div className="p-1 space-y-1">
                <button
                  onClick={() => {
                    handleToggleBlizzard();
                    setScenarioMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Wind className={`w-3.5 h-3.5 ${simulation.is_blizzard_active ? 'text-red-400' : 'text-slate-400'}`} />
                    <span className="text-slate-200">Katabatic Blizzard</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-telemetry font-bold ${
                    simulation.is_blizzard_active ? 'bg-red-950 text-red-300 border border-red-500/50' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {simulation.is_blizzard_active ? 'ACTIVE' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    handleToggleSatellite();
                    setScenarioMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Satellite className={`w-3.5 h-3.5 ${satellite.status === 'closed' ? 'text-red-400' : 'text-slate-400'}`} />
                    <span className="text-slate-200">SATCOM Blackout</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-telemetry font-bold ${
                    satellite.status === 'closed' ? 'bg-red-950 text-red-300 border border-red-500/50' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {satellite.status === 'closed' ? 'OFFLINE' : 'ONLINE'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('emergency');
                    setEmergencyTriggerOpen(true);
                    setScenarioMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 p-2 rounded-lg text-left text-xs bg-red-950/40 hover:bg-red-900/40 text-red-300 border border-red-500/30 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>Declare Emergency Order</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* HIMVEER AI Co-Pilot Button */}
        <button
          onClick={() => setAiDrawerOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-sky-950/80 hover:bg-sky-900/60 border border-sky-500/50 text-sky-200 font-telemetry text-xs font-bold transition-all shadow-sm group cursor-pointer"
          title="Open HIMVEER AI Tactical Co-Pilot"
        >
          <Bot className="w-3.5 h-3.5 text-polar-cyan group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">HIMVEER</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-sky-900/90 text-sky-300 border border-sky-600/60 font-semibold">
            AI
          </span>
        </button>

        {/* Role Selector Pill */}
        <div className="relative">
          <button
            onClick={() => {
              setRoleMenuOpen(!roleMenuOpen);
              setScenarioMenuOpen(false);
            }}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 text-slate-200 transition-all cursor-pointer"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span className="text-xs font-semibold max-w-[100px] sm:max-w-[130px] truncate">
              {currentRoleObj.label}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-polar-900/95 border border-slate-700/80 rounded-xl p-1.5 z-40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
              <div className="text-[10px] font-telemetry uppercase text-slate-400 px-2 py-1 border-b border-slate-800">
                Switch Operational Persona
              </div>
              <div className="p-1 space-y-0.5">
                {roles.map((r) => {
                  const isCurrent = r.id === currentRole;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        setCurrentRole(r.id);
                        if (r.id === 'station_personnel') setActiveTab('field');
                        if (r.id === 'ncpor_hq') setActiveTab('hq');
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        isCurrent
                          ? 'bg-sky-950/80 text-sky-200 font-bold border border-sky-500/40'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <span>{r.label}</span>
                      <span className="text-[9px] font-telemetry px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {r.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
