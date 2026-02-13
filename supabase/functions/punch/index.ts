import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';
import { EventType } from '../_shared/types.ts';
import { parseQrPayload, sha256, validateQrSignature } from '../_shared/security.ts';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { employee_id, event_type, qr_payload, lat, lon, device_id } = body as {
      employee_id: string;
      event_type: EventType;
      qr_payload: string;
      lat: number;
      lon: number;
      device_id: string;
    };

    const qr = parseQrPayload(qr_payload);

    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('id', employee_id)
      .single();
    if (employeeError || !employee) throw new Error('Funcionário não encontrado');
    if (!employee.is_active) throw new Error('Funcionário inativo');

    const { data: location, error: locationError } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', qr.location_id)
      .single();
    if (locationError || !location) throw new Error('Unidade inválida');

    const rawForSign = JSON.stringify({ location_id: qr.location_id, ts: qr.ts });
    const signatureOk = await validateQrSignature(rawForSign, qr.signature, location.qr_secret);
    if (!signatureOk) throw new Error('Assinatura do QR inválida');

    if (employee.allowed_location_id !== location.id) throw new Error('Funcionário não autorizado nesta unidade');

    const { data: geoData, error: geoError } = await supabaseAdmin.rpc('haversine_meters', {
      lat1: lat,
      lon1: lon,
      lat2: location.latitude,
      lon2: location.longitude
    });
    if (geoError) throw geoError;
    if (geoData > location.radius_meters) throw new Error('Fora da área permitida (geofence)');

    if (employee.device_id && employee.device_id !== device_id) {
      throw new Error('Dispositivo divergente. Solicite liberação do admin.');
    }

    if (!employee.device_id) {
      await supabaseAdmin.from('employees').update({ device_id }).eq('id', employee_id);
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data: events } = await supabaseAdmin
      .from('punch_events')
      .select('event_type,event_time')
      .eq('employee_id', employee_id)
      .gte('event_time', `${today}T00:00:00Z`)
      .lte('event_time', `${today}T23:59:59Z`)
      .order('event_time', { ascending: true });

    const lastEvent = events?.[events.length - 1]?.event_type;
    const hasOpenShift = events?.some((e) => e.event_type === 'clock_in') && !events?.some((e) => e.event_type === 'clock_out');

    const invalidSequence =
      (event_type === 'break_start' && !hasOpenShift) ||
      (event_type === 'break_end' && lastEvent !== 'break_start') ||
      (event_type === 'clock_out' && !hasOpenShift) ||
      (event_type === 'clock_in' && hasOpenShift);

    if (invalidSequence) throw new Error('Sequência de eventos inválida');

    const qrHash = await sha256(qr_payload);

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('punch_events')
      .insert({
        employee_id,
        location_id: location.id,
        event_type,
        qr_payload_hash: qrHash,
        device_id,
        lat,
        lon,
        valid: true
      })
      .select('*')
      .single();

    if (insertError) throw insertError;

    await supabaseAdmin.rpc('recalculate_shift_day', {
      p_employee_id: employee_id,
      p_day: new Date(inserted.event_time).toISOString().slice(0, 10)
    });

    return new Response(JSON.stringify({ ok: true, event: inserted }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    const body = await req.clone().json().catch(() => ({}));
    await supabaseAdmin.from('audit_logs').insert({
      employee_id: body.employee_id ?? null,
      reason: (error as Error).message,
      payload: body
    });

    return new Response(JSON.stringify({ ok: false, error: (error as Error).message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
