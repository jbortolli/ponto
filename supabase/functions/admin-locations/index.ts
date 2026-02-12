import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  const { action, location, location_id } = await req.json();

  if (action === 'create') {
    const { error } = await supabaseAdmin.from('locations').insert(location);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ ok: true }));
  }

  if (action === 'update') {
    const { error } = await supabaseAdmin.from('locations').update(location).eq('id', location_id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ ok: true }));
  }

  if (action === 'list') {
    const { data, error } = await supabaseAdmin.from('locations').select('*').order('name');
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ locations: data }));
  }

  return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400 });
});
