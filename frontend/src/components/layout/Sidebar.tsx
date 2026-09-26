'use client';

import React from 'react';
import { usePolarStore } from '../../lib/store';
import {
  Compass,
  Boxes,
  Route,
  Activity,
  Users2,
  ShieldAlert,
  TabletSmartphone,
  Building2,
  Bot,
  ChevronLeft,
  ChevronRight,
  Radio,
  X
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentRole,
    pendingSyncCount,
    setAiDrawerOpen,
    sidebarCollapsed,
    toggleSidebarCollapsed,
    mobileMenuOpen,
    setMobileMenuOpen
  } = usePolarStore();

  const navItems = [
    { id: 'map', label: 'Tactical GIS Map', icon: Compass, roles: ['expedition_lead', 'logistics_officer', 'medical_officer', 'ncpor_hq'] },
    { id: 'cargo', label: 'Cargo & Custody Ledger', icon: Boxes, roles: ['expedition_lead', 'logistics_officer', 'ncpor_hq'] },
    { id: 'optimizer', label: 'Route & Mode Optimizer', icon: Route, roles: ['expedition_lead', 'logistics_officer', 'ncpor_hq'] },
    { id: 'inventory', label: 'Inventory & Resupply', icon: Activity, roles: ['expedition_lead', 'logistics_officer', 'ncpor_hq'] },
    { id: 'personnel', label: 'Personnel & Winter-Over', icon: Users2, roles: ['expedition_lead', 'medical_officer', 'ncpor_hq'] },
    { id: 'emergency', label: 'Emergency Protocol (SAR)', icon: ShieldAlert, roles: ['expedition_lead', 'medical_officer', 'ncpor_hq'], alertBadge: true },
    { id: 'field', label: 'Offline Field Terminal', icon: TabletSmartphone, roles: ['station_personnel', 'expedition_lead', 'logistics_officer'], hasBadge: true },
    { id: 'hq', label: 'NCPOR Goa Command Deck', icon: Building2, roles: ['ncpor_hq', 'expedition_lead'] },
  ];

  const renderNavButtons = (isMobileView = false) => (
    <div className="space-y-1">
      {/* HIMVEER AI Quick Launcher */}
      <button
        onClick={() => {
          setAiDrawerOpen(true);
          if (isMobileView) setMobileMenuOpen(false);
        }}
        className={`w-full flex items-center ${
          sidebarCollapsed && !isMobileView ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'
        } rounded-xl bg-gradient-to-r from-sky-950/60 to-slate-900 border border-sky-500/40 text-polar-cyan hover:border-sky-400 font-semibold transition-all group shadow-sm mb-2.5`}
        title="Launch HIMVEER Tactical AI Co-Pilot"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <Bot className="w-4 h-4 text-polar-cyan shrink-0 group-hover:scale-110 transition-transform" />
          {(!sidebarCollapsed || isMobileView) && (
            <span className="truncate text-xs font-telemetry tracking-wide text-slate-100">
              HIMVEER Co-Pilot
            </span>
          )}
        </div>
        {(!sidebarCollapsed || isMobileView) && (
          <span className="text-[9px] font-telemetry px-1.5 py-0.5 rounded bg-sky-900 text-sky-200 border border-sky-600/60">
            GROQ
          </span>
        )}
      </button>

      {navItems.map((item) => {
        const isAllowed = item.roles.includes(currentRole);
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              if (isMobileView) setMobileMenuOpen(false);
            }}
            title={sidebarCollapsed && !isMobileView ? item.label : undefined}
            className={`w-full flex items-center ${
              sidebarCollapsed && !isMobileView ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'
            } rounded-xl text-left transition-all duration-150 cursor-pointer ${
              isActive
                ? 'bg-sky-950/80 text-white font-semibold border border-sky-500/40 shadow-sm shadow-sky-950/40'
                : isAllowed
                ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                : 'text-slate-600 hover:text-slate-500 opacity-60'
            }`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-polar-cyan' : 'text-slate-400'}`} />
              {(!sidebarCollapsed || isMobileView) && (
                <span className="truncate text-xs tracking-tight">{item.label}</span>
              )}
            </div>

            {/* Badges */}
            {(!sidebarCollapsed || isMobileView) && (
              <div className="flex items-center space-x-1 shrink-0 ml-2">
                {item.hasBadge && pendingSyncCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-telemetry bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    {pendingSyncCount}
                  </span>
                )}
                {item.alertBadge && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                )}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP / TABLET SIDEBAR */}
      <aside
        className={`hidden lg:flex flex-col justify-between py-3.5 bg-polar-950/95 border-r border-slate-800/80 transition-all duration-300 ease-in-out select-none relative z-20 ${
          sidebarCollapsed ? 'w-16 px-2' : 'w-60 px-3'
        }`}
      >
        <div>
          {/* Section Title & Collapse Toggle */}
          <div className="flex items-center justify-between pb-2.5 mb-2 px-1 text-[10px] font-telemetry uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800/60">
            {!sidebarCollapsed && <span>OPERATIONAL MODULES</span>}
            <button
              onClick={toggleSidebarCollapsed}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors ml-auto"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Module Links */}
          {renderNavButtons(false)}
        </div>

        {/* Desktop Footer Status */}
        {!sidebarCollapsed && (
          <div className="pt-3 border-t border-slate-800/80 px-1 text-[10px] text-slate-500 font-telemetry space-y-1">
            <div className="flex items-center justify-between">
              <span>STATION COMMS</span>
              <span className="text-emerald-400 font-medium">HF 8.291 MHz</span>
            </div>
            <div className="flex items-center justify-between">
              <span>CUSTODY LEDGER</span>
              <span className="text-polar-cyan font-medium">SHA-256</span>
            </div>
          </div>
        )}
      </aside>

      {/* 2. MOBILE DRAWER SLIDE-OVER (< lg screens) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative w-72 max-w-[85vw] bg-polar-950 border-r border-slate-800 p-4 flex flex-col justify-between h-full z-10 shadow-2xl animate-in slide-in-from-left duration-250">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-950 border border-sky-500/40 flex items-center justify-center text-polar-cyan">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div>
                    <div className="font-extrabold text-slate-100 text-sm">POLAR OPS</div>
                    <div className="text-[10px] text-slate-400 font-telemetry">44th ISEA Console</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Module Buttons in Mobile View */}
              {renderNavButtons(true)}
            </div>

            {/* Mobile Drawer Footer */}
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-telemetry space-y-1.5">
              <div className="flex items-center justify-between">
                <span>HF SAR Radio:</span>
                <span className="text-emerald-400 font-bold">8.291 MHz</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Expedition:</span>
                <span className="text-polar-ice">Day 142 / 450</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
