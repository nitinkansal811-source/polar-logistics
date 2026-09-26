import { EmergencyIncident } from '../types/index.js';
import { DbStore } from './dbStore.js';

export class EmergencyEngine {
  public static async triggerEmergency(
    type: 'medical_evacuation' | 'blizzard_lockdown' | 'fuel_rupture',
    stationId: 'maitri' | 'bharati',
    customNotes?: string
  ): Promise<EmergencyIncident> {
    const store = DbStore.getInstance();
    const station = await store.getStationById(stationId);
    const stationName = station ? station.name : (stationId === 'maitri' ? 'Maitri Station' : 'Bharati Station');
    const timestamp = new Date().toISOString();
    const uniqueId = `inc-${Date.now()}`;
    const incidentCode = `NCPOR-EMG-${stationId.slice(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const clearanceCode = `MOES-NCPOR-AUTH-${Math.floor(100000 + Math.random() * 900000)}`;

    let incident: EmergencyIncident;

    if (type === 'medical_evacuation') {
      incident = {
        id: uniqueId,
        incident_code: incidentCode,
        type: 'medical_evacuation',
        station_id: stationId,
        station_name: stationName,
        severity: 'priority_1_critical',
        title: `CRITICAL MEDEVAC: Immediate Medical Evacuation Protocol Enacted`,
        description:
          customNotes ||
          `Crew member diagnosed with acute intra-abdominal crisis / severe compound fracture requiring immediate surgical intervention unavailable at ${stationName}. Immediate aero-medical extraction required.`,
        timestamp,
        status: 'active',
        clearance_code: clearanceCode,
        weather_corridor_open: true,
        evacuation_plan: {
          recommended_vehicle: 'Basler BT-67 (Ski-Equipped, ICU Aeromedical Rig)',
          eta_hours: stationId === 'maitri' ? 7.0 : 16.5,
          staging_hub:
            stationId === 'maitri'
              ? 'Novolazarevskaya Blue-Ice Runway (ALCI Staging)'
              : 'Maitri Inter-Station Fuel Cache -> Cape Town',
          tertiary_facility: 'Christiaan Barnard Memorial Hospital, Cape Town',
          comms_frequency: 'HF 8.291 MHz USB / Iridium Channel 01',
          satphone_channel: '+8816-3184-9022 (Polar Search & Rescue Link)',
          action_checklist: [
            'Stabilize patient in Station Medical Ward with IV plasma and thermal suits',
            'Pre-heat Basler BT-67 turbine engines at Novo/Maitri skiway',
            'Alert Cape Town Port Health & Trauma ICU Reception',
            'Enforce radio silence on emergency HF channel 8.291 MHz'
          ],
          approvals_required: [
            'Chief Medical Officer',
            'Station Leader',
            'Secretary MoES / Director NCPOR (Auto-Approved via Clearance Code)'
          ],
          authorized_by: 'MoES Polar Emergency Response Directorate'
        }
      };
    } else if (type === 'blizzard_lockdown') {
      // Trigger blizzard weather in station
      await store.updateStationWeather(stationId, {
        temp_c: -42,
        wind_speed_kt: 88,
        condition: 'Category-5 Katabatic Whiteout Blizzard',
        blizzard_warning: true
      });

      incident = {
        id: uniqueId,
        incident_code: incidentCode,
        type: 'blizzard_lockdown',
        station_id: stationId,
        station_name: stationName,
        severity: 'priority_1_critical',
        title: `CODE-RED BLIZZARD: Full Station Lockdown & Shelter-in-Place`,
        description:
          customNotes ||
          `Katabatic blizzard front exceeding 85 knots with wind chill below -60°C. Zero visibility. Exterior movement forbidden. Survival guide-lines active.`,
        timestamp,
        status: 'active',
        clearance_code: clearanceCode,
        weather_corridor_open: false, // Grounded!
        evacuation_plan: {
          recommended_vehicle: 'None - External Movement Strictly Prohibited',
          eta_hours: 0,
          staging_hub: `${stationName} Main Habitation Module A`,
          tertiary_facility: 'On-station Emergency Survival Shelter',
          comms_frequency: 'Station Intercom VHF Ch 16 / Internal Hardline',
          satphone_channel: 'Iridium PTT Talkgroup India-Polar-1',
          action_checklist: [
            'Seal all airlock blast doors and thermal vestibules',
            'Switch generator load to Priority-1 (Life Support & Central Heating)',
            'Account for 100% station headcount via biometric RFID check-in',
            'Power down unshielded scientific exterior sensor masts'
          ],
          approvals_required: ['Station Leader', 'Base Operations Controller'],
          authorized_by: 'Station Commander Directive 44-B'
        }
      };
    } else {
      // fuel_rupture
      incident = {
        id: uniqueId,
        incident_code: incidentCode,
        type: 'fuel_rupture',
        station_id: stationId,
        station_name: stationName,
        severity: 'priority_2_urgent',
        title: `ENVIRONMENTAL INCIDENT: Polar Fuel Line Rupture Contained`,
        description:
          customNotes ||
          `Arctic diesel secondary transfer line ruptured due to -45°C thermal contraction. Rapid spill response teams deployed to isolate manifold.`,
        timestamp,
        status: 'active',
        clearance_code: clearanceCode,
        weather_corridor_open: true,
        evacuation_plan: {
          recommended_vehicle: 'PistenBully 300 Heavy Spill Response Carrier',
          eta_hours: 0.5,
          staging_hub: `${stationName} Fuel Farm Bunkers`,
          tertiary_facility: 'N/A - Hazardous Materials Containment',
          comms_frequency: 'Station Operations VHF Ch 08',
          satphone_channel: 'NCPOR Environmental Compliance Desk',
          action_checklist: [
            'Depressurize and isolate Main Fuel Line Section 4',
            'Deploy absorbent cryogenic booms and snow berms around leak zone',
            'Transfer remaining diesel to Reserve Bladder #3',
            'Log Antarctic Treaty Protocol Environmental Impact Report'
          ],
          approvals_required: ['Logistics Officer', 'Environmental Officer'],
          authorized_by: 'NCPOR Technical Safety Directorate'
        }
      };
    }

    await store.addIncident(incident);
    return incident;
  }
}
