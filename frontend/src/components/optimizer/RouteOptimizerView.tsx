'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { RouteRecommendation, AssetCategory } from '../../types';
import {
  Route,
  Plane,
  Ship,
  Scale,
  Clock,
  IndianRupee,
  Leaf,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  Fuel,
  Info,
  Sliders
} from 'lucide-react';

export const RouteOptimizerView: React.FC = () => {
  const [origin, setOrigin] = useState('Cape Town Logistics Hub');
  const [destination, setDestination] = useState('Bharati Station');
  const [weightKg, setWeightKg] = useState<number>(1800);
  const [category, setCategory] = useState<AssetCategory>('scientific-equipment');
  const [urgency, setUrgency] = useState<'routine' | 'critical' | 'emergency'>('routine');
  const [seaIce, setSeaIce] = useState<'low' | 'moderate' | 'severe'>('moderate');

  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<RouteRecommendation | null>(null);

  const calculateRoute = async () => {
    try {
      setLoading(true);
      const res = await api.recommendRoute({
        origin,
        destination,
        weight: weightKg,
        category,
        urgency,
        sea_ice: seaIce
      });
      setRecommendation(res.recommendation);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateRoute();
  }, [origin, destination, weightKg, category, urgency, seaIce]);

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto select-none">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Route className="w-5 h-5 text-polar-cyan" />
            <h1 className="text-xl font-bold text-slate-100 tracking-wide">ROUTE & MODE OPTIMIZER</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic polar multi-modal trade-off matrix: aircraft payload ceilings, mandatory Maitri refueling stopovers, and sea-ice impact.
          </p>
        </div>

        {/* Real World Constraints Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded bg-amber-950/40 border border-amber-500/50 text-amber-300 text-xs font-telemetry">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>CONSTRAINT: ZERO DIRECT CPT-BHARATI AIR ACCESS</span>
        </div>
      </div>

      {/* INPUT CALCULATOR & SELECTIONS */}
      <div className="polar-card p-5 space-y-4 shadow-lg">
        <div className="flex items-center space-x-2 pb-2 border-b border-slate-800 text-xs font-semibold text-slate-300">
          <Sliders className="w-4 h-4 text-polar-cyan" />
          <span>CARGO DISPATCH SPECIFICATIONS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          {/* Origin */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Origin Hub:</label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full bg-polar-950 border border-slate-800 rounded p-2 text-slate-200"
            >
              <option value="Cape Town Logistics Hub">Cape Town Hub (FACT)</option>
              <option value="Maitri Station">Maitri Station (Schirmacher)</option>
              <option value="NCPOR Goa">NCPOR Goa Headquarters</option>
            </select>
          </div>

          {/* Destination */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Destination:</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full bg-polar-950 border border-slate-800 rounded p-2 text-slate-200"
            >
              <option value="Bharati Station">Bharati Station (Coastal)</option>
              <option value="Maitri Station">Maitri Station (Inland)</option>
            </select>
          </div>

          {/* Cargo Weight */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">
              Weight: <span className="text-polar-cyan font-telemetry font-bold">{weightKg.toLocaleString()} kg</span>
            </label>
            <input
              type="range"
              min="100"
              max="15000"
              step="100"
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              className="w-full accent-polar-cyan cursor-pointer mt-1"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-telemetry mt-1">
              <span>100 kg</span>
              <span>2.5T (Basler Max)</span>
              <span>15T</span>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Cargo Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as AssetCategory)}
              className="w-full bg-polar-950 border border-slate-800 rounded p-2 text-slate-200"
            >
              <option value="scientific-equipment">Scientific Instrument</option>
              <option value="fuel">Fuel (Arctic Diesel / Jet A-1)</option>
              <option value="medical">Medical / Critical Trauma</option>
              <option value="food">Food Provisions</option>
              <option value="spares">Machinery Spares</option>
            </select>
          </div>

          {/* Urgency */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Mission Urgency:</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as any)}
              className="w-full bg-polar-950 border border-slate-800 rounded p-2 text-slate-200"
            >
              <option value="routine">Routine Resupply</option>
              <option value="critical">Priority Critical</option>
              <option value="emergency">Emergency Priority-1</option>
            </select>
          </div>

          {/* Sea-Ice Severity */}
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Sea-Ice Pack Severity:</label>
            <select
              value={seaIce}
              onChange={(e) => setSeaIce(e.target.value as any)}
              className="w-full bg-polar-950 border border-slate-800 rounded p-2 text-slate-200"
            >
              <option value="low">Low Pack Ice (0-20%)</option>
              <option value="moderate">Moderate Pack (30-50%)</option>
              <option value="severe">Severe Pack (70-90%)</option>
            </select>
          </div>
        </div>
      </div>

      {/* RECOMMENDATION RESULTS */}
      {recommendation && (
        <div className="space-y-6">
          {/* PRIMARY RECOMMENDATION CARD */}
          <div className="polar-card-glow p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  recommendation.recommended_mode === 'air' ? 'bg-amber-950 border border-amber-500 text-amber-400' :
                  recommendation.recommended_mode === 'split' ? 'bg-purple-950 border border-purple-500 text-purple-400' :
                  'bg-sky-950 border border-sky-500 text-sky-400'
                }`}>
                  {recommendation.recommended_mode === 'air' ? <Plane className="w-6 h-6" /> :
                   recommendation.recommended_mode === 'split' ? <Scale className="w-6 h-6" /> :
                   <Ship className="w-6 h-6" />}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-telemetry uppercase tracking-wider text-slate-400 font-bold">
                      RECOMMENDED TRANSPORT MODE
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-telemetry font-bold ${
                      recommendation.recommended_mode === 'air' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      recommendation.recommended_mode === 'split' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                      'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                    }`}>
                      {recommendation.recommended_mode.toUpperCase()} LOGISTICS
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-100 mt-0.5">{recommendation.summary}</h2>
                </div>
              </div>

              {/* Status flag */}
              {recommendation.maitri_stopover_required && (
                <div className="px-3 py-1.5 rounded bg-amber-950/60 border border-amber-500/60 text-amber-300 text-xs font-telemetry">
                  Maitri Stopover + Skiway Refuel Enforced
                </div>
              )}
            </div>

            {/* PAYLOAD LIMIT WARNING (If weight exceeds aircraft limits) */}
            {recommendation.payload_limit_warning && (
              <div className="p-3.5 rounded bg-red-950/70 border border-red-500/80 text-red-200 text-xs space-y-1">
                <div className="flex items-center space-x-2 font-bold text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>AIRCRAFT PAYLOAD EXCEEDED</span>
                </div>
                <div className="text-[11px] font-telemetry">{recommendation.payload_limit_warning}</div>
              </div>
            )}

            {/* SMART CARGO SPLITTER PROPOSAL */}
            {recommendation.cargo_split_proposal && (
              <div className="p-4 rounded-lg bg-purple-950/40 border border-purple-500/50 space-y-2 text-xs">
                <div className="flex items-center space-x-2 font-bold text-purple-300">
                  <Scale className="w-4 h-4" />
                  <span>SMART CARGO SPLITTER PROPOSAL</span>
                </div>
                <p className="text-slate-300 text-[11px] font-telemetry">
                  {recommendation.cargo_split_proposal.rationale}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] font-telemetry">
                  <div className="p-2 rounded bg-polar-950 border border-purple-900">
                    <span className="text-slate-400">AIR SORTIE 1:</span>
                    <div className="text-purple-300 font-bold">
                      {recommendation.cargo_split_proposal.aircraft_sortie_1_kg.toLocaleString()} kg (Basler Max)
                    </div>
                  </div>
                  <div className="p-2 rounded bg-polar-950 border border-purple-900">
                    <span className="text-slate-400">AIR SORTIE 2:</span>
                    <div className="text-purple-300 font-bold">
                      {recommendation.cargo_split_proposal.aircraft_sortie_2_kg.toLocaleString()} kg
                    </div>
                  </div>
                  <div className="p-2 rounded bg-polar-950 border border-purple-900">
                    <span className="text-slate-400">VESSEL HOLD OVERFLOW:</span>
                    <div className="text-slate-300 font-bold">
                      {recommendation.cargo_split_proposal.sea_overflow_kg.toLocaleString()} kg
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4-PILLAR MULTI-MODAL TRADE-OFF MATRIX */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 font-telemetry text-xs">
              <div className="p-3 rounded bg-polar-950 border border-slate-800">
                <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                  <Clock className="w-3.5 h-3.5 text-polar-cyan" />
                  <span className="text-[10px]">TOTAL TRANSIT TIME</span>
                </div>
                <div className="text-base font-bold text-slate-100">
                  {recommendation.total_transit_hours} Hours
                </div>
                <div className="text-[10px] text-slate-500">
                  ≈ {(recommendation.total_transit_hours / 24).toFixed(1)} Days
                </div>
              </div>

              <div className="p-3 rounded bg-polar-950 border border-slate-800">
                <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                  <IndianRupee className="w-3.5 h-3.5 text-polar-amber" />
                  <span className="text-[10px]">ESTIMATED LOGISTICS COST</span>
                </div>
                <div className="text-base font-bold text-slate-100">
                  ₹{recommendation.estimated_cost_inr.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500">
                  Includes fuel bunkering & skiway handling
                </div>
              </div>

              <div className="p-3 rounded bg-polar-950 border border-slate-800">
                <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                  <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px]">CARBON FOOTPRINT</span>
                </div>
                <div className="text-base font-bold text-slate-100">
                  {recommendation.carbon_footprint_kg.toLocaleString()} kg CO₂
                </div>
                <div className="text-[10px] text-slate-500">
                  Antarctic Treaty Environmental Impact
                </div>
              </div>

              <div className="p-3 rounded bg-polar-950 border border-slate-800">
                <div className="flex items-center space-x-1.5 text-slate-400 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[10px]">WEATHER RISK SCORE</span>
                </div>
                <div className="text-base font-bold text-slate-100">
                  {recommendation.weather_risk_score} / 10
                </div>
                <div className="text-[10px] text-slate-500">
                  {recommendation.weather_risk_score >= 7 ? 'High Katabatic Risk' : 'Acceptable Operational Risk'}
                </div>
              </div>
            </div>
          </div>

          {/* DETAILED LEG-BY-LEG ROUTING PIPELINE */}
          <div className="polar-card p-5 space-y-4 shadow-lg">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800">
              <Layers className="w-4 h-4 text-polar-cyan" />
              <span>OPTIMIZED TRANSECT LEG BREAKDOWN</span>
            </div>

            <div className="space-y-3">
              {recommendation.legs_breakdown.map((leg, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-polar-950 border border-slate-800/90 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
                    <div className="flex items-center space-x-2">
                      <span className="w-5 h-5 rounded bg-slate-800 font-telemetry flex items-center justify-center text-slate-300 text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-200">{leg.leg_name}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] font-telemetry">
                      <span className="text-slate-400">{leg.distance_km} km</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-polar-cyan font-semibold">{leg.hours} hrs</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-2 text-[11px] font-telemetry text-slate-300">
                    <span className="text-slate-400">{leg.from}</span>
                    <ArrowRight className="w-3 h-3 text-polar-cyan shrink-0" />
                    <span className="text-slate-400">{leg.to}</span>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-400">
                    {leg.notes}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
