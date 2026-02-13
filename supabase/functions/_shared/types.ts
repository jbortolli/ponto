export type EventType = 'clock_in' | 'break_start' | 'break_end' | 'clock_out';

export interface QrPayload {
  location_id: string;
  ts: number;
  signature: string;
}
