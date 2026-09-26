'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePolarStore } from '../lib/store';
import { TopStatusBar } from '../components/layout/TopStatusBar';
import { Sidebar } from '../components/layout/Sidebar';
import { CargoTrackingView } from '../components/cargo/CargoTrackingView';
import { RouteOptimizerView } from '../components/optimizer/RouteOptimizerView';
import { InventoryForecastingView } from '../components/inventory/InventoryForecastingView';
import { PersonnelView } from '../components/personnel/PersonnelView';
import { EmergencyResponseView } from '../components/emergency/EmergencyResponseView';
import { OfflineFieldApp } from '../components/field/OfflineFieldApp';
import { NCPORHQView } from '../components/hq/NCPORHQView';
import { AIAgentDrawer } from '../components/ai/AIAgentDrawer';
import { getSocket } from '../lib/socket';

// Dynamically import Leaflet Map to avoid SSR window errors
const PolarMap = dynamic(
  () => import('../components/map/PolarMap').then((mod) => mod.PolarMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-polar-950 text-slate-500 font-telemetry text-xs">
        Initializing High-Latitude Mercator Polar GIS Projection...
      </div>
    )
  }
);

export default function Home() {
  const { activeTab, setSatellite, setSimulation, aiDrawerOpen, setAiDrawerOpen } = usePolarStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize socket connection & telemetry listeners
    const socket = getSocket();
    socket.on('telemetry:bootstrap', (data: any) => {
      if (data.satellite) setSatellite(data.satellite);
      if (data.simulation) setSimulation(data.simulation);
    });

    socket.on('satellite:state_changed', (sat: any) => {
      setSatellite(sat);
    });

    socket.on('simulation:state_changed', (sim: any) => {
      setSimulation(sim);
    });

    return () => {
      socket.off('telemetry:bootstrap');
      socket.off('satellite:state_changed');
      socket.off('simulation:state_changed');
    };
  }, []);

  if (!mounted) {
    return null;
  }

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'map':
        return <PolarMap />;
      case 'cargo':
        return <CargoTrackingView />;
      case 'optimizer':
        return <RouteOptimizerView />;
      case 'inventory':
        return <InventoryForecastingView />;
      case 'personnel':
        return <PersonnelView />;
      case 'emergency':
        return <EmergencyResponseView />;
      case 'field':
        return <OfflineFieldApp />;
      case 'hq':
        return <NCPORHQView />;
      default:
        return <PolarMap />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-polar-950">
      {/* PERSISTENT TOP STATUS BAR */}
      <TopStatusBar />

      {/* MAIN CONSOLE BODY: SIDEBAR + VIEW */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-polar-950 relative">
          {renderActiveModule()}
        </main>
      </div>

      {/* TACTICAL AI AGENT DRAWER (GROQ POWERED) */}
      <AIAgentDrawer isOpen={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
    </div>
  );
}
