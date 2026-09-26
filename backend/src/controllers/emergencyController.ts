import { Request, Response } from 'express';
import { DbStore } from '../services/dbStore.js';
import { EmergencyEngine } from '../services/emergencyEngine.js';

export const getIncidents = async (req: Request, res: Response) => {
  const store = DbStore.getInstance();
  const incidents = await store.getIncidents();
  return res.json({ incidents, count: incidents.length });
};

export const triggerEmergency = async (req: Request, res: Response) => {
  const { type, station_id, notes } = req.body;
  const validStation = station_id === 'bharati' ? 'bharati' : 'maitri';
  const validType =
    type === 'medical_evacuation' || type === 'blizzard_lockdown' || type === 'fuel_rupture'
      ? type
      : 'medical_evacuation';

  const incident = await EmergencyEngine.triggerEmergency(validType, validStation, notes);
  return res.status(201).json({
    message: 'POLAR EMERGENCY DECLARED: MoES / NCPOR Incident Order Generated',
    incident
  });
};

export const getIncidentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const store = DbStore.getInstance();
  const incidents = await store.getIncidents();
  const incident = incidents.find((i) => i.id === id);

  if (!incident) return res.status(404).json({ error: 'Incident not found' });
  return res.json({ incident });
};
