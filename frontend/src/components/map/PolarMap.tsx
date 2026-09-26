'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePolarStore } from '../../lib/store';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { RouteLeg, Station } from '../../types';
import {
  Ship,
  Plane,
  Layers,
  Fuel,
  AlertTriangle,
  Globe,
  Compass,
  Crosshair,
  Maximize2,
  MapPin,
  Check,
  ChevronDown,
  Info,
  X
} from 'lucide-react';

type BasemapKey = 'satellite' | 'ocean' | 'nasa' | 'dark' | 'osm';

interface BasemapOption {
  key: BasemapKey;
  name: string;
  badge: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string;
  labelUrl?: string;
  description: string;
}

const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    key: 'satellite',
    name: 'High-Res True Satellite',
    badge: 'ESRI World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labelUrl: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Earthstar Geographics, USDA, USGS, AeroGRID, IGN',
    maxZoom: 19,
    description: 'Photorealistic satellite imagery revealing real Antarctic ice sheets, glaciers, nunataks, and ocean.'
  },
  {
    key: 'ocean',
    name: 'Oceanographic Bathymetry',
    badge: 'ESRI World Ocean',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, GEBCO, NOAA, National Geographic, DeLorme',
    maxZoom: 13,
    description: 'Nautical & polar bathymetry showing continental shelf drops, ocean floor trenches, and ice margins.'
  },
  {
    key: 'nasa',
    name: 'NASA Blue Marble',
    badge: 'NASA GIBS',
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
    attribution: 'Imagery &copy; NASA Global Imagery Browse Services (GIBS)',
    maxZoom: 8,
    description: 'Scientific shaded relief showing continental Antarctic elevations and ice cap topography.'
  },
  {
    key: 'dark',
    name: 'Tactical Ops Dark',
    badge: 'ESRI Dark Gray',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, DeLorme, NAVTEQ',
    maxZoom: 16,
    description: 'Ultra-clean high contrast dark basemap for tactical night operations.'
  },
  {
    key: 'osm',
    name: 'Cartographic Standard',
    badge: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    description: 'Standard topographic cartography with political and natural boundaries.'
  }
];

export const PolarMap: React.FC = () => {
  const { selectedRouteLeg, setSelectedRouteLeg } = usePolarStore();
  const [stations, setStations] = useState<Station[]>([]);
  const [routes, setRoutes] = useState<RouteLeg[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [activeBasemap, setActiveBasemap] = useState<BasemapKey>('satellite');
  
  // Interactive UI toggles to prevent permanent clutter
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showFleetPanel, setShowFleetPanel] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showAntarcticCircle, setShowAntarcticCircle] = useState(true);
  const [mouseCoords, setMouseCoords] = useState<{ lat: string; lng: string } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const baseTileLayerRef = useRef<any>(null);
  const labelTileLayerRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const polylineRefs = useRef<{ [key: string]: any }>({});
  const antarcticCircleRef = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch initial data
  useEffect(() => {
    const load = async () => {
      try {
        const sRes = await api.getStations();
        setStations(sRes.stations);
        const rRes = await api.getRoutes();
        setRoutes(rRes.legs);
      } catch (e) {
        console.error('Error fetching map data:', e);
      }
    };
    load();

    // Socket live listener
    const socket = getSocket();
    socket.on('telemetry:update', (data: any) => {
      if (data.routes) {
        setRoutes(data.routes);
      }
      if (data.stations) {
        setStations(data.stations);
      }
    });

    return () => {
      socket.off('telemetry:update');
    };
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!isClient || !mapContainerRef.current || leafletMapRef.current) return;

    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      // Center over the Southern Ocean Antarctic transect
      const map = L.map(mapContainerRef.current!, {
        center: [-58, 45],
        zoom: 3,
        minZoom: 2,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false
      });

      // Subtle scale bar
      L.control.scale({ imperial: false, position: 'bottomleft', metric: true }).addTo(map);

      // Clean zoom control
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Mouse tracking
      map.on('mousemove', (e: any) => {
        const lat = Math.abs(e.latlng.lat).toFixed(2) + (e.latlng.lat >= 0 ? '°N' : '°S');
        const lng = Math.abs(e.latlng.lng).toFixed(2) + (e.latlng.lng >= 0 ? '°E' : '°W');
        setMouseCoords({ lat, lng });
      });

      leafletMapRef.current = map;
      applyBasemap('satellite', L);
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [isClient]);

  // Apply basemap layer
  const applyBasemap = (key: BasemapKey, leafletInstance?: any) => {
    const map = leafletMapRef.current;
    if (!map) return;

    const opt = BASEMAP_OPTIONS.find((b) => b.key === key) || BASEMAP_OPTIONS[0];

    const apply = (L: any) => {
      if (baseTileLayerRef.current) {
        map.removeLayer(baseTileLayerRef.current);
        baseTileLayerRef.current = null;
      }
      if (labelTileLayerRef.current) {
        map.removeLayer(labelTileLayerRef.current);
        labelTileLayerRef.current = null;
      }

      const baseLayer = L.tileLayer(opt.url, {
        subdomains: opt.subdomains || 'abc',
        maxZoom: opt.maxZoom,
        attribution: opt.attribution
      }).addTo(map);
      baseTileLayerRef.current = baseLayer;

      if (opt.labelUrl) {
        const labelLayer = L.tileLayer(opt.labelUrl, {
          maxZoom: opt.maxZoom,
          opacity: 0.8
        }).addTo(map);
        labelTileLayerRef.current = labelLayer;
      }

      setActiveBasemap(key);
    };

    if (leafletInstance) {
      apply(leafletInstance);
    } else {
      import('leaflet').then((L) => apply(L));
    }
  };

  // Toggle Antarctic Circle (66°33′49″S)
  useEffect(() => {
    if (!leafletMapRef.current) return;

    import('leaflet').then((L) => {
      const map = leafletMapRef.current;

      if (antarcticCircleRef.current) {
        map.removeLayer(antarcticCircleRef.current);
        antarcticCircleRef.current = null;
      }

      if (showAntarcticCircle) {
        const circlePoints: [number, number][] = [];
        for (let lon = -180; lon <= 180; lon += 3) {
          circlePoints.push([-66.5636, lon]);
        }

        const circlePoly = L.polyline(circlePoints, {
          color: '#38BDF8',
          weight: 1.5,
          dashArray: '5, 8',
          opacity: 0.65
        }).addTo(map);

        circlePoly.bindTooltip('Antarctic Polar Circle (66°33′S) — 24h Polar Night / Day Threshold', {
          sticky: true,
          className: 'bg-polar-900 text-sky-300 text-[10px] font-telemetry border border-sky-500/40'
        });

        antarcticCircleRef.current = circlePoly;
      }
    });
  }, [showAntarcticCircle]);

  // Update Markers & Polylines when routes or stations change
  useEffect(() => {
    if (!leafletMapRef.current) return;

    import('leaflet').then((L) => {
      const map = leafletMapRef.current;

      // 1. Station Markers
      stations.forEach((st) => {
        const markerKey = `st-${st.id}`;
        if (!markersRef.current[markerKey]) {
          const isMaitri = st.id === 'maitri';
          const isBharati = st.id === 'bharati';
          const isCape = st.id === 'cape_town';

          const haloColor = isMaitri
            ? 'rgba(56, 189, 248, 0.4)'
            : isBharati
            ? 'rgba(16, 185, 129, 0.4)'
            : isCape
            ? 'rgba(245, 158, 11, 0.4)'
            : 'rgba(168, 85, 247, 0.4)';

          const badgeBg = isMaitri
            ? 'bg-sky-500 text-slate-950'
            : isBharati
            ? 'bg-emerald-400 text-slate-950'
            : isCape
            ? 'bg-amber-400 text-slate-950'
            : 'bg-purple-400 text-slate-950';

          const iconHtml = `
            <div class="relative flex items-center justify-center cursor-pointer group">
              <div class="absolute -inset-2.5 rounded-full animate-ping" style="background: ${haloColor}; opacity: 0.4;"></div>
              <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-950/95 border-2 ${
                isMaitri ? 'border-sky-400' : isBharati ? 'border-emerald-400' : isCape ? 'border-amber-400' : 'border-purple-400'
              } shadow-2xl backdrop-blur-md">
                <span class="text-[10px] font-black font-telemetry ${badgeBg} px-1.5 py-0.5 rounded-full shadow">
                  ${isMaitri ? 'MAI' : isBharati ? 'BHA' : isCape ? 'CPT' : 'GOA'}
                </span>
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            html: iconHtml,
            className: 'custom-station-icon',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const marker = L.marker(st.coordinates, { icon: customIcon }).addTo(map);
          marker.bindPopup(`
            <div class="p-2 space-y-1.5 text-xs font-sans min-w-[220px]">
              <div class="flex items-center justify-between pb-1 border-b border-slate-700/80">
                <span class="font-bold text-sky-300 text-sm">${st.name}</span>
                <span class="text-[10px] font-telemetry px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/40">${st.code}</span>
              </div>
              <div class="text-[11px] text-slate-300 font-telemetry">
                📍 Coordinates: <span class="text-sky-200">${st.coordinates[0]}°, ${st.coordinates[1]}°</span>
              </div>
              <div class="text-[11px] text-slate-300 font-telemetry">
                ⛰️ Elevation: <span class="text-slate-200">${st.elevation_m}m</span> | Runway: <span class="text-slate-200">${st.runway_type}</span>
              </div>
              <div class="mt-1.5 pt-1.5 border-t border-slate-700/80 bg-slate-900/60 p-1.5 rounded flex items-center justify-between text-[11px] font-telemetry">
                <span class="text-emerald-400 font-bold">🌡️ ${st.weather.temp_c}°C</span>
                <span class="text-slate-300">💨 ${st.weather.wind_speed_kt} kt ${st.weather.wind_dir}</span>
                <span class="text-slate-400">👥 ${st.occupancy_current}/${st.occupancy_capacity}</span>
              </div>
            </div>
          `);
          markersRef.current[markerKey] = marker;
        }
      });

      // 2. Mid-way Skiway Refueling Cache Marker
      const refuelKey = 'st-refuel-cache';
      if (!markersRef.current[refuelKey]) {
        const refuelIcon = L.divIcon({
          html: `
            <div class="relative flex items-center justify-center cursor-pointer">
              <div class="absolute -inset-2 rounded-full bg-amber-500/30 animate-pulse"></div>
              <div class="relative w-7 h-7 rounded-full bg-slate-950 border-2 border-amber-400 flex items-center justify-center shadow-2xl">
                <span style="font-size: 11px;">⛽</span>
              </div>
            </div>
          `,
          className: 'custom-refuel-icon',
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        const refuelMarker = L.marker([-70.2, 42.0], { icon: refuelIcon }).addTo(map);
        refuelMarker.bindPopup(`
          <div class="p-2 text-xs font-sans min-w-[230px]">
            <div class="flex items-center space-x-1.5 pb-1 border-b border-amber-500/40 text-amber-400 font-bold text-sm">
              <span>⛽</span>
              <span>Mid-Way Skiway Fuel Depot</span>
            </div>
            <div class="text-slate-400 font-telemetry text-[11px] mt-1">Coordinates: 70.2°S, 42.0°E</div>
            <div class="text-slate-200 text-[11px] mt-1 leading-relaxed bg-amber-950/40 p-1.5 rounded border border-amber-500/30">
              Mandatory aircraft refueling cache for Basler BT-67 & Twin Otter flights between Maitri and Bharati.
            </div>
          </div>
        `);
        markersRef.current[refuelKey] = refuelMarker;
      }

      // 3. Route Polylines and Live Vehicle Markers
      routes.forEach((leg) => {
        const polyKey = `poly-${leg.id}`;
        const isSea = leg.mode === 'sea';
        const color = isSea ? '#38BDF8' : '#F59E0B';

        if (!polylineRefs.current[polyKey]) {
          const poly = L.polyline(leg.waypoints, {
            color,
            weight: 3,
            dashArray: isSea ? '8, 10' : '5, 6',
            opacity: 0.9
          }).addTo(map);

          poly.on('click', () => {
            setSelectedRouteLeg(leg);
          });
          polylineRefs.current[polyKey] = poly;
        }

        // Live Vehicle Marker
        const vehicleKey = `veh-${leg.id}`;
        if (leg.status === 'in_transit') {
          const iconHtml = isSea
            ? `<div class="relative flex items-center justify-center cursor-pointer">
                 <div class="absolute -inset-1.5 rounded-full bg-cyan-400/40 animate-ping"></div>
                 <div class="w-8 h-8 rounded-full bg-slate-950/95 border-2 border-cyan-400 text-cyan-300 shadow-2xl flex items-center justify-center text-sm font-bold">
                   🚢
                 </div>
               </div>`
            : `<div class="relative flex items-center justify-center cursor-pointer">
                 <div class="absolute -inset-1.5 rounded-full bg-amber-400/40 animate-ping"></div>
                 <div class="w-8 h-8 rounded-full bg-slate-950/95 border-2 border-amber-400 text-amber-300 shadow-2xl flex items-center justify-center text-sm font-bold">
                   ✈️
                 </div>
               </div>`;

          const vehIcon = L.divIcon({
            html: iconHtml,
            className: 'vehicle-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          if (!markersRef.current[vehicleKey]) {
            const vMarker = L.marker(leg.current_position, { icon: vehIcon }).addTo(map);
            vMarker.on('click', () => setSelectedRouteLeg(leg));
            markersRef.current[vehicleKey] = vMarker;
          } else {
            markersRef.current[vehicleKey].setLatLng(leg.current_position);
          }
        }
      });
    });
  }, [stations, routes]);

  // Quick Camera Preset FlyTo
  const flyToPreset = (center: [number, number], zoom: number) => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo(center, zoom, {
        duration: 1.2
      });
    }
  };

  const inTransitCount = routes.filter((r) => r.status === 'in_transit').length;

  return (
    <div className="relative w-full h-[calc(100vh-3.5rem)] bg-polar-950 overflow-hidden select-none">
      {/* MAP CANVAS */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* TOP-LEFT: SLEEK COMPACT FLOATING GIS PILL */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 pointer-events-auto">
        <div className="flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-xl px-3 py-1.5 shadow-xl text-xs font-telemetry">
          <span className="w-2 h-2 rounded-full bg-polar-cyan animate-pulse"></span>
          <span className="font-bold text-slate-100 tracking-wide text-[11px]">POLAR GIS</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 text-[10px] hidden sm:inline">{mouseCoords ? `${mouseCoords.lat}, ${mouseCoords.lng}` : 'WGS-84'}</span>
        </div>

        {/* Quick Focus Pills */}
        <div className="hidden sm:flex items-center space-x-1 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-xl p-1 shadow-xl text-[10px] font-telemetry">
          <button
            onClick={() => flyToPreset([-58, 45], 3)}
            className="px-2 py-0.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Overview
          </button>
          <button
            onClick={() => flyToPreset([-70.7667, 11.7333], 6)}
            className="px-2 py-0.5 rounded-lg text-slate-300 hover:text-sky-300 hover:bg-sky-950/60 transition-colors"
          >
            Maitri
          </button>
          <button
            onClick={() => flyToPreset([-69.4078, 76.1872], 6)}
            className="px-2 py-0.5 rounded-lg text-slate-300 hover:text-emerald-300 hover:bg-emerald-950/60 transition-colors"
          >
            Bharati
          </button>
          <button
            onClick={() => flyToPreset([-70.2, 42.0], 7)}
            className="px-2 py-0.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-amber-950/60 transition-colors hidden md:inline-block"
          >
            Depot
          </button>
          <button
            onClick={() => flyToPreset([-33.9249, 18.4241], 6)}
            className="px-2 py-0.5 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-amber-950/60 transition-colors hidden md:inline-block"
          >
            CPT
          </button>
        </div>
      </div>

      {/* TOP-RIGHT: MODERN ACTION CONTROL ISLAND (Clean & Compact) */}
      <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 sm:space-x-2">
        {/* 1. MAP LAYER BUTTON */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLayerMenu(!showLayerMenu);
              setShowFleetPanel(false);
              setShowLegend(false);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-slate-200 text-xs font-telemetry shadow-xl backdrop-blur-md transition-all cursor-pointer"
            title="Change Map Provider"
          >
            <Globe className="w-3.5 h-3.5 text-polar-cyan" />
            <span className="hidden sm:inline font-medium">Layer:</span>
            <span className="text-sky-300 font-bold max-w-[90px] sm:max-w-none truncate">
              {BASEMAP_OPTIONS.find((b) => b.key === activeBasemap)?.badge}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showLayerMenu && (
            <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-polar-900/95 border border-slate-700/80 rounded-xl p-2 z-40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
              <div className="px-2 py-1 text-[10px] font-telemetry uppercase text-slate-400 tracking-wider border-b border-slate-800 flex items-center justify-between">
                <span>Select Polar Basemap (Free)</span>
                <button onClick={() => setShowLayerMenu(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="p-1 space-y-1">
                {BASEMAP_OPTIONS.map((opt) => {
                  const isActive = activeBasemap === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => {
                        applyBasemap(opt.key);
                        setShowLayerMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-all flex flex-col space-y-0.5 ${
                        isActive
                          ? 'bg-sky-950/80 border border-sky-400/80 text-white'
                          : 'bg-slate-950/50 border border-transparent hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{opt.name}</span>
                        {isActive && <Check className="w-3.5 h-3.5 text-polar-cyan" />}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight">
                        {opt.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800 px-2 flex items-center justify-between text-[11px] font-telemetry">
                <span className="text-slate-400 text-[10px]">Polar Circle (66°33′S):</span>
                <button
                  onClick={() => setShowAntarcticCircle(!showAntarcticCircle)}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-all ${
                    showAntarcticCircle
                      ? 'bg-sky-950 text-sky-300 border-sky-500'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                >
                  {showAntarcticCircle ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. LIVE FLEET SESSIONS TOGGLE BUTTON */}
        <div className="relative">
          <button
            onClick={() => {
              setShowFleetPanel(!showFleetPanel);
              setShowLayerMenu(false);
              setShowLegend(false);
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-telemetry shadow-xl backdrop-blur-md transition-all cursor-pointer ${
              showFleetPanel
                ? 'bg-sky-950 border-sky-400 text-white'
                : 'bg-slate-950/85 hover:bg-slate-900 border-slate-800 text-slate-200'
            }`}
            title="View Active Transit Fleet"
          >
            <Ship className="w-3.5 h-3.5 text-polar-cyan" />
            <span className="hidden sm:inline">Fleet</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-sky-900/80 text-sky-300 border border-sky-600/50">
              {inTransitCount}
            </span>
          </button>

          {showFleetPanel && (
            <div className="absolute right-0 mt-1.5 w-72 sm:w-80 bg-polar-900/95 border border-slate-700/80 rounded-xl p-3 z-40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-200 font-telemetry">
                  <Layers className="w-3.5 h-3.5 text-polar-cyan" />
                  <span>ACTIVE FLEET SESSIONS</span>
                </div>
                <button
                  onClick={() => setShowFleetPanel(false)}
                  className="text-slate-400 hover:text-white p-1 text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto pr-1">
                {routes.map((leg) => {
                  const isSelected = selectedRouteLeg?.id === leg.id;
                  const isSea = leg.mode === 'sea';
                  return (
                    <div
                      key={leg.id}
                      onClick={() => {
                        setSelectedRouteLeg(leg);
                        setShowFleetPanel(false);
                      }}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-sky-950/80 border-sky-400 text-slate-100'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5 truncate">
                          {isSea ? <Ship className="w-3.5 h-3.5 text-polar-cyan shrink-0" /> : <Plane className="w-3.5 h-3.5 text-polar-amber shrink-0" />}
                          <span className="font-semibold truncate">{leg.vehicle_name}</span>
                        </div>
                        <span className="text-[10px] font-telemetry text-sky-400 font-bold">
                          {leg.current_progress_pct}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 font-telemetry">
                        <span>{leg.mode.toUpperCase()} • {leg.distance_km} km</span>
                        <span className={leg.status === 'in_transit' ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                          {leg.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full ${isSea ? 'bg-polar-cyan' : 'bg-polar-amber'}`}
                          style={{ width: `${leg.current_progress_pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 3. MAP LEGEND TOGGLE BUTTON */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLegend(!showLegend);
              setShowLayerMenu(false);
              setShowFleetPanel(false);
            }}
            className={`p-1.5 rounded-xl border text-xs shadow-xl backdrop-blur-md transition-all cursor-pointer ${
              showLegend
                ? 'bg-sky-950 border-sky-400 text-white'
                : 'bg-slate-950/85 hover:bg-slate-900 border-slate-800 text-slate-300'
            }`}
            title="Map Symbols Legend"
          >
            <Info className="w-4 h-4 text-polar-cyan" />
          </button>

          {showLegend && (
            <div className="absolute right-0 mt-1.5 w-64 bg-polar-900/95 border border-slate-700/80 rounded-xl p-3 z-40 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 text-[11px] font-telemetry space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-slate-400 font-bold text-[10px] uppercase">MAP LEGEND</span>
                <button onClick={() => setShowLegend(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-1.5 text-slate-300">
                <div className="flex items-center space-x-2">
                  <span className="w-3.5 h-0.5 bg-polar-cyan border-b border-dashed border-polar-cyan"></span>
                  <span>MV Vasiliy Golovnin (Maritime)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-3.5 h-0.5 bg-polar-amber border-b border-dotted border-polar-amber"></span>
                  <span>Basler BT-67 Air Corridor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-sky-300"></span>
                  <span>Maitri (Inland Station)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-300"></span>
                  <span>Bharati (Coastal Station)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-300"></span>
                  <span>Skiway Fuel Depot (70.2°S, 42.0°E)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING ROUTE HUD (When a leg is clicked) */}
      {selectedRouteLeg && (
        <div className="absolute bottom-4 left-3 right-3 sm:right-auto sm:left-4 z-20 sm:w-96 bg-polar-950/95 border border-sky-500/40 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between pb-2 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-telemetry font-bold ${
                  selectedRouteLeg.mode === 'sea' ? 'bg-sky-950 text-sky-300 border border-sky-600' : 'bg-amber-950 text-amber-300 border border-amber-600'
                }`}>
                  {selectedRouteLeg.mode.toUpperCase()} SORTIE
                </span>
                <span className="text-xs font-telemetry text-slate-400">
                  {selectedRouteLeg.vehicle_name}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 mt-1">{selectedRouteLeg.name}</h3>
            </div>
            <button
              onClick={() => setSelectedRouteLeg(null)}
              className="text-slate-400 hover:text-slate-100 p-1 text-sm rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-telemetry">
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400">TOTAL DISTANCE</span>
              <div className="text-slate-100 font-bold">{selectedRouteLeg.distance_km} km</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400">TRANSIT TIME</span>
              <div className="text-slate-100 font-bold">{selectedRouteLeg.transit_time_hrs} Hours</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400">CURRENT POSITION</span>
              <div className="text-polar-cyan font-bold">{selectedRouteLeg.current_position[0]}°, {selectedRouteLeg.current_position[1]}°</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400">PROGRESS / PACK-ICE</span>
              <div className="text-emerald-400 font-bold">{selectedRouteLeg.current_progress_pct}% ({selectedRouteLeg.sea_ice_severity.split(' ')[0]})</div>
            </div>
          </div>

          {/* Real world polar constraint note */}
          {selectedRouteLeg.destination.toLowerCase().includes('bharati') && selectedRouteLeg.mode === 'air' && (
            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/50 text-[11px] text-amber-200 space-y-1">
              <div className="flex items-center space-x-1.5 font-bold text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>MANDATORY POLAR REFUELING STAGING</span>
              </div>
              <div className="leading-snug text-[10px]">
                Direct Cape Town–Bharati flights are physically unfeasible. This sortie utilizes the intermediate skiway fuel cache at 70.2°S, 42.0°E.
              </div>
            </div>
          )}

          {/* Manifest payload list */}
          <div className="pt-1">
            <div className="text-[10px] text-slate-400 font-telemetry uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>MANIFEST ASSETS</span>
              <span className="text-emerald-400">{selectedRouteLeg.cargo_manifest_ids.length} LOADED</span>
            </div>
            {selectedRouteLeg.cargo_manifest_ids.length === 0 ? (
              <div className="text-xs text-slate-500 italic">No cargo assets currently manifest.</div>
            ) : (
              <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                {selectedRouteLeg.cargo_manifest_ids.map((id) => (
                  <div key={id} className="p-1.5 rounded-md bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="font-telemetry text-slate-300">{id}</span>
                    <span className="text-emerald-400 text-[9px] font-telemetry">SECURED</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
