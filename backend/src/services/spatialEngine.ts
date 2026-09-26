export class SpatialEngine {
  private static readonly EARTH_RADIUS_KM = 6371;

  public static toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }

  public static toDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
  }

  public static calculateDistanceKm(coord1: [number, number], coord2: [number, number]): number {
    const lat1 = this.toRadians(coord1[0]);
    const lon1 = this.toRadians(coord1[1]);
    const lat2 = this.toRadians(coord2[0]);
    const lon2 = this.toRadians(coord2[1]);

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(this.EARTH_RADIUS_KM * c);
  }

  /**
   * Interpolate a coordinate along a Great Circle / geodesic path
   * fraction between 0.0 and 1.0
   */
  public static interpolatePath(
    start: [number, number],
    end: [number, number],
    fraction: number
  ): [number, number] {
    const f = Math.max(0, Math.min(1, fraction));
    const lat1 = this.toRadians(start[0]);
    const lon1 = this.toRadians(start[1]);
    const lat2 = this.toRadians(end[0]);
    const lon2 = this.toRadians(end[1]);

    const d = 2 * Math.asin(
      Math.sqrt(
        Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
          Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
      )
    );

    if (d === 0) return start;

    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));
    const lon = Math.atan2(y, x);

    return [
      parseFloat(this.toDegrees(lat).toFixed(4)),
      parseFloat(this.toDegrees(lon).toFixed(4))
    ];
  }

  /**
   * Multi-segment waypoint interpolation
   */
  public static interpolateRoute(
    waypoints: [number, number][],
    progressPct: number
  ): [number, number] {
    if (waypoints.length === 0) return [0, 0];
    if (waypoints.length === 1) return waypoints[0];

    const clamped = Math.max(0, Math.min(100, progressPct));
    const totalSegments = waypoints.length - 1;
    const segmentIndex = Math.min(
      Math.floor((clamped / 100) * totalSegments),
      totalSegments - 1
    );

    const segmentFraction = (clamped / 100) * totalSegments - segmentIndex;
    return this.interpolatePath(
      waypoints[segmentIndex],
      waypoints[segmentIndex + 1],
      segmentFraction
    );
  }
}
