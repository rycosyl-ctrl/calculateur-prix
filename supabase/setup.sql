-- Configuration Supabase pour le calculateur de prix.
-- À exécuter une fois dans le SQL Editor du dashboard Supabase.

-- Une ligne par utilisateur : sa configuration complète en JSON.
create table if not exists public.user_configs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

-- Sécurité au niveau des lignes : chacun ne voit et ne modifie que sa propre config.
alter table public.user_configs enable row level security;

drop policy if exists "own config" on public.user_configs;
create policy "own config"
  on public.user_configs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
