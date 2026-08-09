-- SprayLog schema. Run this in the Supabase SQL editor of a fresh project.

create type plot_kind as enum ('greenhouse', 'open_field');
create type material_type as enum ('pesticide','insecticide','fungicide','herbicide','fertilizer','adjuvant','other');

create table materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type material_type not null default 'other',
  unit text not null default 'L',
  notes text,
  created_at timestamptz not null default now()
);

create table plots (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind plot_kind not null default 'open_field',
  spray_interval_days integer not null default 7 check (spray_interval_days > 0),
  planned boolean not null default true,
  grid_x integer not null default 0 check (grid_x >= 0),
  grid_y integer not null default 0 check (grid_y >= 0),
  grid_w integer not null default 2 check (grid_w between 1 and 12),
  grid_h integer not null default 2 check (grid_h between 1 and 12),
  notes text,
  created_at timestamptz not null default now()
);

create table sprayings (
  id uuid primary key default gen_random_uuid(),
  applied_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create table spraying_plots (
  spraying_id uuid not null references sprayings(id) on delete cascade,
  plot_id uuid not null references plots(id) on delete restrict,
  primary key (spraying_id, plot_id)
);

create table spraying_items (
  id uuid primary key default gen_random_uuid(),
  spraying_id uuid not null references sprayings(id) on delete cascade,
  material_id uuid not null references materials(id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  unit text not null
);

create table app_settings (
  id integer primary key default 1 check (id = 1),
  notification_lead_hours numeric not null default 24
);

insert into app_settings (id) values (1);

create or replace function apply_spraying(
  p_applied_at timestamptz,
  p_notes text,
  p_plot_ids uuid[],
  p_items jsonb
) returns uuid
language plpgsql
security definer
as $$
declare
  new_id uuid;
begin
  insert into sprayings (applied_at, notes)
  values (p_applied_at, p_notes)
  returning id into new_id;

  insert into spraying_plots (spraying_id, plot_id)
  select new_id, unnest(p_plot_ids);

  insert into spraying_items (spraying_id, material_id, quantity, unit)
  select new_id,
         (item->>'material_id')::uuid,
         (item->>'quantity')::numeric,
         item->>'unit'
  from jsonb_array_elements(p_items) item;

  return new_id;
end;
$$;

create or replace function update_spraying(
  p_id uuid,
  p_applied_at timestamptz,
  p_notes text,
  p_plot_ids uuid[],
  p_items jsonb
) returns void
language plpgsql
security definer
as $$
begin
  update sprayings
  set applied_at = p_applied_at, notes = p_notes
  where id = p_id;

  delete from spraying_plots where spraying_id = p_id;
  insert into spraying_plots (spraying_id, plot_id)
  select p_id, unnest(p_plot_ids);

  delete from spraying_items where spraying_id = p_id;
  insert into spraying_items (spraying_id, material_id, quantity, unit)
  select p_id,
         (item->>'material_id')::uuid,
         (item->>'quantity')::numeric,
         item->>'unit'
  from jsonb_array_elements(p_items) item;
end;
$$;

grant execute on function apply_spraying(timestamptz, text, uuid[], jsonb) to authenticated;
grant execute on function update_spraying(uuid, timestamptz, text, uuid[], jsonb) to authenticated;

alter table materials enable row level security;
alter table plots enable row level security;
alter table sprayings enable row level security;
alter table spraying_plots enable row level security;
alter table spraying_items enable row level security;
alter table app_settings enable row level security;

create policy "full" on materials      for all to authenticated using (true) with check (true);
create policy "full" on plots          for all to authenticated using (true) with check (true);
create policy "full" on sprayings      for all to authenticated using (true) with check (true);
create policy "full" on spraying_plots for all to authenticated using (true) with check (true);
create policy "full" on spraying_items for all to authenticated using (true) with check (true);
create policy "full" on app_settings   for all to authenticated using (true) with check (true);
