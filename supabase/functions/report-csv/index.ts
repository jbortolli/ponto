import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  const { start_date, end_date } = await req.json();

  const { data, error } = await supabaseAdmin
    .from('shifts')
    .select('shift_date,worked_minutes,break_minutes,status,employees(name)')
    .gte('shift_date', start_date)
    .lte('shift_date', end_date)
    .order('shift_date', { ascending: true });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  const lines = ['date,employee,worked_minutes,break_minutes,status'];
  for (const row of data ?? []) {
    lines.push(`${row.shift_date},${(row as any).employees?.name ?? ''},${row.worked_minutes},${row.break_minutes},${row.status}`);
  }

  return new Response(JSON.stringify({ csv: lines.join('\n') }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
