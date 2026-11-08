-- ════════════════════════════════════════════════════════════════
-- OCD LIVE — schéma Supabase
-- À coller dans Supabase > SQL Editor > New query, puis « Run ».
-- ════════════════════════════════════════════════════════════════

create table if not exists public.bookings (
  id                uuid primary key,
  code              text not null unique,
  created_at        timestamptz not null default now(),
  mode              text not null check (mode in ('presentiel', 'distance')),
  package_id        text not null,
  starts_at         timestamptz not null,
  duration_minutes  integer not null check (duration_minutes > 0),
  amount            integer not null check (amount >= 0),
  full_name         text not null,
  whatsapp          text not null,
  email             text not null,
  business_name     text not null,
  sector            text not null,
  products          text not null,
  tiktok            text,
  country           text not null,
  city              text not null,
  photo_url         text,
  client_timezone   text,
  status            text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'cancelled')),
  hold_expires_at   timestamptz not null,
  validated_at      timestamptz
);

create index if not exists bookings_starts_at_idx on public.bookings (starts_at);

-- Le site utilise la clé service_role côté serveur uniquement.
-- RLS activé sans politique = aucun accès public direct à la table.
alter table public.bookings enable row level security;

-- ── Insertion anti double réservation ──────────────────────────────
-- Un verrou transactionnel sérialise les réservations : la vérification
-- du créneau et l'insertion ne peuvent pas être entrelacées.
create or replace function public.insert_booking_if_free(payload jsonb, monthly_quota integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  b public.bookings;
  new_start timestamptz;
  new_end   timestamptz;
  used      integer;
begin
  b := jsonb_populate_record(null::public.bookings, payload);
  new_start := b.starts_at;
  new_end   := b.starts_at + make_interval(mins => b.duration_minutes);

  perform pg_advisory_xact_lock(hashtext('ocd_live_bookings'));

  if exists (
    select 1 from public.bookings x
    where (x.status = 'confirmed' or (x.status = 'pending' and x.hold_expires_at > now()))
      and x.starts_at < new_end
      and x.starts_at + make_interval(mins => x.duration_minutes) > new_start
  ) then
    return 'slot_taken';
  end if;

  if monthly_quota is not null then
    select count(*) into used from public.bookings x
    where x.package_id = b.package_id
      and date_trunc('month', x.starts_at at time zone 'UTC') = date_trunc('month', new_start at time zone 'UTC')
      and (x.status = 'confirmed' or (x.status = 'pending' and x.hold_expires_at > now()));
    if used >= monthly_quota then
      return 'sold_out';
    end if;
  end if;

  insert into public.bookings select (b).*;
  return 'ok';
end;
$$;

revoke all on function public.insert_booking_if_free(jsonb, integer) from public, anon, authenticated;

-- ── Photos produits ───────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('produits', 'produits', true)
on conflict (id) do nothing;
