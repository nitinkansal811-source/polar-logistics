import { RouteRecommendation, AssetCategory } from '../types/index.js';

export class RouteOptimizer {
  private static readonly BASLER_PAYLOAD_LIMIT_KG = 2500;
  private static readonly TWIN_OTTER_PAYLOAD_LIMIT_KG = 1400;

  public static optimizeRoute(
    origin: string,
    destination: string,
    weightKg: number,
    category: AssetCategory,
    urgency: 'routine' | 'critical' | 'emergency' = 'routine',
    seaIceCondition: 'low' | 'moderate' | 'severe' = 'moderate'
  ): RouteRecommendation {
    const isDestBharati = destination.toLowerCase().includes('bharati');
    const isDestMaitri = destination.toLowerCase().includes('maitri');
    const isOriginCapeTown = origin.toLowerCase().includes('cape') || origin.toLowerCase().includes('cpt');

    // Real-world polar constraint: NO DIRECT FLIGHT from Cape Town to Bharati
    const maitriStopoverRequired = isOriginCapeTown && isDestBharati;

    // Sea ice penalty multiplier
    let seaIceMultiplier = 1.0;
    let seaIceDaysAddition = 0;
    if (seaIceCondition === 'moderate') {
      seaIceMultiplier = 1.25;
      seaIceDaysAddition = 2.5;
    } else if (seaIceCondition === 'severe') {
      seaIceMultiplier = 1.75;
      seaIceDaysAddition = 6.0;
    }

    // Determine payload feasibility
    const exceedsBaslerPayload = weightKg > this.BASLER_PAYLOAD_LIMIT_KG;
    const exceedsTwinOtterPayload = weightKg > this.TWIN_OTTER_PAYLOAD_LIMIT_KG;

    let recommendedMode: 'air' | 'sea' | 'split' = 'sea';
    let payloadWarning: string | undefined;
    let cargoSplitProposal: RouteRecommendation['cargo_split_proposal'];

    if (exceedsBaslerPayload) {
      payloadWarning = `CRITICAL PAYLOAD ALERT: Cargo weight of ${weightKg.toLocaleString()} kg exceeds Basler BT-67 maximum ski-landing ceiling of 2,500 kg. Direct air transport for single shipment is unfeasible.`;
      
      if (urgency === 'emergency' || urgency === 'critical') {
        recommendedMode = 'split';
        const sortie1 = this.BASLER_PAYLOAD_LIMIT_KG;
        const remaining = weightKg - sortie1;
        const sortie2 = Math.min(remaining, this.BASLER_PAYLOAD_LIMIT_KG);
        const seaOverflow = Math.max(0, remaining - sortie2);

        cargoSplitProposal = {
          aircraft_sortie_1_kg: sortie1,
          aircraft_sortie_2_kg: sortie2,
          sea_overflow_kg: seaOverflow,
          rationale: `Mission Critical Splitting: Dispatched ${sortie1.toLocaleString()} kg on Priority Sortie 1, ${sortie2.toLocaleString()} kg on Sortie 2${seaOverflow > 0 ? `, and ${seaOverflow.toLocaleString()} kg deferred to vessel cargo hold` : ''}.`
        };
      } else {
        recommendedMode = 'sea';
      }
    } else if (urgency === 'emergency' || category === 'medical') {
      recommendedMode = 'air';
    } else if (category === 'fuel' || weightKg > 2000) {
      recommendedMode = 'sea'; // Fuel and bulk cargo is overwhelmingly maritime
    } else if (urgency === 'critical') {
      recommendedMode = 'air';
    } else {
      // Routine evaluation based on cost vs time
      recommendedMode = weightKg <= 1200 ? 'air' : 'sea';
    }

    // Build leg breakdown
    const legs: RouteRecommendation['legs_breakdown'] = [];
    let totalDistanceKm = 0;
    let totalHours = 0;

    if (recommendedMode === 'air' || recommendedMode === 'split') {
      if (maitriStopoverRequired) {
        legs.push({
          leg_name: 'Leg 1: Intercontinental Strategic Air Bridge',
          mode: 'air',
          from: 'Cape Town (FACT)',
          to: 'Maitri / Novolazarevskaya Blue-Ice Runway (AT27)',
          distance_km: 4200,
          hours: 6.5,
          notes: 'DROMLAN Polar Air Corridor. Basler BT-67 long-range flight with auxiliary fuel tanks.'
        });
        legs.push({
          leg_name: 'Leg 2: Inter-Station Polar Air Corridor (Mandatory Refueling)',
          mode: 'air',
          from: 'Maitri Blue-Ice Runway',
          to: 'Skiway Fuel Cache Depot (70.2°S, 42.0°E)',
          distance_km: 1340,
          hours: 4.2,
          notes: 'Mandatory technical stopover: gravity refueling from cached Jet A-1 polar drums.'
        });
        legs.push({
          leg_name: 'Leg 3: Final Polar Ingress to Bharati',
          mode: 'air',
          from: 'Skiway Fuel Cache Depot',
          to: 'Bharati Station Fast-Ice Skiway',
          distance_km: 1340,
          hours: 4.3,
          notes: 'Prydz Bay approach. Visual ski landing on groomed snowway.'
        });
        totalDistanceKm = 6880;
        totalHours = 15.0;
      } else if (isOriginCapeTown && isDestMaitri) {
        legs.push({
          leg_name: 'Leg 1: DROMLAN Direct Air Corridor',
          mode: 'air',
          from: 'Cape Town (FACT)',
          to: 'Maitri Station / Novo Runway',
          distance_km: 4200,
          hours: 6.5,
          notes: 'Direct blue-ice runway landing at Schirmacher Oasis staging.'
        });
        totalDistanceKm = 4200;
        totalHours = 6.5;
      } else {
        // Maitri to Bharati
        legs.push({
          leg_name: 'Inter-Station Air Corridor (via Refuel Cache)',
          mode: 'air',
          from: origin,
          to: destination,
          distance_km: 2680,
          hours: 8.5,
          notes: 'Twin Otter / Basler BT-67 inter-station shuttle with mid-way skiway refuel.'
        });
        totalDistanceKm = 2680;
        totalHours = 8.5;
      }
    } else {
      // Maritime vessel route
      if (isDestBharati) {
        legs.push({
          leg_name: 'Leg 1: Southern Ocean Open Water Transit',
          mode: 'sea',
          from: 'Cape Town Port Hub',
          to: 'Antarctic Divergence / Pack Ice Boundary',
          distance_km: 3200,
          hours: Math.round(140 * seaIceMultiplier),
          notes: 'Open ocean cruising at 13 knots through the Roaring Forties.'
        });
        legs.push({
          leg_name: 'Leg 2: Ice Pack Navigation & Prydz Bay Berthing',
          mode: 'sea',
          from: 'Pack Ice Boundary',
          to: 'Bharati Coastal Wharf',
          distance_km: 2100,
          hours: Math.round(110 * seaIceMultiplier),
          notes: `Icebreaking operations (${seaIceCondition} pack ice). Speed reduced to 4-6 knots.`
        });
        totalDistanceKm = 5300;
        totalHours = Math.round((250 + seaIceDaysAddition * 24) * seaIceMultiplier);
      } else {
        legs.push({
          leg_name: 'Cape Town to Princess Astrid Coast (Maitri Shelf)',
          mode: 'sea',
          from: 'Cape Town Port Hub',
          to: 'Maitri Ice Shelf Berth',
          distance_km: 4480,
          hours: Math.round((230 + seaIceDaysAddition * 24) * seaIceMultiplier),
          notes: 'Icebreaker discharge onto shelf, followed by 110 km PistenBully heavy convoy inland.'
        });
        totalDistanceKm = 4480;
        totalHours = Math.round((230 + seaIceDaysAddition * 24) * seaIceMultiplier);
      }
    }

    // Trade-off calculations
    const costPerKmAir = 185; // INR per kg-km
    const costPerKmSea = 18;  // INR per kg-km
    const estimatedCostInr =
      recommendedMode === 'sea'
        ? Math.round(weightKg * totalDistanceKm * 0.045) + 350000
        : Math.round(weightKg * totalDistanceKm * 0.28) + 1200000;

    const carbonFootprintKg =
      recommendedMode === 'sea'
        ? Math.round(weightKg * totalDistanceKm * 0.00015)
        : Math.round(weightKg * totalDistanceKm * 0.0018);

    const weatherRiskScore =
      recommendedMode === 'air'
        ? (urgency === 'emergency' ? 7 : 5)
        : seaIceCondition === 'severe' ? 8 : (seaIceCondition === 'moderate' ? 5 : 3);

    const summary =
      recommendedMode === 'air'
        ? `Air Transport Recommended: ${maitriStopoverRequired ? 'Routes via Maitri & Mid-way Skiway Cache (NO direct Cape Town-Bharati flight exists).' : 'Direct air transit.'} Est. transit time: ${totalHours} hours.`
        : recommendedMode === 'split'
        ? `Split Multi-Modal Logistics Recommended due to ${weightKg} kg weight exceeding aircraft capacity.`
        : `Maritime Transport (Icebreaker) Recommended: Lowest cost and high payload security. Total transit: ${(totalHours / 24).toFixed(1)} days (${seaIceCondition} sea-ice severity).`;

    return {
      recommended_mode: recommendedMode,
      summary,
      total_distance_km: totalDistanceKm,
      total_transit_hours: totalHours,
      estimated_cost_inr: estimatedCostInr,
      carbon_footprint_kg: carbonFootprintKg,
      weather_risk_score: weatherRiskScore,
      maitri_stopover_required: maitriStopoverRequired,
      payload_limit_warning: payloadWarning,
      legs_breakdown: legs,
      cargo_split_proposal: cargoSplitProposal
    };
  }
}
