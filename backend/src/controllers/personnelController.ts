import { Request, Response } from 'express';
import { DbStore } from '../services/dbStore.js';
import { BloodGroup } from '../types/index.js';

export const getPersonnel = async (req: Request, res: Response) => {
  const { stationId, location } = req.query;
  const store = DbStore.getInstance();
  let list = await store.getPersonnel();

  if (stationId) {
    list = list.filter((p) => p.station_id.toLowerCase() === (stationId as string).toLowerCase());
  }
  if (location) {
    list = list.filter((p) => p.location.toLowerCase().includes((location as string).toLowerCase()));
  }

  return res.json({ personnel: list, count: list.length });
};

export const updatePersonnelLocation = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { location, station_id, station_name } = req.body;
  const store = DbStore.getInstance();

  const updated = await store.updatePersonnelLocation(id, location, station_id, station_name);
  if (!updated) return res.status(404).json({ error: 'Personnel not found' });

  return res.json({ personnel: updated });
};

export const getCompatibleDonors = async (req: Request, res: Response) => {
  const { bloodGroup, stationId } = req.params;
  const store = DbStore.getInstance();
  let list = await store.getPersonnel();

  if (stationId) {
    list = list.filter((p) => p.station_id.toLowerCase() === stationId.toLowerCase());
  }

  // Filter for emergency donors
  const compatible = list.filter((p) => {
    if (!p.emergency_donor_eligible || p.medical_fitness !== 'fit') return false;

    // Universal donors: O-
    if (p.blood_group === 'O-') return true;
    if (bloodGroup === 'AB+' || bloodGroup === 'AB-') return true;
    if (bloodGroup.startsWith('A') && (p.blood_group === 'A+' || p.blood_group === 'A-' || p.blood_group.startsWith('O'))) return true;
    if (bloodGroup.startsWith('B') && (p.blood_group === 'B+' || p.blood_group === 'B-' || p.blood_group.startsWith('O'))) return true;
    return p.blood_group === bloodGroup;
  });

  return res.json({
    recipient_blood_group: bloodGroup,
    station_id: stationId,
    compatible_donors_count: compatible.length,
    donors: compatible
  });
};

export const getWinterOverSummary = async (req: Request, res: Response) => {
  const store = DbStore.getInstance();
  const list = await store.getPersonnel();

  const winterOverActive = list.filter((p) => p.winter_over_status === 'winter_over_active');
  const avgDaysInPost = Math.round(
    winterOverActive.reduce((acc, p) => acc + p.days_in_post, 0) / (winterOverActive.length || 1)
  );
  const avgReadiness = Math.round(
    winterOverActive.reduce((acc, p) => acc + p.readiness_score, 0) / (winterOverActive.length || 1)
  );

  return res.json({
    total_deployed_crew: list.length,
    active_winter_over_crew: winterOverActive.length,
    average_days_in_post: avgDaysInPost,
    max_winter_over_days: 450,
    average_readiness_score: avgReadiness,
    at_risk_restricted_duty: list.filter((p) => p.medical_fitness !== 'fit').length,
    upcoming_relief_crew_at_cpt: list.filter((p) => p.location === 'Cape Town Hub').length
  });
};
