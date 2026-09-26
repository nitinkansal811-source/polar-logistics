import { Request, Response } from 'express';
import { DbStore } from '../services/dbStore.js';
import { SimulationEngine } from '../services/simulationEngine.js';

export const getSimulationState = async (req: Request, res: Response) => {
  const store = DbStore.getInstance();
  return res.json({
    simulation: store.getSimulationState(),
    satellite: store.getSatelliteState()
  });
};

export const setTimeWarp = async (req: Request, res: Response) => {
  const { warp } = req.body;
  const validWarp = warp === 60 ? 60 : warp === 10 ? 10 : 1;
  const engine = SimulationEngine.getInstance();
  const state = await engine.setTimeWarp(validWarp);
  return res.json({ message: `Time warp set to ${validWarp}x`, simulation: state });
};

export const triggerBlizzard = async (req: Request, res: Response) => {
  const { active } = req.body;
  const engine = SimulationEngine.getInstance();
  const state = await engine.triggerBlizzard(Boolean(active));
  return res.json({
    message: active ? 'BLIZZARD INJECTED: 86kt winds at Maitri' : 'Blizzard cleared',
    simulation: state
  });
};

export const triggerSatelliteBlackout = async (req: Request, res: Response) => {
  const { blackout } = req.body;
  const engine = SimulationEngine.getInstance();
  const state = await engine.triggerSatelliteBlackout(Boolean(blackout));
  return res.json({
    message: blackout ? 'SATELLITE BLACKOUT INJECTED: 0 kbps link' : 'Satellite link restored: 128 kbps',
    satellite: state
  });
};

export const toggleSatellite = async (req: Request, res: Response) => {
  const store = DbStore.getInstance();
  const current = store.getSatelliteState();
  const engine = SimulationEngine.getInstance();
  const newState = await engine.triggerSatelliteBlackout(current.status === 'active');
  return res.json({ satellite: newState });
};

export const getStations = async (req: Request, res: Response) => {
  const store = DbStore.getInstance();
  const stations = await store.getStations();
  return res.json({ stations });
};
