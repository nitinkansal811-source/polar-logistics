'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Personnel, BloodGroup } from '../../types';
import {
  Users2,
  HeartPulse,
  Droplet,
  Moon,
  ShieldCheck,
  MapPin,
  Calendar,
  AlertCircle,
  Filter,
  Search,
  CheckCircle2
} from 'lucide-react';

export const PersonnelView: React.FC = () => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedStation, setSelectedStation] = useState<string>('all');
  const [bloodFilter, setBloodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.getPersonnel();
        setPersonnel(res.personnel);
        const sum = await api.getPersonnelSummary();
        setSummary(sum);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredPersonnel = personnel.filter((p) => {
    const matchesStation =
      selectedStation === 'all' ||
      p.location.toLowerCase().includes(selectedStation.toLowerCase()) ||
      p.station_id.toLowerCase().includes(selectedStation.toLowerCase());

    const matchesBlood = bloodFilter === 'all' || p.blood_group === bloodFilter;

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStation && matchesBlood && matchesSearch;
  });

  return (
    <div className="p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto select-none">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Users2 className="w-5 h-5 text-polar-cyan" />
            <h1 className="text-xl font-bold text-slate-100 tracking-wide">PERSONNEL & 15-MONTH WINTER-OVER SUITE</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Human factors telemetry: polar night exposure, rotation eligibility, and emergency blood donor matching.
          </p>
        </div>

        {/* 15-MONTH STATS BANNER */}
        {summary && (
          <div className="flex items-center space-x-3 text-xs font-telemetry">
            <div className="px-3 py-1.5 rounded bg-polar-900 border border-polar-800">
              <span className="text-slate-500 block text-[10px]">AVG DAYS IN POST</span>
              <span className="text-polar-cyan font-bold">{summary.average_days_in_post} / 450 Days</span>
            </div>
            <div className="px-3 py-1.5 rounded bg-polar-900 border border-polar-800">
              <span className="text-slate-500 block text-[10px]">CREW READINESS</span>
              <span className="text-emerald-400 font-bold">{summary.average_readiness_score}% Index</span>
            </div>
            <div className="px-3 py-1.5 rounded bg-polar-900 border border-polar-800">
              <span className="text-slate-500 block text-[10px]">RELIEF CREW (CPT)</span>
              <span className="text-amber-400 font-bold">{summary.upcoming_relief_crew_at_cpt} Staged</span>
            </div>
          </div>
        )}
      </div>

      {/* FILTER BAR & BLOOD COMPATIBILITY MATRIX PICKER */}
      <div className="polar-card p-4 space-y-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search */}
          <div className="flex items-center space-x-2 flex-1 max-w-sm bg-polar-950 px-3 py-1.5 rounded border border-slate-800">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search crew name, discipline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none w-full text-xs"
            />
          </div>

          {/* Station Filter */}
          <div className="flex items-center space-x-1 font-telemetry">
            {['all', 'Maitri', 'Bharati', 'MV Vasiliy Golovnin', 'Cape Town Hub'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStation(st)}
                className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                  selectedStation === st
                    ? 'bg-polar-cyan text-polar-950 font-bold'
                    : 'bg-polar-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {st === 'all' ? 'ALL LOCATIONS' : st}
              </button>
            ))}
          </div>

          {/* Emergency Blood Group Filter */}
          <div className="flex items-center space-x-1.5 font-telemetry">
            <div className="flex items-center space-x-1 text-red-400 font-bold text-[11px]">
              <Droplet className="w-3.5 h-3.5" />
              <span>DONOR MATCH:</span>
            </div>
            {['all', 'O-', 'O+', 'A+', 'A-', 'B+', 'B-', 'AB+'].map((bg) => (
              <button
                key={bg}
                onClick={() => setBloodFilter(bg)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  bloodFilter === bg
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-polar-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CREW ROSTER GRID */}
      {loading ? (
        <div className="polar-card p-12 text-center text-slate-500 text-xs font-telemetry">
          Loading expedition personnel roster...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPersonnel.map((person) => {
            const isUniversalDonor = person.blood_group === 'O-';
            const progressPct = Math.min(100, Math.round((person.days_in_post / person.max_post_days) * 100));

            return (
              <div key={person.id} className="polar-card p-4 space-y-3 shadow-md hover:border-slate-700 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-telemetry font-bold text-polar-cyan">{person.code}</span>
                    <h3 className="text-sm font-bold text-slate-100">{person.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{person.designation}</p>
                  </div>

                  {/* Blood Group Pill */}
                  <div className="flex flex-col items-end">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-telemetry font-bold ${
                      isUniversalDonor
                        ? 'bg-red-950 text-red-300 border border-red-500 animate-pulse'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {person.blood_group} {isUniversalDonor ? '★ UNIVERSAL' : ''}
                    </span>
                    {person.emergency_donor_eligible && (
                      <span className="text-[9px] font-telemetry text-emerald-400 mt-0.5">
                        Donor Eligible
                      </span>
                    )}
                  </div>
                </div>

                {/* Location & Status */}
                <div className="flex items-center justify-between text-[11px] font-telemetry text-slate-400">
                  <div className="flex items-center space-x-1 truncate">
                    <MapPin className="w-3 h-3 text-polar-cyan shrink-0" />
                    <span className="truncate">{person.location}</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded font-bold ${
                    person.medical_fitness === 'fit' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {person.medical_fitness.toUpperCase()}
                  </span>
                </div>

                {/* 15-Month Deployment Progress */}
                <div className="space-y-1 pt-1 font-telemetry text-xs">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>15-Month Winter-Over Progress</span>
                    <span className="text-polar-ice font-bold">{person.days_in_post} / {person.max_post_days} Days</span>
                  </div>
                  <div className="w-full bg-polar-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-polar-cyan"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {/* Readiness & Polar Night */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] font-telemetry text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <Moon className="w-3 h-3 text-indigo-400" />
                    <span>{person.polar_night_days} Days Darkness</span>
                  </div>
                  <div className="flex items-center space-x-1.5 justify-end">
                    <HeartPulse className="w-3 h-3 text-emerald-400" />
                    <span>{person.readiness_score}% Readiness</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
