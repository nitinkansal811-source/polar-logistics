import { Request, Response } from 'express';
import { DbStore } from '../services/dbStore.js';
import { RouteOptimizer } from '../services/routeOptimizer.js';
import { AssetCategory } from '../types/index.js';

export const getRouteLegs = async (req: Request, res: Response) => {
  const store = DbStore.getInstance();
  const legs = await store.getRouteLegs();
  return res.json({ legs });
};

export const recommendRoute = async (req: Request, res: Response) => {
  const { origin, destination, weight, category, urgency, sea_ice } = req.query;

  const originStr = (origin as string) || 'Cape Town Logistics Hub';
  const destStr = (destination as string) || 'Bharati Station';
  const weightKg = Number(weight) || 1200;
  const categoryStr = (category as AssetCategory) || 'scientific-equipment';
  const urgencyStr = (urgency as 'routine' | 'critical' | 'emergency') || 'routine';
  const seaIceStr = (sea_ice as 'low' | 'moderate' | 'severe') || 'moderate';

  const recommendation = RouteOptimizer.optimizeRoute(
    originStr,
    destStr,
    weightKg,
    categoryStr,
    urgencyStr,
    seaIceStr
  );

  return res.json({ recommendation });
};
