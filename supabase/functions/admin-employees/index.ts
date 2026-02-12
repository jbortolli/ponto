import { supabaseAdmin } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  const { action, employee, employee_id } = await req.json();

  if (action === 'create') {
    const { data: pinHash, error: pinHashError } = await supabaseAdmin.rpc('generate_pin_hash', { p_pin: employee.pin });
    if (pinHashError) return new Response(JSON.stringify({ error: pinHashError.message }), { status: 400 });

    const { error } = await supabaseAdmin.from('employees').insert({
      name: employee.name,
      email: employee.email ?? null,
      pin_hash: pinHash,
      allowed_location_id: employee.allowed_location_id,
      is_active: true,
      is_admin: false
    });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ ok: true }));
  }

  if (action === 'reset_device') {
    const { error } = await supabaseAdmin.from('employees').update({ device_id: null }).eq('id', employee_id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ ok: true }));
  }

  if (action === 'toggle_active') {
    const { error } = await supabaseAdmin
      .from('employees')
      .update({ is_active: employee.is_active })
      .eq('id', employee_id);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ ok: true }));
  }

  if (action === 'list') {
    const { data, error } = await supabaseAdmin.from('employees').select('*').order('name');
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ employees: data }));
  }

  return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400 });
});
