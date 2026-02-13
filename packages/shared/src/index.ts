export type EventType = 'clock_in' | 'break_start' | 'break_end' | 'clock_out';

export interface PunchEvent {
  eventType: EventType;
  occurredAt: string; // ISO string
}

export interface ShiftSummary {
  firstIn: string | null;
  lastOut: string | null;
  workedMinutes: number;
  breakMinutes: number;
  status: 'complete' | 'incomplete';
}

export function calculateShift(events: PunchEvent[]): ShiftSummary {
  const sorted = [...events].sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
  const firstIn = sorted.find((e) => e.eventType === 'clock_in')?.occurredAt ?? null;
  const lastOut = [...sorted].reverse().find((e) => e.eventType === 'clock_out')?.occurredAt ?? null;

  let breakMinutes = 0;
  let pendingBreakStart: string | null = null;

  for (const event of sorted) {
    if (event.eventType === 'break_start') {
      pendingBreakStart = event.occurredAt;
    } else if (event.eventType === 'break_end' && pendingBreakStart) {
      const minutes = Math.max(0, Math.round((Date.parse(event.occurredAt) - Date.parse(pendingBreakStart)) / 60000));
      breakMinutes += minutes;
      pendingBreakStart = null;
    }
  }

  if (!firstIn || !lastOut) {
    return {
      firstIn,
      lastOut,
      workedMinutes: 0,
      breakMinutes,
      status: 'incomplete'
    };
  }

  const totalMinutes = Math.max(0, Math.round((Date.parse(lastOut) - Date.parse(firstIn)) / 60000));
  const workedMinutes = Math.max(0, totalMinutes - breakMinutes);

  const status = pendingBreakStart ? 'incomplete' : 'complete';

  return {
    firstIn,
    lastOut,
    workedMinutes,
    breakMinutes,
    status
  };
}
