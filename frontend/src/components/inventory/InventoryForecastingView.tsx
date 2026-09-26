'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { InventoryItem } from '../../types';
import { usePolarStore } from '../../lib/store';
import {
  Activity,
  AlertTriangle,
  Flame,
  Calendar,
  ShieldCheck,
  TrendingDown,
  RefreshCw,
  Building2,
  Wind,
  Droplet,
  Utensils,
  Stethoscope,
  Wrench
} from 'lucide-react';

export const InventoryForecastingView: React.FC = () => {
  const { simulation } = usePolarStore();
  const [selectedStation, setSelectedStation] = useState<'maitri' | 'bharati'>('maitri');
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadForecast = async () => {
    try {
      setLoading(true);
      const res = await api.getResupplyForecast(selectedStation);
      setForecastData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, [selectedStation, simulation.is_blizzard_active]);

  const handleEnactRationing = async (itemId: string) => {
    try {
      setActionLoading(true);
      await api.enactRationing(itemId);
      await loadForecast();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'fuel':
        return <Droplet className="w-4 h-4 text-polar-cyan" />;
      case 'food':
        return <Utensils className="w-4 h-4 text-emerald-400" />;
      case 'medical':
        return <Stethoscope className="w-4 h-4 text-red-400" />;
      default:
        return <Wrench className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto select-none">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-polar-cyan" />
            <h1 className="text-xl font-bold text-slate-100 tracking-wide">INVENTORY & RESUPPLY FORECASTING</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Predictive burn-rate models cross-referenced against the Austral Summer resupply window (Nov–March).
          </p>
        </div>

        {/* STATION TOGGLE */}
        <div className="flex items-center space-x-2 bg-polar-950 p-1.5 rounded-lg border border-polar-800">
          <button
            onClick={() => setSelectedStation('maitri')}
            className={`px-3 py-1.5 rounded text-xs font-telemetry font-semibold transition-all ${
              selectedStation === 'maitri'
                ? 'bg-polar-cyan text-polar-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Maitri Station (Inland)
          </button>
          <button
            onClick={() => setSelectedStation('bharati')}
            className={`px-3 py-1.5 rounded text-xs font-telemetry font-semibold transition-all ${
              selectedStation === 'bharati'
                ? 'bg-emerald-500 text-polar-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bharati Station (Coastal)
          </button>
        </div>
      </div>

      {/* DYNAMIC WEATHER WARNING (Blizzard condition) */}
      {simulation.is_blizzard_active && (
        <div className="p-4 rounded-lg bg-red-950/60 border border-red-500/70 text-red-200 text-xs flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <Wind className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="font-bold">ENVIRONMENTAL BURN SURGE ACTIVE (+40% HEATING FUEL)</span>
              <p className="text-[11px] text-red-300">
                Category-5 Katabatic Blizzard has increased generator thermal heating load from 340 L/day to 476 L/day.
              </p>
            </div>
          </div>
          <span className="font-telemetry font-bold text-red-400 px-2 py-1 bg-red-900/60 rounded border border-red-500/60">
            RATE: 1.4x
          </span>
        </div>
      )}

      {/* RESUPPLY WINDOW BANNER */}
      {forecastData && (
        <div className="polar-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-polar-950 border border-slate-700 flex items-center justify-center text-polar-cyan">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-telemetry uppercase text-slate-400 tracking-wider font-semibold">
                NEXT RESUPPLY WINDOW (AUSTRAL SUMMER)
              </div>
              <div className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <span>{forecastData.resupply_window.start_date} (Nov 15, 2026)</span>
                <span className="text-slate-500">•</span>
                <span className="text-polar-cyan font-telemetry">
                  {forecastData.resupply_window.days_remaining} Days Remaining
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {forecastData.critical_alerts_count > 0 ? (
              <div className="px-3 py-1.5 rounded bg-red-950/70 border border-red-500/80 text-red-300 text-xs font-telemetry flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
                <span className="font-bold">
                  {forecastData.critical_alerts_count} CRITICAL DEFICIT ITEMS
                </span>
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-xs font-telemetry flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>RESERVES SECURE THROUGH WINTER</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FORECAST INVENTORY CARDS */}
      {loading ? (
        <div className="polar-card p-12 text-center text-slate-500 text-xs font-telemetry">
          Calculating linear moving-average depletion curves...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forecastData?.forecast.map((item: any) => {
            const stockPct = Math.min(100, Math.round((item.current_stock / (item.current_stock + 20000)) * 100));
            const isAtRisk = item.is_at_risk;

            return (
              <div
                key={item.id}
                className={`polar-card p-5 space-y-3 transition-all ${
                  isAtRisk ? 'border-red-500/60 shadow-red-950/30 shadow-lg' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded bg-polar-950 border border-slate-800">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-telemetry uppercase text-slate-400 font-semibold">
                          {item.category.toUpperCase()}
                        </span>
                        {item.rationing_enacted && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 font-telemetry">
                            RATIONING ACTIVE (-22%)
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-100">{item.item_name}</h3>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-telemetry font-bold ${
                    isAtRisk ? 'bg-red-950 text-red-400 border border-red-500 animate-pulse' :
                    'bg-emerald-950 text-emerald-400 border border-emerald-600'
                  }`}>
                    {isAtRisk ? 'DEPLETION RISK' : 'SECURE'}
                  </span>
                </div>

                {/* Stock & Burn Rate Readout */}
                <div className="grid grid-cols-3 gap-2 font-telemetry text-xs pt-1">
                  <div className="p-2 rounded bg-polar-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">CURRENT STOCK</span>
                    <span className="text-slate-100 font-bold">
                      {item.current_stock.toLocaleString()} {item.unit}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-polar-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">DAILY BURN RATE</span>
                    <span className="text-polar-cyan font-bold">
                      {item.daily_burn_rate} {item.unit}/day
                    </span>
                  </div>
                  <div className="p-2 rounded bg-polar-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">DAYS TO DEPLETION</span>
                    <span className={`font-bold ${isAtRisk ? 'text-red-400' : 'text-emerald-400'}`}>
                      {item.days_remaining} Days
                    </span>
                  </div>
                </div>

                {/* Visual Depletion Timeline Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] font-telemetry">
                    <span className="text-slate-400">Resupply Window Target: 140 Days</span>
                    <span className={isAtRisk ? 'text-red-400 font-bold' : 'text-slate-300'}>
                      {isAtRisk ? `Deficit: -${item.deficit_units.toLocaleString()} ${item.unit}` : 'Surplus Stock'}
                    </span>
                  </div>
                  <div className="w-full bg-polar-950 h-2 rounded-full overflow-hidden border border-slate-800 relative">
                    {/* Window target indicator at ~70% */}
                    <div className="absolute left-[70%] top-0 bottom-0 w-0.5 bg-amber-400 z-10" title="Resupply Window Mark" />
                    <div
                      className={`h-full ${isAtRisk ? 'bg-red-500' : 'bg-polar-cyan'}`}
                      style={{ width: `${Math.min(100, (item.days_remaining / 200) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Actionable Mitigation Recommendation */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                  <div className="text-[11px] text-slate-400 flex-1">
                    {item.recommended_action}
                  </div>

                  {isAtRisk && !item.rationing_enacted && (
                    <button
                      onClick={() => handleEnactRationing(item.id)}
                      disabled={actionLoading}
                      className="px-2.5 py-1 rounded bg-amber-950 border border-amber-500 text-amber-300 hover:bg-amber-900/60 font-telemetry font-bold text-xs shrink-0 transition-all"
                    >
                      Enact Rationing (-22%)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
