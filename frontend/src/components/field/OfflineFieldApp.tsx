'use client';

import React, { useState, useEffect } from 'react';
import { usePolarStore } from '../../lib/store';
import { api } from '../../lib/api';
import { queueOfflineAction, getPendingActions, markActionsSynced, PendingAction } from '../../lib/dexieDb';
import {
  TabletSmartphone,
  Satellite,
  QrCode,
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  Layers,
  Fuel,
  RefreshCw,
  ScanLine,
  MapPin,
  Flame,
  Radio
} from 'lucide-react';

export const OfflineFieldApp: React.FC = () => {
  const { satellite, setSatellite, pendingSyncCount, setPendingSyncCount } = usePolarStore();

  const [pendingQueue, setPendingQueue] = useState<PendingAction[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Field Forms State
  const [selectedStation, setSelectedStation] = useState('Bharati Station');
  const [checkoutItem, setCheckoutItem] = useState('Arctic-Grade Diesel');
  const [checkoutAmount, setCheckoutAmount] = useState(200);
  const [technicianName, setTechnicianName] = useState('Vikramaditya Chauhan');

  // Hazard Report Form
  const [hazardTitle, setHazardTitle] = useState('');
  const [hazardGps, setHazardGps] = useState('69.4120°S, 76.1950°E');
  const [hazardSeverity, setHazardSeverity] = useState('priority_2_urgent');

  // Scanner Simulator
  const [scanning, setScanning] = useState(false);

  // Refresh pending queue from IndexedDB
  const refreshQueue = async () => {
    try {
      const actions = await getPendingActions();
      setPendingQueue(actions);
      setPendingSyncCount(actions.length);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    refreshQueue();
  }, []);

  // Flush Queue to Backend when Satellite Link is ACTIVE
  const flushSyncQueue = async () => {
    if (satellite.status !== 'active') {
      setNotification('SYNC DELAYED: Satellite window currently closed. Actions remain safely queued in local IndexedDB.');
      setTimeout(() => setNotification(null), 4000);
      return;
    }

    const actions = await getPendingActions();
    if (actions.length === 0) return;

    try {
      setSyncing(true);
      const res = await api.batchSync(actions);
      await markActionsSynced(actions.map((a) => a.id));
      await refreshQueue();
      setNotification(`SATELLITE SYNC COMPLETE: ${res.processed} field action(s) reconciled with NCPOR Central Database!`);
      setTimeout(() => setNotification(null), 5000);
    } catch (e: any) {
      setNotification(`Sync error: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // Watch for satellite transitions to 'active' -> auto flush!
  useEffect(() => {
    if (satellite.status === 'active') {
      flushSyncQueue();
    }
  }, [satellite.status]);

  // Inventory Dispense Submit
  const handleInventoryCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = await queueOfflineAction('inventory_checkout', {
      inventory_id: selectedStation.includes('Maitri') ? 'inv-mai-01' : 'inv-bha-01',
      item_name: checkoutItem,
      amount: checkoutAmount,
      station_name: selectedStation,
      actor_name: technicianName
    });

    await refreshQueue();
    setNotification(`Action Queued Locally: Dispensed ${checkoutAmount} units of ${checkoutItem}`);
    setTimeout(() => setNotification(null), 3500);

    // Auto flush if online
    if (satellite.status === 'active') {
      flushSyncQueue();
    }
  };

  // Crevasse / Hazard Report Submit
  const handleHazardReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hazardTitle) return;

    const action = await queueOfflineAction('incident_report', {
      title: hazardTitle,
      description: `Field incident logged via ruggedized terminal at GPS ${hazardGps} by ${technicianName}`,
      station_id: selectedStation.includes('Maitri') ? 'maitri' : 'bharati',
      severity: hazardSeverity
    });

    await refreshQueue();
    setHazardTitle('');
    setNotification(`Hazard Queued Locally: ${hazardTitle}`);
    setTimeout(() => setNotification(null), 3500);

    if (satellite.status === 'active') {
      flushSyncQueue();
    }
  };

  // RFID Scan Simulator
  const handleSimulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setCheckoutItem('Arctic Diesel 200L Drum (RFID #RF-9942)');
      setCheckoutAmount(200);
      setScanning(false);
      setNotification('RFID Tag Scanned: Arctic Diesel 200L Drum identified');
      setTimeout(() => setNotification(null), 3000);
    }, 800);
  };

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto select-none">
      {/* RUGGEDIZED TERMINAL BANNER */}
      <div className="polar-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-polar-cyan shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded bg-polar-950 border border-polar-cyan flex items-center justify-center text-polar-cyan shadow-md">
            <TabletSmartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold text-slate-100 tracking-wider">
                RUGGEDIZED POLAR FIELD TERMINAL
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-telemetry">
                IDB v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-telemetry">
              Station Field Operations • IndexedDB Offline Cache • Auto-Sync on Satellite Pass
            </p>
          </div>
        </div>

        {/* SATELLITE WINDOW TOGGLE BUTTON */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              const newStatus = satellite.status === 'active' ? 'closed' : 'active';
              setSatellite({
                status: newStatus,
                bandwidth_kbps: newStatus === 'active' ? 128 : 0,
                signal_strength_pct: newStatus === 'active' ? 94 : 0
              });
            }}
            className={`px-3 py-2 rounded-lg text-xs font-telemetry font-bold flex items-center space-x-2 border transition-all shadow-md ${
              satellite.status === 'active'
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-red-950/90 border-red-500 text-red-300 hover:bg-red-900/60 animate-pulse'
            }`}
          >
            <Satellite className="w-4 h-4" />
            <span>
              {satellite.status === 'active' ? 'SATELLITE LINK: ACTIVE' : 'SATELLITE LINK: CLOSED'}
            </span>
          </button>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {notification && (
        <div className="p-3 rounded-lg bg-polar-cyan/15 border border-polar-cyan text-polar-cyan text-xs font-telemetry flex items-center justify-between shadow-lg animate-in fade-in">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white text-xs ml-2">
            ✕
          </button>
        </div>
      )}

      {/* MAIN TWO COLUMN FIELD ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. QUICK INVENTORY DISPENSE & RFID SCAN */}
        <div className="polar-card p-5 space-y-4 shadow-lg">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
              <Fuel className="w-4 h-4 text-polar-cyan" />
              <span>FIELD CARGO DISPENSING / CHECK-OUT</span>
            </div>
            <button
              type="button"
              onClick={handleSimulateScan}
              disabled={scanning}
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-sky-950 border border-sky-500 text-sky-300 hover:bg-sky-900/50 text-[11px] font-telemetry"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>{scanning ? 'Reading...' : 'Scan RFID'}</span>
            </button>
          </div>

          <form onSubmit={handleInventoryCheckout} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Station / Outpost:</label>
              <select
                value={selectedStation}
                onChange={(e) => setSelectedStation(e.target.value)}
                className="w-full bg-polar-950 border border-slate-800 rounded p-2.5 text-slate-200 text-xs font-telemetry"
              >
                <option value="Bharati Station">Bharati Station (Larsemann Hills)</option>
                <option value="Maitri Station">Maitri Station (Schirmacher Oasis)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Item to Dispense:</label>
              <input
                type="text"
                value={checkoutItem}
                onChange={(e) => setCheckoutItem(e.target.value)}
                className="w-full bg-polar-950 border border-slate-800 rounded p-2.5 text-slate-200 text-xs font-telemetry"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Quantity (Liters / Units):</label>
                <input
                  type="number"
                  min="1"
                  value={checkoutAmount}
                  onChange={(e) => setCheckoutAmount(Number(e.target.value))}
                  className="w-full bg-polar-950 border border-slate-800 rounded p-2.5 text-slate-200 text-xs font-telemetry"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Technician Call-Sign:</label>
                <input
                  type="text"
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full bg-polar-950 border border-slate-800 rounded p-2.5 text-slate-200 text-xs font-telemetry"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-polar-cyan text-polar-950 font-bold hover:bg-sky-400 text-xs font-telemetry shadow-lg transition-all mt-2"
            >
              Record Dispense in Offline Cache
            </button>
          </form>
        </div>

        {/* 2. FIELD HAZARD & CREVASSE REPORT */}
        <div className="polar-card p-5 space-y-4 shadow-lg">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 text-xs font-bold text-slate-200">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>OFFLINE CREVASSE & HAZARD LOG</span>
          </div>

          <form onSubmit={handleHazardReport} className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-semibold">Hazard Summary:</label>
              <input
                type="text"
                required
                placeholder="e.g. Unmapped crevasse spotted along traverse route Bra-04"
                value={hazardTitle}
                onChange={(e) => setHazardTitle(e.target.value)}
                className="w-full bg-polar-950 border border-slate-800 rounded p-2.5 text-slate-200 text-xs font-telemetry"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">GPS Waypoint (Auto-Captured):</label>
                <div className="flex items-center space-x-1.5 bg-polar-950 border border-slate-800 rounded p-2 text-slate-300 font-telemetry text-xs">
                  <MapPin className="w-3.5 h-3.5 text-polar-cyan shrink-0" />
                  <input
                    type="text"
                    value={hazardGps}
                    onChange={(e) => setHazardGps(e.target.value)}
                    className="bg-transparent text-slate-200 w-full focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Severity:</label>
                <select
                  value={hazardSeverity}
                  onChange={(e) => setHazardSeverity(e.target.value)}
                  className="w-full bg-polar-950 border border-slate-800 rounded p-2.5 text-slate-200 text-xs font-telemetry"
                >
                  <option value="priority_2_urgent">Priority 2 - Urgent</option>
                  <option value="priority_1_critical">Priority 1 - Critical Whiteout</option>
                  <option value="priority_3_elevated">Priority 3 - Elevated Caution</option>
                </select>
              </div>
            </div>

            <div className="p-2.5 rounded bg-polar-950/70 border border-slate-800 text-[11px] text-slate-400 font-telemetry">
              Automatic offline storage ensures crevasse coordinates are logged immediately even if deep inside polar dead-zones.
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-500 text-xs font-telemetry shadow-lg transition-all mt-2"
            >
              Log Hazard to Offline Queue
            </button>
          </form>
        </div>
      </div>

      {/* 3. SYNC TELEMETRY DRAWER (Pending Offline Queue) */}
      <div className="polar-card p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-polar-cyan" />
            <h3 className="text-xs font-bold text-slate-200 tracking-wider">
              PENDING OFFLINE TRANSMISSION QUEUE ({pendingQueue.length} ACTIONS)
            </h3>
          </div>

          <button
            onClick={flushSyncQueue}
            disabled={syncing || pendingQueue.length === 0}
            className={`px-3 py-1.5 rounded text-xs font-telemetry font-bold flex items-center space-x-1.5 ${
              pendingQueue.length > 0 && satellite.status === 'active'
                ? 'bg-polar-cyan text-polar-950 hover:bg-sky-400 shadow-md'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Transmitting Batch...' : 'Flush Queue Now'}</span>
          </button>
        </div>

        {pendingQueue.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-telemetry">
            All offline field actions synchronized with NCPOR headquarters. Queue is clean.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {pendingQueue.map((act) => (
              <div key={act.id} className="p-3 rounded-lg bg-polar-950 border border-slate-800/90 text-xs font-telemetry flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-amber-400 font-bold uppercase">{act.action_type.replace('_', ' ')}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-300">{new Date(act.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    {JSON.stringify(act.payload)}
                  </div>
                </div>

                <div className="px-2 py-1 rounded bg-amber-950/80 text-amber-300 border border-amber-600 text-[10px] shrink-0 font-bold">
                  PENDING SYNC
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
