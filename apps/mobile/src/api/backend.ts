import * as Location from 'expo-location';
import { supabase } from './supabase';
import { DaySummary, EventType, PunchEvent } from '../types';

export async function submitPunch(payload: {
  employeeId: string;
  eventType: EventType;
  qrPayload: string;
  deviceId: string;
}) {
  const loc = await Location.getCurrentPositionAsync({});
  const { data, error } = await supabase.functions.invoke('punch', {
    body: {
      employee_id: payload.employeeId,
      event_type: payload.eventType,
      qr_payload: payload.qrPayload,
      lat: loc.coords.latitude,
      lon: loc.coords.longitude,
      device_id: payload.deviceId
    }
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function getMyEvents(employeeId: string): Promise<PunchEvent[]> {
  const { data, error } = await supabase.functions.invoke('my-events', { body: { employee_id: employeeId } });
  if (error) throw new Error(error.message);
  return data.events;
}

export async function getMyDaySummary(employeeId: string): Promise<DaySummary> {
  const { data, error } = await supabase.functions.invoke('my-day-summary', { body: { employee_id: employeeId } });
  if (error) throw new Error(error.message);
  return data.summary;
}
