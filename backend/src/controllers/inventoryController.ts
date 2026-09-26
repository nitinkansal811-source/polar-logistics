import { Request, Response } from 'express';
import { DbStore } from '../services/dbStore.js';

export const getInventory = async (req: Request, res: Response) => {
  const { stationId } = req.query;
  const store = DbStore.getInstance();
  const items = await store.getInventory(stationId as string);
  return res.json({ inventory: items, count: items.length });
};

export const getStationInventory = async (req: Request, res: Response) => {
  const { stationId } = req.params;
  const store = DbStore.getInstance();
  const items = await store.getInventory(stationId);
  return res.json({ station_id: stationId, inventory: items });
};

export const getResupplyForecast = async (req: Request, res: Response) => {
  const { stationId } = req.params;
  const store = DbStore.getInstance();
  const items = await store.getInventory(stationId);
  const station = await store.getStationById(stationId);

  // Austral Summer Window is Nov 15 (~140 days ahead)
  const daysUntilResupplyWindow = 140;
  const resupplyWindowDate = '2026-11-15';

  const analysis = items.map((item) => {
    const daysRemaining = item.daily_burn_rate > 0 ? Math.round(item.current_stock / item.daily_burn_rate) : 999;
    const isAtRisk = daysRemaining < daysUntilResupplyWindow;
    const deficitUnits = isAtRisk ? Math.round((daysUntilResupplyWindow - daysRemaining) * item.daily_burn_rate) : 0;

    return {
      id: item.id,
      item_name: item.item_name,
      category: item.category,
      current_stock: Math.round(item.current_stock),
      unit: item.unit,
      daily_burn_rate: item.daily_burn_rate,
      days_remaining: daysRemaining,
      resupply_window_days: daysUntilResupplyWindow,
      resupply_window_date: resupplyWindowDate,
      is_at_risk: isAtRisk,
      deficit_units: deficitUnits,
      rationing_enacted: item.rationing_enacted,
      recommended_action: isAtRisk
        ? item.rationing_enacted
          ? 'Rationing active. Schedule emergency Basler air-drop from Cape Town / Maitri cache.'
          : 'CRITICAL: Enact Level-2 Heating Rationing or request emergency air transport before winter freeze.'
        : 'Sufficient reserves to bridge the winter lock-in period.'
    };
  });

  const criticalCount = analysis.filter((a) => a.is_at_risk).length;

  return res.json({
    station_id: stationId,
    station_name: station ? station.name : stationId,
    resupply_window: {
      start_date: resupplyWindowDate,
      days_remaining: daysUntilResupplyWindow,
      season: 'Austral Summer (Nov - March)'
    },
    critical_alerts_count: criticalCount,
    forecast: analysis
  });
};

export const enactRationing = async (req: Request, res: Response) => {
  const { id } = req.params;
  const store = DbStore.getInstance();
  const updated = await store.enactRationing(id);
  if (!updated) return res.status(404).json({ error: 'Inventory item not found' });

  return res.json({
    message: 'Level-2 Rationing Protocol successfully enacted (-22% consumption)',
    item: updated
  });
};
