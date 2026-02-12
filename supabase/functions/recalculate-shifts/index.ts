import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  const { start_date, end_date } = await req.json();

  const { error } = await supabaseAdmin.rpc('recalculate_shift_period', {
    p_start: start_date,
    p_end: end_date
  });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ ok: true }));
});
