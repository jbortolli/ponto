import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  const { employee_id } = await req.json();
  const day = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from('punch_events')
    .select('id,event_type,event_time')
    .eq('employee_id', employee_id)
    .gte('event_time', `${day}T00:00:00Z`)
    .lte('event_time', `${day}T23:59:59Z`)
    .order('event_time', { ascending: true });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ events: data }), { headers: { 'Content-Type': 'application/json' } });
});
