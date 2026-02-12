-- Extensions
create extension if not exists "pgcrypto";

-- Enum
create type public.event_type as enum ('clock_in', 'break_start', 'break_end', 'clock_out');

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer not null check (radius_meters > 0),
  qr_secret text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  name text not null,
  email text unique,
  pin_hash text not null,
  allowed_location_id uuid not null references public.locations(id),
  device_id text,
  is_active boolean not null default true,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.punch_events (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id),
  location_id uuid not null references public.locations(id),
  event_type public.event_type not null,
  event_time timestamptz not null default now(),
  server_received_at timestamptz not null default now(),
  qr_payload_hash text not null,
  device_id text not null,
  lat double precision not null,
  lon double precision not null,
  valid boolean not null default true
);

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id),
  shift_date date not null,
  first_in timestamptz,
  last_out timestamptz,
  worked_minutes integer not null default 0,
  break_minutes integer not null default 0,
  status text not null check (status in ('complete', 'incomplete')),
  updated_at timestamptz not null default now(),
  unique(employee_id, shift_date)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id),
  location_id uuid references public.locations(id),
  event_type public.event_type,
  reason text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index idx_punch_employee_time on public.punch_events(employee_id, event_time desc);
create index idx_punch_location_time on public.punch_events(location_id, event_time desc);
create index idx_shifts_employee_date on public.shifts(employee_id, shift_date desc);
create index idx_audit_created_at on public.audit_logs(created_at desc);

-- Helper functions
create or replace function public.current_employee_id()
returns uuid language sql stable as $$
  select id from public.employees where auth_user_id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce((select is_admin from public.employees where auth_user_id = auth.uid() limit 1), false);
$$;

create or replace function public.login_with_pin(p_pin text)
returns table (id uuid, name text, email text, is_admin boolean)
language plpgsql security definer as $$
begin
  return query
  select e.id, e.name, e.email, e.is_admin
  from public.employees e
  where e.pin_hash = crypt(p_pin, e.pin_hash)
    and e.is_active = true
  limit 1;
end;
$$;

grant execute on function public.login_with_pin(text) to anon, authenticated;

create or replace function public.haversine_meters(lat1 double precision, lon1 double precision, lat2 double precision, lon2 double precision)
returns double precision language sql immutable as $$
  select 6371000 * 2 * asin(
    sqrt(
      pow(sin(radians((lat2-lat1)/2)),2) +
      cos(radians(lat1)) * cos(radians(lat2)) * pow(sin(radians((lon2-lon1)/2)),2)
    )
  );
$$;

create or replace function public.recalculate_shift_day(p_employee_id uuid, p_day date)
returns void language plpgsql security definer as $$
declare
  v_first_in timestamptz;
  v_last_out timestamptz;
  v_break_minutes int := 0;
  v_worked_minutes int := 0;
  v_status text := 'complete';
  v_break_start timestamptz;
  evt record;
begin
  select min(event_time), max(event_time) filter (where event_type = 'clock_out')
    into v_first_in, v_last_out
  from public.punch_events
  where employee_id = p_employee_id
    and event_time::date = p_day
    and event_type in ('clock_in', 'clock_out');

  for evt in
    select event_type, event_time
    from public.punch_events
    where employee_id = p_employee_id
      and event_time::date = p_day
      and event_type in ('break_start', 'break_end')
    order by event_time
  loop
    if evt.event_type = 'break_start' then
      v_break_start := evt.event_time;
    elsif evt.event_type = 'break_end' and v_break_start is not null then
      v_break_minutes := v_break_minutes + greatest(0, extract(epoch from (evt.event_time - v_break_start))::int / 60);
      v_break_start := null;
    end if;
  end loop;

  if v_first_in is null or v_last_out is null then
    v_status := 'incomplete';
    v_worked_minutes := 0;
  else
    v_worked_minutes := greatest(0, (extract(epoch from (v_last_out - v_first_in))::int / 60) - v_break_minutes);
    if v_break_start is not null then
      v_status := 'incomplete';
    end if;
  end if;

  insert into public.shifts(employee_id, shift_date, first_in, last_out, worked_minutes, break_minutes, status, updated_at)
  values (p_employee_id, p_day, v_first_in, v_last_out, v_worked_minutes, v_break_minutes, v_status, now())
  on conflict (employee_id, shift_date)
  do update set
    first_in = excluded.first_in,
    last_out = excluded.last_out,
    worked_minutes = excluded.worked_minutes,
    break_minutes = excluded.break_minutes,
    status = excluded.status,
    updated_at = now();
end;
$$;

create or replace function public.recalculate_shift_period(p_start date, p_end date)
returns void language plpgsql security definer as $$
declare r record;
begin
  for r in
    select distinct employee_id, event_time::date as d
    from public.punch_events
    where event_time::date between p_start and p_end
  loop
    perform public.recalculate_shift_day(r.employee_id, r.d);
  end loop;
end;
$$;

-- RLS
alter table public.employees enable row level security;
alter table public.locations enable row level security;
alter table public.punch_events enable row level security;
alter table public.shifts enable row level security;
alter table public.audit_logs enable row level security;

create policy "employee self read" on public.employees
  for select using (id = public.current_employee_id() or public.is_admin());
create policy "admin manage employees" on public.employees
  for all using (public.is_admin()) with check (public.is_admin());

create policy "employee read active locations" on public.locations
  for select using (is_active = true or public.is_admin());
create policy "admin manage locations" on public.locations
  for all using (public.is_admin()) with check (public.is_admin());

create policy "employee own events" on public.punch_events
  for select using (employee_id = public.current_employee_id() or public.is_admin());
create policy "employee insert own events" on public.punch_events
  for insert with check (employee_id = public.current_employee_id() or public.is_admin());

create policy "employee own shifts" on public.shifts
  for select using (employee_id = public.current_employee_id() or public.is_admin());

create policy "admin read audit" on public.audit_logs
  for select using (public.is_admin());
create policy "service insert audit" on public.audit_logs
  for insert with check (true);

create or replace function public.admin_create_employee(
  p_name text,
  p_email text,
  p_pin text,
  p_allowed_location_id uuid,
  p_is_admin boolean default false
)
returns uuid
language plpgsql
security definer as $$
declare v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Apenas admin';
  end if;

  insert into public.employees(name, email, pin_hash, allowed_location_id, is_admin, is_active)
  values (p_name, nullif(p_email, ''), crypt(p_pin, gen_salt('bf')), p_allowed_location_id, p_is_admin, true)
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.admin_create_employee(text, text, text, uuid, boolean) to authenticated;

create or replace function public.generate_pin_hash(p_pin text)
returns text language sql security definer as $$
  select crypt(p_pin, gen_salt('bf'));
$$;

grant execute on function public.generate_pin_hash(text) to anon, authenticated;
