import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  const { employee_id } = await req.json();
  const day = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from('shifts')
    .select('shift_date,worked_minutes,break_minutes,status')
    .eq('employee_id', employee_id)
    .eq('shift_date', day)
    .maybeSingle();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(
    JSON.stringify({
      summary: data ?? { date: day, worked_minutes: 0, break_minutes: 0, status: 'incomplete' }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
