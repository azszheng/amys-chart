import tzlookup from 'tz-lookup';
import { DateTime } from 'luxon';

export type TimezoneResult = {
  timezone: string;   // IANA zone
  utc: string;        // ISO UTC string
};

export function resolveTimezone(
  lat: number,
  lng: number,
  date: string,  // YYYY-MM-DD
  time: string,  // HH:mm
): TimezoneResult {
  const timezone = tzlookup(lat, lng);
  const local = DateTime.fromISO(`${date}T${time}`, { zone: timezone });

  if (!local.isValid) {
    throw new Error(`Invalid date/time: ${date}T${time} in zone ${timezone} — ${local.invalidReason}`);
  }

  const utc = local.toUTC().toISO();
  if (!utc) {
    throw new Error(`Failed to convert ${date}T${time} (${timezone}) to UTC`);
  }

  return { timezone, utc };
}
