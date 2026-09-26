import { Server as SocketIOServer } from 'socket.io';
import { DbStore } from './dbStore.js';
import { SpatialEngine } from './spatialEngine.js';

export class SimulationEngine {
  private static instance: SimulationEngine;
  private io?: SocketIOServer;
  private intervalTimer?: NodeJS.Timeout;
  private isRunning: boolean = false;

  private constructor() {}

  public static getInstance(): SimulationEngine {
    if (!SimulationEngine.instance) {
      SimulationEngine.instance = new SimulationEngine();
    }
    return SimulationEngine.instance;
  }

  public setSocketServer(io: SocketIOServer) {
    this.io = io;
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[SimulationEngine] Polar background telemetry loop initialized (3s ticks)');

    this.intervalTimer = setInterval(() => {
      this.tick();
    }, 3000);
  }

  public stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
    }
    this.isRunning = false;
  }

  private async tick() {
    const store = DbStore.getInstance();
    const simState = store.getSimulationState();
    const warp = simState.time_warp; // 1, 10, or 60

    // 1. Advance Maritime Vessel (MV Vasiliy Golovnin)
    const legs = await store.getRouteLegs();
    const seaLeg = legs.find((l) => l.id === 'leg-sea-01');
    if (seaLeg) {
      // Progress step
      const step = 0.4 * warp;
      let newProgress = (seaLeg.current_progress_pct + step);
      if (newProgress > 100) newProgress = 0; // Loop voyage for demo continuity

      const newPos = SpatialEngine.interpolateRoute(seaLeg.waypoints, newProgress);
      await store.updateRouteLegProgress(seaLeg.id, parseFloat(newProgress.toFixed(1)), newPos);
    }

    // 2. Advance Air Corridor Flight (Basler BT-67)
    const airLeg = legs.find((l) => l.id === 'leg-air-02');
    if (airLeg) {
      const step = 1.2 * warp;
      let newProgress = (airLeg.current_progress_pct + step);
      if (newProgress > 100) newProgress = 0; // Loop flight

      const newPos = SpatialEngine.interpolateRoute(airLeg.waypoints, newProgress);
      await store.updateRouteLegProgress(airLeg.id, parseFloat(newProgress.toFixed(1)), newPos);
    }

    // 3. Dynamic Station Burn Rate Simulation
    // If blizzard is active, fuel consumption spikes +40%
    const blizzardMultiplier = simState.is_blizzard_active ? 1.4 : 1.0;
    const inventory = await store.getInventory();
    for (const item of inventory) {
      if (item.category === 'fuel') {
        // Daily burn rate converted to 3s tick increment with warp
        const burnPerTick = (item.daily_burn_rate / 28800) * warp * blizzardMultiplier;
        await store.updateInventoryStock(item.id, -burnPerTick);
      }
    }

    // 4. Update simulated date / expedition day if high warp
    if (warp >= 10) {
      const dayIncrement = warp === 60 ? 0.05 : 0.01;
      const newDay = parseFloat((simState.expedition_day + dayIncrement).toFixed(2));
      store.setSimulationState({ expedition_day: newDay });
    }

    // 5. Broadcast live telemetry packet over Socket.io
    if (this.io) {
      const updatedLegs = await store.getRouteLegs();
      const updatedInventory = await store.getInventory();
      const updatedStations = await store.getStations();
      const satState = store.getSatelliteState();

      this.io.emit('telemetry:update', {
        timestamp: new Date().toISOString(),
        simulation: store.getSimulationState(),
        satellite: satState,
        routes: updatedLegs,
        stations: updatedStations,
        inventory_summary: updatedInventory.map((i) => ({
          id: i.id,
          name: i.item_name,
          station_id: i.station_id,
          current_stock: Math.round(i.current_stock),
          days_until_depletion: i.days_until_depletion,
          critical_alert: i.critical_alert
        }))
      });
    }
  }

  // Demo Controls
  public async setTimeWarp(warp: 1 | 10 | 60) {
    const store = DbStore.getInstance();
    store.setSimulationState({ time_warp: warp });
    if (this.io) {
      this.io.emit('simulation:state_changed', store.getSimulationState());
    }
    return store.getSimulationState();
  }

  public async triggerBlizzard(active: boolean) {
    const store = DbStore.getInstance();
    store.setSimulationState({ is_blizzard_active: active });

    if (active) {
      await store.updateStationWeather('maitri', {
        temp_c: -44,
        wind_speed_kt: 86,
        condition: 'Category-5 Katabatic Blizzard Code-Red',
        blizzard_warning: true
      });
    } else {
      await store.updateStationWeather('maitri', {
        temp_c: -19,
        wind_speed_kt: 28,
        condition: 'Blowing Snow / Katabatic Advisory',
        blizzard_warning: false
      });
    }

    if (this.io) {
      this.io.emit('simulation:state_changed', store.getSimulationState());
      this.io.emit('weather:updated', await store.getStations());
    }
    return store.getSimulationState();
  }

  public async triggerSatelliteBlackout(blackout: boolean) {
    const store = DbStore.getInstance();
    store.setSimulationState({ is_satellite_blackout: blackout });

    if (blackout) {
      store.setSatelliteState({
        status: 'closed',
        bandwidth_kbps: 0,
        signal_strength_pct: 0
      });
    } else {
      store.setSatelliteState({
        status: 'active',
        bandwidth_kbps: 128,
        signal_strength_pct: 94,
        last_window_sync: new Date().toISOString()
      });
    }

    if (this.io) {
      this.io.emit('simulation:state_changed', store.getSimulationState());
      this.io.emit('satellite:state_changed', store.getSatelliteState());
    }
    return store.getSatelliteState();
  }
}
