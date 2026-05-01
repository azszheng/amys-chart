export const CX = 230, CY = 230;

// Ring radii
export const R_OUTER      = 208;  // outer edge of sign ring
export const R_SIGN_IN    = 176;  // inner edge of sign ring / outer edge of house ring
export const R_HOUSE_IN   = 148;  // inner edge of house ring / planet zone
export const R_PLANET     = 126;  // default planet glyph radius
export const R_CORE       = 100;  // aspect line endpoints

// SVG angle: 0° = 12 o'clock, increases clockwise
// ASC maps to 270° (9 o'clock); ecliptic increases counterclockwise → decreasing SVG angle
export function lonToAngle(lon: number, ascLon: number): number {
  return ((270 - (lon - ascLon)) % 360 + 360) % 360;
}

export function polarToXY(r: number, angleDeg: number, cx = CX, cy = CY) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

// Angular midpoint between two SVG angles (going the short way)
export function midAngle(a: number, b: number): number {
  const diff = ((b - a + 360) % 360);
  return (a + diff / 2) % 360;
}
