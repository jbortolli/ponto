export type EventType = 'clock_in' | 'break_start' | 'break_end' | 'clock_out';

export interface EmployeeSession {
  id: string;
  name: string;
  email?: string;
  isAdmin: boolean;
}

export interface PunchEvent {
  id: string;
  event_type: EventType;
  event_time: string;
}

export interface DaySummary {
  date: string;
  worked_minutes: number;
  break_minutes: number;
  status: 'complete' | 'incomplete';
}
