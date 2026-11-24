import tzlookup from 'tz-lookup';

export type DayPhase = 'night' | 'morning' | 'afternoon' | 'evening';

export interface PlaceClock {
  time: string;
  date: string;
  hour: number;
  minute: number;
  phase: DayPhase;
  phaseLabel: string;
  timezone: string;
}

function phaseFor(hour: number): { phase: DayPhase; label: string } {
  if (hour < 5) return { phase: 'night', label: 'Night' };
  if (hour < 11) return { phase: 'morning', label: 'Morning light' };
  if (hour < 17) return { phase: 'afternoon', label: 'Afternoon' };
  if (hour < 20) return { phase: 'evening', label: 'Golden hour' };
  return { phase: 'night', label: 'Night' };
}

export function getPlaceClock(lat: number, lon: number, now: Date = new Date()): PlaceClock {
  let timezone = 'UTC';
  try {
    timezone = tzlookup(lat, lon) || 'UTC';
  } catch {
    timezone = 'UTC';
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).formatToParts(now);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  const hour = Number(value('hour')) % 24;
  const minute = Number(value('minute'));
  const { phase, label } = phaseFor(hour);

  return {
    time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    date: `${value('weekday')}, ${value('day')} ${value('month')}`,
    hour,
    minute,
    phase,
    phaseLabel: label,
    timezone,
  };
}
