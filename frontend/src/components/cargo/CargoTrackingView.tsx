'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Asset, AssetCategory, CustodyLogEntry } from '../../types';
import {
  Boxes,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Hash,
  Clock,
  User,
  MapPin,
  FileCheck2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const CargoTrackingView: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAsset, setActiveAsset] = useState<Asset | null>(null);
  const [integrityState, setIntegrityState] = useState<{ isValid: boolean; errorReason?: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showNewAssetModal, setShowNewAssetModal] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);

  // New Handoff Form
  const [handoffLocation, setHandoffLocation] = useState('Bharati Coastal Wharf');
  const [handoffAction, setHandoffAction] = useState('UNLOADED_FROM_VESSEL');
  const [handoffActor, setHandoffActor] = useState('Lt Cdr Arvind Pillai');

  // New Asset Form
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetCategory, setNewAssetCategory] = useState<AssetCategory>('scientific-equipment');
  const [newAssetWeight, setNewAssetWeight] = useState(1200);
  const [newAssetOrigin, setNewAssetOrigin] = useState('Cape Town Port');
  const [newAssetDest, setNewAssetDest] = useState('Bharati Station');

  const loadAssets = async () => {
    try {
      setLoading(true);
      const res = await api.getAssets();
      setAssets(res.assets);
      if (res.assets.length > 0 && !activeAsset) {
        setActiveAsset(res.assets[0]);
      }
    } catch (e) {
      console.error('Error loading assets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  // When activeAsset changes, inspect integrity
  useEffect(() => {
    if (activeAsset) {
      api.getAssetById(activeAsset.id).then((res) => {
        setIntegrityState(res.integrity);
      }).catch(() => {
        setIntegrityState({ isValid: true });
      });
    }
  }, [activeAsset]);

  const handleSimulateTamper = async () => {
    if (!activeAsset) return;
    try {
      setActionLoading(true);
      const res = await api.simulateTamper(activeAsset.id, 0);
      setActiveAsset(res.asset);
      setIntegrityState(res.integrity);
      setAssets((prev) => prev.map((a) => (a.id === res.asset.id ? res.asset : a)));
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRepairTamper = async () => {
    if (!activeAsset) return;
    try {
      setActionLoading(true);
      const res = await api.repairTamper(activeAsset.id);
      setActiveAsset(res.asset);
      setIntegrityState(res.integrity);
      setAssets((prev) => prev.map((a) => (a.id === res.asset.id ? res.asset : a)));
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateHandoff = async () => {
    if (!activeAsset) return;
    try {
      setActionLoading(true);
      const res = await api.appendCustodyHandoff(activeAsset.id, {
        actor_id: 'usr-officer',
        actor_name: handoffActor,
        actor_role: 'Logistics Officer',
        action: handoffAction,
        location: handoffLocation,
        condition: 'sealed_normal'
      });
      setActiveAsset(res.asset);
      setIntegrityState(res.integrity);
      setAssets((prev) => prev.map((a) => (a.id === res.asset.id ? res.asset : a)));
      setShowHandoffModal(false);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateNewAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssetName) return;
    try {
      setActionLoading(true);
      const res = await api.createAsset({
        name: newAssetName,
        category: newAssetCategory,
        weight_kg: newAssetWeight,
        origin: newAssetOrigin,
        destination: newAssetDest,
        actor_name: 'Cdr. Rajesh Nair'
      });
      setAssets((prev) => [res.asset, ...prev]);
      setActiveAsset(res.asset);
      setShowNewAssetModal(false);
      setNewAssetName('');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAssets = assets.filter((a) => {
    const matchesCat = selectedCategory === 'all' || a.category === selectedCategory;
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.current_location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto select-none">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Boxes className="w-5 h-5 text-polar-cyan" />
            <h1 className="text-xl font-bold text-slate-100 tracking-wide">CARGO & ASSET TRACKING</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident supply chain tracking across Goa HQ, Cape Town Staging, and Antarctic Stations with SHA-256 hash chains.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNewAssetModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded bg-polar-cyan/20 border border-polar-cyan text-polar-cyan hover:bg-polar-cyan/30 text-xs font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch New Asset</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-polar-900 border border-polar-800 text-xs">
        <div className="flex items-center space-x-2 flex-1 max-w-md bg-polar-950 px-3 py-1.5 rounded border border-slate-800">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by code, equipment name, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none w-full text-xs"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {['all', 'fuel', 'food', 'scientific-equipment', 'medical', 'spares'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-[11px] font-telemetry uppercase transition-all ${
                selectedCategory === cat
                  ? 'bg-polar-cyan text-polar-950 font-bold'
                  : 'bg-polar-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* TWO-PANE LAYOUT: Asset Table on Left, Blockchain Custody Explorer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Asset Catalog (5 Cols) */}
        <div className="lg:col-span-5 space-y-2 max-h-[750px] overflow-y-auto pr-1">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-xs font-telemetry">Loading cargo catalog...</div>
          ) : filteredAssets.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No assets match your search.</div>
          ) : (
            filteredAssets.map((asset) => {
              const isSelected = activeAsset?.id === asset.id;
              const isTampered = asset.custody_log.some((c) => c.tamper_detected);

              return (
                <div
                  key={asset.id}
                  onClick={() => setActiveAsset(asset)}
                  className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? isTampered
                        ? 'bg-red-950/30 border-red-500 text-slate-100 shadow-md'
                        : 'bg-polar-850 border-polar-cyan text-slate-100 shadow-md'
                      : 'bg-polar-900/70 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-telemetry text-[11px] font-bold text-polar-cyan">{asset.code}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-telemetry font-bold ${
                      asset.priority === 'emergency' ? 'bg-red-950 text-red-400 border border-red-800' :
                      asset.priority === 'critical' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {asset.priority.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-200 mt-1">{asset.name}</h3>

                  <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] text-slate-400 font-telemetry">
                    <div>
                      <span className="text-slate-500">Weight: </span>
                      <span className="text-slate-200 font-semibold">{asset.weight_kg.toLocaleString()} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Status: </span>
                      <span className={asset.status === 'in_transit' ? 'text-polar-amber font-bold' : 'text-slate-200'}>
                        {asset.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-telemetry">
                    <div className="flex items-center space-x-1 truncate">
                      <MapPin className="w-3 h-3 text-polar-cyan shrink-0" />
                      <span className="truncate">{asset.current_location}</span>
                    </div>
                    <span className="text-slate-500">{asset.custody_log.length} Blocks</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: Blockchain Custody Explorer (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeAsset ? (
            <div className="polar-card p-5 space-y-4 shadow-xl">
              {/* ASSET HEADER & TAMPER DEMO CONTROLS */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-telemetry font-bold bg-sky-950 text-sky-400 border border-sky-700">
                      {activeAsset.category.toUpperCase()}
                    </span>
                    <span className="text-xs font-telemetry text-slate-400">{activeAsset.code}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-100 mt-1">{activeAsset.name}</h2>
                </div>

                {/* Verification Badge */}
                <div className="flex items-center space-x-2">
                  {integrityState?.isValid ? (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-xs font-telemetry">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold">INTEGRITY VERIFIED</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-red-950/80 border border-red-500 text-red-300 text-xs font-telemetry animate-pulse">
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                      <span className="font-bold">TAMPER DETECTED!</span>
                    </div>
                  )}
                </div>
              </div>

              {/* JUDGE DEMO CONTROLS (Tamper Simulation) */}
              <div className="p-3 rounded bg-polar-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-polar-amber" />
                  <span className="text-slate-300 font-semibold">Judge Demo Controls:</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowHandoffModal(true)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-telemetry"
                  >
                    + Append Handoff
                  </button>

                  <button
                    onClick={handleSimulateTamper}
                    disabled={actionLoading}
                    className="px-2.5 py-1 rounded bg-red-950 border border-red-500/70 text-red-300 hover:bg-red-900/50 font-telemetry font-bold transition-all"
                    title="Alters a character in a past custody block without valid cryptographic proof to demonstrate tamper alert"
                  >
                    Simulate Tamper
                  </button>

                  <button
                    onClick={handleRepairTamper}
                    disabled={actionLoading}
                    className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-500/70 text-emerald-300 hover:bg-emerald-900/50 font-telemetry font-bold transition-all"
                    title="Restores valid custody chain"
                  >
                    Repair Chain
                  </button>
                </div>
              </div>

              {/* Cryptographic alert banner if broken */}
              {!integrityState?.isValid && (
                <div className="p-3 rounded bg-red-950/70 border border-red-500/80 text-red-200 text-xs space-y-1 animate-pulse">
                  <div className="font-bold flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>CRYPTOGRAPHIC BREACH ALERT: HASH MISMATCH</span>
                  </div>
                  <div className="font-telemetry text-[11px] text-red-300">
                    {integrityState?.errorReason || 'Audit log payload was modified out-of-band. Cryptographic signature chain broken.'}
                  </div>
                </div>
              )}

              {/* BLOCKCHAIN BLOCKS CHAIN VISUALIZER */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-telemetry text-slate-400 uppercase tracking-wider font-semibold">
                  IMMUTABLE CUSTODY BLOCKS ({activeAsset.custody_log.length} SEQUENTIAL BLOCKS)
                </div>

                <div className="space-y-3 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
                  {activeAsset.custody_log.map((block, idx) => {
                    const isTampered = block.tamper_detected;

                    return (
                      <div
                        key={idx}
                        className={`relative pl-11 text-xs transition-all ${
                          isTampered ? 'opacity-100' : ''
                        }`}
                      >
                        {/* Node circle on timeline */}
                        <div className={`absolute left-3.5 top-3 w-3.5 h-3.5 rounded-full border-2 transform -translate-x-1/2 ${
                          isTampered ? 'bg-red-500 border-red-300 animate-ping-slow' : 'bg-polar-950 border-polar-cyan'
                        }`} />

                        <div className={`p-3.5 rounded-lg border ${
                          isTampered
                            ? 'bg-red-950/40 border-red-500 shadow-md'
                            : 'bg-polar-950/80 border-slate-800/90 hover:border-slate-700'
                        }`}>
                          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                            <div className="flex items-center space-x-2 font-telemetry">
                              <span className="font-bold text-polar-cyan">BLOCK #{block.index}</span>
                              <span className="text-slate-500">•</span>
                              <span className="text-slate-300 font-semibold">{block.action}</span>
                            </div>
                            <span className="text-[10px] font-telemetry text-slate-500">
                              {new Date(block.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] font-telemetry">
                            <div>
                              <span className="text-slate-500">Custodian: </span>
                              <span className="text-slate-200 font-semibold">{block.actor_name}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Location: </span>
                              <span className={isTampered ? 'text-red-400 font-bold underline' : 'text-slate-200'}>
                                {block.location}
                              </span>
                            </div>
                          </div>

                          {/* Cryptographic Hashes */}
                          <div className="mt-2.5 pt-2 border-t border-slate-800/60 space-y-1 font-telemetry text-[10px]">
                            <div className="flex items-center justify-between text-slate-500 truncate">
                              <span>PREV HASH:</span>
                              <span className="text-slate-400 font-mono truncate max-w-[280px]">
                                {block.prev_hash}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-slate-500 truncate">
                              <span className={isTampered ? 'text-red-400 font-bold' : 'text-polar-cyan'}>
                                CURRENT HASH:
                              </span>
                              <span className={`font-mono truncate max-w-[280px] ${isTampered ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                                {block.current_hash}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="polar-card p-12 text-center text-slate-500 text-xs">
              Select an asset on the left to inspect its cryptographic custody ledger.
            </div>
          )}
        </div>
      </div>

      {/* APPEND HANDOFF MODAL */}
      {showHandoffModal && activeAsset && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="polar-card p-6 max-w-md w-full space-y-4 border-polar-cyan shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <FileCheck2 className="w-4 h-4 text-polar-cyan" />
              <span>Append Cryptographic Custody Handoff</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Asset:</label>
                <div className="font-telemetry text-polar-cyan font-bold">{activeAsset.code} - {activeAsset.name}</div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Action Type:</label>
                <select
                  value={handoffAction}
                  onChange={(e) => setHandoffAction(e.target.value)}
                  className="w-full bg-polar-950 border border-slate-800 rounded p-2 text-slate-200"
                >
                  <option value="UNLOADED_FROM_VESSEL">UNLOADED_FROM_VESSEL</option>
                  <option value="TRANSFERRED_TO_STATION">TRANSFERRED_TO_STATION</option>
                  <option value="INSPECTED_AT_DEPOT">INSPECTED_AT_DEPOT</option>
                  <option value="LOADED_ONTO_AIRCRAFT">LOADED_ONTO_AIRCRAFT</option>
                  <option value="SECURED_IN_COLD_VAULT">SECURED_IN_COLD_VAULT</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">New Custody Location:</label>
                <input
                  type="text"
                  value={handoffLocation}
                  onChange={(e) => setHandoffLocation(e.target.value)}
                  className="w-full bg-polar-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Signing Officer Name:</label>
                <input
                  type="text"
                  value={handoffActor}
                  onChange={(e) => setHandoffActor(e.target.value)}
                  className="w-full bg-polar-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowHandoffModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHandoff}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded bg-polar-cyan text-polar-950 font-bold hover:bg-sky-400 text-xs"
              >
                {actionLoading ? 'Signing...' : 'Sign Block & Append'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW ASSET MODAL */}
      {showNewAssetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateNewAsset} className="polar-card p-6 max-w-md w-full space-y-4 border-polar-cyan shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Plus className="w-4 h-4 text-polar-cyan" />
              <span>Dispatch New Polar Asset</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Asset Name / Description:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cryospheric Seismometer Suite"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  className="w-full bg-polar-950 border border-slate-800 rounded p-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Category:</label>
                  <select
                    value={newAssetCategory}
                    onChange={(e) => setNewAssetCategory(e.target.value as AssetCategory)}
                    className="w-full bg-polar-950 border border-slate-800 rounded p-2 text-slate-200"
                  >
                    <option value="scientific-equipment">Scientific</option>
                    <option value="fuel">Fuel</option>
                    <option value="food">Food</option>
                    <option value="medical">Medical</option>
                    <option value="spares">Spares</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Weight (kg):</label>
                  <input
                    type="number"
                    min="1"
                    value={newAssetWeight}
                    onChange={(e) => setNewAssetWeight(Number(e.target.value))}
                    className="w-full bg-polar-950 border border-slate-800 rounded p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Origin Port:</label>
                  <input
                    type="text"
                    value={newAssetOrigin}
                    onChange={(e) => setNewAssetOrigin(e.target.value)}
                    className="w-full bg-polar-950 border border-slate-800 rounded p-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Destination Station:</label>
                  <select
                    value={newAssetDest}
                    onChange={(e) => setNewAssetDest(e.target.value)}
                    className="w-full bg-polar-950 border border-slate-800 rounded p-2 text-slate-200"
                  >
                    <option value="Bharati Station">Bharati Station</option>
                    <option value="Maitri Station">Maitri Station</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewAssetModal(false)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-3 py-1.5 rounded bg-polar-cyan text-polar-950 font-bold hover:bg-sky-400 text-xs"
              >
                {actionLoading ? 'Initializing...' : 'Genesis Hash & Dispatch'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
