'use client';

import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  Fuel,
  Users,
  Printer,
  ShieldCheck,
  Leaf,
  Layers,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface ApprovalItem {
  id: string;
  code: string;
  title: string;
  requested_by: string;
  station: string;
  category: 'air_sortie' | 'fuel_transfer' | 'procurement' | 'personnel_rotation';
  status: 'pending' | 'approved';
  cost_estimate_inr: string;
  justification: string;
}

export const NCPORHQView: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([
    {
      id: 'app-01',
      code: 'REQ-AIR-44-09',
      title: 'Basler BT-67 Aeromedical Sortie Authorization (Novo to Cape Town)',
      requested_by: 'Dr. Amitabh Sen (Expedition Leader, Maitri)',
      station: 'Maitri Station',
      category: 'air_sortie',
      status: 'pending',
      cost_estimate_inr: '₹14,50,000',
      justification: 'Critical evacuation of crew member with acute intra-abdominal syndrome.'
    },
    {
      id: 'app-02',
      code: 'REQ-POL-44-14',
      title: 'Inter-Station Jet A-1 Reserve Reallocation (5,000 Liters)',
      requested_by: 'Cdr. Rajesh Nair (Logistics Director)',
      station: 'Bharati to Maitri Skiway Cache',
      category: 'fuel_transfer',
      status: 'pending',
      cost_estimate_inr: '₹8,20,000',
      justification: 'Pre-positioning aviation turbine fuel at 70.2°S 42°E skiway before winter freeze.'
    },
    {
      id: 'app-03',
      code: 'REQ-ROT-45-01',
      title: '45th ISEA Winter-Over Advance Staging Batch (Cape Town)',
      requested_by: 'Directorate of Polar Expeditions (NCPOR)',
      station: 'Cape Town Hub',
      category: 'personnel_rotation',
      status: 'approved',
      cost_estimate_inr: '₹32,00,000',
      justification: 'Medical fitness screening & cold-weather survival drill clearance for 18 scientists.'
    }
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'approved' } : a))
    );
    const item = approvals.find((a) => a.id === id);
    setNotification(`DIRECTORATE SIGN-OFF GRANTED: ${item?.code} cleared under MoES Polar Directive.`);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto select-none">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-polar-cyan" />
            <h1 className="text-xl font-bold text-slate-100 tracking-wide">
              NCPOR HEADQUARTERS COMMAND DECK (GOA)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ministry of Earth Sciences (MoES) strategic expedition governance, cross-station reserves, and executive approvals.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 px-3 py-2 rounded bg-polar-cyan/15 border border-polar-cyan text-polar-cyan hover:bg-polar-cyan/25 text-xs font-telemetry font-bold transition-all shadow-md"
        >
          <Printer className="w-4 h-4" />
          <span>Export Ministry Briefing Report</span>
        </button>
      </div>

      {notification && (
        <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500 text-emerald-300 text-xs font-telemetry flex items-center justify-between shadow-lg">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* EXECUTIVE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-telemetry text-xs">
        <div className="polar-card p-4 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">EXPEDITION FUEL SECURITY</span>
            <Fuel className="w-4 h-4 text-polar-cyan" />
          </div>
          <div className="text-xl font-bold text-slate-100">1,42,000 L</div>
          <div className="text-[11px] text-emerald-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>185 Days Winter Reserves Available</span>
          </div>
        </div>

        <div className="polar-card p-4 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">WINTERING COMPLEMENT</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">52 Scientists</div>
          <div className="text-[11px] text-slate-400">
            24 Maitri • 28 Bharati • 100% Fit
          </div>
        </div>

        <div className="polar-card p-4 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">EXPEDITION EFFICIENCY</span>
            <TrendingUp className="w-4 h-4 text-polar-amber" />
          </div>
          <div className="text-xl font-bold text-slate-100">+18.4%</div>
          <div className="text-[11px] text-slate-400">
            Compared to 43rd ISEA Fuel Burn Baseline
          </div>
        </div>

        <div className="polar-card p-4 space-y-2 shadow-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-bold">TREATY ENVIRONMENTAL IMPACT</span>
            <Leaf className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">Grade A</div>
          <div className="text-[11px] text-emerald-400">
            Zero Spill Violations Recorded
          </div>
        </div>
      </div>

      {/* PENDING APPROVALS QUEUE */}
      <div className="polar-card p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-polar-cyan" />
            <h2 className="text-xs font-bold text-slate-100 tracking-wider">
              MINISTRY EXECUTIVE REQUISITION & FLIGHT APPROVALS QUEUE
            </h2>
          </div>
          <span className="text-[10px] font-telemetry text-amber-400 font-bold">
            {approvals.filter((a) => a.status === 'pending').length} Action(s) Pending Review
          </span>
        </div>

        <div className="space-y-3">
          {approvals.map((item) => {
            const isPending = item.status === 'pending';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-lg border text-xs transition-all ${
                  isPending
                    ? 'bg-polar-950/90 border-slate-800/90 hover:border-slate-700 shadow-sm'
                    : 'bg-emerald-950/20 border-emerald-500/40 opacity-90'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                  <div className="flex items-center space-x-2">
                    <span className="font-telemetry text-polar-cyan font-bold">{item.code}</span>
                    <span className="text-slate-500">•</span>
                    <span className="font-bold text-slate-200">{item.title}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] font-telemetry">
                    <span className="text-slate-400">EST: {item.cost_estimate_inr}</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      isPending
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/60 animate-pulse'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-[11px] font-telemetry text-slate-400">
                  <div>
                    <span className="text-slate-500">Originating Officer: </span>
                    <span className="text-slate-300">{item.requested_by}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Deployment Staging: </span>
                    <span className="text-slate-300">{item.station}</span>
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-300">
                  <span className="text-slate-500 font-telemetry">Operational Justification: </span>
                  {item.justification}
                </div>

                {isPending && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-telemetry font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Grant Ministry Clearance & Sign</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
