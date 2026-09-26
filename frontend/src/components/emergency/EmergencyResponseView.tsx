'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { EmergencyIncident } from '../../types';
import { usePolarStore } from '../../lib/store';
import {
  ShieldAlert,
  Flame,
  Wind,
  Stethoscope,
  Radio,
  FileText,
  Clock,
  Printer,
  AlertOctagon,
  CheckCircle2,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const EmergencyResponseView: React.FC = () => {
  const { emergencyTriggerOpen, setEmergencyTriggerOpen } = usePolarStore();
  const [incidents, setIncidents] = useState<EmergencyIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<EmergencyIncident | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  // Form states
  const [emgType, setEmgType] = useState<'medical_evacuation' | 'blizzard_lockdown' | 'fuel_rupture'>('medical_evacuation');
  const [emgStation, setEmgStation] = useState<'maitri' | 'bharati'>('maitri');
  const [emgNotes, setEmgNotes] = useState('');

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const res = await api.getIncidents();
      setIncidents(res.incidents);
      if (res.incidents.length > 0 && !selectedIncident) {
        setSelectedIncident(res.incidents[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleTriggerEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setTriggering(true);
      const res = await api.triggerEmergency({
        type: emgType,
        station_id: emgStation,
        notes: emgNotes
      });
      setIncidents((prev) => [res.incident, ...prev]);
      setSelectedIncident(res.incident);
      setEmergencyTriggerOpen(false);
      setEmgNotes('');
    } catch (e) {
      console.error(e);
    } finally {
      setTriggering(false);
    }
  };

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto select-none">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
            <h1 className="text-xl font-bold text-slate-100 tracking-wide">
              EMERGENCY PROTOCOL & SEARCH-AND-RESCUE (SAR)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official Ministry of Earth Sciences (MoES) Polar Emergency Response Framework and aeromedical dispatch engine.
          </p>
        </div>

        <button
          onClick={() => setEmergencyTriggerOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-2 rounded bg-red-950 border border-red-500 text-red-300 hover:bg-red-900/50 text-xs font-bold font-telemetry shadow-lg transition-all animate-pulse"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>DECLARE POLAR EMERGENCY</span>
        </button>
      </div>

      {/* TWO-COLUMN LAYOUT: Incident History on Left, Detailed Structured Order on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INCIDENT LOGS (4 Cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-telemetry text-slate-400 uppercase tracking-wider font-semibold pb-1">
            CRISIS INCIDENT LOGS ({incidents.length})
          </div>

          {loading ? (
            <div className="polar-card p-8 text-center text-slate-500 text-xs font-telemetry">Loading incidents...</div>
          ) : incidents.length === 0 ? (
            <div className="polar-card p-8 text-center text-slate-500 text-xs">
              No active emergency incidents reported.
            </div>
          ) : (
            incidents.map((inc) => {
              const isSelected = selectedIncident?.id === inc.id;

              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-red-950/40 border-red-500 text-slate-100 shadow-md'
                      : 'bg-polar-900/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-telemetry text-[11px] font-bold text-red-400">{inc.incident_code}</span>
                    <span className="text-[10px] font-telemetry text-slate-500">
                      {new Date(inc.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-200 mt-1">{inc.title}</h3>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px] font-telemetry text-slate-400">
                    <span>{inc.station_name}</span>
                    <span className="text-amber-400 font-bold">{inc.status.toUpperCase()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* STRUCTURED EMERGENCY DISPATCH ORDER (8 Cols) */}
        <div className="lg:col-span-8">
          {selectedIncident ? (
            <div className="polar-card-emergency p-6 space-y-5 shadow-2xl">
              {/* ORDER HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-red-500/40">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-telemetry font-bold bg-red-950 text-red-300 border border-red-500">
                      {selectedIncident.severity.toUpperCase().replace('_', ' ')}
                    </span>
                    <span className="text-xs font-telemetry text-red-300 font-bold">
                      {selectedIncident.incident_code}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-100 mt-1">{selectedIncident.title}</h2>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1 rounded bg-black/40 border border-slate-700 text-slate-300 text-xs font-telemetry">
                    CLEARANCE: <span className="text-polar-cyan font-bold">{selectedIncident.clearance_code}</span>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    title="Print / Save PDF Incident Dispatch Brief"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="p-3.5 rounded bg-black/40 border border-red-900/60 text-xs text-slate-200 leading-relaxed font-telemetry">
                {selectedIncident.description}
              </div>

              {/* TACTICAL SAR DISPATCH DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-telemetry text-xs">
                <div className="p-3 rounded bg-black/40 border border-red-900/40">
                  <span className="text-[10px] text-slate-400 block mb-0.5">RECOMMENDED TRANSPORT VEHICLE</span>
                  <span className="text-polar-cyan font-bold">
                    {selectedIncident.evacuation_plan.recommended_vehicle}
                  </span>
                </div>

                <div className="p-3 rounded bg-black/40 border border-red-900/40">
                  <span className="text-[10px] text-slate-400 block mb-0.5">ESTIMATED EVACUATION TIME (ETA)</span>
                  <span className="text-amber-400 font-bold">
                    {selectedIncident.evacuation_plan.eta_hours} Hours Transit
                  </span>
                </div>

                <div className="p-3 rounded bg-black/40 border border-red-900/40">
                  <span className="text-[10px] text-slate-400 block mb-0.5">TERTIARY HOSPITAL DIVERSION</span>
                  <span className="text-slate-200 font-bold">
                    {selectedIncident.evacuation_plan.tertiary_facility}
                  </span>
                </div>

                <div className="p-3 rounded bg-black/40 border border-red-900/40">
                  <span className="text-[10px] text-slate-400 block mb-0.5">EMERGENCY COMMS FREQUENCY</span>
                  <span className="text-emerald-400 font-bold">
                    {selectedIncident.evacuation_plan.comms_frequency}
                  </span>
                </div>
              </div>

              {/* IMMEDIATE OPERATIONAL ACTION CHECKLIST */}
              <div className="space-y-2 pt-2 border-t border-red-900/60">
                <div className="text-xs font-telemetry text-slate-300 uppercase tracking-wider font-semibold">
                  IMMEDIATE SAR OPERATIONAL CHECKLIST
                </div>
                <div className="space-y-1.5">
                  {selectedIncident.evacuation_plan.action_checklist.map((item, idx) => (
                    <div key={idx} className="p-2 rounded bg-black/30 border border-red-950 flex items-center space-x-2 text-xs text-slate-300 font-telemetry">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SIGN-OFF FOOTER */}
              <div className="pt-3 border-t border-red-900/60 flex items-center justify-between text-[11px] font-telemetry text-slate-400">
                <span>AUTHORIZED BY: {selectedIncident.evacuation_plan.authorized_by}</span>
                <span className="text-emerald-400">STATUS: OFFICIAL DISPATCH ACTIVE</span>
              </div>
            </div>
          ) : (
            <div className="polar-card p-12 text-center text-slate-500 text-xs">
              Select an incident or trigger a new crisis to generate an official MoES SAR Dispatch Order.
            </div>
          )}
        </div>
      </div>

      {/* TRIGGER EMERGENCY MODAL */}
      {emergencyTriggerOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleTriggerEmergency} className="polar-card-emergency p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-red-300 flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
              <span>MoES Crisis Declaration & SAR Order Generator</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Emergency Scenario Type:</label>
                <select
                  value={emgType}
                  onChange={(e) => setEmgType(e.target.value as any)}
                  className="w-full bg-polar-950 border border-red-800 rounded p-2 text-slate-200"
                >
                  <option value="medical_evacuation">
                    Critical MEDEVAC (Aero-medical evacuation to Cape Town)
                  </option>
                  <option value="blizzard_lockdown">
                    Category-5 Katabatic Blizzard Code-Red (Station Lockdown)
                  </option>
                  <option value="fuel_rupture">
                    Polar Fuel Line Rupture (Environmental Containment)
                  </option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Affected Base Station:</label>
                <select
                  value={emgStation}
                  onChange={(e) => setEmgStation(e.target.value as any)}
                  className="w-full bg-polar-950 border border-red-800 rounded p-2 text-slate-200"
                >
                  <option value="maitri">Maitri Station (Schirmacher Oasis)</option>
                  <option value="bharati">Bharati Station (Larsemann Hills)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Clinical / Incident Telemetry Notes:</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Field researcher sustained severe compound tibial fracture during glacier traverse. Internal hemorrhage risk."
                  value={emgNotes}
                  onChange={(e) => setEmgNotes(e.target.value)}
                  className="w-full bg-polar-950 border border-red-800 rounded p-2 text-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-red-900/80">
              <button
                type="button"
                onClick={() => setEmergencyTriggerOpen(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={triggering}
                className="px-3 py-1.5 rounded bg-red-600 text-white font-bold hover:bg-red-500 text-xs font-telemetry shadow-lg"
              >
                {triggering ? 'Authorizing...' : 'Authorize Clearance & Transmit Order'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
